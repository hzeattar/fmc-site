<?php
/*
 * Public endpoint — returns all companies from DB for complaint form dropdown.
 * No authentication required (public register).
 */
require_once __DIR__ . '/../inc/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonOut(['ok' => false, 'error' => 'Method not allowed'], 405);
}

try {
    $pdo  = DB::pdo();
    $stmt = $pdo->query("SELECT id, name, license_number, status, type, category, country, year_founded FROM fmc_companies ORDER BY name ASC");
    $rows = $stmt->fetchAll();

    $companies = array_map(function ($c) {
        $yr = $c['year_founded'] ?: 2010;
        return [
            'id'     => $c['license_number'] ?: ('FMC-' . $yr . '-' . str_pad((int)$c['id'], 4, '0', STR_PAD_LEFT)),
            'db_id'  => (int) $c['id'],
            'name'   => $c['name'],
            'short'  => strtoupper(implode('', array_slice(array_map(fn($w) => $w[0] ?? '', explode(' ', $c['name'])), 0, 4))),
            'status' => $c['status'] ?? 'active',
            'type'   => $c['type'] ?? $c['category'] ?? '',
            'country'=> $c['country'] ?? '',
            'since'  => (string) ($c['year_founded'] ?? ''),
        ];
    }, $rows);

    jsonOut(['ok' => true, 'companies' => $companies]);
} catch (PDOException $e) {
    error_log('COMPANIES GET: ' . $e->getMessage());
    jsonOut(['ok' => false, 'error' => 'Server error'], 500);
}
