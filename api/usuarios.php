<?php
// ============================================================
// /api/usuarios.php - CRUD de usuarios del sistema
// ============================================================
// Gestiona las cuentas de acceso al sistema (admin y usuario):
//   GET           → lista todos los usuarios activos (sin contraseñas)
//   GET ?id=N     → devuelve un usuario por su ID
//   POST          → crea un nuevo usuario verificando email único
//   PUT           → actualiza datos; la contraseña solo cambia si se envía
//   DELETE        → elimina lógicamente (soft delete: estado = 0)
// ============================================================
require_once __DIR__ . '/config.php';

$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];

// Switch para manejar cada método HTTP (GET, POST, PUT, DELETE) y realizar la operación correspondiente sobre la tabla usuarios.
// Cada caso maneja la lógica específica para esa operación, incluyendo validaciones como email único y manejo de errores.
switch ($method) {
    // ----- LEER -----
    case 'GET':
        // Si se pasa ?id=N devuelve solo ese usuario
        if (isset($_GET['id'])) {
            // Selecciona id, nombre, email, rol y estado de la tabla usuarios donde el id coincide. Nunca se devuelve la contraseña por seguridad.
            $stmt = $db->prepare('SELECT id, nombre, email, rol, estado FROM usuarios WHERE id = ?');
            // Ejecuta la consulta con el ID proporcionado
            $stmt->execute([$_GET['id']]);
            // Obtiene la fila resultante (si existe)
            $row = $stmt->fetch();
            // Si no se encuentra el usuario, devuelve un error 404 Not Found.
            if (!$row) jsonError('Usuario no encontrado', 404);
            // Devuelve el usuario encontrado con los tipos normalizados (id como entero y estado como booleano).
            $row['id'] = (int) $row['id'];
            $row['estado'] = (bool) $row['estado'];
            // Devuelve el usuario encontrado con los tipos normalizados.
            jsonResponse($row);
        }

        // Sin parámetros: lista todos los usuarios activos
        // Nunca se devuelve el campo password por seguridad
        $stmt = $db->query(
            // Selecciona id, nombre, email, rol y estado de la tabla usuarios donde estado es activo (1). Nunca se devuelve la contraseña por seguridad.
            'SELECT id, nombre, email, rol, estado FROM usuarios WHERE estado = 1'
        );
        // Obtiene todas las filas resultantes
        $rows = $stmt->fetchAll();
        // Normaliza los tipos de cada usuario: id como entero y estado como booleano. Esto es importante para que el frontend reciba los datos en el formato esperado.
        foreach ($rows as &$r) {
            $r['id']     = (int)  $r['id'];
            $r['estado'] = (bool) $r['estado'];
        }
        // Devuelve la lista de usuarios activos con los tipos normalizados.
        jsonResponse($rows);
        break;

    // ----- CREAR -----
    case 'POST':
        $input = getInput();
        // Elimina espacios en blanco al inicio y al final del email para evitar problemas de validación.
        $email = trim($input['email'] ?? '');

        // Verificar email duplicado antes de insertar
        $check = $db->prepare('SELECT id FROM usuarios WHERE email = ?');
        // Ejecuta la consulta para verificar si el email ya existe en la base de datos.
        $check->execute([$email]);
        // Si se encuentra un registro con el mismo email, devuelve un error indicando que el email ya está registrado.
        if ($check->fetch()) {
            jsonError('El email ya está registrado');
        }

        // Insertar el nuevo usuario; rol por defecto 'usuario'
        $stmt = $db->prepare(
            'INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)'
        );
        // Ejecuta la inserción con los datos proporcionados en el cuerpo JSON.
        $stmt->execute([
            $input['nombre'],
            $email,
            $input['password'],
            $input['rol'] ?? 'usuario',
        ]);
        // Devuelve el usuario recién creado con el ID generado por MySQL y un código 201 Created.
        jsonResponse([
            'id'     => (int) $db->lastInsertId(),
            'nombre' => $input['nombre'],
            'email'  => $email,
            'rol'    => $input['rol'] ?? 'usuario',
            'estado' => true,
        ], 201);
        break;

    // ----- ACTUALIZAR -----
    case 'PUT':
        $input = getInput();
        // El ID del usuario a actualizar es obligatorio; si no se proporciona, devuelve un error.
        $id    = $input['id'] ?? null;
        if (!$id) jsonError('ID requerido');

        // Verificar email duplicado excluyendo al propio usuario
        // Elimina espacios en blanco al inicio y al final del email para evitar problemas de validación.
        $email = trim($input['email'] ?? '');
        // Prepara una consulta para verificar si el email ya está registrado por otro usuario (excluyendo al usuario actual).
        $check = $db->prepare('SELECT id FROM usuarios WHERE email = ? AND id != ?');
        // Ejecuta la consulta con el email proporcionado y el ID del usuario actual para verificar si el email ya existe en otro registro de la base de datos.
        $check->execute([$email, $id]);
        // Si se encuentra un registro con el mismo email (excluyendo al usuario actual), devuelve un error indicando que el email ya está registrado por otro usuario.
        if ($check->fetch()) {
            jsonError('El email ya está registrado por otro usuario');
        }

        // Si se envía password, actualizarla; de lo contrario solo datos básicos
        if (!empty($input['password'])) {
            // Prepara una consulta para actualizar el nombre, email, contraseña y rol del usuario con el ID especificado.
            $stmt = $db->prepare(
                'UPDATE usuarios SET nombre = ?, email = ?, password = ?, rol = ? WHERE id = ?'
            );
            // Ejecuta la actualización con los datos proporcionados en el cuerpo JSON.
            $stmt->execute([
                $input['nombre'],
                $email,
                $input['password'],
                $input['rol'] ?? 'usuario',
                $id,
            ]);
        } else {
            // Prepara una consulta para actualizar el nombre, email y rol del usuario con el ID especificado.
            $stmt = $db->prepare(
                'UPDATE usuarios SET nombre = ?, email = ?, rol = ? WHERE id = ?'
            );
            // Ejecuta la actualización con los datos proporcionados en el cuerpo JSON.
            $stmt->execute([
                $input['nombre'],
                $email,
                $input['rol'] ?? 'usuario',
                $id,
            ]);
        }

        // Devuelve el usuario actualizado sin contraseña
        jsonResponse([
        // Devuelve el usuario actualizado con el ID, nombre, email, rol y estado. El campo password no se devuelve por seguridad.
            'id'     => (int) $id,
            'nombre' => $input['nombre'],
            'email'  => $email,
            'rol'    => $input['rol'] ?? 'usuario',
            'estado' => true,
        ]);
        break;

    // ----- ELIMINAR (soft delete) -----
    case 'DELETE':
        // Usamos getInput() para obtener el ID del usuario a eliminar.
        $input = getInput();
        $id    = $input['id'] ?? null;
        // Si no se proporciona un ID, respondemos con un error.
        if (!$id) jsonError('ID requerido');

        // Desactiva al usuario sin borrar el registro
        // Prepara una consulta para actualizar el campo estado a 0 (inactivo) del usuario con el ID especificado, en lugar de eliminarlo físicamente de la base de datos.
        // Esto se hace para conservar el historial de ventas relacionadas con ese usuario.
        $stmt = $db->prepare('UPDATE usuarios SET estado = 0 WHERE id = ?');
        // Ejecuta la actualización para marcar al usuario como inactivo.
        $stmt->execute([$id]);
        // Devuelve un mensaje indicando que el usuario ha sido eliminado.
        jsonResponse(['message' => 'Usuario eliminado']);
        break;

    default:
    // Si se recibe un método HTTP no soportado, devuelve un error 405 Method Not Allowed.
        jsonError('Método no permitido', 405);
}
