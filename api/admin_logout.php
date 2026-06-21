<?php
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_samesite', 'Strict');
ini_set('session.save_path', sys_get_temp_dir());
session_start();
require_once __DIR__ . '/../inc/db.php';
session_destroy();
jsonOut(['ok' => true]);
