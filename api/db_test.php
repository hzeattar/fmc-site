<?php
header('Content-Type: application/json');
$out = [
    'php' => phpversion(),
    'pdo_mysql' => extension_loaded('pdo_mysql'),
    'env' => [
        'host' => getenv('MYSQLHOST') ?: 'N/A',
        'port' => getenv('MYSQLPORT') ?: 'N/A',
        'db' => getenv('MYSQLDATABASE') ?: 'N/A',
        'user' => getenv('MYSQLUSER') ?: 'N/A',
        'pass_len' => strlen(getenv('MYSQLPASSWORD') ?: ''),
        'has_pdo' => class_exists('PDO') ? 'yes' : 'no',
        'has_mysql_driver' => in_array('mysql', PDO::getAvailableDrivers()) ? 'yes' : 'no',
    ],
    'error' => null,
];
try {
    $dsn = sprintf("mysql:host=%s;port=%s;dbname=%s", getenv('MYSQLHOST'), getenv('MYSQLPORT'), getenv('MYSQLDATABASE'));
    $pdo = new PDO($dsn, getenv('MYSQLUSER'), getenv('MYSQLPASSWORD'));
    $out['mysql_connected'] = true;
    $out['mysql_version'] = $pdo->query("SELECT VERSION()")->fetchColumn();
} catch (Exception $e) {
    $out['mysql_connected'] = false;
    $out['error'] = $e->getMessage();
}
echo json_encode($out);
