<?php
header('Content-Type: application/json');
$input = file_get_contents('php://input');
if (!$input) {
  http_response_code(400);
  echo json_encode(['status' => 'error', 'message' => 'No input']);
  exit;
}
$data = json_decode($input, true);
if (!$data) {
  http_response_code(400);
  echo json_encode(['status' => 'error', 'message' => 'Invalid JSON']);
  exit;
}
$dir = __DIR__ . '/data';
if (!is_dir($dir)) mkdir($dir, 0755, true);
$file = $dir . '/subscriptions.json';
$existing = [];
if (file_exists($file)) {
  $raw = file_get_contents($file);
  $existing = json_decode($raw, true) ?: [];
}
// Simple dedupe by endpoint
$endpoint = $data['endpoint'] ?? null;
if ($endpoint) {
  $existing = array_filter($existing, function($s) use ($endpoint) {
    return ($s['endpoint'] ?? null) !== $endpoint;
  });
}
$existing[] = $data;
file_put_contents($file, json_encode(array_values($existing), JSON_PRETTY_PRINT));
echo json_encode(['status' => 'success']);
