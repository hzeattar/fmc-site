<?php
require_once __DIR__ . '/../inc/db.php';
require_once __DIR__ . '/../inc/session_db.php';
startAdminSession();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonOut(['ok' => false, 'error' => 'Method not allowed'], 405);
}

if (!isset($_SESSION['admin_id'])) {
    jsonOut(['ok' => false, 'error' => 'Unauthorized'], 401);
}

try {
    $pdo  = DB::pdo();
    $rows = [];

    /* Try fetching with raw_data + all flat columns; fall back if column not yet added */
    try {
        $stmt = $pdo->query(
            "SELECT raw_data, reference, full_name, email, phone, company_name, description,
                    amount_lost, currency_lost, status, created_at
             FROM fmc_complaints ORDER BY created_at DESC LIMIT 1000"
        );
        $rows = $stmt->fetchAll();
    } catch (PDOException $eCol) {
        /* raw_data column doesn't exist yet */
        $stmt = $pdo->query(
            "SELECT reference, full_name, email, phone, company_name, description,
                    amount_lost, currency_lost, status, created_at
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
        /* Fallback for records without raw_data — rebuild full JS shape from flat columns */
        $dbStatus = $row['status'] ?? 'pending';
        $frontendState = match ($dbStatus) {
            'under_review' => 'review',
            default => 'received',
        };
        $complaints[] = [
            'ref'          => $row['reference'],
            'createdAt'    => $row['created_at'],
            'state'        => $frontendState,
            'status'       => $frontendState,
            'stateHistory' => [['state' => $frontendState, 'at' => $row['created_at'], 'by' => 'system']],
            'messages'     => [],
            'extraFiles'   => [],
            'applicantUnread' => 0,
            'complainant'  => [
                'fullName' => $row['full_name'] ?? '',
                'email'    => $row['email'] ?? '',
                'phone'    => $row['phone'] ?? '',
            ],
            'case'         => [
                'firm'            => $row['company_name'] ?? '',
                'currency'        => $row['currency_lost'] ?? 'USD',
                'amountDeposited' => (string) ($row['amount_lost'] ?? ''),
                'reason'          => $row['description'] ?? '',
            ],
            'evidence'     => [],
        ];
    }

    jsonOut(['ok' => true, 'complaints' => $complaints]);
} catch (PDOException $e) {
    error_log('ADMIN COMPLAINTS: ' . $e->getMessage());
    jsonOut(['ok' => false, 'error' => 'Server error'], 500);
}
