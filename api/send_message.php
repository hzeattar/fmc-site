<?php
require_once __DIR__ . '/../inc/db.php';
require_once __DIR__ . '/../inc/mailer.php';

requireMethod('POST');
$data = getJsonBody();

$ref   = sanitizeString($data['reference'] ?? '', 16);
$name  = sanitizeString($data['name'] ?? '', 100);
$email = filter_var(trim($data['email'] ?? ''), FILTER_SANITIZE_EMAIL);
$msg   = sanitizeString($data['message'] ?? '', 2000);

if (!$ref || !$name || !$msg) {
    jsonOut(['ok' => false, 'error' => 'Reference, name, and message required'], 422);
}

try {
    $pdo = DB::pdo();
    $stmt = $pdo->prepare("SELECT id, email FROM fmc_complaints WHERE reference = ?");
    $stmt->execute([$ref]);
    $complaint = $stmt->fetch();
    if (!$complaint) {
        jsonOut(['ok' => false, 'error' => 'Complaint not found'], 404);
    }

    $stmt = $pdo->prepare(
        "INSERT INTO fmc_messages (complaint_id, sender_type, sender_name, content) VALUES (?, 'user', ?, ?)"
    );
    $stmt->execute([$complaint['id'], $name, $msg]);
    $msgId = (int) $pdo->lastInsertId();

    jsonOut(['ok' => true, 'id' => $msgId, 'message' => 'Message sent']);
} catch (PDOException $e) {
    error_log("MSG ERROR: " . $e->getMessage());
    jsonOut(['ok' => false, 'error' => 'Failed to send message'], 500);
}
