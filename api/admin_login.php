<?php
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', 1);
ini_set('session.cookie_samesite', 'Strict');
session_start();

require_once __DIR__ . '/../inc/db.php';

requireMethod('POST');
$data = getJsonBody();

$username = sanitizeString($data['username'] ?? '', 50);
$password = trim($data['password'] ?? '');

if (!$username || !$password) {
    jsonOut(['ok' => false, 'error' => 'Username and password required'], 422);
}

try {
    $pdo = DB::pdo();

    // Check DB admin first
    $stmt = $pdo->prepare("SELECT * FROM fmc_admins WHERE username = ? AND status = 'active' LIMIT 1");
    $stmt->execute([$username]);
    $admin = $stmt->fetch();

    if (!$admin && $username === ADMIN_USERNAME) {
        $envPassword = getenv('ADMIN_PASSWORD') ?: '';
        if ($envPassword && $password === $envPassword) {
            $_SESSION['admin_id']   = 0;
            $_SESSION['admin_name'] = 'Administrator';
            $_SESSION['admin_role'] = 'super';
            jsonOut(['ok' => true, 'admin_id' => 0, 'name' => 'Administrator', 'role' => 'super']);
        }
    }

    if (!$admin) {
        jsonOut(['ok' => false, 'error' => 'Invalid credentials'], 401);
    }

    if (!password_verify($password, $admin['password_hash'])) {
        jsonOut(['ok' => false, 'error' => 'Invalid credentials'], 401);
    }

    $pdo->prepare("UPDATE fmc_admins SET last_login = NOW() WHERE id = ?")
        ->execute([(int)$admin['id']]);

    $_SESSION['admin_id']   = (int)$admin['id'];
    $_SESSION['admin_name'] = $admin['name'];
    $_SESSION['admin_role'] = $admin['role'];

    jsonOut([
        'ok'      => true,
        'admin_id'=> (int)$admin['id'],
        'name'    => $admin['name'],
        'role'    => $admin['role'],
    ]);
} catch (PDOException $e) {
    error_log("LOGIN ERROR: " . $e->getMessage());
    jsonOut(['ok' => false, 'error' => 'Server error'], 500);
}
