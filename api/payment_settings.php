<?php
/*
 * Payment settings API
 * GET  (no auth required) → return current payment settings
 * POST (admin session required) → save payment settings
 */
require_once __DIR__ . '/../inc/db.php';

$DEFAULTS = [
    'bank' => [
        'accountName'   => 'Financial Monitoring Commission',
        'bankName'       => 'Bank of England',
        'iban'           => '',
        'swift'          => '',
        'sort'           => '',
        'accountNumber'  => '',
        'address'        => '',
        'reference'      => 'Use your case reference (e.g. FMC-CMP-XXXXXX) as the payment reference.',
    ],
    'crypto' => [
        'asset'   => 'USDT',
        'network' => 'TRC20',
        'address' => '',
        'qr'      => '',
    ],
];

try {
    $pdo = DB::pdo();

    /* Ensure settings table exists */
    $pdo->exec("CREATE TABLE IF NOT EXISTS fmc_settings (
        `key`       VARCHAR(100) NOT NULL PRIMARY KEY,
        `value`     MEDIUMTEXT   NOT NULL,
        updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    /* ── GET ── */
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $row = $pdo->prepare("SELECT `value` FROM fmc_settings WHERE `key` = 'payment_settings'");
        $row->execute();
        $val = $row->fetchColumn();
        if ($val) {
            $saved = json_decode($val, true) ?: [];
            $out = [
                'bank'   => array_merge($DEFAULTS['bank'],   $saved['bank']   ?? []),
                'crypto' => array_merge($DEFAULTS['crypto'], $saved['crypto'] ?? []),
            ];
        } else {
            $out = $DEFAULTS;
        }
        jsonOut(['ok' => true, 'settings' => $out]);
    }

    /* ── POST (admin only) ── */
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        require_once __DIR__ . '/../inc/session_db.php';
        startAdminSession();
        if (!isset($_SESSION['admin_id'])) {
            jsonOut(['ok' => false, 'error' => 'Unauthorized'], 401);
        }

        $d = getJsonBody();
        $bank   = $d['bank']   ?? [];
        $crypto = $d['crypto'] ?? [];

        $out = [
            'bank' => [
                'accountName'   => trim($bank['accountName']   ?? ''),
                'bankName'       => trim($bank['bankName']       ?? ''),
                'iban'           => trim($bank['iban']           ?? ''),
                'swift'          => trim($bank['swift']          ?? ''),
                'sort'           => trim($bank['sort']           ?? ''),
                'accountNumber'  => trim($bank['accountNumber']  ?? ''),
                'address'        => trim($bank['address']        ?? ''),
                'reference'      => trim($bank['reference']      ?? ''),
            ],
            'crypto' => [
                'asset'   => trim($crypto['asset']   ?? 'USDT'),
                'network' => trim($crypto['network'] ?? 'TRC20'),
                'address' => trim($crypto['address'] ?? ''),
                'qr'      => trim($crypto['qr']      ?? ''),
            ],
        ];

        $json = json_encode($out, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $pdo->prepare(
            "INSERT INTO fmc_settings (`key`, `value`) VALUES ('payment_settings', ?)
             ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)"
        )->execute([$json]);

        jsonOut(['ok' => true]);
    }

    jsonOut(['ok' => false, 'error' => 'Method not allowed'], 405);

} catch (PDOException $e) {
    error_log('PAYMENT SETTINGS ERROR: ' . $e->getMessage());
    jsonOut(['ok' => false, 'error' => 'Server error'], 500);
}
