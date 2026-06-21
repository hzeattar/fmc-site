<?php
require_once __DIR__ . '/../inc/db.php';

requireMethod('GET');

$id = sanitizeString($_GET['id'] ?? '', 16);
if (!$id) {
    jsonOut(['ok' => false, 'error' => 'Reference required'], 400);
}

try {
    $pdo = DB::pdo();
    $stmt = $pdo->prepare(
        "SELECT c.id, c.reference, c.full_name, c.email, c.phone, c.company_name,
                c.issue_type, c.category, c.description, c.status, c.priority,
                c.amount_lost, c.currency_lost, c.created_at, c.updated_at
         FROM fmc_complaints c WHERE c.reference = ? LIMIT 1"
    );
    $stmt->execute([$id]);
    $complaint = $stmt->fetch();

    if (!$complaint) {
        jsonOut(['ok' => false, 'error' => 'Complaint not found'], 404);
    }

    // Messages
    $msgs = $pdo->prepare("SELECT * FROM fmc_messages WHERE complaint_id = ? ORDER BY created_at ASC");
    $msgs->execute([$complaint['id']]);
    $messages = $msgs->fetchAll();

    // Payments
    $pays = $pdo->prepare("SELECT * FROM fmc_payments WHERE complaint_id = ? ORDER BY created_at DESC");
    $pays->execute([$complaint['id']]);
    $payments = $pays->fetchAll();

    jsonOut([
        'ok'      => true,
        'data'    => [
            'id'          => (int) $complaint['id'],
            'reference'   => $complaint['reference'],
            'full_name'   => $complaint['full_name'],
            'email'       => $complaint['email'],
            'phone'       => $complaint['phone'],
            'company_name'=> $complaint['company_name'],
            'issue_type'  => $complaint['issue_type'],
            'category'    => $complaint['category'],
            'description' => $complaint['description'],
            'status'      => $complaint['status'],
            'priority'    => $complaint['priority'],
            'amount_lost' => (float) $complaint['amount_lost'],
            'currency_lost'=> $complaint['currency_lost'],
            'created_at'  => $complaint['created_at'],
            'updated_at'  => $complaint['updated_at'],
        ],
        'messages'  => array_map(function($m) {
            return [
                'id' => (int) $m['id'],
                'type' => $m['sender_type'],
                'name' => $m['sender_name'],
                'content' => $m['content'],
                'created_at' => $m['created_at'],
            ];
        }, $messages),
        'payments' => array_map(function($p) {
            return [
                'method' => $p['method'],
                'amount' => (float) $p['amount'],
                'currency' => $p['currency'],
                'status' => $p['status'],
                'paid_at' => $p['paid_at'],
            ];
        }, $payments),
    ]);
} catch (PDOException $e) {
    error_log("TRACK ERROR: " . $e->getMessage());
    jsonOut(['ok' => false, 'error' => 'Server error'], 500);
}
