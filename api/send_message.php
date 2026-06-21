<?php
require_once __DIR__ . '/../inc/db.php';

requireMethod('POST');
$data = getJsonBody();

$ref  = sanitizeString($data['reference'] ?? '', 30);
$name = sanitizeString($data['name'] ?? 'Complainant', 100);
$msg  = trim($data['message'] ?? '');

if (!$ref || !$msg) {
    jsonOut(['ok' => false, 'error' => 'Reference and message required'], 422);
}
if (mb_strlen($msg, 'UTF-8') > 2000) {
    $msg = mb_substr($msg, 0, 2000, 'UTF-8');
}

try {
    $pdo  = DB::pdo();
    $stmt = $pdo->prepare("SELECT id, raw_data FROM fmc_complaints WHERE reference = ?");
    $stmt->execute([$ref]);
    $row  = $stmt->fetch();
    if (!$row) {
        jsonOut(['ok' => false, 'error' => 'Complaint not found'], 404);
    }

    $nowIso  = gmdate('c');
    $record  = is_string($row['raw_data']) ? (json_decode($row['raw_data'], true) ?: []) : [];

    /* Append message to raw_data */
    $record['messages'][] = [
        'from' => 'applicant',
        'text' => $msg,
        'at'   => $nowIso,
    ];

    $rawJson = json_encode($record, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $pdo->prepare("UPDATE fmc_complaints SET raw_data = ?, updated_at = NOW() WHERE id = ?")
        ->execute([$rawJson, $row['id']]);

    /* Also insert into fmc_messages for reporting */
    $pdo->prepare(
        "INSERT INTO fmc_messages (complaint_id, sender_type, sender_name, content) VALUES (?, 'user', ?, ?)"
    )->execute([$row['id'], $name, $msg]);

    jsonOut(['ok' => true, 'message' => 'Message sent']);
} catch (PDOException $e) {
    error_log('MSG ERROR: ' . $e->getMessage());
    jsonOut(['ok' => false, 'error' => 'Failed to send message'], 500);
}
