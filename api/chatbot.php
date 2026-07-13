<?php
// ============================================================
// /api/chatbot.php - Asistente virtual con IA (DeepSeek)
// ============================================================
// POST { messages: [{ role: 'user'|'assistant', content: '...' }, ...] }
//   → reenvía la conversación a la API de DeepSeek (compatible con OpenAI)
//     y devuelve la respuesta del asistente.
//
// La clave de API se configura en config.php (constante DEEPSEEK_API_KEY)
// o mediante la variable de entorno DEEPSEEK_API_KEY. De este modo la
// clave NUNCA se expone en el frontend.
// ============================================================
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Método no permitido', 405);
}

// Verifica que exista una clave de API configurada.
if (DEEPSEEK_API_KEY === '') {
    jsonError('El chatbot no está configurado. Añade tu clave DEEPSEEK_API_KEY en api/config.php.', 503);
}

$input    = getInput();
$messages = $input['messages'] ?? [];

if (!is_array($messages) || count($messages) === 0) {
    jsonError('Se requiere al menos un mensaje', 400);
}

// Instrucción de sistema: define la personalidad y el contexto del asistente.
$systemPrompt = [
    'role'    => 'system',
    'content' =>
        'Eres "Valdecito", el asistente virtual de la cafetería Juan Valdez Café en Perú. ' .
        'Respondes de forma amable, breve y en español. Ayudas a los clientes con información ' .
        'sobre el menú (cafés, bebidas frías, panadería y snacks), horarios de atención ' .
        '(Lun-Vie 7am-9pm, Sáb 8am-10pm, Dom 9am-8pm), promociones, ubicación (Av. Perú 123, Lima) ' .
        'y recomendaciones de productos. Si te preguntan algo fuera del contexto de la cafetería, ' .
        'redirige la conversación amablemente hacia cómo puedes ayudar con el café.',
];

// Sanitiza los mensajes recibidos: solo se aceptan roles válidos y texto.
$sanitized = [$systemPrompt];
foreach ($messages as $msg) {
    $role    = $msg['role'] ?? '';
    $content = trim((string) ($msg['content'] ?? ''));
    if (!in_array($role, ['user', 'assistant'], true) || $content === '') continue;
    $sanitized[] = ['role' => $role, 'content' => mb_substr($content, 0, 2000)];
}

// Limita el historial a los últimos 20 mensajes (más el system) para controlar el tamaño.
if (count($sanitized) > 21) {
    $sanitized = array_merge([$systemPrompt], array_slice($sanitized, -20));
}

$payload = json_encode([
    'model'       => DEEPSEEK_MODEL,
    'messages'    => $sanitized,
    'temperature' => 0.7,
    'max_tokens'  => 600,
    'stream'      => false,
], JSON_UNESCAPED_UNICODE);

// Realiza la petición a DeepSeek mediante cURL.
$ch = curl_init(DEEPSEEK_API_URL);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $payload,
    CURLOPT_HTTPHEADER     => [
        'Content-Type: application/json',
        'Authorization: Bearer ' . DEEPSEEK_API_KEY,
    ],
    CURLOPT_TIMEOUT        => 45,
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlErr  = curl_error($ch);
curl_close($ch);

if ($response === false) {
    jsonError('No se pudo conectar con el servicio de IA: ' . $curlErr, 502);
}

$data = json_decode($response, true);

if ($httpCode >= 400) {
    $apiMessage = $data['error']['message'] ?? 'Error del servicio de IA';
    jsonError($apiMessage, $httpCode);
}

$reply = $data['choices'][0]['message']['content'] ?? null;
if ($reply === null) {
    jsonError('El servicio de IA no devolvió una respuesta válida', 502);
}

jsonResponse([
    'reply' => trim($reply),
    'usage' => $data['usage'] ?? null,
]);
