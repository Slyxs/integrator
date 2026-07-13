<?php
// ============================================================
// /api/reclamaciones.php - Libro de Reclamaciones
// ============================================================
// GET           → lista todas las reclamaciones (admin)
// GET ?id=N     → devuelve una reclamación por su ID (admin)
// GET ?codigo=X → consulta el estado de una reclamación por su código (público)
// POST          → registra una nueva reclamación (público) y genera su código
// PUT           → actualiza estado / respuesta de una reclamación (admin)
// DELETE        → elimina lógicamente una reclamación (admin)
// ============================================================
require_once __DIR__ . '/config.php';

$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];

// Valores permitidos por los ENUM de la tabla.
const TIPOS_RECLAMO   = ['reclamo', 'queja'];
const TIPOS_DOCUMENTO = ['DNI', 'CE', 'pasaporte', 'RUC'];
const TIPOS_BIEN      = ['producto', 'servicio'];
const ESTADOS_RECLAMO = ['pendiente', 'en_proceso', 'resuelto', 'rechazado'];

// Normaliza los tipos del array de una reclamación.
function castReclamacion(array $r): array {
    $r['id']             = (int) $r['id'];
    $r['menorEdad']      = (bool) $r['menorEdad'];
    $r['montoReclamado'] = $r['montoReclamado'] !== null ? (float) $r['montoReclamado'] : null;
    return $r;
}

// Devuelve un valor válido de una lista blanca o el valor por defecto.
function enumValido($valor, array $permitidos, string $default): string {
    return in_array($valor, $permitidos, true) ? $valor : $default;
}

// Genera el siguiente código correlativo tipo REC-000001.
function siguienteCodigoReclamo(PDO $db): string {
    $ultimo = $db->query('SELECT MAX(id) AS max_id FROM reclamaciones')->fetch();
    $siguiente = ((int) ($ultimo['max_id'] ?? 0)) + 1;
    return 'REC-' . str_pad((string) $siguiente, 6, '0', STR_PAD_LEFT);
}

// Columnas seleccionadas (con alias camelCase para el frontend).
const RECLAMO_COLUMNS =
    'id, codigo, tipo, nombre, apellido, tipo_documento AS tipoDocumento, documento,
     email, telefono, direccion, menor_edad AS menorEdad, tipo_bien AS tipoBien,
     monto_reclamado AS montoReclamado, descripcion_bien AS descripcionBien,
     detalle, pedido, estado, respuesta, created_at AS createdAt';

switch ($method) {
    // ----- LEER -----
    case 'GET':
        // Consulta pública del estado por código
        if (isset($_GET['codigo'])) {
            $stmt = $db->prepare(
                'SELECT codigo, tipo, estado, respuesta, created_at AS createdAt
                   FROM reclamaciones WHERE codigo = ?'
            );
            $stmt->execute([strtoupper(trim($_GET['codigo']))]);
            $row = $stmt->fetch();
            if (!$row) jsonError('No existe una reclamación con ese código', 404);
            jsonResponse($row);
        }

        // Detalle por ID (admin)
        if (isset($_GET['id'])) {
            $stmt = $db->prepare('SELECT ' . RECLAMO_COLUMNS . ' FROM reclamaciones WHERE id = ?');
            $stmt->execute([$_GET['id']]);
            $row = $stmt->fetch();
            if (!$row) jsonError('Reclamación no encontrada', 404);
            jsonResponse(castReclamacion($row));
        }

        // Listado completo (admin)
        $stmt = $db->query('SELECT ' . RECLAMO_COLUMNS . ' FROM reclamaciones ORDER BY created_at DESC');
        jsonResponse(array_map('castReclamacion', $stmt->fetchAll()));
        break;

    // ----- CREAR (público) -----
    case 'POST':
        $input = getInput();
        if (empty($input['nombre']))   jsonError('El nombre es requerido');
        if (empty($input['apellido'])) jsonError('El apellido es requerido');
        if (empty($input['detalle']))  jsonError('El detalle de la reclamación es requerido');

        $codigo = siguienteCodigoReclamo($db);

        $stmt = $db->prepare(
            'INSERT INTO reclamaciones
                (codigo, tipo, nombre, apellido, tipo_documento, documento, email, telefono,
                 direccion, menor_edad, tipo_bien, monto_reclamado, descripcion_bien, detalle, pedido)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $codigo,
            enumValido($input['tipo'] ?? 'reclamo', TIPOS_RECLAMO, 'reclamo'),
            $input['nombre'],
            $input['apellido'],
            enumValido($input['tipoDocumento'] ?? 'DNI', TIPOS_DOCUMENTO, 'DNI'),
            $input['documento'] ?? null,
            $input['email']     ?? null,
            $input['telefono']  ?? null,
            $input['direccion'] ?? null,
            !empty($input['menorEdad']) ? 1 : 0,
            enumValido($input['tipoBien'] ?? 'producto', TIPOS_BIEN, 'producto'),
            isset($input['montoReclamado']) && $input['montoReclamado'] !== '' ? $input['montoReclamado'] : null,
            $input['descripcionBien'] ?? null,
            $input['detalle'],
            $input['pedido'] ?? null,
        ]);

        jsonResponse([
            'id'      => (int) $db->lastInsertId(),
            'codigo'  => $codigo,
            'estado'  => 'pendiente',
            'message' => 'Reclamación registrada correctamente',
        ], 201);
        break;

    // ----- ACTUALIZAR (admin) -----
    case 'PUT':
        $input = getInput();
        $id    = $input['id'] ?? null;
        if (!$id) jsonError('ID requerido');

        $stmt = $db->prepare(
            'UPDATE reclamaciones SET estado = ?, respuesta = ? WHERE id = ?'
        );
        $stmt->execute([
            enumValido($input['estado'] ?? 'pendiente', ESTADOS_RECLAMO, 'pendiente'),
            $input['respuesta'] ?? null,
            $id,
        ]);
        jsonResponse(['message' => 'Reclamación actualizada']);
        break;

    // ----- ELIMINAR -----
    case 'DELETE':
        $input = getInput();
        $id    = $input['id'] ?? null;
        if (!$id) jsonError('ID requerido');
        $stmt = $db->prepare('DELETE FROM reclamaciones WHERE id = ?');
        $stmt->execute([$id]);
        jsonResponse(['message' => 'Reclamación eliminada']);
        break;

    default:
        jsonError('Método no permitido', 405);
}
