<?php
// ============================================================
// /api/trabajadores.php - CRUD de trabajadores (personal)
// ============================================================
// Gestiona las operaciones sobre la tabla `trabajadores`:
//   GET           → lista todos los trabajadores activos
//   GET ?id=N     → devuelve un trabajador por su ID
//   POST          → crea un nuevo trabajador (documento único)
//   PUT           → actualiza los datos de un trabajador existente
//   DELETE        → elimina lógicamente (soft delete: estado = 0)
// ============================================================
require_once __DIR__ . '/config.php';

$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];

// Turnos permitidos por el ENUM de la tabla.
const TURNOS_VALIDOS = ['mañana', 'tarde', 'noche'];

// Normaliza los tipos del array de un trabajador.
function castTrabajador(array $t): array {
    $t['id']      = (int) $t['id'];
    $t['salario'] = (float) $t['salario'];
    $t['estado']  = (bool) $t['estado'];
    return $t;
}

// Devuelve un turno válido o el valor por defecto.
function turnoValido($turno): string {
    return in_array($turno, TURNOS_VALIDOS, true) ? $turno : 'mañana';
}

switch ($method) {
    // ----- LEER -----
    case 'GET':
        if (isset($_GET['id'])) {
            $stmt = $db->prepare(
                'SELECT id, nombre, apellido, documento, cargo, telefono, email,
                        salario, fecha_ingreso AS fechaIngreso, turno, estado
                   FROM trabajadores WHERE id = ?'
            );
            $stmt->execute([$_GET['id']]);
            $row = $stmt->fetch();
            if (!$row) jsonError('Trabajador no encontrado', 404);
            jsonResponse(castTrabajador($row));
        }

        $stmt = $db->query(
            'SELECT id, nombre, apellido, documento, cargo, telefono, email,
                    salario, fecha_ingreso AS fechaIngreso, turno, estado
               FROM trabajadores WHERE estado = 1 ORDER BY apellido, nombre'
        );
        jsonResponse(array_map('castTrabajador', $stmt->fetchAll()));
        break;

    // ----- CREAR -----
    case 'POST':
        $input = getInput();
        if (empty($input['nombre']))   jsonError('El nombre es requerido');
        if (empty($input['apellido'])) jsonError('El apellido es requerido');
        if (empty($input['cargo']))    jsonError('El cargo es requerido');

        try {
            $stmt = $db->prepare(
                'INSERT INTO trabajadores
                    (nombre, apellido, documento, cargo, telefono, email, salario, fecha_ingreso, turno)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
            );
            $stmt->execute([
                $input['nombre'],
                $input['apellido'],
                $input['documento'] ?? null,
                $input['cargo'],
                $input['telefono']  ?? null,
                $input['email']     ?? null,
                $input['salario']   ?? 0,
                !empty($input['fechaIngreso']) ? $input['fechaIngreso'] : null,
                turnoValido($input['turno'] ?? 'mañana'),
            ]);
        } catch (PDOException $e) {
            if ($e->getCode() === '23000') jsonError('El documento ya está registrado', 409);
            jsonError('Error al crear el trabajador', 500);
        }

        jsonResponse(castTrabajador([
            'id'           => (int) $db->lastInsertId(),
            'nombre'       => $input['nombre'],
            'apellido'     => $input['apellido'],
            'documento'    => $input['documento'] ?? null,
            'cargo'        => $input['cargo'],
            'telefono'     => $input['telefono']  ?? null,
            'email'        => $input['email']     ?? null,
            'salario'      => $input['salario']   ?? 0,
            'fechaIngreso' => $input['fechaIngreso'] ?? null,
            'turno'        => turnoValido($input['turno'] ?? 'mañana'),
            'estado'       => 1,
        ]), 201);
        break;

    // ----- ACTUALIZAR -----
    case 'PUT':
        $input = getInput();
        $id    = $input['id'] ?? null;
        if (!$id) jsonError('ID requerido');
        if (empty($input['nombre']))   jsonError('El nombre es requerido');
        if (empty($input['apellido'])) jsonError('El apellido es requerido');
        if (empty($input['cargo']))    jsonError('El cargo es requerido');

        try {
            $stmt = $db->prepare(
                'UPDATE trabajadores
                    SET nombre = ?, apellido = ?, documento = ?, cargo = ?, telefono = ?,
                        email = ?, salario = ?, fecha_ingreso = ?, turno = ?
                  WHERE id = ?'
            );
            $stmt->execute([
                $input['nombre'],
                $input['apellido'],
                $input['documento'] ?? null,
                $input['cargo'],
                $input['telefono']  ?? null,
                $input['email']     ?? null,
                $input['salario']   ?? 0,
                !empty($input['fechaIngreso']) ? $input['fechaIngreso'] : null,
                turnoValido($input['turno'] ?? 'mañana'),
                $id,
            ]);
        } catch (PDOException $e) {
            if ($e->getCode() === '23000') jsonError('El documento ya está registrado por otro trabajador', 409);
            jsonError('Error al actualizar el trabajador', 500);
        }

        jsonResponse(castTrabajador([
            'id'           => (int) $id,
            'nombre'       => $input['nombre'],
            'apellido'     => $input['apellido'],
            'documento'    => $input['documento'] ?? null,
            'cargo'        => $input['cargo'],
            'telefono'     => $input['telefono']  ?? null,
            'email'        => $input['email']     ?? null,
            'salario'      => $input['salario']   ?? 0,
            'fechaIngreso' => $input['fechaIngreso'] ?? null,
            'turno'        => turnoValido($input['turno'] ?? 'mañana'),
            'estado'       => 1,
        ]));
        break;

    // ----- ELIMINAR (soft delete) -----
    case 'DELETE':
        $input = getInput();
        $id    = $input['id'] ?? null;
        if (!$id) jsonError('ID requerido');
        $stmt = $db->prepare('UPDATE trabajadores SET estado = 0 WHERE id = ?');
        $stmt->execute([$id]);
        jsonResponse(['message' => 'Trabajador eliminado']);
        break;

    default:
        jsonError('Método no permitido', 405);
}
