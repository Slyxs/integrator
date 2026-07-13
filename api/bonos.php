<?php
// ============================================================
// /api/bonos.php - Gestión de bonos de empleados
// ============================================================
// GET           → lista todos los bonos con el nombre del trabajador
// GET ?id=N     → devuelve un bono por su ID
// POST          → registra un nuevo bono
// PUT           → actualiza un bono existente
// DELETE        → elimina un bono
// ============================================================
require_once __DIR__ . '/config.php';

$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];

// Valores permitidos por los ENUM de la tabla.
const TIPOS_BONO   = ['productividad', 'puntualidad', 'ventas', 'antiguedad', 'otro'];
const ESTADOS_BONO = ['pendiente', 'pagado'];

// Columnas seleccionadas con alias camelCase para el frontend.
const BONO_COLUMNS =
    "b.id, b.trabajador_id AS trabajadorId,
     CONCAT(t.nombre, ' ', t.apellido) AS trabajadorNombre, t.cargo AS trabajadorCargo,
     b.tipo, b.concepto, b.monto, b.fecha, b.estado, b.observaciones";

// Normaliza los tipos del array de un bono.
function castBono(array $b): array {
    $b['id']           = (int) $b['id'];
    $b['trabajadorId'] = (int) $b['trabajadorId'];
    $b['monto']        = (float) $b['monto'];
    return $b;
}

// Devuelve un valor válido de una lista blanca o el valor por defecto.
function bonoEnumValido($valor, array $permitidos, string $default): string {
    return in_array($valor, $permitidos, true) ? $valor : $default;
}

switch ($method) {
    // ----- LEER -----
    case 'GET':
        if (isset($_GET['id'])) {
            $stmt = $db->prepare(
                'SELECT ' . BONO_COLUMNS . '
                   FROM bonos b
                   JOIN trabajadores t ON t.id = b.trabajador_id
                  WHERE b.id = ?'
            );
            $stmt->execute([$_GET['id']]);
            $row = $stmt->fetch();
            if (!$row) jsonError('Bono no encontrado', 404);
            jsonResponse(castBono($row));
        }

        $stmt = $db->query(
            'SELECT ' . BONO_COLUMNS . '
               FROM bonos b
               JOIN trabajadores t ON t.id = b.trabajador_id
              ORDER BY b.fecha DESC, b.id DESC'
        );
        jsonResponse(array_map('castBono', $stmt->fetchAll()));
        break;

    // ----- CREAR -----
    case 'POST':
        $input = getInput();
        if (empty($input['trabajadorId'])) jsonError('El trabajador es requerido');
        if (empty($input['fecha']))        jsonError('La fecha es requerida');

        $stmt = $db->prepare(
            'INSERT INTO bonos (trabajador_id, tipo, concepto, monto, fecha, estado, observaciones)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            (int) $input['trabajadorId'],
            bonoEnumValido($input['tipo'] ?? 'productividad', TIPOS_BONO, 'productividad'),
            $input['concepto'] ?? null,
            (float) ($input['monto'] ?? 0),
            $input['fecha'],
            bonoEnumValido($input['estado'] ?? 'pendiente', ESTADOS_BONO, 'pendiente'),
            $input['observaciones'] ?? null,
        ]);

        jsonResponse(['id' => (int) $db->lastInsertId(), 'success' => true], 201);
        break;

    // ----- ACTUALIZAR -----
    case 'PUT':
        $input = getInput();
        $id    = $input['id'] ?? null;
        if (!$id) jsonError('ID requerido');
        if (empty($input['trabajadorId'])) jsonError('El trabajador es requerido');
        if (empty($input['fecha']))        jsonError('La fecha es requerida');

        $stmt = $db->prepare(
            'UPDATE bonos
                SET trabajador_id = ?, tipo = ?, concepto = ?, monto = ?, fecha = ?,
                    estado = ?, observaciones = ?
              WHERE id = ?'
        );
        $stmt->execute([
            (int) $input['trabajadorId'],
            bonoEnumValido($input['tipo'] ?? 'productividad', TIPOS_BONO, 'productividad'),
            $input['concepto'] ?? null,
            (float) ($input['monto'] ?? 0),
            $input['fecha'],
            bonoEnumValido($input['estado'] ?? 'pendiente', ESTADOS_BONO, 'pendiente'),
            $input['observaciones'] ?? null,
            $id,
        ]);

        jsonResponse(['id' => (int) $id, 'success' => true]);
        break;

    // ----- ELIMINAR -----
    case 'DELETE':
        $input = getInput();
        $id    = $input['id'] ?? null;
        if (!$id) jsonError('ID requerido');
        $stmt = $db->prepare('DELETE FROM bonos WHERE id = ?');
        $stmt->execute([$id]);
        jsonResponse(['message' => 'Bono eliminado']);
        break;

    default:
        jsonError('Método no permitido', 405);
}
