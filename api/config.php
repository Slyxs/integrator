<?php
// ============================================================
// Juan Valdez Café - Configuración del API
// ============================================================
// Este archivo es incluido por todos los endpoints del API.
// Se encarga de:
//   1. Configurar las cabeceras HTTP (CORS + JSON)
//   2. Proveer la conexión PDO a MySQL (singleton)
//   3. Exponer funciones helper: jsonResponse, jsonError, getInput
// ============================================================

// --- Cabeceras HTTP ---
// Indica al navegador que la respuesta es JSON en UTF-8.
// Access-Control-Allow-Origin: * permite peticiones desde cualquier origen
// (necesario para que el frontend Vite en otro puerto pueda llamar al API).
// Access-Control-Allow-Methods para permitir los métodos HTTP usados por el API.
// Access-Control-Allow-Headers para permitir Content-Type en las peticiones POST/PUT.
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// --- Preflight CORS (OPTIONS) ---
// Los navegadores envían primero una petición OPTIONS antes de una petición real
// para verificar que el servidor acepta el método y los headers que quiere usar. Respondemos
// con 200 y terminamos inmediatamente para no ejecutar lógica innecesaria.
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// --- Conexión a la base de datos ---
// PDO es una extensión de PHP para acceder a bases de datos de forma segura y eficiente.
// La conexión se crea una sola vez por petición
// y se reutiliza en todas las llamadas a getDB().
function getDB() {
    static $pdo = null;
    // Si la conexión ya existe, la devuelve; si no, la crea.
    if ($pdo === null) {
        // Configuración de la conexión a MySQL
        $host = 'localhost';
        $db   = 'juan_valdez_cafe';
        $user = 'root';
        $pass = '';  // XAMPP usa contraseña vacía por defecto

        // Crea la conexión PDO con las opciones adecuadas:
        $pdo = new PDO(
            "mysql:host=$host;dbname=$db;charset=utf8mb4",
            $user,
            $pass,
            [
                // Lanza excepciones ante cualquier error SQL en lugar de fallar silenciosamente
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                // Devuelve filas como arrays asociativos (clave => valor)
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                // Usa prepared statements reales en lugar de emularlos, los prepared statements ayudan a prevenir inyecciones SQL y mejoran el rendimiento.
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]
        );
    }
    return $pdo;
}

// --- Respuesta JSON exitosa ---
// Serializa $data como JSON, establece el código HTTP y termina el script.
// JSON_UNESCAPED_UNICODE evita que caracteres como 'á' 'ó' se escapen como \uXXXX.
function jsonResponse($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

// --- Respuesta JSON de error ---
// Igual que jsonResponse pero envuelve el mensaje en { "error": "..." }
// para que el frontend pueda detectar errores de forma uniforme.
function jsonError($message, $code = 400) {
    // Establece el código HTTP de error (400 Bad Request por defecto) y devuelve un JSON con la clave "error".
    http_response_code($code);
    echo json_encode(['error' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

// --- Lectura del cuerpo de la petición ---
// Lee el cuerpo crudo (JSON enviado por fetch/axios) y lo decodifica en array.
// Si el cuerpo está vacío o no es JSON válido, devuelve un array vacío
// para que los endpoints no fallen con null.
function getInput() {
    return json_decode(file_get_contents('php://input'), true) ?? [];
}
