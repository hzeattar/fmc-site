<?php
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', 1);
ini_set('session.cookie_samesite', 'Strict');
ini_set('session.save_path', sys_get_temp_dir());
session_start();

require_once __DIR__ . '/../inc/db.php';

requireMethod('POST');

if (!isset($_SESSION['admin_id'])) {
    jsonOut(['ok' => false, 'error' => 'Unauthorized'], 401);
}

$rec = getJsonBody();
$ref = trim($rec['ref'] ?? '');
if (!$ref) {
    jsonOut(['ok' => false, 'error' => 'Reference required'], 400);
}

/* Map frontend state to DB status column */
$stateMap = [
    'received' => 'pending',
    'review'   => 'under_review',
    'call'     => 'under_review',
    'info'     => 'under_review',
    'decision' => 'under_review',
    'closed'   => 'closed',
];
$state    = $rec['state'] ?? 'received';
$dbStatus = $stateMap[$state] ?? 'pending';

$rawJson = json_encode($rec, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

try {
    $pdo  = DB::pdo();
    /* Try with raw_data, fall back if column missing */
    try {
        $stmt = $pdo->prepare(
            "UPDATE fmc_complaints SET raw_data = ?, status = ?, updated_at = NOW() WHERE reference = ?"
        );
        $stmt->execute([$rawJson, $dbStatus, $ref]);
    } catch (PDOException $e2) {
        if (strpos($e2->getMessage(), 'Unknown column') !== false || strpos($e2->getMessage(), 'raw_data') !== false) {
            $pdo->prepare("UPDATE fmc_complaints SET status = ?, updated_at = NOW() WHERE reference = ?")
                ->execute([$dbStatus, $ref]);
        } else {
            throw $e2;
        }
    }

    jsonOut(['ok' => true]);
} catch (PDOException $e) {
    error_log('ADMIN SAVE: ' . $e->getMessage());
    jsonOut(['ok' => false, 'error' => 'Failed to save'], 500);
}
