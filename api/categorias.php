<?php
// ============================================================
// GET /api/categorias.php - Listar categorías activas
// ============================================================
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonError('Método no permitido', 405);
}

$db   = getDB();
$stmt = $db->query('SELECT id, nombre, descripcion, estado FROM categorias WHERE estado = 1');
$rows = $stmt->fetchAll();

foreach ($rows as &$r) {
    $r['id']     = (int) $r['id'];
    $r['estado'] = (bool) $r['estado'];
}

jsonResponse($rows);
