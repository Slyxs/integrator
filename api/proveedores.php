<?php
// ============================================================
// /api/proveedores.php - CRUD de proveedores
// ============================================================
// Gestiona las operaciones sobre la tabla `proveedores`:
//   GET           → lista todos los proveedores activos
//   GET ?id=N     → devuelve un proveedor por su ID
//   POST          → crea un nuevo proveedor (RUC único)
//   PUT           → actualiza los datos de un proveedor existente
//   DELETE        → elimina lógicamente (soft delete: estado = 0)
// ============================================================
require_once __DIR__ . '/config.php';

$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];

// Normaliza los tipos del array de un proveedor.
function castProveedor(array $p): array {
    $p['id']     = (int) $p['id'];
    $p['estado'] = (bool) $p['estado'];
    return $p;
}

switch ($method) {
    // ----- LEER -----
    case 'GET':
        if (isset($_GET['id'])) {
            $stmt = $db->prepare(
                'SELECT id, nombre, ruc, contacto, telefono, email, direccion, suministro, estado
                   FROM proveedores WHERE id = ?'
            );
            $stmt->execute([$_GET['id']]);
            $row = $stmt->fetch();
            if (!$row) jsonError('Proveedor no encontrado', 404);
            jsonResponse(castProveedor($row));
        }

        $stmt = $db->query(
            'SELECT id, nombre, ruc, contacto, telefono, email, direccion, suministro, estado
               FROM proveedores WHERE estado = 1 ORDER BY nombre'
        );
        jsonResponse(array_map('castProveedor', $stmt->fetchAll()));
        break;

    // ----- CREAR -----
    case 'POST':
        $input = getInput();
        if (empty($input['nombre'])) jsonError('El nombre es requerido');

        try {
            $stmt = $db->prepare(
                'INSERT INTO proveedores (nombre, ruc, contacto, telefono, email, direccion, suministro)
                 VALUES (?, ?, ?, ?, ?, ?, ?)'
            );
            $stmt->execute([
                $input['nombre'],
                $input['ruc']        ?? null,
                $input['contacto']   ?? null,
                $input['telefono']   ?? null,
                $input['email']      ?? null,
                $input['direccion']  ?? null,
                $input['suministro'] ?? null,
            ]);
        } catch (PDOException $e) {
            if ($e->getCode() === '23000') jsonError('El RUC ya está registrado', 409);
            jsonError('Error al crear el proveedor', 500);
        }

        jsonResponse(castProveedor([
            'id'         => (int) $db->lastInsertId(),
            'nombre'     => $input['nombre'],
            'ruc'        => $input['ruc']        ?? null,
            'contacto'   => $input['contacto']   ?? null,
            'telefono'   => $input['telefono']   ?? null,
            'email'      => $input['email']      ?? null,
            'direccion'  => $input['direccion']  ?? null,
            'suministro' => $input['suministro'] ?? null,
            'estado'     => 1,
        ]), 201);
        break;

    // ----- ACTUALIZAR -----
    case 'PUT':
        $input = getInput();
        $id    = $input['id'] ?? null;
        if (!$id) jsonError('ID requerido');
        if (empty($input['nombre'])) jsonError('El nombre es requerido');

        try {
            $stmt = $db->prepare(
                'UPDATE proveedores
                    SET nombre = ?, ruc = ?, contacto = ?, telefono = ?, email = ?, direccion = ?, suministro = ?
                  WHERE id = ?'
            );
            $stmt->execute([
                $input['nombre'],
                $input['ruc']        ?? null,
                $input['contacto']   ?? null,
                $input['telefono']   ?? null,
                $input['email']      ?? null,
                $input['direccion']  ?? null,
                $input['suministro'] ?? null,
                $id,
            ]);
        } catch (PDOException $e) {
            if ($e->getCode() === '23000') jsonError('El RUC ya está registrado por otro proveedor', 409);
            jsonError('Error al actualizar el proveedor', 500);
        }

        jsonResponse(castProveedor([
            'id'         => (int) $id,
            'nombre'     => $input['nombre'],
            'ruc'        => $input['ruc']        ?? null,
            'contacto'   => $input['contacto']   ?? null,
            'telefono'   => $input['telefono']   ?? null,
            'email'      => $input['email']      ?? null,
            'direccion'  => $input['direccion']  ?? null,
            'suministro' => $input['suministro'] ?? null,
            'estado'     => 1,
        ]));
        break;

    // ----- ELIMINAR (soft delete) -----
    case 'DELETE':
        $input = getInput();
        $id    = $input['id'] ?? null;
        if (!$id) jsonError('ID requerido');
        $stmt = $db->prepare('UPDATE proveedores SET estado = 0 WHERE id = ?');
        $stmt->execute([$id]);
        jsonResponse(['message' => 'Proveedor eliminado']);
        break;

    default:
        jsonError('Método no permitido', 405);
}
