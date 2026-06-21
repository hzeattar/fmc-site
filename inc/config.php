<?php
// FMC Site - Database & App Configuration
// Reads environment variables from Railway

define('APP_ENV', getenv('RAILWAY_ENVIRONMENT_NAME') ?: 'production');
define('APP_URL', getenv('SITE_URL') ?: 'https://fmc-gov.com');
define('FROM_EMAIL', getenv('FROM_EMAIL') ?: 'noreply@fmc-gov.com');
define('ADMIN_NOTIFY_EMAIL', getenv('ADMIN_NOTIFY_EMAIL') ?: 'admin@fmc-gov.com');
define('DB_CHARSET', 'utf8mb4');

$db = [
    'host'   => getenv('MYSQLHOST')      ?: 'localhost',
    'db'     => getenv('MYSQLDATABASE')  ?: 'railway',
    'user'   => getenv('MYSQLUSER')      ?: 'root',
    'pass'   => getenv('MYSQLPASSWORD')  ?: '',
    'port'   => intval(getenv('MYSQLPORT') ?: '3306'),
    'charset' => 'utf8mb4',
];

/* Admin credentials from environment */
define('ADMIN_USERNAME', getenv('ADMIN_USERNAME') ?: 'admin');
define('ADMIN_PASSWORD_HASH', getenv('ADMIN_PASSWORD_HASH') ?: '');

/* Allow CORS for API from same domain */
if (!empty($_SERVER['HTTP_ORIGIN'])) {
    $allowed = [
        'https://fmc-gov.com',
        'https://www.fmc-gov.com',
    ];
    if (in_array($_SERVER['HTTP_ORIGIN'], $allowed, true) || APP_ENV !== 'production') {
        header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
    }
}
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

/* JSON helpers */
function jsonOut(array $data, int $code = 200): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function requireMethod(string $method): void {
    if ($_SERVER['REQUEST_METHOD'] !== $method) {
        jsonOut(['ok' => false, 'error' => 'Method not allowed'], 405);
    }
}
function getJsonBody(): array {
    $raw = file_get_contents('php://input');
    if (!$raw) return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}
function sanitizeString(?string $v, int $max = 500): string {
    $v = trim((string) $v);
    if ($max > 0 && mb_strlen($v) > $max) $v = mb_substr($v, 0, $max);
    return htmlspecialchars($v, ENT_QUOTES, 'UTF-8');
}
function generateRef(): string {
    return strtoupper(bin2hex(random_bytes(6))); // 12 chars
}
