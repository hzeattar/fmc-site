<?php
/* Admin session bootstrap */
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', 1);
ini_set('session.cookie_samesite', 'Strict');
session_start();

function requireAdmin(): void {
    if (empty($_SESSION['admin_id'])) {
        header('Location: /backend/login.php');
        exit;
    }
}
function isSuper(): bool {
    return ($_SESSION['admin_role'] ?? '') === 'super';
}
