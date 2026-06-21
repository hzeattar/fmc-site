<?php
require_once __DIR__ . '/inc.php';
require_once __DIR__ . '/../inc/db.php';
require_once __DIR__ . '/../inc/mailer.php';
requireAdmin();

$pdo = DB::pdo();

// Stats
$stats = $pdo->query("SELECT
    COUNT(*) as total,
    SUM(status='pending') as pending,
    SUM(status='under_review') as under_review,
    SUM(status='resolved') as resolved,
    SUM(status='payment_required') as payment_required
FROM fmc_complaints")->fetch();

$recent = $pdo->query("SELECT id, reference, full_name, email, company_name, status, priority, created_at
    FROM fmc_complaints ORDER BY created_at DESC LIMIT 20")->fetchAll();

$companies = $pdo->query("SELECT id, name, status FROM fmc_companies ORDER BY name LIMIT 50")->fetchAll();

// Handle status update via POST
$flash = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && !empty($_POST['action'])) {
    if ($_POST['action'] === 'update_status' && !empty($_POST['id']) && !empty($_POST['status'])) {
        $id = (int)$_POST['id'];
        $status = in_array($_POST['status'], ['pending','under_review','resolved','closed','payment_required']) ? $_POST['status'] : 'pending';
        $pdo->prepare("UPDATE fmc_complaints SET status=?, updated_at=NOW() WHERE id=?")->execute([$status, $id]);
        // Send notification
        $c = $pdo->prepare("SELECT email, reference FROM fmc_complaints WHERE id=?");
        $c->execute([$id]);
        if ($row = $c->fetch()) {
            Mailer::statusUpdate($row['email'], $row['reference'], $status);
        }
        $flash = 'Status updated and email notification sent.';
    }
    if ($_POST['action'] === 'add_company' && !empty($_POST['name'])) {
        $pdo->prepare("INSERT INTO fmc_companies (name, license_number, status, category, type, country)
            VALUES (?, ?, 'active', ?, ?, ?)") ->execute([$_POST['name'], $_POST['license']??'', $_POST['category']??'', $_POST['type']??'', $_POST['country']??'']);
        $flash = 'Company added.';
    }
}

// Refresh data after action
if ($flash) {
    $stats = $pdo->query("SELECT COUNT(*) as total, SUM(status='pending') as pending, SUM(status='under_review') as under_review, SUM(status='resolved') as resolved, SUM(status='payment_required') as payment_required FROM fmc_complaints")->fetch();
    $recent = $pdo->query("SELECT id, reference, full_name, email, company_name, status, priority, created_at FROM fmc_complaints ORDER BY created_at DESC LIMIT 20")->fetchAll();
    $companies = $pdo->query("SELECT id, name, status FROM fmc_companies ORDER BY name LIMIT 50")->fetchAll();
}

?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>FMC Admin Dashboard</title>
<style>
*{box-sizing:border-box}body{margin:0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;background:#0b1121;color:#e2e8f0}
.topbar{background:#0f172a;border-bottom:1px solid #1e293b;padding:12px 24px;display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;z-index:10}
.topbar h1{margin:0;font-size:18px;color:#f8fafc}
.topbar a{color:#93c5fd;text-decoration:none;font-size:13px}
.container{max-width:1200px;margin:0 auto;padding:24px}
.flash{background:#064e3b;border:1px solid #059669;color:#6ee7b7;padding:10px 14px;border-radius:8px;margin-bottom:16px;font-size:13px}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:24px}
.card{background:#1e293b;border:1px solid #334155;border-radius:10px;padding:16px}
.card h3{margin:0 0 4px;font-size:13px;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8}
.card .num{font-size:28px;font-weight:700;color:#f8fafc}
.card.pending .num{color:#eab308}.card.under_review .num{color:#3b82f6}.card.resolved .num{color:#22c55e}
.section{background:#1e293b;border:1px solid #334155;border-radius:10px;padding:20px;margin-bottom:20px}
.section h2{margin:0 0 14px;font-size:16px;border-bottom:1px solid #334155;padding-bottom:8px}
table{width:100%;border-collapse:collapse;font-size:13px}
th{text-align:left;padding:8px 10px;background:#0f172a;color:#94a3b8;font-weight:600;text-transform:uppercase;font-size:11px;letter-spacing:.04em}
td{padding:8px 10px;border-top:1px solid #334155}
tr:hover td{background:#1f2937}
a{color:#60a5fa;text-decoration:none}select{padding:4px 8px;border-radius:4px;background:#0f172a;border:1px solid #334155;color:#e2e8f0;font-size:13px}
input[type="text"],input[type="email"]{padding:6px 10px;border-radius:4px;background:#0f172a;border:1px solid #334155;color:#e2e8f0;font-size:13px;width:100%}
button.btn{padding:6px 14px;border:none;border-radius:4px;background:#2563eb;color:#fff;font-size:12px;cursor:pointer}
button.btn:hover{background:#1d4ed8}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:20px}
@media (max-width:800px){.grid2{grid-template-columns:1fr}}
.status-pending{color:#eab308}.status-under_review{color:#3b82f6}.status-resolved{color:#22c55e}.status-closed{color:#94a3b8}.status-payment_required{color:#ef4444}
</style>
</head>
<body>
<div class="topbar">
  <h1>FMC Admin Dashboard</h1>
  <div>
    <span style="color:#94a3b8;font-size:13px"><?php echo htmlspecialchars($_SESSION['admin_name'] ?? 'Admin'); ?></span>
    <a href="/backend/logout.php" style="margin-left:18px">Logout</a>
  </div>
</div>
<div class="container">
<?php if ($flash): ?><div class="flash"><?php echo htmlspecialchars($flash); ?></div><?php endif; ?>

<div class="stats">
  <div class="card pending"><h3>Pending</h3><div class="num"><?php echo (int)($stats['pending'] ?? 0); ?></div></div>
  <div class="card under_review"><h3>Under Review</h3><div class="num"><?php echo (int)($stats['under_review'] ?? 0); ?></div></div>
  <div class="card resolved"><h3>Resolved</h3><div class="num"><?php echo (int)($stats['resolved'] ?? 0); ?></div></div>
  <div class="card"><h3>Total</h3><div class="num"><?php echo (int)($stats['total'] ?? 0); ?></div></div>
</div>

<div class="grid2">
<div class="section">
  <h2>Recent Complaints</h2>
  <div style="overflow-x:auto">
  <table>
    <thead><tr><th>Ref</th><th>Name</th><th>Company</th><th>Status</th><th>Action</th></tr></thead>
    <tbody>
    <?php foreach ($recent as $r): ?>
    <tr>
      <td><a href="/pages/track.html?id=<?php echo urlencode($r['reference']); ?>" target="_blank"><?php echo htmlspecialchars($r['reference']); ?></a></td>
      <td><?php echo htmlspecialchars($r['full_name']); ?></td>
      <td><?php echo htmlspecialchars($r['company_name'] ?? '-'); ?></td>
      <td class="status-<?php echo $r['status']; ?>"><?php echo str_replace('_',' ',$r['status']); ?></td>
      <td>
        <form method="POST" style="display:flex;gap:6px">
          <input type="hidden" name="action" value="update_status">
          <input type="hidden" name="id" value="<?php echo (int)$r['id']; ?>">
          <select name="status">
            <option value="pending" <?php echo $r['status']==='pending'?'selected':''; ?>>Pending</option>
            <option value="under_review" <?php echo $r['status']==='under_review'?'selected':''; ?>>Under Review</option>
            <option value="payment_required" <?php echo $r['status']==='payment_required'?'selected':''; ?>>Payment Required</option>
            <option value="resolved" <?php echo $r['status']==='resolved'?'selected':''; ?>>Resolved</option>
            <option value="closed" <?php echo $r['status']==='closed'?'selected':''; ?>>Closed</option>
          </select>
          <button class="btn">Update</button>
        </form>
      </td>
    </tr>
    <?php endforeach; ?>
    </tbody>
  </table>
  </div>
</div>

<div class="section">
  <h2>Companies</h2>
  <div style="overflow-x:auto">
  <table>
    <thead><tr><th>Name</th><th>Status</th></tr></thead>
    <tbody>
    <?php foreach ($companies as $c): ?>
    <tr><td><?php echo htmlspecialchars($c['name']); ?></td><td><?php echo htmlspecialchars($c['status']); ?></td></tr>
    <?php endforeach; ?>
    </tbody>
  </table>
  </div>
  <h3 style="margin-top:18px;font-size:13px;color:#94a3b8">Add Company</h3>
  <form method="POST" class="grid2" style="grid-template-columns:1fr;margin-top:8px">
    <input type="hidden" name="action" value="add_company">
    <input type="text" name="name" placeholder="Company name" required style="margin-bottom:8px">
    <div class="grid2"><input type="text" name="license" placeholder="License #"><input type="text" name="category" placeholder="Category"></div>
    <div class="grid2"><input type="text" name="type" placeholder="Type"><input type="text" name="country" placeholder="Country" style="margin-bottom:8px"></div>
    <button class="btn">Add Company</button>
  </form>
</div>
</div>

</div>
</body>
</html>
