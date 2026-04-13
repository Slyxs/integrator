<?php
// ============================================================
// /api/ventas.php - Ventas
// GET           → listar todas (con items)
// GET ?id=N     → obtener una (con items)
// POST          → crear venta + detalle + actualizar stock
// ============================================================
require_once __DIR__ . '/config.php';

$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];

/**
 * Agrega el array de items a una venta.
 */
function attachItems(PDO $db, array &$sale): void {
    $stmt = $db->prepare(
        'SELECT producto_id   AS productoId,
                nombre_producto AS nombre,
                cantidad,
                precio_unitario AS precioUnitario,
                subtotal
           FROM detalle_ventas
          WHERE venta_id = ?'
    );
    $stmt->execute([$sale['id']]);
    $items = $stmt->fetchAll();

    foreach ($items as &$item) {
        $item['productoId']     = (int)   $item['productoId'];
        $item['cantidad']       = (int)   $item['cantidad'];
        $item['precioUnitario'] = (float) $item['precioUnitario'];
        $item['subtotal']       = (float) $item['subtotal'];
    }
    $sale['items'] = $items;
}

function castSale(array $s): array {
    $s['id']         = (int)   $s['id'];
    $s['usuarioId']  = (int)   $s['usuarioId'];
    $s['total']      = (float) $s['total'];
    if (isset($s['detallePago']) && is_string($s['detallePago'])) {
        $s['detallePago'] = json_decode($s['detallePago'], true);
    }
    return $s;
}

switch ($method) {
    // ---------- LEER ----------
    case 'GET':
        if (isset($_GET['id'])) {
            $stmt = $db->prepare(
                'SELECT id, numero,
                        cliente_nombre    AS clienteNombre,
                        cliente_documento AS clienteDocumento,
                        usuario_id        AS usuarioId,
                        usuario_nombre    AS usuarioNombre,
                        metodo_pago       AS metodoPago,
                        detalle_pago      AS detallePago,
                        total, estado,
                        created_at        AS fecha
                   FROM ventas WHERE id = ?'
            );
            $stmt->execute([$_GET['id']]);
            $sale = $stmt->fetch();
            if (!$sale) jsonResponse(null);

            $sale = castSale($sale);
            attachItems($db, $sale);
            jsonResponse($sale);
        }

        // Todas las ventas, orden cronológico (ASC) — el frontend invierte si necesita
        $stmt = $db->query(
            'SELECT id, numero,
                    cliente_nombre    AS clienteNombre,
                    cliente_documento AS clienteDocumento,
                    usuario_id        AS usuarioId,
                    usuario_nombre    AS usuarioNombre,
                    metodo_pago       AS metodoPago,
                    total, estado,
                    created_at        AS fecha
               FROM ventas
              ORDER BY id ASC'
        );
        $sales = $stmt->fetchAll();

        foreach ($sales as &$s) {
            $s = castSale($s);
            attachItems($db, $s);
        }
        jsonResponse($sales);
        break;

    // ---------- CREAR ----------
    case 'POST':
        $input = getInput();

        $db->beginTransaction();
        try {
            // Generar número de boleta
            $stmt  = $db->query('SELECT COUNT(*) AS total FROM ventas');
            $count = (int) $stmt->fetch()['total'];
            $numero = 'BV-' . str_pad($count + 1, 6, '0', STR_PAD_LEFT);

            // Insertar venta
            $stmt = $db->prepare(
                'INSERT INTO ventas
                    (numero, cliente_nombre, cliente_documento, usuario_id, usuario_nombre,
                     metodo_pago, detalle_pago, total)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
            );
            $stmt->execute([
                $numero,
                $input['clienteNombre']    ?? 'Consumidor Final',
                $input['clienteDocumento'] ?? null,
                $input['usuarioId'],
                $input['usuarioNombre']    ?? null,
                $input['metodoPago']       ?? 'efectivo',
                isset($input['detallePago']) ? json_encode($input['detallePago']) : null,
                $input['total'],
            ]);
            $saleId = (int) $db->lastInsertId();

            // Insertar detalle y actualizar stock
            $insertItem  = $db->prepare(
                'INSERT INTO detalle_ventas (venta_id, producto_id, nombre_producto, cantidad, precio_unitario)
                 VALUES (?, ?, ?, ?, ?)'
            );
            $updateStock = $db->prepare(
                'UPDATE productos SET stock = GREATEST(0, stock - ?) WHERE id = ?'
            );

            foreach ($input['items'] as $item) {
                $insertItem->execute([
                    $saleId,
                    $item['productoId'],
                    $item['nombre'],
                    $item['cantidad'],
                    $item['precioUnitario'],
                ]);
                $updateStock->execute([$item['cantidad'], $item['productoId']]);
            }

            $db->commit();

            jsonResponse([
                'id'            => $saleId,
                'numero'        => $numero,
                'fecha'         => date('c'),
                'clienteNombre' => $input['clienteNombre'] ?? 'Consumidor Final',
                'metodoPago'    => $input['metodoPago']     ?? 'efectivo',
                'total'         => (float) $input['total'],
            ], 201);
        } catch (Exception $e) {
            $db->rollBack();
            jsonError('Error al crear la venta: ' . $e->getMessage(), 500);
        }
        break;

    default:
        jsonError('Método no permitido', 405);
}
