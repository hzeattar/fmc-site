<?php
require_once __DIR__ . '/../inc/db.php';

requireMethod('POST');
$data = getJsonBody();
$ref  = trim($data['ref'] ?? '');
if (!$ref) {
    jsonOut(['ok' => false, 'error' => 'Reference required'], 400);
}

try {
    $pdo  = DB::pdo();
    $stmt = $pdo->prepare(
        "SELECT id, raw_data, reference, full_name, email, phone, company_name, description,
                amount_lost, currency_lost, status, created_at
         FROM fmc_complaints WHERE reference = ?"
    );
    $stmt->execute([$ref]);
    $row  = $stmt->fetch();
    if (!$row) {
        jsonOut(['ok' => false, 'error' => 'Not found'], 404);
    }

    if (!empty($row['raw_data'])) {
        $record = json_decode($row['raw_data'], true) ?: [];
    } else {
        /* Build complete record from flat columns to avoid partial raw_data corruption */
        $stMap  = ['pending' => 'received', 'under_review' => 'review', 'closed' => 'closed'];
        $st     = $stMap[$row['status'] ?? 'pending'] ?? 'received';
        $record = [
            'ref'          => $row['reference'],
            'createdAt'    => $row['created_at'],
            'status'       => $st, 'state' => $st,
            'stateHistory' => [['state' => $st, 'at' => $row['created_at'], 'by' => 'system']],
            'officer'      => null, 'appointment' => null, 'infoRequest' => null, 'decision' => null,
            'messages'     => [], 'extraFiles' => [], 'applicantUnread' => 0,
            'complainant'  => [
                'fullName' => $row['full_name'] ?? '',
                'email'    => $row['email']     ?? '',
                'phone'    => $row['phone']     ?? '',
            ],
            'case'         => [
                'firm'            => $row['company_name']  ?? '',
                'currency'        => $row['currency_lost'] ?? 'USD',
                'amountDeposited' => (string)($row['amount_lost'] ?? ''),
                'reason'          => $row['description']   ?? '',
            ],
            'evidence' => [],
        ];
    }
    $record['applicantUnread'] = 0;

    $pdo->prepare("UPDATE fmc_complaints SET raw_data = ?, updated_at = NOW() WHERE id = ?")
        ->execute([json_encode($record, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), $row['id']]);

    jsonOut(['ok' => true]);
} catch (PDOException $e) {
    error_log('MARK READ: ' . $e->getMessage());
    jsonOut(['ok' => false], 500);
}
