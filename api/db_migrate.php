<?php
require_once __DIR__ . '/../inc/db.php';

$secret = $_GET['secret'] ?? '';
if ($secret !== (getenv('DB_INIT_SECRET') ?: 'fmc-init-2026')) {
    http_response_code(403);
    jsonOut(['ok' => false, 'error' => 'Forbidden']);
}

try {
    $pdo  = DB::pdo();
    $done = [];

    /* ── 1. raw_data column ── */
    try {
        $pdo->exec("ALTER TABLE fmc_complaints ADD COLUMN raw_data MEDIUMTEXT DEFAULT NULL");
        $done[] = 'Added raw_data column';
    } catch (PDOException $e) {
        $done[] = 'raw_data column already exists';
    }

    /* ── 2. MySQL-backed sessions table ── */
    $pdo->exec("CREATE TABLE IF NOT EXISTS fmc_sessions (
        id      VARCHAR(128) NOT NULL PRIMARY KEY,
        data    MEDIUMTEXT   NOT NULL,
        expires DATETIME     NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_expires (expires)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    $done[] = 'fmc_sessions table ensured';

    /* ── 3. Ensure admin account ── */
    $pass = getenv('ADMIN_PASSWORD') ?: 'FmcAdmin2026!';
    $hash = password_hash($pass, PASSWORD_DEFAULT);
    $pdo->prepare(
        "INSERT INTO fmc_admins (name, email, username, password_hash, role, status)
         VALUES ('Administrator', 'admin@fmc-gov.com', 'admin', ?, 'super', 'active')
         ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash), status='active'"
    )->execute([$hash]);
    $done[] = 'Admin account ensured';

    /* ── 4. Clean expired sessions ── */
    $deleted = $pdo->exec("DELETE FROM fmc_sessions WHERE expires < NOW()");
    if ($deleted > 0) $done[] = "Cleared {$deleted} expired session(s)";

    jsonOut(['ok' => true, 'applied' => $done]);
} catch (Exception $e) {
    error_log('MIGRATE ERROR: ' . $e->getMessage());
    jsonOut(['ok' => false, 'error' => $e->getMessage()], 500);
}
