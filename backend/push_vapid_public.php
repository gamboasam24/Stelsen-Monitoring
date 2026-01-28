<?php
// Allow CORS for development environments (dynamic origin if provided)
if (isset($_SERVER['HTTP_ORIGIN'])) {
  // echo back the requesting origin to allow credentials
  header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
  header('Access-Control-Allow-Credentials: true');
  header('Access-Control-Allow-Methods: GET, OPTIONS');
  header('Access-Control-Allow-Headers: Content-Type');
} else {
  header('Access-Control-Allow-Origin: *');
}

header('Content-Type: application/json');
require_once __DIR__ . '/vapid_keys.php';

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

$public = isset($VAPID_PUBLIC) ? $VAPID_PUBLIC : null;
if (!$public) {
  http_response_code(500);
  echo json_encode(['error' => 'VAPID public key not configured']);
  exit;
}

echo json_encode(['publicKey' => $public]);
