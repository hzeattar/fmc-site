<?php
/*
 * Admin-only companies CRUD (GET / POST / DELETE).
 * - GET    → list all companies from DB
 * - POST   → create or update a company (pass db_id to update)
 * - DELETE → delete a company by db_id
 */
require_once __DIR__ . '/../inc/db.php';
require_once __DIR__ . '/../inc/session_db.php';
startAdminSession();

if (!isset($_SESSION['admin_id'])) {
    jsonOut(['ok' => false, 'error' => 'Unauthorized'], 401);
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    $pdo = DB::pdo();

    /* ── GET — list ── */
    if ($method === 'GET') {
        $stmt = $pdo->query(
            "SELECT id, name, license_number, status, type, category, country, year_founded, website, description
             FROM fmc_companies ORDER BY name ASC LIMIT 2000"
        );
        $rows = $stmt->fetchAll();
        $companies = array_map(function ($c) {
            $yr = (int)($c['year_founded'] ?: 2010);
            return [
                'id'             => $c['license_number'] ?: ('FMC-' . $yr . '-' . str_pad((int)$c['id'], 4, '0', STR_PAD_LEFT)),
                'db_id'          => (int) $c['id'],
                'name'           => $c['name'],
                'short'          => strtoupper(implode('', array_slice(array_map(fn($w) => $w[0] ?? '', explode(' ', $c['name'])), 0, 4))),
                'type'           => $c['type'] ?? $c['category'] ?? '',
                'status'         => $c['status'] ?? 'active',
                'country'        => $c['country'] ?? '',
                'since'          => (string) $yr,
                'website'        => $c['website'] ?? '',
                'summary'        => $c['description'] ?? '',
                'complaints'     => 0,
                'license_number' => $c['license_number'] ?? '',
            ];
        }, $rows);
        jsonOut(['ok' => true, 'companies' => $companies]);
    }

    /* ── POST — create / update ── */
    if ($method === 'POST') {
        $d    = getJsonBody();
        $name = trim($d['name'] ?? '');
        if (!$name) jsonOut(['ok' => false, 'error' => 'Name is required'], 422);

        $license  = sanitizeString($d['license_number'] ?? $d['id'] ?? '', 100);
        $status   = in_array($d['status'] ?? 'active', ['active', 'frozen', 'suspended', 'pending'])
                    ? ($d['status'] ?? 'active') : 'active';
        $type     = sanitizeString($d['type'] ?? '', 100);
        $country  = sanitizeString($d['country'] ?? '', 100);
        $since    = (int) ($d['since'] ?? date('Y'));
        $website  = sanitizeString($d['website'] ?? '', 500);
        $summary  = sanitizeString($d['summary'] ?? '', 1000);
        $dbId     = (int) ($d['db_id'] ?? 0);

        if ($dbId) {
            $pdo->prepare(
                "UPDATE fmc_companies
                 SET name=?, license_number=?, status=?, type=?, country=?, year_founded=?, website=?, description=?
                 WHERE id=?"
            )->execute([$name, $license, $status, $type, $country, $since, $website, $summary, $dbId]);
            jsonOut(['ok' => true, 'db_id' => $dbId, 'action' => 'updated']);
        } else {
            $stmt = $pdo->prepare(
                "INSERT INTO fmc_companies (name, license_number, status, type, country, year_founded, website, description)
                 VALUES (?,?,?,?,?,?,?,?)"
            );
            $stmt->execute([$name, $license, $status, $type, $country, $since, $website, $summary]);
            $newId = (int) $pdo->lastInsertId();
            jsonOut(['ok' => true, 'db_id' => $newId, 'action' => 'created']);
        }
    }

    /* ── DELETE — remove ── */
    if ($method === 'DELETE') {
        $d    = getJsonBody();
        $dbId = (int) ($d['db_id'] ?? 0);
        if (!$dbId) jsonOut(['ok' => false, 'error' => 'db_id required'], 400);
        $pdo->prepare("DELETE FROM fmc_companies WHERE id = ?")->execute([$dbId]);
        jsonOut(['ok' => true]);
    }

    jsonOut(['ok' => false, 'error' => 'Method not allowed'], 405);

} catch (PDOException $e) {
    error_log('COMPANIES API ERROR: ' . $e->getMessage());
    /* Return the real DB error message to help diagnose column/schema issues */
    jsonOut(['ok' => false, 'error' => 'Database error: ' . $e->getMessage()], 500);
}
