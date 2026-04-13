<?php
// ============================================================
// /api/clientes.php - CRUD de clientes
// GET           → listar activos
// GET ?id=N     → obtener uno
// POST          → crear
// PUT           → actualizar
// DELETE        → eliminar (soft delete)
// ============================================================
require_once __DIR__ . '/config.php';

$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];

function castClient(array $c): array {
    $c['id']     = (int) $c['id'];
    $c['estado'] = (bool) $c['estado'];
    return $c;
}

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            $stmt = $db->prepare('SELECT * FROM clientes WHERE id = ?');
            $stmt->execute([$_GET['id']]);
            $row = $stmt->fetch();
            if (!$row) jsonError('Cliente no encontrado', 404);
            jsonResponse(castClient($row));
        }

        $stmt = $db->query('SELECT * FROM clientes WHERE estado = 1');
        jsonResponse(array_map('castClient', $stmt->fetchAll()));
        break;

    case 'POST':
        $input = getInput();
        $stmt  = $db->prepare(
            'INSERT INTO clientes (nombre, apellido, email, telefono, direccion, documento)
             VALUES (?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $input['nombre'],
            $input['apellido'],
            $input['email']     ?? null,
            $input['telefono']  ?? null,
            $input['direccion'] ?? null,
            $input['documento'] ?? null,
        ]);
        jsonResponse(castClient(array_merge(
            ['id' => $db->lastInsertId(), 'estado' => 1],
            $input
        )), 201);
        break;

    case 'PUT':
        $input = getInput();
        $id    = $input['id'] ?? null;
        if (!$id) jsonError('ID requerido');

        $stmt = $db->prepare(
            'UPDATE clientes
                SET nombre = ?, apellido = ?, email = ?, telefono = ?, direccion = ?, documento = ?
              WHERE id = ?'
        );
        $stmt->execute([
            $input['nombre'],
            $input['apellido'],
            $input['email']     ?? null,
            $input['telefono']  ?? null,
            $input['direccion'] ?? null,
            $input['documento'] ?? null,
            $id,
        ]);
        jsonResponse(castClient(array_merge(['id' => $id, 'estado' => 1], $input)));
        break;

    case 'DELETE':
        $input = getInput();
        $id    = $input['id'] ?? null;
        if (!$id) jsonError('ID requerido');

        $stmt = $db->prepare('UPDATE clientes SET estado = 0 WHERE id = ?');
        $stmt->execute([$id]);
        jsonResponse(['message' => 'Cliente eliminado']);
        break;

    default:
        jsonError('Método no permitido', 405);
}
