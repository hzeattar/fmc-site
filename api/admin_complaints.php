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

if (!isset($_SESSION['admin_id'])) {
    jsonOut(['ok' => false, 'error' => 'Unauthorized'], 401);
}

try {
    $pdo  = DB::pdo();
    $rows = [];

    /* Try fetching with raw_data; fall back if column not yet added */
    try {
        $stmt = $pdo->query(
            "SELECT raw_data, reference, full_name, email, created_at
             FROM fmc_complaints ORDER BY created_at DESC LIMIT 1000"
        );
        $rows = $stmt->fetchAll();
    } catch (PDOException $eCol) {
        /* raw_data column doesn't exist yet */
        $stmt = $pdo->query(
            "SELECT reference, full_name, email, created_at
             FROM fmc_complaints ORDER BY created_at DESC LIMIT 1000"
        );
        $rows = $stmt->fetchAll();
    }

    $complaints = [];
    foreach ($rows as $row) {
        if (!empty($row['raw_data'])) {
            $c = json_decode($row['raw_data'], true);
            if (is_array($c)) {
                $complaints[] = $c;
                continue;
            }
        }
        /* Fallback for records without raw_data */
        $complaints[] = [
            'ref'          => $row['reference'],
            'createdAt'    => $row['created_at'],
            'state'        => 'received',
            'status'       => 'received',
            'stateHistory' => [],
            'messages'     => [],
            'extraFiles'   => [],
            'applicantUnread' => 0,
            'complainant'  => ['fullName' => $row['full_name'], 'email' => $row['email']],
            'case'         => [],
            'evidence'     => [],
        ];
    }

    jsonOut(['ok' => true, 'complaints' => $complaints]);
} catch (PDOException $e) {
    error_log('ADMIN COMPLAINTS: ' . $e->getMessage());
    jsonOut(['ok' => false, 'error' => 'Server error'], 500);
}
