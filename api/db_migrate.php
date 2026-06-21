<?php
require_once __DIR__ . '/../inc/db.php';

$secret = $_GET['secret'] ?? '';
if ($secret !== (getenv('DB_INIT_SECRET') ?: 'fmc-init-2026')) {
    http_response_code(403);
    jsonOut(['ok' => false, 'error' => 'Forbidden']);
}

try {
    $pdo  = DB::pdo();
    $done = [];

    /* ── 1. raw_data column ── */
    try {
        $pdo->exec("ALTER TABLE fmc_complaints ADD COLUMN raw_data MEDIUMTEXT DEFAULT NULL");
        $done[] = 'Added raw_data column';
    } catch (PDOException $e) {
        $done[] = 'raw_data column already exists';
    }

    /* ── 2. updated_at column ── */
    try {
        $pdo->exec("ALTER TABLE fmc_complaints ADD COLUMN updated_at DATETIME DEFAULT NULL");
        $done[] = 'Added updated_at column';
    } catch (PDOException $e) {
        $done[] = 'updated_at column already exists';
    }

    /* ── 3. MySQL-backed sessions table ── */
    $pdo->exec("CREATE TABLE IF NOT EXISTS fmc_sessions (
        id      VARCHAR(128) NOT NULL PRIMARY KEY,
        data    MEDIUMTEXT   NOT NULL,
        expires DATETIME     NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_expires (expires)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    $done[] = 'fmc_sessions table ensured';

    /* ── 4. Ensure admin account ── */
    $pass = getenv('ADMIN_PASSWORD') ?: 'FmcAdmin2026!';
    $hash = password_hash($pass, PASSWORD_DEFAULT);
    $pdo->prepare(
        "INSERT INTO fmc_admins (name, email, username, password_hash, role, status)
         VALUES ('Administrator', 'admin@fmc-gov.com', 'admin', ?, 'super', 'active')
         ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash), status='active'"
    )->execute([$hash]);
    $done[] = 'Admin account ensured';

    /* ── 5. Ensure fmc_companies has all required columns ── */
    $compCols = [
        "ALTER TABLE fmc_companies ADD COLUMN type        VARCHAR(100)  DEFAULT NULL",
        "ALTER TABLE fmc_companies ADD COLUMN country     VARCHAR(100)  DEFAULT NULL",
        "ALTER TABLE fmc_companies ADD COLUMN year_founded INT          DEFAULT NULL",
        "ALTER TABLE fmc_companies ADD COLUMN website     VARCHAR(500)  DEFAULT NULL",
        "ALTER TABLE fmc_companies ADD COLUMN description TEXT          DEFAULT NULL",
    ];
    foreach ($compCols as $sql) {
        try { $pdo->exec($sql); $done[] = 'Added companies column'; }
        catch (PDOException $e) { /* column already exists — ignore */ }
    }

    /* ── 6. Clean expired sessions ── */
    $deleted = $pdo->exec("DELETE FROM fmc_sessions WHERE expires < NOW()");
    if ($deleted > 0) $done[] = "Cleared {$deleted} expired session(s)";

    /* ── 7. Backfill raw_data for NULL/empty/corrupted complaint records ── */
    try {
        /* Count records that need rebuilding: NULL, empty, OR missing the 'ref' key */
        $nullCount = (int) $pdo->query(
            "SELECT COUNT(*) FROM fmc_complaints
             WHERE raw_data IS NULL
                OR raw_data = ''
                OR JSON_UNQUOTE(JSON_EXTRACT(raw_data, '$.ref')) IS NULL"
        )->fetchColumn();

        if ($nullCount > 0) {
            $rows = $pdo->query(
                "SELECT id, reference, full_name, email, phone, company_name, description,
                        amount_lost, currency_lost, status, created_at
                 FROM fmc_complaints
                 WHERE raw_data IS NULL
                    OR raw_data = ''
                    OR JSON_UNQUOTE(JSON_EXTRACT(raw_data, '$.ref')) IS NULL"
            )->fetchAll();

            $update = $pdo->prepare(
                "UPDATE fmc_complaints SET raw_data = ? WHERE id = ?"
            );
            $filled = 0;
            foreach ($rows as $r) {
                $stMap  = ['pending' => 'received', 'under_review' => 'review', 'closed' => 'closed'];
                $st     = $stMap[$r['status'] ?? 'pending'] ?? 'received';
                $record = [
                    'ref'          => $r['reference'],
                    'createdAt'    => $r['created_at'],
                    'status'       => $st,
                    'state'        => $st,
                    'stateHistory' => [['state' => $st, 'at' => $r['created_at'], 'by' => 'system']],
                    'officer'      => null,
                    'appointment'  => null,
                    'infoRequest'  => null,
                    'decision'     => null,
                    'messages'     => [],
                    'extraFiles'   => [],
                    'applicantUnread' => 0,
                    'complainant'  => [
                        'fullName' => $r['full_name']  ?? '',
                        'email'    => $r['email']      ?? '',
                        'phone'    => $r['phone']      ?? '',
                    ],
                    'case'         => [
                        'firm'            => $r['company_name']  ?? '',
                        'currency'        => $r['currency_lost'] ?? 'USD',
                        'amountDeposited' => (string)($r['amount_lost'] ?? ''),
                        'reason'          => $r['description']   ?? '',
                    ],
                    'evidence' => [],
                ];
                $update->execute([
                    json_encode($record, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                    $r['id'],
                ]);
                $filled++;
            }
            $done[] = "Backfilled raw_data for {$filled} complaint(s)";
        } else {
            $done[] = 'No raw_data backfill needed';
        }
    } catch (\Throwable $bfErr) {
        $done[] = 'Backfill skipped: ' . $bfErr->getMessage();
    }

    jsonOut(['ok' => true, 'applied' => $done]);
} catch (Exception $e) {
    error_log('MIGRATE ERROR: ' . $e->getMessage());
    jsonOut(['ok' => false, 'error' => $e->getMessage()], 500);
}
