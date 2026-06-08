<?php
// ============================================================
// Juan Valdez Café - API de Promociones
// ============================================================
// GET  /api/promociones.php              → lista las promociones activas y vigentes
// GET  /api/promociones.php?codigo=XXXX  → valida un código de descuento específico
// POST /api/promociones.php              → crea una nueva promoción (admin)
//                                          o registra el uso de una promo (action: 'usar')
// PUT  /api/promociones.php              → actualiza una promoción existente (admin)
// DELETE /api/promociones.php            → desactiva una promoción (soft-delete, admin)
// ============================================================

require_once 'config.php';

$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];

function promocionEstadoToInt($value, $default = 1) {
    if ($value === null) return $default;
    if (is_bool($value)) return $value ? 1 : 0;
    if (is_int($value) || is_float($value)) return ((int) $value) === 1 ? 1 : 0;

    if (is_string($value)) {
        $normalized = strtolower(trim($value));
        if (in_array($normalized, ['1', 'true', 'activo', 'activa', 'on', 'yes', 'si'], true)) return 1;
        if (in_array($normalized, ['0', 'false', 'inactivo', 'inactiva', 'off', 'no', ''], true)) return 0;
    }

    return $default;
}

function castPromocion(array $promo): array {
    if (array_key_exists('id', $promo)) {
        $promo['id'] = (int) $promo['id'];
    }
    if (array_key_exists('valor', $promo)) {
        $promo['valor'] = (float) $promo['valor'];
    }
    if (array_key_exists('minimo_compra', $promo)) {
        $promo['minimo_compra'] = (float) $promo['minimo_compra'];
    }
    if (array_key_exists('usos_actuales', $promo)) {
        $promo['usos_actuales'] = (int) $promo['usos_actuales'];
    }
    if (array_key_exists('usos_maximos', $promo) && $promo['usos_maximos'] !== null) {
        $promo['usos_maximos'] = (int) $promo['usos_maximos'];
    }
    if (array_key_exists('estado', $promo)) {
        $promo['estado'] = promocionEstadoToInt($promo['estado'], 0) === 1;
    }

    return $promo;
}

// ===================== GET =====================
if ($method === 'GET') {

    $codigo = isset($_GET['codigo']) ? strtoupper(trim($_GET['codigo'])) : null;

    if ($codigo !== null) {
        // --- Validar un código específico ---
        $stmt = $db->prepare('
            SELECT id, codigo, titulo, descripcion, tipo, valor,
                   minimo_compra, usos_maximos, usos_actuales, fecha_inicio, fecha_fin, estado
            FROM promociones
            WHERE codigo = :codigo
              AND estado = 1
              AND fecha_inicio <= CURDATE()
              AND (fecha_fin IS NULL OR fecha_fin >= CURDATE())
              AND (usos_maximos IS NULL OR usos_actuales < usos_maximos)
            LIMIT 1
        ');
        $stmt->execute([':codigo' => $codigo]);
        $promo = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$promo) {
            jsonError('Código de descuento inválido o expirado', 404);
        }

        jsonResponse(castPromocion($promo));
    }

    // --- Listar todas las promociones activas y vigentes ---
    $all = isset($_GET['all']) && $_GET['all'] === '1';

    if ($all) {
        // Admin: devuelve todas sin filtrar por estado ni fecha
        $stmt = $db->query('
            SELECT id, codigo, titulo, descripcion, tipo, valor,
                   minimo_compra, usos_maximos, usos_actuales, fecha_inicio, fecha_fin, estado
            FROM promociones
            ORDER BY created_at ASC
        ');
    } else {
        $stmt = $db->query('
            SELECT id, codigo, titulo, descripcion, tipo, valor,
                   minimo_compra, usos_maximos, usos_actuales, fecha_inicio, fecha_fin, estado
            FROM promociones
            WHERE estado = 1
              AND fecha_inicio <= CURDATE()
              AND (fecha_fin IS NULL OR fecha_fin >= CURDATE())
            ORDER BY created_at ASC
        ');
    }
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $rows = array_map('castPromocion', $rows);

    jsonResponse($rows);
}

// ===================== POST =====================
if ($method === 'POST') {
    $data   = getInput();
    $action = $data['action'] ?? '';

    // --- Registrar uso de una promoción tras una venta exitosa ---
    if ($action === 'usar') {
        $id = (int) ($data['id'] ?? 0);
        if (!$id) jsonError('ID de promoción requerido', 400);

        $stmt = $db->prepare(
            'UPDATE promociones SET usos_actuales = usos_actuales + 1 WHERE id = ? AND estado = 1'
        );
        $stmt->execute([$id]);
        jsonResponse(['success' => true]);
    }

    // --- Crear una nueva promoción (admin) ---
    $required = ['codigo', 'titulo', 'tipo', 'valor', 'fecha_inicio'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            jsonError("Campo requerido: $field", 400);
        }
    }

    if (!in_array($data['tipo'], ['porcentaje', 'monto_fijo'])) {
        jsonError('Tipo inválido. Usa: porcentaje o monto_fijo', 400);
    }

    try {
        $stmt = $db->prepare('
            INSERT INTO promociones
              (codigo, titulo, descripcion, tipo, valor, minimo_compra, usos_maximos, fecha_inicio, fecha_fin, estado)
            VALUES
              (:codigo, :titulo, :descripcion, :tipo, :valor, :minimo_compra, :usos_maximos, :fecha_inicio, :fecha_fin, :estado)
        ');
        $stmt->execute([
            ':codigo'        => strtoupper(trim($data['codigo'])),
            ':titulo'        => trim($data['titulo']),
            ':descripcion'   => isset($data['descripcion']) ? trim($data['descripcion']) : null,
            ':tipo'          => $data['tipo'],
            ':valor'         => (float) $data['valor'],
            ':minimo_compra' => (float) ($data['minimo_compra'] ?? 0),
            ':usos_maximos'  => isset($data['usos_maximos']) && $data['usos_maximos'] !== '' ? (int) $data['usos_maximos'] : null,
            ':fecha_inicio'  => $data['fecha_inicio'],
            ':fecha_fin'     => !empty($data['fecha_fin']) ? $data['fecha_fin'] : null,
            ':estado'        => promocionEstadoToInt($data['estado'] ?? true, 1),
        ]);
        jsonResponse(['id' => (int) $db->lastInsertId(), 'success' => true], 201);
    } catch (PDOException $e) {
        if ($e->getCode() === '23000') {
            jsonError('El código de promoción ya existe', 409);
        }
        jsonError('Error al crear la promoción', 500);
    }
}

// ===================== PUT =====================
if ($method === 'PUT') {
    $data = getInput();
    $id   = (int) ($data['id'] ?? 0);
    if (!$id) jsonError('ID requerido', 400);

    if (!in_array($data['tipo'] ?? '', ['porcentaje', 'monto_fijo'])) {
        jsonError('Tipo inválido. Usa: porcentaje o monto_fijo', 400);
    }

    try {
        $stmt = $db->prepare('
            UPDATE promociones SET
                codigo        = :codigo,
                titulo        = :titulo,
                descripcion   = :descripcion,
                tipo          = :tipo,
                valor         = :valor,
                minimo_compra = :minimo_compra,
                usos_maximos  = :usos_maximos,
                fecha_inicio  = :fecha_inicio,
                fecha_fin     = :fecha_fin,
                estado        = :estado
            WHERE id = :id
        ');
        $stmt->execute([
            ':codigo'        => strtoupper(trim($data['codigo'])),
            ':titulo'        => trim($data['titulo']),
            ':descripcion'   => isset($data['descripcion']) ? trim($data['descripcion']) : null,
            ':tipo'          => $data['tipo'],
            ':valor'         => (float) $data['valor'],
            ':minimo_compra' => (float) ($data['minimo_compra'] ?? 0),
            ':usos_maximos'  => isset($data['usos_maximos']) && $data['usos_maximos'] !== '' ? (int) $data['usos_maximos'] : null,
            ':fecha_inicio'  => $data['fecha_inicio'],
            ':fecha_fin'     => !empty($data['fecha_fin']) ? $data['fecha_fin'] : null,
            ':estado'        => promocionEstadoToInt($data['estado'] ?? true, 1),
            ':id'            => $id,
        ]);
        jsonResponse(['success' => true]);
    } catch (PDOException $e) {
        if ($e->getCode() === '23000') {
            jsonError('El código de promoción ya existe', 409);
        }
        jsonError('Error al actualizar la promoción', 500);
    }
}

// ===================== DELETE =====================
if ($method === 'DELETE') {
    $data = getInput();
    $id   = (int) ($data['id'] ?? 0);
    if (!$id) jsonError('ID requerido', 400);

    $stmt = $db->prepare('UPDATE promociones SET estado = 0 WHERE id = ?');
    $stmt->execute([$id]);
    jsonResponse(['success' => true]);
}
