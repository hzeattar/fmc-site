<?php
require_once __DIR__ . '/config.php';

class DB {
    private static ?PDO $pdo = null;
    public static function pdo(): PDO {
        if (self::$pdo === null) {
            global $db;
            $dsn = "mysql:host={$db['host']};port={$db['port']};dbname={$db['db']};charset={$db['charset']}";
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ];
            try {
                self::$pdo = new PDO($dsn, $db['user'], $db['pass'], $options);
                self::$pdo->exec("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");
            } catch (PDOException $e) {
                http_response_code(500);
                header('Content-Type: application/json');
                echo json_encode(['ok' => false, 'error' => 'Database connection failed']);
                error_log("DB ERROR: " . $e->getMessage());
                exit;
            }
        }
        return self::$pdo;
    }
}
