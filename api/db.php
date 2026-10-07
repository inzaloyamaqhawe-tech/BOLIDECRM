<?php

declare(strict_types=1);

function crm_config(): array
{
    $configPath = __DIR__ . '/config.php';
    if (!is_file($configPath)) {
        $configPath = __DIR__ . '/config.example.php';
    }
    return require $configPath;
}

function crm_pdo(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $config = crm_config();
    $dsn = sprintf(
        'mysql:host=%s;dbname=%s;charset=utf8mb4',
        $config['db_host'],
        $config['db_name']
    );

    $pdo = new PDO($dsn, $config['db_user'], $config['db_pass'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    return $pdo;
}

function crm_json(array $payload, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_SLASHES);
}

function crm_apply_cors(): void
{
    $config = crm_config();
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origin && in_array($origin, $config['allowed_origins'], true)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Vary: Origin');
    }
    header('Access-Control-Allow-Headers: Content-Type, X-Bolide-Api-Secret');
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

function crm_require_secret(): void
{
    $config = crm_config();
    $expected = (string) ($config['api_secret'] ?? '');
    $received = (string) ($_SERVER['HTTP_X_BOLIDE_API_SECRET'] ?? '');
    if ($expected === '' || !hash_equals($expected, $received)) {
        crm_json(['ok' => false, 'error' => 'Unauthorized'], 401);
        exit;
    }
}

function crm_input(): array
{
    $raw = file_get_contents('php://input') ?: '';
    if ($raw === '') {
        return [];
    }
    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        crm_json(['ok' => false, 'error' => 'Invalid JSON body'], 400);
        exit;
    }
    return $decoded;
}

function crm_iso_to_mysql(?string $value): ?string
{
    if (!$value) {
        return null;
    }
    $ts = strtotime($value);
    if ($ts === false) {
        return null;
    }
    return gmdate('Y-m-d H:i:s', $ts);
}

function crm_date_or_null(?string $value): ?string
{
    if (!$value) {
        return null;
    }
    $ts = strtotime($value);
    if ($ts === false) {
        return null;
    }
    return gmdate('Y-m-d', $ts);
}
