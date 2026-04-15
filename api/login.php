<?php
// ============================================================
// POST /api/login.php - Autenticación de usuario
// ============================================================
// Recibe { email, password } en el cuerpo JSON.
// Busca al usuario activo en la BD, compara la contraseña,
// y devuelve los datos del usuario (sin contraseña) si es correcto.
// El frontend guarda ese objeto en localStorage para mantener la sesión.
// ============================================================

// Carga el archivo de configuración junto con sus funciones (getDB, jsonResponse, jsonError, getInput).
require_once __DIR__ . '/config.php';

// Solo se acepta POST; cualquier otro método devuelve 405.
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Método no permitido', 405);
}

// Leer y validar los campos del cuerpo JSON
$input = getInput();
// trim() para eliminar espacios en blanco al inicio y al final del email
$email    = trim($input['email'] ?? '');
$password = $input['password'] ?? '';

if (!$email || !$password) {
    jsonError('Email y contraseña son requeridos');
}

// Buscar el usuario por email, solo si está activo (estado = 1)
$db   = getDB();
// Selecciona id, nombre, email, password y rol de la tabla usuarios donde el email coincide y el estado es activo
$stmt = $db->prepare('SELECT id, nombre, email, password, rol FROM usuarios WHERE email = ? AND estado = 1');
// Ejecuta la consulta con el email proporcionado
$stmt->execute([$email]);
// Obtiene la fila resultante (si existe)
$user = $stmt->fetch();

// Verificar que el usuario exista y que la contraseña coincida.
// Si la contraseña no coincide o el usuario no existe, devuelve un error 401 Unauthorized.
if (!$user || $user['password'] !== $password) {
    jsonError('Credenciales incorrectas', 401);
}

// Nunca devolver la contraseña al cliente por seguridad.
unset($user['password']);
// Convertir el ID a entero para consistencia con el frontend.
$user['id'] = (int) $user['id'];

// Devolver los datos del usuario (id, nombre, email, rol)
jsonResponse($user);
