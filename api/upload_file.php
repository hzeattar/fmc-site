<?php
/*
 * File upload endpoint — no auth required (used by complaint form + track page).
 * POST multipart/form-data with:
 *   file        = the file
 *   context     = 'evidence' | 'extra'   (optional, default: evidence)
 *   reference   = complaint reference    (optional, used for naming)
 *
 * Returns: { ok: true, url: "/uploads/xxxxxx.jpg", name: "original.jpg" }
 */
require_once __DIR__ . '/../inc/db.php';

requireMethod('POST');

/* ── Config ── */
$UPLOAD_DIR  = '/app/uploads/';
$MAX_SIZE    = 10 * 1024 * 1024;   /* 10 MB */
$ALLOWED     = ['image/jpeg','image/png','image/gif','image/webp','application/pdf'];
$ALLOWED_EXT = ['jpg','jpeg','png','gif','webp','pdf'];

/* ── Ensure uploads directory exists and is writable ── */
if (!is_dir($UPLOAD_DIR)) {
    if (!mkdir($UPLOAD_DIR, 0755, true)) {
        jsonOut(['ok' => false, 'error' => 'Cannot create uploads directory'], 500);
    }
}

/* ── Validate file ── */
if (empty($_FILES['file'])) {
    jsonOut(['ok' => false, 'error' => 'No file provided'], 400);
}
$f    = $_FILES['file'];
$err  = $f['error'] ?? UPLOAD_ERR_NO_FILE;
if ($err !== UPLOAD_ERR_OK) {
    $errMap = [
        UPLOAD_ERR_INI_SIZE   => 'File exceeds server limit',
        UPLOAD_ERR_FORM_SIZE  => 'File exceeds form limit',
        UPLOAD_ERR_PARTIAL    => 'File was only partially uploaded',
        UPLOAD_ERR_NO_FILE    => 'No file uploaded',
        UPLOAD_ERR_NO_TMP_DIR => 'Missing temp folder',
        UPLOAD_ERR_CANT_WRITE => 'Failed to write file',
    ];
    jsonOut(['ok' => false, 'error' => $errMap[$err] ?? 'Upload error ' . $err], 400);
}
if ($f['size'] > $MAX_SIZE) {
    jsonOut(['ok' => false, 'error' => 'File too large (max 10 MB)'], 413);
}

/* Validate MIME via finfo */
$finfo    = finfo_open(FILEINFO_MIME_TYPE);
$mime     = finfo_file($finfo, $f['tmp_name']);
finfo_close($finfo);
if (!in_array($mime, $ALLOWED)) {
    jsonOut(['ok' => false, 'error' => 'File type not allowed (' . $mime . '). Only images and PDFs.'], 415);
}

/* Validate extension */
$origName = $f['name'];
$ext      = strtolower(pathinfo($origName, PATHINFO_EXTENSION));
if (!in_array($ext, $ALLOWED_EXT)) {
    jsonOut(['ok' => false, 'error' => 'Extension not allowed'], 415);
}

/* ── Generate unique filename ── */
$uniqueName = bin2hex(random_bytes(16)) . '.' . $ext;
$dest       = $UPLOAD_DIR . $uniqueName;

if (!move_uploaded_file($f['tmp_name'], $dest)) {
    jsonOut(['ok' => false, 'error' => 'Failed to save file'], 500);
}

jsonOut([
    'ok'   => true,
    'url'  => '/uploads/' . $uniqueName,
    'name' => $origName,
]);
