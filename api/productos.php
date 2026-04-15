<?php
// ============================================================
// /api/productos.php - CRUD de productos
// ============================================================
// Gestiona las operaciones sobre la tabla `productos`:
//   GET           → lista todos los productos activos con su categoría
//   GET ?id=N     → devuelve un producto por su ID
//   POST          → crea un nuevo producto
//   PUT           → actualiza los datos de un producto existente
//   DELETE        → elimina lógicamente (soft delete: estado = 0)
// ============================================================
require_once __DIR__ . '/config.php';

$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];

// Normaliza los tipos del array de un producto.
// Garantiza que precio sea float, stock e id sean enteros, y estado booleano.
function castProduct(array $p): array {
    // Convierte los campos del producto al tipo adecuado para que el frontend reciba los datos en el formato esperado.
    $p['id']          = (int) $p['id'];
    $p['precio']      = (float) $p['precio'];
    $p['categoriaId'] = (int) $p['categoriaId'];
    $p['stock']       = (int) $p['stock'];
    $p['estado']      = (bool) $p['estado'];
    return $p;
}
// Un switch para manejar cada método HTTP (GET, POST, PUT, DELETE) y realizar la operación correspondiente sobre la tabla productos.
// Cada caso maneja la lógica específica para esa operación, incluyendo validaciones como email único y manejo de errores.
switch ($method) {
    // ----- LEER -----
    case 'GET':
        // Si se pasa ?id=N devuelve solo ese producto
        if (isset($_GET['id'])) {
            // Selecciona id, nombre, descripcion, precio, categoria_id como categoriaId, stock, imagen_url como imagenUrl y estado de la tabla productos donde el id coincide.
            $stmt = $db->prepare(
                'SELECT id, nombre, descripcion, precio,
                        categoria_id AS categoriaId, stock,
                        imagen_url AS imagenUrl, estado
                   FROM productos WHERE id = ?'
            );
            // Ejecuta la consulta con el ID proporcionado
            $stmt->execute([$_GET['id']]);
            // Obtiene la fila resultante (si existe)
            $row = $stmt->fetch();
            // Si no se encuentra el producto, devuelve un error 404 Not Found.                
            if (!$row) jsonError('Producto no encontrado', 404);
            // Devuelve el producto encontrado con los tipos normalizados.
            jsonResponse(castProduct($row));
        }

        // Sin parámetros: lista todos los productos activos
        $stmt = $db->query(
            'SELECT id, nombre, descripcion, precio,
                    categoria_id AS categoriaId, stock,
                    imagen_url AS imagenUrl, estado
               FROM productos WHERE estado = 1'
        );
        // Obtiene todas las filas resultantes
        $rows = $stmt->fetchAll();
        // Devuelve la lista de productos con los tipos normalizados.
        jsonResponse(array_map('castProduct', $rows));
        break;

    // ----- CREAR -----
    case 'POST':
        $input = getInput();
        // Inserta el producto; stock por defecto 0 si no se especifica
        $stmt  = $db->prepare(
            'INSERT INTO productos (nombre, descripcion, precio, categoria_id, stock)
             VALUES (?, ?, ?, ?, ?)'
        );
        // Ejecuta la inserción con los datos proporcionados en el cuerpo JSON.
        $stmt->execute([
            $input['nombre'],
            $input['descripcion'] ?? '',
            $input['precio'],
            $input['categoriaId'],
            $input['stock'] ?? 0,
        ]);
        // Construye el objeto de respuesta con el ID recién generado
        jsonResponse(castProduct([
            'id'          => $db->lastInsertId(),
            'nombre'      => $input['nombre'],
            'descripcion' => $input['descripcion'] ?? '',
            'precio'      => $input['precio'],
            'categoriaId' => $input['categoriaId'],
            'stock'       => $input['stock'] ?? 0,
            'imagenUrl'   => null,
            'estado'      => 1,
        // Devuelve el producto recién creado con el ID generado por MySQL y un código 201 Created.
        ]), 201);
        break;

    // ----- ACTUALIZAR -----
    case 'PUT':
        $input = getInput();
        // El ID del producto a actualizar es obligatorio; si no se proporciona, devuelve un error.
        $id    = $input['id'] ?? null;
        // Si no se proporciona el ID, devuelve un error 400 Bad Request indicando que el ID es requerido.
        if (!$id) jsonError('ID requerido');

        // Actualiza todos los campos editables (sin tocar imagen_url porque aun no usamos imagenes en el frontend)
        $stmt = $db->prepare(
            'UPDATE productos
                SET nombre = ?, descripcion = ?, precio = ?, categoria_id = ?, stock = ?
              WHERE id = ?'
        );
        // Ejecuta la actualización con los datos proporcionados en el cuerpo JSON.
        $stmt->execute([
            $input['nombre'],
            $input['descripcion'] ?? '',
            $input['precio'],
            $input['categoriaId'],
            $input['stock'] ?? 0,
            $id,
        ]);
        // Devuelve el producto actualizado con los datos proporcionados y el ID.
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

    // ----- ELIMINAR (soft delete) -----
    case 'DELETE':
        $input = getInput();
        // El ID del producto a eliminar es obligatorio; si no se proporciona, devuelve un error.
        $id    = $input['id'] ?? null;
        if (!$id) jsonError('ID requerido');

        // Marca el producto como inactivo en lugar de borrarlo,
        // para no romper el historial de ventas que lo referencian.
        $stmt = $db->prepare('UPDATE productos SET estado = 0 WHERE id = ?');
        // Ejecuta la actualización para marcar el producto como inactivo.
        $stmt->execute([$id]);
        // Devuelve un mensaje indicando que el producto ha sido eliminado.
        jsonResponse(['message' => 'Producto eliminado']);
        break;

    default:
    // Si se recibe un método HTTP no soportado, devuelve un error 405 Method Not Allowed.
        jsonError('Método no permitido', 405);
}
