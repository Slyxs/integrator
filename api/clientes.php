<?php
// ============================================================
// /api/clientes.php - CRUD de clientes
// ============================================================
// Gestiona las operaciones sobre la tabla `clientes`:
//   GET           → lista todos los clientes activos
//   GET ?id=N     → devuelve un cliente por su ID
//   POST          → crea un nuevo cliente
//   PUT           → actualiza los datos de un cliente existente
//   DELETE        → elimina lógicamente (soft delete: estado = 0)
// ============================================================
require_once __DIR__ . '/config.php';

$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];

// Normaliza los tipos del array de un cliente:
// id como entero y estado como booleano.
// Se aplica a todas las respuestas para consistencia con el frontend.
function castClient(array $c): array {
    $c['id']     = (int) $c['id'];
    $c['estado'] = (bool) $c['estado'];
    return $c;
}

switch ($method) {
    // ----- LEER -----
    case 'GET':
        // Si se pasa ?id=N devuelve solo ese cliente
        if (isset($_GET['id'])) {
            // Selecciona todos los campos de la tabla clientes donde el id coincide.
            $stmt = $db->prepare('SELECT * FROM clientes WHERE id = ?');
            // Ejecuta la consulta con el ID proporcionado
            $stmt->execute([$_GET['id']]);
            // Obtiene la fila resultante (si existe)
            $row = $stmt->fetch();
            // Si no se encuentra el cliente, devuelve un error 404 Not Found.
            if (!$row) jsonError('Cliente no encontrado', 404);
            // Devuelve el cliente encontrado con los tipos normalizados.
            jsonResponse(castClient($row));
        }

        // Sin parámetros: devuelve todos los clientes activos
        $stmt = $db->query('SELECT * FROM clientes WHERE estado = 1');
        // Devuelve la lista de clientes activos con los tipos normalizados.
        jsonResponse(array_map('castClient', $stmt->fetchAll()));
        break;

    // ----- CREAR -----
    case 'POST':
        $input = getInput();
        // Inserta el nuevo cliente; email, teléfono, dirección y documento son opcionales
        $stmt  = $db->prepare(
            'INSERT INTO clientes (nombre, apellido, email, telefono, direccion, documento)
             VALUES (?, ?, ?, ?, ?, ?)'
        );
        // Ejecuta la consulta con los datos proporcionados en el cuerpo JSON. Se usan null para los campos opcionales si no se envían.
        $stmt->execute([
            $input['nombre'],
            $input['apellido'],
            $input['email']     ?? null,
            $input['telefono']  ?? null,
            $input['direccion'] ?? null,
            $input['documento'] ?? null,
        ]);

        // Devuelve el cliente recién creado con el ID generado por MySQL
        jsonResponse(castClient(array_merge(
            // Se combina el ID generado por la base de datos con los datos enviados en el cuerpo JSON para construir la respuesta.
            // El estado se establece en 1 (activo) por defecto.
            ['id' => $db->lastInsertId(), 'estado' => 1],
            $input
        )), 201);
        break;

    // ----- ACTUALIZAR -----
    case 'PUT':
        $input = getInput();
        $id    = $input['id'] ?? null;
        if (!$id) jsonError('ID requerido');

        // Actualiza todos los campos editables del cliente
        $stmt = $db->prepare(
            'UPDATE clientes
                SET nombre = ?, apellido = ?, email = ?, telefono = ?, direccion = ?, documento = ?
              WHERE id = ?'
        );
        // Ejecuta la consulta con los datos proporcionados en el cuerpo JSON. Se usan null para los campos opcionales si no se envían.
        $stmt->execute([
            $input['nombre'],
            $input['apellido'],
            $input['email']     ?? null,
            $input['telefono']  ?? null,
            $input['direccion'] ?? null,
            $input['documento'] ?? null,
            $id,
        ]);
        // Devuelve el cliente actualizado con los datos enviados en el cuerpo JSON y el ID. El estado se mantiene en 1 (activo).
        jsonResponse(castClient(array_merge(['id' => $id, 'estado' => 1], $input)));
        break;

    // ----- ELIMINAR (soft delete) -----
    // Hace una actualización para marcar el cliente como inactivo (estado = 0) en lugar de eliminarlo físicamente de la base de datos.
    // Esto permite conservar el historial de ventas relacionadas con ese cliente.
    case 'DELETE':
        $input = getInput();
        // El ID del cliente a eliminar es obligatorio; si no se proporciona, devuelve un error 400 Bad Request indicando que el ID es requerido.
        $id    = $input['id'] ?? null;
        if (!$id) jsonError('ID requerido');

        // No se borra el registro; solo se marca estado = 0
        // para conservar el historial de ventas relacionadas.
        $stmt = $db->prepare('UPDATE clientes SET estado = 0 WHERE id = ?');
        $stmt->execute([$id]);
        // Devuelve un mensaje indicando que el cliente fue eliminado (soft delete).
        jsonResponse(['message' => 'Cliente eliminado']);
        break;
        
    // Si se recibe un método HTTP no soportado, devuelve un error 405 Method Not Allowed.
    default:
        jsonError('Método no permitido', 405);
}
