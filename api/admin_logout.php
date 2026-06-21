<?php
require_once __DIR__ . '/../inc/db.php';
require_once __DIR__ . '/../inc/session_db.php';
startAdminSession();
session_destroy();
jsonOut(['ok' => true]);
