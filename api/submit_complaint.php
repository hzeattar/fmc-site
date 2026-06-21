<?php
require_once __DIR__ . '/../inc/db.php';
require_once __DIR__ . '/../inc/mailer.php';

requireMethod('POST');
$data = getJsonBody();

// Validate required fields
if (empty($data['full_name']) || empty($data['email']) || empty($data['description'])) {
    jsonOut(['ok' => false, 'error' => 'Full name, email, and description are required'], 422);
}

$ref       = generateRef();
$fullName  = sanitizeString($data['full_name'], 255);
$email     = filter_var(trim($data['email']), FILTER_SANITIZE_EMAIL);
$phone     = sanitizeString($data['phone'] ?? '', 50);
$companyId = !empty($data['company_id']) ? (int) $data['company_id'] : null;
$companyName = sanitizeString($data['company'] ?? '', 255);
$issueType = sanitizeString($data['issue_type'] ?? '', 100);
$category  = sanitizeString($data['category'] ?? '', 100);
$amount    = !empty($data['amount']) ? (float) $data['amount'] : 0;
$currency  = sanitizeString($data['currency'] ?? 'USD', 10);
$desc      = sanitizeString($data['description'], 5000);
$attachments = !empty($data['attachments']) && is_array($data['attachments']) ? json_encode($data['attachments']) : '[]';

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonOut(['ok' => false, 'error' => 'Invalid email address'], 422);
}

try {
    $pdo = DB::pdo();

    $stmt = $pdo->prepare(
        "INSERT INTO fmc_complaints (reference, full_name, email, phone, company_id,
         company_name, issue_type, category, description, amount_lost, currency_lost, attachments)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    $stmt->execute([
        $ref, $fullName, $email, $phone, $companyId, $companyName,
        $issueType, $category, $desc, $amount, $currency, $attachments
    ]);
    $id = (int) $pdo->lastInsertId();

    // Get company name if company_id provided
    $companyNameDb = $companyName;
    if ($companyId) {
        $c = $pdo->prepare("SELECT name FROM fmc_companies WHERE id = ?");
        $c->execute([$companyId]);
        if ($row = $c->fetch()) $companyNameDb = $row['name'];
    }

    // Send confirmation email
    Mailer::complaintConfirmation($email, $ref, $fullName);
    // Notify staff
    Mailer::staffNotification($ref);

    jsonOut([
        'ok'          => true,
        'reference'   => $ref,
        'id'          => $id,
        'company'     => $companyNameDb,
        'message'     => 'Complaint submitted successfully. Check your email for confirmation.'
    ]);
} catch (PDOException $e) {
    error_log("COMPLAINT ERROR: " . $e->getMessage());
    jsonOut(['ok' => false, 'error' => 'Failed to save complaint'], 500);
}
