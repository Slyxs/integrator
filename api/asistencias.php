<?php
// ============================================================
// /api/asistencias.php - Gestión de asistencia de empleados
// ============================================================
// GET           → lista todas las asistencias con el nombre del trabajador
// GET ?id=N     → devuelve una asistencia por su ID
// POST          → registra una nueva asistencia (única por trabajador y fecha)
// PUT           → actualiza una asistencia existente
// DELETE        → elimina una asistencia
// ============================================================
require_once __DIR__ . '/config.php';

$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];

// Estados permitidos por el ENUM de la tabla.
const ESTADOS_ASISTENCIA = ['presente', 'tardanza', 'falta', 'justificada'];

// Columnas seleccionadas con alias camelCase para el frontend.
const ASISTENCIA_COLUMNS =
    "a.id, a.trabajador_id AS trabajadorId,
     CONCAT(t.nombre, ' ', t.apellido) AS trabajadorNombre, t.cargo AS trabajadorCargo,
     a.fecha, a.hora_entrada AS horaEntrada, a.hora_salida AS horaSalida,
     a.estado, a.observaciones";

// Normaliza los tipos del array de una asistencia.
function castAsistencia(array $a): array {
    $a['id']           = (int) $a['id'];
    $a['trabajadorId'] = (int) $a['trabajadorId'];
    return $a;
}

// Devuelve un estado válido o el valor por defecto.
function estadoAsistenciaValido($estado): string {
    return in_array($estado, ESTADOS_ASISTENCIA, true) ? $estado : 'presente';
}

switch ($method) {
    // ----- LEER -----
    case 'GET':
        if (isset($_GET['id'])) {
            $stmt = $db->prepare(
                'SELECT ' . ASISTENCIA_COLUMNS . '
                   FROM asistencias a
                   JOIN trabajadores t ON t.id = a.trabajador_id
                  WHERE a.id = ?'
            );
            $stmt->execute([$_GET['id']]);
            $row = $stmt->fetch();
            if (!$row) jsonError('Asistencia no encontrada', 404);
            jsonResponse(castAsistencia($row));
        }

        $stmt = $db->query(
            'SELECT ' . ASISTENCIA_COLUMNS . '
               FROM asistencias a
               JOIN trabajadores t ON t.id = a.trabajador_id
              ORDER BY a.fecha DESC, a.id DESC'
        );
        jsonResponse(array_map('castAsistencia', $stmt->fetchAll()));
        break;

    // ----- CREAR -----
    case 'POST':
        $input = getInput();
        if (empty($input['trabajadorId'])) jsonError('El trabajador es requerido');
        if (empty($input['fecha']))        jsonError('La fecha es requerida');

        try {
            $stmt = $db->prepare(
                'INSERT INTO asistencias
                    (trabajador_id, fecha, hora_entrada, hora_salida, estado, observaciones)
                 VALUES (?, ?, ?, ?, ?, ?)'
            );
            $stmt->execute([
                (int) $input['trabajadorId'],
                $input['fecha'],
                !empty($input['horaEntrada']) ? $input['horaEntrada'] : null,
                !empty($input['horaSalida'])  ? $input['horaSalida']  : null,
                estadoAsistenciaValido($input['estado'] ?? 'presente'),
                $input['observaciones'] ?? null,
            ]);
        } catch (PDOException $e) {
            if ($e->getCode() === '23000') {
                jsonError('Ya existe un registro de asistencia para ese trabajador en esa fecha', 409);
            }
            jsonError('Error al registrar la asistencia', 500);
        }

        jsonResponse(['id' => (int) $db->lastInsertId(), 'success' => true], 201);
        break;

    // ----- ACTUALIZAR -----
    case 'PUT':
        $input = getInput();
        $id    = $input['id'] ?? null;
        if (!$id) jsonError('ID requerido');
        if (empty($input['trabajadorId'])) jsonError('El trabajador es requerido');
        if (empty($input['fecha']))        jsonError('La fecha es requerida');

        try {
            $stmt = $db->prepare(
                'UPDATE asistencias
                    SET trabajador_id = ?, fecha = ?, hora_entrada = ?, hora_salida = ?,
                        estado = ?, observaciones = ?
                  WHERE id = ?'
            );
            $stmt->execute([
                (int) $input['trabajadorId'],
                $input['fecha'],
                !empty($input['horaEntrada']) ? $input['horaEntrada'] : null,
                !empty($input['horaSalida'])  ? $input['horaSalida']  : null,
                estadoAsistenciaValido($input['estado'] ?? 'presente'),
                $input['observaciones'] ?? null,
                $id,
            ]);
        } catch (PDOException $e) {
            if ($e->getCode() === '23000') {
                jsonError('Ya existe un registro de asistencia para ese trabajador en esa fecha', 409);
            }
            jsonError('Error al actualizar la asistencia', 500);
        }

        jsonResponse(['id' => (int) $id, 'success' => true]);
        break;

    // ----- ELIMINAR -----
    case 'DELETE':
        $input = getInput();
        $id    = $input['id'] ?? null;
        if (!$id) jsonError('ID requerido');
        $stmt = $db->prepare('DELETE FROM asistencias WHERE id = ?');
        $stmt->execute([$id]);
        jsonResponse(['message' => 'Asistencia eliminada']);
        break;

    default:
        jsonError('Método no permitido', 405);
}
