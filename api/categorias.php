<?php
// ============================================================
// /api/categorias.php - CRUD de categorías
// ============================================================
// GET           → lista todas las categorías activas
// POST          → crea una nueva categoría
// PUT           → actualiza nombre/descripción de una categoría
// DELETE        → soft delete (estado = 0)
// ============================================================
require_once __DIR__ . '/config.php';

$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];

function castCategory(array $c): array {
    $c['id']     = (int) $c['id'];
    $c['estado'] = (bool) $c['estado'];
    return $c;
}

switch ($method) {
    // ----- LEER -----
    case 'GET':
        $stmt = $db->query('SELECT id, nombre, descripcion, estado FROM categorias WHERE estado = 1 ORDER BY nombre');
        jsonResponse(array_map('castCategory', $stmt->fetchAll()));
        break;

    // ----- CREAR -----
    case 'POST':
        $input = getInput();
        if (empty($input['nombre'])) jsonError('El nombre es requerido');
        $stmt = $db->prepare('INSERT INTO categorias (nombre, descripcion) VALUES (?, ?)');
        $stmt->execute([$input['nombre'], $input['descripcion'] ?? null]);
        jsonResponse(castCategory([
            'id'          => (int) $db->lastInsertId(),
            'nombre'      => $input['nombre'],
            'descripcion' => $input['descripcion'] ?? null,
            'estado'      => 1,
        ]), 201);
        break;

    // ----- ACTUALIZAR -----
    case 'PUT':
        $input = getInput();
        $id    = $input['id'] ?? null;
        if (!$id) jsonError('ID requerido');
        if (empty($input['nombre'])) jsonError('El nombre es requerido');
        $stmt = $db->prepare('UPDATE categorias SET nombre = ?, descripcion = ? WHERE id = ?');
        $stmt->execute([$input['nombre'], $input['descripcion'] ?? null, $id]);
        jsonResponse(castCategory([
            'id'          => (int) $id,
            'nombre'      => $input['nombre'],
            'descripcion' => $input['descripcion'] ?? null,
            'estado'      => 1,
        ]));
        break;

    // ----- ELIMINAR (soft delete) -----
    case 'DELETE':
        $input = getInput();
        $id    = $input['id'] ?? null;
        if (!$id) jsonError('ID requerido');
        $stmt = $db->prepare('UPDATE categorias SET estado = 0 WHERE id = ?');
        $stmt->execute([$id]);
        jsonResponse(['message' => 'Categoría eliminada']);
        break;

    default:
        jsonError('Método no permitido', 405);
}
