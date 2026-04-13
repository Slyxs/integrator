<?php
// ============================================================
// /api/productos.php - CRUD de productos
// GET           → listar activos
// GET ?id=N     → obtener uno
// POST          → crear
// PUT           → actualizar
// DELETE        → eliminar (soft delete)
// ============================================================
require_once __DIR__ . '/config.php';

$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];

function castProduct(array $p): array {
    $p['id']          = (int) $p['id'];
    $p['precio']      = (float) $p['precio'];
    $p['categoriaId'] = (int) $p['categoriaId'];
    $p['stock']       = (int) $p['stock'];
    $p['estado']      = (bool) $p['estado'];
    return $p;
}

switch ($method) {
    // ----- LEER -----
    case 'GET':
        if (isset($_GET['id'])) {
            $stmt = $db->prepare(
                'SELECT id, nombre, descripcion, precio,
                        categoria_id AS categoriaId, stock,
                        imagen_url AS imagenUrl, estado
                   FROM productos WHERE id = ?'
            );
            $stmt->execute([$_GET['id']]);
            $row = $stmt->fetch();
            if (!$row) jsonError('Producto no encontrado', 404);
            jsonResponse(castProduct($row));
        }

        $stmt = $db->query(
            'SELECT id, nombre, descripcion, precio,
                    categoria_id AS categoriaId, stock,
                    imagen_url AS imagenUrl, estado
               FROM productos WHERE estado = 1'
        );
        $rows = $stmt->fetchAll();
        jsonResponse(array_map('castProduct', $rows));
        break;

    // ----- CREAR -----
    case 'POST':
        $input = getInput();
        $stmt  = $db->prepare(
            'INSERT INTO productos (nombre, descripcion, precio, categoria_id, stock)
             VALUES (?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $input['nombre'],
            $input['descripcion'] ?? '',
            $input['precio'],
            $input['categoriaId'],
            $input['stock'] ?? 0,
        ]);
        jsonResponse(castProduct([
            'id'          => $db->lastInsertId(),
            'nombre'      => $input['nombre'],
            'descripcion' => $input['descripcion'] ?? '',
            'precio'      => $input['precio'],
            'categoriaId' => $input['categoriaId'],
            'stock'       => $input['stock'] ?? 0,
            'imagenUrl'   => null,
            'estado'      => 1,
        ]), 201);
        break;

    // ----- ACTUALIZAR -----
    case 'PUT':
        $input = getInput();
        $id    = $input['id'] ?? null;
        if (!$id) jsonError('ID requerido');

        $stmt = $db->prepare(
            'UPDATE productos
                SET nombre = ?, descripcion = ?, precio = ?, categoria_id = ?, stock = ?
              WHERE id = ?'
        );
        $stmt->execute([
            $input['nombre'],
            $input['descripcion'] ?? '',
            $input['precio'],
            $input['categoriaId'],
            $input['stock'] ?? 0,
            $id,
        ]);
        jsonResponse(castProduct([
            'id'          => $id,
            'nombre'      => $input['nombre'],
            'descripcion' => $input['descripcion'] ?? '',
            'precio'      => $input['precio'],
            'categoriaId' => $input['categoriaId'],
            'stock'       => $input['stock'] ?? 0,
            'imagenUrl'   => null,
            'estado'      => 1,
        ]));
        break;

    // ----- ELIMINAR (soft) -----
    case 'DELETE':
        $input = getInput();
        $id    = $input['id'] ?? null;
        if (!$id) jsonError('ID requerido');

        $stmt = $db->prepare('UPDATE productos SET estado = 0 WHERE id = ?');
        $stmt->execute([$id]);
        jsonResponse(['message' => 'Producto eliminado']);
        break;

    default:
        jsonError('Método no permitido', 405);
}
