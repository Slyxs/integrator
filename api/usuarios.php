<?php
// ============================================================
// /api/usuarios.php - Usuarios
// GET           → listar (sin contraseñas)
// GET ?id=N     → obtener uno
// POST          → crear
// PUT           → actualizar (nombre, email, rol, password opcional)
// DELETE        → eliminar (soft delete)
// ============================================================
require_once __DIR__ . '/config.php';

$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            $stmt = $db->prepare('SELECT id, nombre, email, rol, estado FROM usuarios WHERE id = ?');
            $stmt->execute([$_GET['id']]);
            $row = $stmt->fetch();
            if (!$row) jsonError('Usuario no encontrado', 404);
            $row['id'] = (int) $row['id'];
            $row['estado'] = (bool) $row['estado'];
            jsonResponse($row);
        }

        $stmt = $db->query(
            'SELECT id, nombre, email, rol, estado FROM usuarios WHERE estado = 1'
        );
        $rows = $stmt->fetchAll();
        foreach ($rows as &$r) {
            $r['id']     = (int)  $r['id'];
            $r['estado'] = (bool) $r['estado'];
        }
        jsonResponse($rows);
        break;

    case 'POST':
        $input = getInput();
        $email = trim($input['email'] ?? '');

        // Verificar email duplicado
        $check = $db->prepare('SELECT id FROM usuarios WHERE email = ?');
        $check->execute([$email]);
        if ($check->fetch()) {
            jsonError('El email ya está registrado');
        }

        $stmt = $db->prepare(
            'INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)'
        );
        $stmt->execute([
            $input['nombre'],
            $email,
            $input['password'],
            $input['rol'] ?? 'usuario',
        ]);

        jsonResponse([
            'id'     => (int) $db->lastInsertId(),
            'nombre' => $input['nombre'],
            'email'  => $email,
            'rol'    => $input['rol'] ?? 'usuario',
            'estado' => true,
        ], 201);
        break;

    case 'PUT':
        $input = getInput();
        $id    = $input['id'] ?? null;
        if (!$id) jsonError('ID requerido');

        // Verificar email duplicado (excluyendo al propio usuario)
        $email = trim($input['email'] ?? '');
        $check = $db->prepare('SELECT id FROM usuarios WHERE email = ? AND id != ?');
        $check->execute([$email, $id]);
        if ($check->fetch()) {
            jsonError('El email ya está registrado por otro usuario');
        }

        // Si se envía password, actualizarla también
        if (!empty($input['password'])) {
            $stmt = $db->prepare(
                'UPDATE usuarios SET nombre = ?, email = ?, password = ?, rol = ? WHERE id = ?'
            );
            $stmt->execute([
                $input['nombre'],
                $email,
                $input['password'],
                $input['rol'] ?? 'usuario',
                $id,
            ]);
        } else {
            $stmt = $db->prepare(
                'UPDATE usuarios SET nombre = ?, email = ?, rol = ? WHERE id = ?'
            );
            $stmt->execute([
                $input['nombre'],
                $email,
                $input['rol'] ?? 'usuario',
                $id,
            ]);
        }

        jsonResponse([
            'id'     => (int) $id,
            'nombre' => $input['nombre'],
            'email'  => $email,
            'rol'    => $input['rol'] ?? 'usuario',
            'estado' => true,
        ]);
        break;

    case 'DELETE':
        $input = getInput();
        $id    = $input['id'] ?? null;
        if (!$id) jsonError('ID requerido');

        $stmt = $db->prepare('UPDATE usuarios SET estado = 0 WHERE id = ?');
        $stmt->execute([$id]);
        jsonResponse(['message' => 'Usuario eliminado']);
        break;

    default:
        jsonError('Método no permitido', 405);
}
