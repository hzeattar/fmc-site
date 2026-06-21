<?php
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', 1);
ini_set('session.cookie_samesite', 'Strict');
ini_set('session.save_path', sys_get_temp_dir());
session_start();
require_once __DIR__ . '/../inc/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonOut(['ok' => false, 'error' => 'Method not allowed'], 405);
}

if (isset($_SESSION['admin_id'])) {
    jsonOut([
        'ok'   => true,
        'name' => $_SESSION['admin_name'] ?? 'Admin',
        'role' => $_SESSION['admin_role'] ?? 'staff',
    ]);
} else {
    jsonOut(['ok' => false, 'error' => 'Not authenticated'], 401);
}
