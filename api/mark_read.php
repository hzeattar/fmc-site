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
    $stmt = $pdo->prepare("SELECT id, raw_data FROM fmc_complaints WHERE reference = ?");
    $stmt->execute([$ref]);
    $row  = $stmt->fetch();
    if (!$row) {
        jsonOut(['ok' => false, 'error' => 'Not found'], 404);
    }

    $record = is_string($row['raw_data']) ? (json_decode($row['raw_data'], true) ?: []) : [];
    $record['applicantUnread'] = 0;

    $pdo->prepare("UPDATE fmc_complaints SET raw_data = ?, updated_at = NOW() WHERE id = ?")
        ->execute([json_encode($record, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), $row['id']]);

    jsonOut(['ok' => true]);
} catch (PDOException $e) {
    error_log('MARK READ: ' . $e->getMessage());
    jsonOut(['ok' => false], 500);
}
