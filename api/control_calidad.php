<?php
// ============================================================
// /api/control_calidad.php - CRUD de inspecciones de calidad
// ============================================================
// Gestiona las operaciones sobre la tabla `control_calidad`:
//   GET           → lista todas las inspecciones activas
//   GET ?id=N     → devuelve una inspección por su ID
//   POST          → registra una nueva inspección de calidad
//   PUT           → actualiza los datos de una inspección existente
//   DELETE        → elimina lógicamente (soft delete: estado = 0)
// ============================================================
require_once __DIR__ . '/config.php';

$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];

// Resultados permitidos por el ENUM de la tabla.
const RESULTADOS_VALIDOS = ['aprobado', 'observado', 'rechazado'];

// Normaliza los tipos del array de una inspección.
function castControl(array $c): array {
    $c['id']          = (int) $c['id'];
    $c['productoId']  = $c['productoId'] !== null ? (int) $c['productoId'] : null;
    $c['puntuacion']  = (int) $c['puntuacion'];
    $c['temperatura'] = $c['temperatura'] !== null ? (float) $c['temperatura'] : null;
    $c['estado']      = (bool) $c['estado'];
    return $c;
}

// Devuelve un resultado válido o el valor por defecto.
function resultadoValido($resultado): string {
    return in_array($resultado, RESULTADOS_VALIDOS, true) ? $resultado : 'aprobado';
}

switch ($method) {
    // ----- LEER -----
    case 'GET':
        if (isset($_GET['id'])) {
            $stmt = $db->prepare(
                'SELECT id, producto_id AS productoId, producto_nombre AS productoNombre,
                        lote, fecha_inspeccion AS fechaInspeccion, inspector, temperatura,
                        puntuacion, resultado, observaciones, estado
                   FROM control_calidad WHERE id = ?'
            );
            $stmt->execute([$_GET['id']]);
            $row = $stmt->fetch();
            if (!$row) jsonError('Inspección no encontrada', 404);
            jsonResponse(castControl($row));
        }

        $stmt = $db->query(
            'SELECT id, producto_id AS productoId, producto_nombre AS productoNombre,
                    lote, fecha_inspeccion AS fechaInspeccion, inspector, temperatura,
                    puntuacion, resultado, observaciones, estado
               FROM control_calidad WHERE estado = 1 ORDER BY fecha_inspeccion DESC, id DESC'
        );
        jsonResponse(array_map('castControl', $stmt->fetchAll()));
        break;

    // ----- CREAR -----
    case 'POST':
        $input = getInput();
        if (empty($input['fechaInspeccion'])) jsonError('La fecha de inspección es requerida');

        $stmt = $db->prepare(
            'INSERT INTO control_calidad
                (producto_id, producto_nombre, lote, fecha_inspeccion, inspector,
                 temperatura, puntuacion, resultado, observaciones)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            !empty($input['productoId']) ? (int) $input['productoId'] : null,
            $input['productoNombre'] ?? null,
            $input['lote']           ?? null,
            $input['fechaInspeccion'],
            $input['inspector']      ?? null,
            isset($input['temperatura']) && $input['temperatura'] !== '' ? $input['temperatura'] : null,
            (int) ($input['puntuacion'] ?? 0),
            resultadoValido($input['resultado'] ?? 'aprobado'),
            $input['observaciones']  ?? null,
        ]);

        jsonResponse(castControl([
            'id'              => (int) $db->lastInsertId(),
            'productoId'      => !empty($input['productoId']) ? (int) $input['productoId'] : null,
            'productoNombre'  => $input['productoNombre'] ?? null,
            'lote'            => $input['lote'] ?? null,
            'fechaInspeccion' => $input['fechaInspeccion'],
            'inspector'       => $input['inspector'] ?? null,
            'temperatura'     => isset($input['temperatura']) && $input['temperatura'] !== '' ? $input['temperatura'] : null,
            'puntuacion'      => (int) ($input['puntuacion'] ?? 0),
            'resultado'       => resultadoValido($input['resultado'] ?? 'aprobado'),
            'observaciones'   => $input['observaciones'] ?? null,
            'estado'          => 1,
        ]), 201);
        break;

    // ----- ACTUALIZAR -----
    case 'PUT':
        $input = getInput();
        $id    = $input['id'] ?? null;
        if (!$id) jsonError('ID requerido');
        if (empty($input['fechaInspeccion'])) jsonError('La fecha de inspección es requerida');

        $stmt = $db->prepare(
            'UPDATE control_calidad
                SET producto_id = ?, producto_nombre = ?, lote = ?, fecha_inspeccion = ?,
                    inspector = ?, temperatura = ?, puntuacion = ?, resultado = ?, observaciones = ?
              WHERE id = ?'
        );
        $stmt->execute([
            !empty($input['productoId']) ? (int) $input['productoId'] : null,
            $input['productoNombre'] ?? null,
            $input['lote']           ?? null,
            $input['fechaInspeccion'],
            $input['inspector']      ?? null,
            isset($input['temperatura']) && $input['temperatura'] !== '' ? $input['temperatura'] : null,
            (int) ($input['puntuacion'] ?? 0),
            resultadoValido($input['resultado'] ?? 'aprobado'),
            $input['observaciones']  ?? null,
            $id,
        ]);

        jsonResponse(castControl([
            'id'              => (int) $id,
            'productoId'      => !empty($input['productoId']) ? (int) $input['productoId'] : null,
            'productoNombre'  => $input['productoNombre'] ?? null,
            'lote'            => $input['lote'] ?? null,
            'fechaInspeccion' => $input['fechaInspeccion'],
            'inspector'       => $input['inspector'] ?? null,
            'temperatura'     => isset($input['temperatura']) && $input['temperatura'] !== '' ? $input['temperatura'] : null,
            'puntuacion'      => (int) ($input['puntuacion'] ?? 0),
            'resultado'       => resultadoValido($input['resultado'] ?? 'aprobado'),
            'observaciones'   => $input['observaciones'] ?? null,
            'estado'          => 1,
        ]));
        break;

    // ----- ELIMINAR (soft delete) -----
    case 'DELETE':
        $input = getInput();
        $id    = $input['id'] ?? null;
        if (!$id) jsonError('ID requerido');
        $stmt = $db->prepare('UPDATE control_calidad SET estado = 0 WHERE id = ?');
        $stmt->execute([$id]);
        jsonResponse(['message' => 'Inspección eliminada']);
        break;

    default:
        jsonError('Método no permitido', 405);
}
