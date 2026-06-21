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

/* ── Quick diagnostic with main FROM address ── */
$diagMain = Mailer::sendDebug(
    $to,
    'FMC — Diagnostic Test',
    '<h1>Test</h1><p>Diagnostic email.</p>',
    'FMC Diagnostic Test'
);

/* ── If main FROM fails, try Resend onboarding sender ── */
$usingFallback = false;
if (!$diagMain['ok'] && strpos($diagMain['body'] ?? '', 'not verified') !== false) {
    /* Temporarily override FROM_EMAIL with Resend's allowed test sender */
    define('FROM_EMAIL_OVERRIDE', 'onboarding@resend.dev');
    $diagFallback = Mailer::sendDebugFrom(FROM_EMAIL_OVERRIDE, $to, 'FMC — Diagnostic Test (fallback sender)', '<h1>Test</h1><p>Fallback sender test.</p>');
    if ($diagFallback['ok']) {
        $usingFallback = true;
        $diagMain = $diagFallback;
    }
}

if (!$diagMain['ok']) {
    jsonOut([
        'ok'          => false,
        'problem'     => 'Domain not verified in Resend. See fix instructions below.',
        'resend_code' => $diagMain['code'],
        'resend_body' => $diagMain['body'],
        'from'        => FROM_EMAIL,
        'key_prefix'  => substr(getenv('RESEND_API_KEY') ?: '', 0, 8) . '...',
        'fix'         => [
            'step1' => 'Go to https://resend.com/domains',
            'step2' => 'Click "Add Domain" and enter: fmc-gov.com',
            'step3' => 'Add the DNS TXT records shown to your domain registrar',
            'step4' => 'Wait for verification (usually 10-30 minutes)',
            'step5' => 'Update ADMIN_NOTIFY_EMAIL to your real email in Railway env vars',
        ],
        'env_fixes' => [
            'ADMIN_NOTIFY_EMAIL' => 'Change to your real email (e.g. dbbbbcx@gmail.com)',
        ],
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
