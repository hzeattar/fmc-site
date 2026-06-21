<?php
require_once __DIR__ . '/../inc/db.php';
require_once __DIR__ . '/../inc/session_db.php';
startAdminSession();

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
