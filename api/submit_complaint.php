<?php
require_once __DIR__ . '/../inc/db.php';
require_once __DIR__ . '/../inc/mailer.php';

requireMethod('POST');
$data = getJsonBody();

/* Clean value for raw_data (no HTML encoding — JS esc() handles display) */
function cln($v, $max = 0) {
    $v = trim((string) $v);
    if ($max > 0 && mb_strlen($v, 'UTF-8') > $max) $v = mb_substr($v, 0, $max, 'UTF-8');
    return $v;
}

/* ── Full JS wizard format (has 'complainant' key) ── */
if (isset($data['complainant']) && is_array($data['complainant'])) {
    $c  = (array) ($data['complainant'] ?? []);
    $k  = (array) ($data['case']        ?? []);
    $ev = (array) ($data['evidence']    ?? []);

    $email = filter_var(trim($c['email'] ?? ''), FILTER_SANITIZE_EMAIL);
    if (empty($c['fullName'])) {
        jsonOut(['ok' => false, 'error' => 'Full name is required'], 422);
    }
    if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        jsonOut(['ok' => false, 'error' => 'Invalid email address'], 422);
    }

    $nowIso = gmdate('c');
    $ref    = 'FMC-CMP-' . strtoupper(bin2hex(random_bytes(3)));

    $record = [
        'ref'             => $ref,
        'createdAt'       => $nowIso,
        'status'          => 'received',
        'state'           => 'received',
        'stateHistory'    => [['state' => 'received', 'at' => $nowIso, 'by' => 'system']],
        'officer'         => null,
        'appointment'     => null,
        'infoRequest'     => null,
        'decision'        => null,
        'messages'        => [],
        'extraFiles'      => [],
        'applicantUnread' => 0,
        'complainant'     => [
            'fullName'    => cln($c['fullName']    ?? '', 255),
            'nationality' => cln($c['nationality'] ?? '', 100),
            'dob'         => cln($c['dob']         ?? '', 20),
            'email'       => $email,
            'phone'       => cln($c['phone']       ?? '', 50),
            'residence'   => cln($c['residence']   ?? '', 100),
            'address'     => cln($c['address']     ?? '', 500),
        ],
        'case'            => [
            'firm'            => cln($k['firm']            ?? '', 255),
            'currency'        => cln($k['currency']        ?? 'USD', 10),
            'amountDeposited' => cln($k['amountDeposited'] ?? '', 50),
            'lastBalance'     => cln($k['lastBalance']     ?? '', 50),
            'lastContact'     => cln($k['lastContact']     ?? '', 100),
            'reason'          => cln($k['reason']          ?? '', 5000),
        ],
        'evidence'        => [
            'idType'   => cln($ev['idType']   ?? '', 50),
            'idDoc'    => cln($ev['idDoc']    ?? '', 255),
            'transfer' => cln($ev['transfer'] ?? '', 255),
            'platform' => cln($ev['platform'] ?? '', 255),
        ],
    ];

    $rawJson  = json_encode($record, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $amtFloat = (float) preg_replace('/[^0-9.]/', '', $record['case']['amountDeposited'] ?: '0');

    try {
        $pdo  = DB::pdo();
        /* Try with raw_data first, fall back without it if column missing */
        try {
            $stmt = $pdo->prepare(
                "INSERT INTO fmc_complaints
                 (reference, full_name, email, phone, company_name, description,
                  amount_lost, currency_lost, status, raw_data)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)"
            );
            $stmt->execute([
                $ref,
                $record['complainant']['fullName'],
                $record['complainant']['email'],
                $record['complainant']['phone'],
                $record['case']['firm'],
                $record['case']['reason'],
                $amtFloat,
                $record['case']['currency'],
                $rawJson,
            ]);
        } catch (PDOException $e2) {
            /* raw_data column not yet added — insert without it */
            if (strpos($e2->getMessage(), 'Unknown column') !== false || strpos($e2->getMessage(), 'raw_data') !== false) {
                $stmt = $pdo->prepare(
                    "INSERT INTO fmc_complaints
                     (reference, full_name, email, phone, company_name, description,
                      amount_lost, currency_lost, status)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')"
                );
                $stmt->execute([
                    $ref,
                    $record['complainant']['fullName'],
                    $record['complainant']['email'],
                    $record['complainant']['phone'],
                    $record['case']['firm'],
                    $record['case']['reason'],
                    $amtFloat,
                    $record['case']['currency'],
                ]);
            } else {
                throw $e2;
            }
        }

        try { Mailer::complaintConfirmation($email, $ref, $record['complainant']['fullName']); }
        catch (\Throwable $e) { error_log('MAIL: ' . $e->getMessage()); }
        try { Mailer::staffNotification($ref); }
        catch (\Throwable $e) { error_log('MAIL: ' . $e->getMessage()); }

        jsonOut(['ok' => true, 'ref' => $ref, 'reference' => $ref]);
    } catch (PDOException $e) {
        error_log('COMPLAINT ERROR: ' . $e->getMessage());
        jsonOut(['ok' => false, 'error' => 'Failed to save complaint'], 500);
    }
}

/* ── Legacy flat format ── */
if (empty($data['full_name']) || empty($data['email']) || empty($data['description'])) {
    jsonOut(['ok' => false, 'error' => 'Full name, email, and description are required'], 422);
}
$ref         = generateRef();
$fullName    = sanitizeString($data['full_name'], 255);
$email       = filter_var(trim($data['email']), FILTER_SANITIZE_EMAIL);
$phone       = sanitizeString($data['phone'] ?? '', 50);
$companyId   = !empty($data['company_id']) ? (int) $data['company_id'] : null;
$companyName = sanitizeString($data['company'] ?? '', 255);
$desc        = sanitizeString($data['description'], 5000);
$amount      = !empty($data['amount']) ? (float) $data['amount'] : 0;
$currency    = sanitizeString($data['currency'] ?? 'USD', 10);

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonOut(['ok' => false, 'error' => 'Invalid email address'], 422);
}
try {
    $pdo  = DB::pdo();
    $stmt = $pdo->prepare(
        "INSERT INTO fmc_complaints (reference, full_name, email, phone, company_id,
         company_name, description, amount_lost, currency_lost)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    $stmt->execute([$ref, $fullName, $email, $phone, $companyId, $companyName, $desc, $amount, $currency]);
    try { Mailer::complaintConfirmation($email, $ref, $fullName); } catch (\Throwable $e) {}
    try { Mailer::staffNotification($ref); } catch (\Throwable $e) {}
    jsonOut(['ok' => true, 'reference' => $ref, 'ref' => $ref]);
} catch (PDOException $e) {
    error_log('COMPLAINT ERROR: ' . $e->getMessage());
    jsonOut(['ok' => false, 'error' => 'Failed to save complaint'], 500);
}
