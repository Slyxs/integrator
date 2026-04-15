<?php
// ============================================================
// /api/ventas.php - Ventas
// ============================================================
// Gestiona el registro y consulta de ventas:
//   GET           → lista todas las ventas con sus items (orden ASC)
//   GET ?id=N     → devuelve una venta concreta con sus items
//   POST          → crea una venta, inserta el detalle y descuenta el stock
//                    Todo ocurre dentro de una transacción para garantizar
//                    consistencia si alguna operación falla.
// ============================================================
require_once __DIR__ . '/config.php';

$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];

// AttachItems se encarga de cargar los items (líneas de detalle) de una venta y agregarlos al array de la venta bajo la clave 'items'.
// Carga los items (líneas de detalle) de una venta y los agrega
// al array de la venta bajo la clave 'items'.
// Se llama después de leer la fila de la tabla ventas.
function attachItems(PDO $db, array &$sale): void {
    // Selecciona producto_id como productoId, nombre_producto como nombre, cantidad, precio_unitario como precioUnitario y
    // subtotal de la tabla detalle_ventas donde el venta_id coincide con el ID de la venta.
    $stmt = $db->prepare(
        'SELECT producto_id   AS productoId,
                nombre_producto AS nombre,
                cantidad,
                precio_unitario AS precioUnitario,
                subtotal
           FROM detalle_ventas
          WHERE venta_id = ?'
    );
    // Ejecuta la consulta con el ID de la venta proporcionado
    $stmt->execute([$sale['id']]);
    // Obtiene todas las filas resultantes
    $items = $stmt->fetchAll();

    // Normaliza los tipos de cada item: productoId y cantidad como enteros,
    // precioUnitario y subtotal como floats. Esto es importante para que el frontend reciba los datos en el formato esperado.
    // productoId y cantidad se convierten a enteros.
    foreach ($items as &$item) {
        $item['productoId']     = (int)   $item['productoId'];
        $item['cantidad']       = (int)   $item['cantidad'];
        $item['precioUnitario'] = (float) $item['precioUnitario'];
        $item['subtotal']       = (float) $item['subtotal'];
    }
    // Agrega el array de items al array de la venta bajo la clave 'items'.
    $sale['items'] = $items;
}

// CastSale se encarga de normalizar los tipos de los campos de una venta para que el frontend reciba los datos en el formato esperado.
// castSale se llama después de leer la fila de la tabla ventas para convertir los tipos de datos a los esperados por el frontend.
function castSale(array $s): array {
    // id y usuarioId se convierten a enteros, total a float.
    $s['id']         = (int)   $s['id'];
    $s['usuarioId']  = (int)   $s['usuarioId'];
    $s['total']      = (float) $s['total'];
    // detallePago se decodifica de JSON si es una cadena. Esto es importante para que el frontend reciba los datos en el formato esperado.
    if (isset($s['detallePago']) && is_string($s['detallePago'])) {
        $s['detallePago'] = json_decode($s['detallePago'], true);
    }
    // Devuelve el array de la venta con los tipos normalizados.
    return $s;
}

// Un switch para manejar cada método HTTP (GET, POST) y realizar la operación correspondiente sobre la tabla ventas.
switch ($method) {
    // ---------- LEER ----------
    case 'GET':
        // Si se pasa ?id=N devuelve solo esa venta con sus items
        if (isset($_GET['id'])) {
            // Selecciona id, numero, cliente_nombre como clienteNombre, cliente_documento como clienteDocumento, usuario_id como usuarioId,
            // usuario_nombre como usuarioNombre, metodo_pago como metodoPago, detalle_pago como detallePago, total, estado y created_at como fecha
            // de la tabla ventas donde el id coincide con el ID proporcionado.
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
            // Ejecuta la consulta con el ID proporcionado
            $stmt->execute([$_GET['id']]);
            // Obtiene la fila resultante (si existe)
            $sale = $stmt->fetch();
            // Si no se encuentra la venta, devuelve null (en lugar de un error) para que el frontend pueda manejarlo como "venta no encontrada".
            if (!$sale) jsonResponse(null);

            // Normaliza los tipos de la venta y adjunta los items antes de devolver la respuesta.
            $sale = castSale($sale);
            // Adjunta los items al objeto de la venta para que el frontend reciba toda la información en una sola respuesta.
            attachItems($db, $sale);  // adjunta los items al objeto de la venta
            // Devuelve la venta encontrada con los tipos normalizados y los items adjuntos.
            jsonResponse($sale);
        }

        // Sin parámetros: todas las ventas en orden cronológico ascendente.
        // El frontend puede invertir el orden si muestra las más recientes primero.
        $stmt = $db->query(
            // Selecciona id, numero, cliente_nombre como clienteNombre, cliente_documento como clienteDocumento, usuario_id como usuarioId,
            // usuario_nombre como usuarioNombre, metodo_pago como metodoPago, detalle_pago como detallePago
            // total, estado y created_at como fecha de la tabla ventas ordenadas por id en orden ascendente.
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
        // Obtiene todas las filas resultantes
        $sales = $stmt->fetchAll();
        // Normaliza los tipos de cada venta y adjunta los items antes de devolver la respuesta.
        foreach ($sales as &$s) {
            $s = castSale($s); // normaliza los tipos de la venta
            attachItems($db, $s);  // adjunta los items a cada venta
        }
        // Devuelve la lista de ventas con los tipos normalizados y los items adjuntos.
        jsonResponse($sales);
        break;

    // ---------- CREAR ----------
    case 'POST':
        $input = getInput();

        // beginTransaction inicia una transacción para asegurar que todas las operaciones relacionadas
        // con la creación de la venta se realicen de manera atómica. Si alguna operación falla, se puede hacer rollback
        // para revertir todos los cambios y mantener la integridad de la base de datos.
        // Esto es crucial para evitar inconsistencias, como tener una venta registrada sin su detalle o un stock descontado sin una venta correspondiente.


        // Transacción: si cualquier paso falla se hace rollback para no dejar datos parciales en la BD.
        $db->beginTransaction();
        try {
            // Generar número de boleta autoincremental con formato BV-000001
            
            // Cuenta el total de ventas existentes para generar el número de boleta. Esto asegura que cada venta tenga un número único y secuencial.
            $stmt  = $db->query('SELECT COUNT(*) AS total FROM ventas');
            $count = (int) $stmt->fetch()['total'];
            $numero = 'BV-' . str_pad($count + 1, 6, '0', STR_PAD_LEFT);

            // Insertar la cabecera de la venta
            // Prepara una consulta para insertar una nueva venta en la tabla ventas con los datos proporcionados en el cuerpo JSON.
            // El número de boleta se genera automáticamente y el estado se establece en 1 (activo) por defecto.
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
            // Obtiene el ID de la venta recién creada para usarlo al insertar el detalle y devolver la respuesta.
            $saleId = (int) $db->lastInsertId();

            // Preparar sentencias para insertar el detalle y descontar el stock
            $insertItem  = $db->prepare(
                'INSERT INTO detalle_ventas (venta_id, producto_id, nombre_producto, cantidad, precio_unitario)
                 VALUES (?, ?, ?, ?, ?)'
            );
            // GREATEST(0, stock - cantidad) evita que el stock quede negativo.
            // GREATEST significa que si el resultado de stock - cantidad es menor que 0, se establecerá en 0 en lugar de un número negativo.
            $updateStock = $db->prepare(
                'UPDATE productos SET stock = GREATEST(0, stock - ?) WHERE id = ?'
            );

            // Iterar sobre cada item del carrito, insertar el detalle y descontar stock
            foreach ($input['items'] as $item) {
                // Insertar cada línea de detalle con el ID de la venta recién creada y los datos del producto.
                $insertItem->execute([
                    $saleId,
                    $item['productoId'],
                    $item['nombre'],
                    $item['cantidad'],
                    $item['precioUnitario'],
                ]);
                // Descontar el stock del producto correspondiente a la cantidad vendida.
                // Esto asegura que el stock se actualice correctamente cada vez que se registra una venta.
                $updateStock->execute([$item['cantidad'], $item['productoId']]);
            }

            // Si todo fue exitoso, se hace commit para guardar los cambios en la base de datos. Si hubo algún error, se hará rollback en el catch.
            $db->commit();
            // Devuelve la venta recién creada con su ID, número de boleta, fecha actual, nombre del cliente, método de pago y total.
            jsonResponse([
                'id'            => $saleId,
                'numero'        => $numero,
                'fecha'         => date('c'),
                'clienteNombre' => $input['clienteNombre'] ?? 'Consumidor Final',
                'metodoPago'    => $input['metodoPago']     ?? 'efectivo',
                'total'         => (float) $input['total'],
            // Con 201 Created para indicar que se creó un nuevo recurso.
            ], 201);
        
        // Si ocurre cualquier error durante el proceso de creación de la venta, se captura la excepción.
        // Se hace rollback para revertir los cambios y se devuelve un error con el mensaje correspondiente.
        } catch (Exception $e) {
            $db->rollBack();
            // Devuelve un error 500 Internal Server Error con el mensaje de la excepción para que el frontend pueda mostrarlo o manejarlo adecuadamente.
            jsonError('Error al crear la venta: ' . $e->getMessage(), 500);
        }
        break;

    // Si se recibe un método HTTP no soportado, devuelve un error 405 Method Not Allowed.
    default:
        jsonError('Método no permitido', 405);
}
