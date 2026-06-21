<?php
require_once __DIR__ . '/../inc/db.php';
require_once __DIR__ . '/../inc/mailer.php';

$secret = $_GET['secret'] ?? '';
if ($secret !== (getenv('DB_INIT_SECRET') ?: 'fmc-init-2026')) {
    http_response_code(403);
    jsonOut(['ok' => false, 'error' => 'Forbidden']);
}

$to = trim($_GET['to'] ?? '');
if (!$to || !filter_var($to, FILTER_VALIDATE_EMAIL)) {
    jsonOut(['ok' => false, 'error' => 'Provide a valid ?to= email address']);
}

$results = [];
$testRef  = 'FMC-TEST-001';
$testName = 'Test User';

/* 1. Complaint confirmation */
try {
    $r1 = Mailer::complaintConfirmation($to, $testRef, $testName);
    $results['complaint_confirmation'] = $r1 ? 'sent' : 'failed';
} catch (\Throwable $e) {
    $results['complaint_confirmation'] = 'error: ' . $e->getMessage();
}

/* 2. Staff notification */
try {
    $r2 = Mailer::staffNotification($testRef, $testName, 'Binance');
    $results['staff_notification'] = $r2 ? 'sent' : 'failed';
} catch (\Throwable $e) {
    $results['staff_notification'] = 'error: ' . $e->getMessage();
}

/* 3. State change: review */
try {
    $r3 = Mailer::stateChange($testRef, $to, $testName, 'review');
    $results['state_change_review'] = $r3 ? 'sent' : 'failed';
} catch (\Throwable $e) {
    $results['state_change_review'] = 'error: ' . $e->getMessage();
}

/* 4. State change: info (with requested docs) */
try {
    $r4 = Mailer::stateChange($testRef, $to, $testName, 'info', [
        'infoRequest' => [
            'items' => ['Copy of passport or national ID', 'Bank statement for the last 3 months', 'Screenshot of the trading platform showing the issue'],
            'note'  => 'Please upload these documents through your case portal within 7 days.'
        ]
    ]);
    $results['state_change_info'] = $r4 ? 'sent' : 'failed';
} catch (\Throwable $e) {
    $results['state_change_info'] = 'error: ' . $e->getMessage();
}

/* 5. State change: call (with appointment) */
try {
    $r5 = Mailer::stateChange($testRef, $to, $testName, 'call', [
        'appointment' => [
            'dateText' => '25/06/2026 14:00',
            'note'     => 'You will receive the call via the phone number you provided in your complaint.'
        ]
    ]);
    $results['state_change_call'] = $r5 ? 'sent' : 'failed';
} catch (\Throwable $e) {
    $results['state_change_call'] = 'error: ' . $e->getMessage();
}

/* 6. State change: decision */
try {
    $r6 = Mailer::stateChange($testRef, $to, $testName, 'decision', [
        'decision' => [
            'text'    => 'The Commission has reviewed the submitted evidence and determined that the firm acted in violation of Article 14(3) of the Investment Protection Rules. Restitution proceedings have been initiated.',
            'payment' => ['enabled' => true, 'amount' => '250', 'currency' => 'GBP', 'status' => 'awaiting']
        ]
    ]);
    $results['state_change_decision'] = $r6 ? 'sent' : 'failed';
} catch (\Throwable $e) {
    $results['state_change_decision'] = 'error: ' . $e->getMessage();
}

/* 7. State change: closed */
try {
    $r7 = Mailer::stateChange($testRef, $to, $testName, 'closed');
    $results['state_change_closed'] = $r7 ? 'sent' : 'failed';
} catch (\Throwable $e) {
    $results['state_change_closed'] = 'error: ' . $e->getMessage();
}

$allOk = !in_array('failed', $results) && count(array_filter($results, fn($v) => str_starts_with($v, 'error'))) === 0;

jsonOut([
    'ok'            => $allOk,
    'sent_to'       => $to,
    'resend_from'   => FROM_EMAIL,
    'admin_notify'  => ADMIN_NOTIFY_EMAIL,
    'resend_key_set'=> !empty(getenv('RESEND_API_KEY')),
    'results'       => $results,
]);
