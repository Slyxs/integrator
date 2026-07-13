<?php
// ============================================================
// /api/respaldo.php - Respaldo de información
// ============================================================
// GET                    → genera un respaldo de los datos y lo registra
//   ?formato=json (def.) → devuelve los datos como objeto JSON descargable
//   ?formato=sql         → devuelve sentencias INSERT reconstruibles
//   ?usuario=Nombre      → nombre del administrador que genera el respaldo
// GET ?historial=1       → devuelve el historial de respaldos generados
//
// Nota de seguridad: por seguridad NUNCA se incluye la columna `password`
// de la tabla usuarios en el respaldo. Para un respaldo binario completo
// y restaurable use mysqldump directamente en el servidor.
// ============================================================
require_once __DIR__ . '/config.php';

$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    jsonError('Método no permitido', 405);
}

// Tablas incluidas en el respaldo con las columnas a exportar.
// usuarios se exporta sin la columna password por seguridad.
$tablas = [
    'usuarios'       => 'id, nombre, email, rol, estado, created_at, updated_at',
    'clientes'       => '*',
    'categorias'     => '*',
    'productos'      => '*',
    'ventas'         => '*',
    'detalle_ventas' => '*',
    'promociones'    => '*',
    'proveedores'    => '*',
    'trabajadores'   => '*',
    'maquinaria'     => '*',
    'control_calidad'=> '*',
    'reclamaciones'  => '*',
    'asistencias'    => '*',
    'bonos'          => '*',
];

// ----- Historial de respaldos -----
if (isset($_GET['historial'])) {
    $stmt = $db->query(
        'SELECT id, archivo, formato, tablas, registros, usuario, created_at AS createdAt
           FROM respaldos ORDER BY created_at DESC'
    );
    $rows = $stmt->fetchAll();
    foreach ($rows as &$r) {
        $r['id']        = (int) $r['id'];
        $r['tablas']    = (int) $r['tablas'];
        $r['registros'] = (int) $r['registros'];
    }
    jsonResponse($rows);
}

$formato = ($_GET['formato'] ?? 'json') === 'sql' ? 'sql' : 'json';
$usuario = isset($_GET['usuario']) ? substr(trim($_GET['usuario']), 0, 100) : null;

// Recolecta los datos de todas las tablas.
$datos          = [];
$totalRegistros = 0;
foreach ($tablas as $tabla => $columnas) {
    try {
        $rows = $db->query("SELECT $columnas FROM $tabla")->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        // Si una tabla aún no existe, se omite del respaldo.
        continue;
    }
    $datos[$tabla] = $rows;
    $totalRegistros += count($rows);
}

$timestamp = date('Y-m-d_His');

// Registra el respaldo en el historial.
$archivo = "respaldo_juan_valdez_{$timestamp}.{$formato}";
$log = $db->prepare(
    'INSERT INTO respaldos (archivo, formato, tablas, registros, usuario) VALUES (?, ?, ?, ?, ?)'
);
$log->execute([$archivo, $formato, count($datos), $totalRegistros, $usuario]);

// ----- Formato SQL -----
if ($formato === 'sql') {
    $sql  = "-- Respaldo Juan Valdez Café\n";
    $sql .= "-- Generado: " . date('Y-m-d H:i:s') . "\n";
    $sql .= "SET FOREIGN_KEY_CHECKS=0;\n\n";

    foreach ($datos as $tabla => $rows) {
        $sql .= "-- Tabla: $tabla ( " . count($rows) . " registros )\n";
        foreach ($rows as $row) {
            $cols = array_map(fn($c) => "`$c`", array_keys($row));
            $vals = array_map(function ($v) use ($db) {
                if ($v === null) return 'NULL';
                if (is_numeric($v)) return $v;
                return $db->quote($v);
            }, array_values($row));
            $sql .= "INSERT INTO `$tabla` (" . implode(', ', $cols) . ") VALUES (" . implode(', ', $vals) . ");\n";
        }
        $sql .= "\n";
    }
    $sql .= "SET FOREIGN_KEY_CHECKS=1;\n";

    jsonResponse([
        'archivo'    => $archivo,
        'formato'    => 'sql',
        'generadoEn' => date('Y-m-d H:i:s'),
        'tablas'     => count($datos),
        'registros'  => $totalRegistros,
        'sql'        => $sql,
    ]);
}

// ----- Formato JSON -----
jsonResponse([
    'archivo'    => $archivo,
    'formato'    => 'json',
    'generadoEn' => date('Y-m-d H:i:s'),
    'tablas'     => count($datos),
    'registros'  => $totalRegistros,
    'datos'      => $datos,
]);
