<?php
// ============================================================
// GET /api/categorias.php - Listar categorías activas
// ============================================================
// Solo soporta GET. Devuelve todas las categorías con estado = 1.
// Se usa en el menú de usuario y en el formulario de productos del admin
// para poblar los selectores de categoría.
// ============================================================
require_once __DIR__ . '/config.php';

// Rechazar cualquier método distinto a GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonError('Método no permitido', 405);
}

// Obtener todas las categorías activas de la base de datos
$db   = getDB();
$stmt = $db->query('SELECT id, nombre, descripcion, estado FROM categorias WHERE estado = 1');
$rows = $stmt->fetchAll();

// Normalizar tipos: id como entero y estado como booleano
// para que el JSON sea consistente con lo que espera el frontend.
foreach ($rows as &$r) {
    $r['id']     = (int) $r['id'];
    $r['estado'] = (bool) $r['estado'];
}

jsonResponse($rows);
