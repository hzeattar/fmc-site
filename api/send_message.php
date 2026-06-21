<?php
require_once __DIR__ . '/../inc/db.php';

requireMethod('POST');
$data = getJsonBody();

$ref       = sanitizeString($data['reference'] ?? '', 30);
$name      = sanitizeString($data['name']      ?? 'Complainant', 100);
$msg       = trim($data['message'] ?? '');
$extraFile = $data['extra_file'] ?? null;   /* new: { name, size, url, from, at } */

if (!$ref) {
    jsonOut(['ok' => false, 'error' => 'Reference required'], 422);
}
/* Allow empty message only when an extra_file is provided */
if (!$msg && !$extraFile) {
    jsonOut(['ok' => false, 'error' => 'Reference and message required'], 422);
}
if ($msg && mb_strlen($msg, 'UTF-8') > 2000) {
    $msg = mb_substr($msg, 0, 2000, 'UTF-8');
}

try {
    $pdo  = DB::pdo();
    $stmt = $pdo->prepare("SELECT id FROM fmc_complaints WHERE reference = ?");
    $stmt->execute([$ref]);
    $row  = $stmt->fetch();
    if (!$row) {
        jsonOut(['ok' => false, 'error' => 'Complaint not found'], 404);
    }

    $nowIso = gmdate('c');
    $record = null;

    /* Load / build raw_data record */
    try {
        $stmtRaw = $pdo->prepare(
            "SELECT id, raw_data, reference, full_name, email, phone, company_name, description,
                    amount_lost, currency_lost, status, created_at
             FROM fmc_complaints WHERE id = ?"
        );
        $stmtRaw->execute([$row['id']]);
        $rowRaw = $stmtRaw->fetch();
        if ($rowRaw) {
            if (!empty($rowRaw['raw_data'])) {
                $record = json_decode($rowRaw['raw_data'], true) ?: [];
            } else {
                $stMap  = ['pending' => 'received', 'under_review' => 'review', 'closed' => 'closed'];
                $st     = $stMap[$rowRaw['status'] ?? 'pending'] ?? 'received';
                $record = [
                    'ref'          => $rowRaw['reference'],
                    'createdAt'    => $rowRaw['created_at'],
                    'status'       => $st, 'state' => $st,
                    'stateHistory' => [['state' => $st, 'at' => $rowRaw['created_at'], 'by' => 'system']],
                    'officer'      => null, 'appointment' => null, 'infoRequest' => null, 'decision' => null,
                    'messages'     => [], 'extraFiles' => [], 'applicantUnread' => 0,
                    'complainant'  => [
                        'fullName' => $rowRaw['full_name'] ?? '',
                        'email'    => $rowRaw['email']     ?? '',
                        'phone'    => $rowRaw['phone']     ?? '',
                    ],
                    'case'         => [
                        'firm'            => $rowRaw['company_name']  ?? '',
                        'currency'        => $rowRaw['currency_lost'] ?? 'USD',
                        'amountDeposited' => (string)($rowRaw['amount_lost'] ?? ''),
                        'reason'          => $rowRaw['description']   ?? '',
                    ],
                    'evidence' => [],
                ];
            }

            /* Append message if provided */
            if ($msg) {
                $record['messages'][] = ['from' => 'applicant', 'text' => $msg, 'at' => $nowIso];
            }

            /* Append extra file if provided */
            if ($extraFile && !empty($extraFile['name'])) {
                $record['extraFiles'] = $record['extraFiles'] ?? [];
                $record['extraFiles'][] = [
                    'name' => sanitizeString($extraFile['name'] ?? '', 255),
                    'size' => (int) ($extraFile['size'] ?? 0),
                    'url'  => sanitizeString($extraFile['url']  ?? '', 500),
                    'from' => 'applicant',
                    'at'   => $nowIso,
                ];
                /* Increment admin unread for new file */
                $record['adminUnread'] = ($record['adminUnread'] ?? 0) + 1;
            }

            $rawJson = json_encode($record, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            $pdo->prepare("UPDATE fmc_complaints SET raw_data = ?, updated_at = NOW() WHERE id = ?")
                ->execute([$rawJson, $rowRaw['id']]);
        }
    } catch (\Throwable $ignored) {}

    /* Insert into fmc_messages only if there is an actual text message */
    if ($msg) {
        $pdo->prepare(
            "INSERT INTO fmc_messages (complaint_id, sender_type, sender_name, content) VALUES (?, 'user', ?, ?)"
        )->execute([$row['id'], $name, $msg]);
    }

    $out = ['ok' => true];
    if ($record) $out['record'] = $record;
    jsonOut($out);

} catch (PDOException $e) {
    error_log('MSG ERROR: ' . $e->getMessage());
    jsonOut(['ok' => false, 'error' => 'Failed to send message'], 500);
}
