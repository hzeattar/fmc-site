<?php
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', 1);
ini_set('session.cookie_samesite', 'Strict');
session_start();
$_SESSION = [];
session_destroy();
header('Location: /backend/login.php');
exit;
