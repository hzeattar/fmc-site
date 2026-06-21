<?php
// FMC Main Entry — proxy to index.html while keeping PHP active for API/backend
if (file_exists(__DIR__ . '/index.html')) {
    readfile(__DIR__ . '/index.html');
} else {
    http_response_code(404);
    echo '<h1>FMC Site</h1><p>Main page missing.</p>';
}
