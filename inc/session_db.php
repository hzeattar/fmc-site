<?php
require_once __DIR__ . '/config.php';

/*
 * MySQL-backed session handler
 * Sessions survive container restarts and deployments.
 * Requires: fmc_sessions table (created by db_migrate.php)
 */
class DbSessionHandler implements SessionHandlerInterface {
    private static ?PDO $_pdo = null;

    private static function conn(): ?PDO {
        if (self::$_pdo) return self::$_pdo;
        global $db;
        try {
            $dsn = "mysql:host={$db['host']};port={$db['port']};dbname={$db['db']};charset=utf8mb4";
            self::$_pdo = new PDO($dsn, $db['user'], $db['pass'], [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
        } catch (\Throwable $e) {
            error_log('SESSION DB CONNECT: ' . $e->getMessage());
            return null;
        }
        return self::$_pdo;
    }

    public function open(string $path, string $name): bool { return true; }
    public function close(): bool { return true; }

    public function read(string $id): string|false {
        $pdo = self::conn();
        if (!$pdo) return '';
        try {
            $stmt = $pdo->prepare("SELECT data FROM fmc_sessions WHERE id = ? AND expires > NOW() LIMIT 1");
            $stmt->execute([$id]);
            $row = $stmt->fetch();
            return $row ? (string) $row['data'] : '';
        } catch (\Throwable $e) {
            error_log('SESSION READ: ' . $e->getMessage());
            return '';
        }
    }

    public function write(string $id, string $data): bool {
        $pdo = self::conn();
        if (!$pdo) return false;
        try {
            $pdo->prepare(
                "INSERT INTO fmc_sessions (id, data, expires)
                 VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))
                 ON DUPLICATE KEY UPDATE data = VALUES(data), expires = VALUES(expires)"
            )->execute([$id, $data]);
            return true;
        } catch (\Throwable $e) {
            error_log('SESSION WRITE: ' . $e->getMessage());
            return false;
        }
    }

    public function destroy(string $id): bool {
        $pdo = self::conn();
        if (!$pdo) return true;
        try {
            $pdo->prepare("DELETE FROM fmc_sessions WHERE id = ?")->execute([$id]);
        } catch (\Throwable $ignored) {}
        return true;
    }

    public function gc(int $max_lifetime): int|false {
        $pdo = self::conn();
        if (!$pdo) return 0;
        try {
            $stmt = $pdo->prepare("DELETE FROM fmc_sessions WHERE expires < NOW()");
            $stmt->execute();
            return $stmt->rowCount();
        } catch (\Throwable $e) {
            return 0;
        }
    }
}

function startAdminSession(): void {
    static $started = false;
    if ($started || session_status() !== PHP_SESSION_NONE) { $started = true; return; }
    $handler = new DbSessionHandler();
    session_set_save_handler($handler, true);
    ini_set('session.cookie_httponly', 1);
    ini_set('session.cookie_secure', 1);
    ini_set('session.cookie_samesite', 'Strict');
    ini_set('session.gc_maxlifetime', 604800); // 7 days
    session_start();
    $started = true;
}
