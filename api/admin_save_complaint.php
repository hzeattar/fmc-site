<?php
require_once __DIR__ . '/../inc/db.php';
require_once __DIR__ . '/../inc/mailer.php';
require_once __DIR__ . '/../inc/session_db.php';
startAdminSession();

requireMethod('POST');

if (!isset($_SESSION['admin_id'])) {
    jsonOut(['ok' => false, 'error' => 'Unauthorized'], 401);
}

$rec = getJsonBody();
$ref = trim($rec['ref'] ?? '');
if (!$ref) {
    jsonOut(['ok' => false, 'error' => 'Reference required'], 400);
}

$newState = $rec['state'] ?? 'received';

/* Map frontend state to DB status column */
$stateMap = [
    'received' => 'pending',
    'review'   => 'under_review',
    'call'     => 'under_review',
    'info'     => 'under_review',
    'decision' => 'under_review',
    'closed'   => 'closed',
];
$dbStatus = $stateMap[$newState] ?? 'pending';
$rawJson  = json_encode($rec, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

try {
    $pdo = DB::pdo();

    /* ── Read old state + complainant email before updating ── */
    $oldState         = 'received';
    $complainantEmail = '';
    $complainantName  = '';

    try {
        $stmtOld = $pdo->prepare("SELECT raw_data FROM fmc_complaints WHERE reference = ? LIMIT 1");
        $stmtOld->execute([$ref]);
        $oldRow = $stmtOld->fetch();
        if ($oldRow && !empty($oldRow['raw_data'])) {
            $oldRec = json_decode($oldRow['raw_data'], true) ?: [];
            $oldState         = $oldRec['state']                   ?? 'received';
            $complainantEmail = $oldRec['complainant']['email']    ?? '';
            $complainantName  = $oldRec['complainant']['fullName'] ?? '';
        }
    } catch (\Throwable $ignored) {}

    /* ── Persist updated record ── */
    try {
        $pdo->prepare(
            "UPDATE fmc_complaints SET raw_data = ?, status = ?, updated_at = NOW() WHERE reference = ?"
        )->execute([$rawJson, $dbStatus, $ref]);
    } catch (PDOException $e2) {
        if (strpos($e2->getMessage(), 'Unknown column') !== false || strpos($e2->getMessage(), 'raw_data') !== false) {
            $pdo->prepare("UPDATE fmc_complaints SET status = ?, updated_at = NOW() WHERE reference = ?")
                ->execute([$dbStatus, $ref]);
        } else {
            throw $e2;
        }
    }

    /* ── Send email when state actually changed ── */
    if ($newState !== $oldState && $complainantEmail) {
        $extra = [
            'appointment' => $rec['appointment'] ?? null,
            'infoRequest' => $rec['infoRequest'] ?? null,
            'decision'    => $rec['decision']    ?? null,
        ];
        try {
            Mailer::stateChange($ref, $complainantEmail, $complainantName, $newState, $extra);
        } catch (\Throwable $mailErr) {
            error_log('STATE CHANGE MAIL: ' . $mailErr->getMessage());
        }
    }

    jsonOut(['ok' => true]);
} catch (PDOException $e) {
    error_log('ADMIN SAVE: ' . $e->getMessage());
    jsonOut(['ok' => false, 'error' => 'Failed to save'], 500);
}
