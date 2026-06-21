<?php
require_once __DIR__ . '/../inc/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonOut(['ok' => false, 'error' => 'Method not allowed'], 405);
}

/* Accept both ?ref= and ?id= for backward compatibility */
$ref = sanitizeString($_GET['ref'] ?? $_GET['id'] ?? '', 30);
if (!$ref) {
    jsonOut(['ok' => false, 'error' => 'Reference required'], 400);
}

try {
    $pdo  = DB::pdo();
    $stmt = $pdo->prepare("SELECT * FROM fmc_complaints WHERE reference = ? LIMIT 1");
    $stmt->execute([$ref]);
    $row  = $stmt->fetch();

    if (!$row) {
        jsonOut(['ok' => false, 'error' => 'Complaint not found'], 404);
    }

    /* If raw_data exists, return it directly — it is the full JS record */
    if (!empty($row['raw_data'])) {
        $record = json_decode($row['raw_data'], true);
        if (is_array($record)) {
            jsonOut(['ok' => true, 'complaint' => $record]);
        }
    }

    /* Fallback: build a minimal record from flat columns */
    $record = [
        'ref'          => $row['reference'],
        'createdAt'    => $row['created_at'],
        'status'       => 'received',
        'state'        => 'received',
        'stateHistory' => [['state' => 'received', 'at' => $row['created_at'], 'by' => 'system']],
        'officer'      => null,
        'appointment'  => null,
        'infoRequest'  => null,
        'decision'     => null,
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

    jsonOut(['ok' => true, 'complaint' => $record]);
} catch (PDOException $e) {
    error_log('TRACK ERROR: ' . $e->getMessage());
    jsonOut(['ok' => false, 'error' => 'Server error'], 500);
}
