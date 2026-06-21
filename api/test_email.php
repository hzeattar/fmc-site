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

$testRef  = 'FMC-TEST-001';
$testName = 'Test User';

/* ── Run one diagnostic call first to get the raw Resend response ── */
$diag = Mailer::sendDebug(
    $to,
    'FMC — Diagnostic Test',
    '<h1>Test</h1><p>This is a diagnostic email from the FMC system.</p>',
    'FMC Diagnostic Test'
);

if (!$diag['ok']) {
    /* Show the exact error and stop — no point sending more */
    jsonOut([
        'ok'           => false,
        'diagnosis'    => 'Single test email FAILED — all other sends skipped.',
        'resend_code'  => $diag['code'],
        'resend_body'  => $diag['body'],
        'sent_to'      => $to,
        'from'         => FROM_EMAIL,
        'key_set'      => !empty(getenv('RESEND_API_KEY')),
        'key_prefix'   => substr(getenv('RESEND_API_KEY') ?: '', 0, 8) . '...',
    ]);
}

/* ── Diagnostic passed — send all template emails ── */
$results = [];

$emails = [
    '1_complaint_confirmation' => fn() => Mailer::complaintConfirmation($to, $testRef, $testName),
    '2_staff_notification'     => fn() => Mailer::staffNotification($testRef, $testName, 'Binance'),
    '3_state_review'           => fn() => Mailer::stateChange($testRef, $to, $testName, 'review'),
    '4_state_info'             => fn() => Mailer::stateChange($testRef, $to, $testName, 'info', [
        'infoRequest' => [
            'items' => ['Copy of passport or national ID', 'Bank statement for the last 3 months', 'Screenshot of the trading platform'],
            'note'  => 'Please upload these documents within 7 days.'
        ]
    ]),
    '5_state_call'             => fn() => Mailer::stateChange($testRef, $to, $testName, 'call', [
        'appointment' => ['dateText' => '25/06/2026 14:00', 'note' => 'You will be called on the number you provided.']
    ]),
    '6_state_decision'         => fn() => Mailer::stateChange($testRef, $to, $testName, 'decision', [
        'decision' => [
            'text'    => 'The Commission determined the firm acted in violation of Article 14(3). Restitution proceedings have been initiated.',
            'payment' => ['enabled' => true, 'amount' => '250', 'currency' => 'GBP', 'status' => 'awaiting']
        ]
    ]),
    '7_state_closed'           => fn() => Mailer::stateChange($testRef, $to, $testName, 'closed'),
];

foreach ($emails as $key => $fn) {
    try {
        $results[$key] = $fn() ? 'sent' : 'failed';
    } catch (\Throwable $e) {
        $results[$key] = 'error: ' . $e->getMessage();
    }
    usleep(200000); /* 200ms between sends to avoid rate limiting */
}

$allSent = !in_array('failed', $results, true) &&
           count(array_filter($results, fn($v) => str_starts_with($v, 'error'))) === 0;

jsonOut([
    'ok'          => $allSent,
    'sent_to'     => $to,
    'from'        => FROM_EMAIL,
    'admin_email' => ADMIN_NOTIFY_EMAIL,
    'total'       => count($results),
    'results'     => $results,
]);
