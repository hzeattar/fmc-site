<?php
require_once __DIR__ . '/../inc/db.php';

$secret = $_GET['secret'] ?? '';
if ($secret !== (getenv('DB_INIT_SECRET') ?: 'fmc-init-2026')) {
    http_response_code(403);
    jsonOut(['ok' => false, 'error' => 'Forbidden']);
}

try {
    $pdo = DB::pdo();
    $done = [];

    // Add raw_data column for storing the full JS record
    try {
        $pdo->exec("ALTER TABLE fmc_complaints ADD COLUMN raw_data MEDIUMTEXT DEFAULT NULL");
        $done[] = 'Added raw_data column';
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate column') !== false || $e->getCode() === '42S21') {
            $done[] = 'raw_data column already exists';
        } else {
            throw $e;
        }
    }

    // Ensure admin user exists with hashed password
    $pass = getenv('ADMIN_PASSWORD') ?: 'FmcAdmin2026!';
    $hash = password_hash($pass, PASSWORD_DEFAULT);
    $pdo->prepare(
        "INSERT INTO fmc_admins (name, email, username, password_hash, role, status)
         VALUES ('Administrator', 'admin@fmc-gov.com', 'admin', ?, 'super', 'active')
         ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash), status='active'"
    )->execute([$hash]);
    $done[] = 'Admin account ensured';

    jsonOut(['ok' => true, 'applied' => $done]);
} catch (Exception $e) {
    error_log('MIGRATE ERROR: ' . $e->getMessage());
    jsonOut(['ok' => false, 'error' => $e->getMessage()], 500);
}
