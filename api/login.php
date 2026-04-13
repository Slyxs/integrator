<?php
// ============================================================
// POST /api/login.php - Autenticación de usuario
// ============================================================
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Método no permitido', 405);
}

$input = getInput();
$email    = trim($input['email'] ?? '');
$password = $input['password'] ?? '';

if (!$email || !$password) {
    jsonError('Email y contraseña son requeridos');
}

$db   = getDB();
$stmt = $db->prepare('SELECT id, nombre, email, password, rol FROM usuarios WHERE email = ? AND estado = 1');
$stmt->execute([$email]);
$user = $stmt->fetch();

// Comparación directa (los datos semilla usan texto plano)
if (!$user || $user['password'] !== $password) {
    jsonError('Credenciales incorrectas', 401);
}

unset($user['password']);
$user['id'] = (int) $user['id'];

jsonResponse($user);
