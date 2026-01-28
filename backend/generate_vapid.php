<?php
// Simple generator for VAPID keys using minishlink/web-push library
// Usage: visit this script in your browser (e.g. http://localhost/stelsen_monitoring/backend/generate_vapid.php)
// It will generate a keypair and write them to vapid_keys.php (backup created).

header('Content-Type: application/json');
if (php_sapi_name() === 'cli') {
    echo "This script is intended to be run from a browser.\n";
}

require_once __DIR__ . '/vendor/autoload.php';
use Minishlink\WebPush\VAPID;

try {
    $keys = VAPID::createVapidKeys();
} catch (\Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to create VAPID keys', 'detail' => $e->getMessage()]);
    exit;
}

$public = $keys['publicKey'] ?? null;
$private = $keys['privateKey'] ?? null;

if (!$public || !$private) {
    http_response_code(500);
    echo json_encode(['error' => 'Key generation returned invalid keys']);
    exit;
}

$vapidFile = __DIR__ . '/vapid_keys.php';
$backup = __DIR__ . '/vapid_keys.php.bak.' . time();
if (is_writable(__DIR__)) {
    if (file_exists($vapidFile)) {
        copy($vapidFile, $backup);
    }

    $content = "<?php\n";
    $content .= "// Generated VAPID keys - keep them secret in production\n";
    $content .= "\$VAPID_PUBLIC = '" . $public . "';\n";
    $content .= "\$VAPID_PRIVATE = '" . $private . "';\n";
    $content .= "\$VAPID_SUBJECT = 'mailto:admin@example.com';\n";

    $written = @file_put_contents($vapidFile, $content);
    if ($written === false) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to write vapid_keys.php — check file permissions', 'publicKey' => $public, 'privateKey' => $private]);
        exit;
    }

    echo json_encode(['success' => true, 'publicKey' => $public, 'privateKey' => $private, 'backup' => basename($backup)]);
    exit;
} else {
    // Can't write file — just print keys for manual copy
    echo json_encode(['success' => true, 'publicKey' => $public, 'privateKey' => $private, 'note' => 'Cannot write to backend folder — copy keys into vapid_keys.php manually.']);
    exit;
}
