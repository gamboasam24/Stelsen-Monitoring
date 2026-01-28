<?php
header('Content-Type: application/json');
$input = file_get_contents('php://input');
if (!$input) {
  http_response_code(400);
  echo json_encode(['status' => 'error', 'message' => 'No input']);
  exit;
}
$data = json_decode($input, true);
if (!$data || empty($data['endpoint'])) {
  http_response_code(400);
  echo json_encode(['status' => 'error', 'message' => 'Missing endpoint']);
  exit;
}
$endpoint = $data['endpoint'];
$dir = __DIR__ . '/data';
$file = $dir . '/subscriptions.json';
if (!is_dir($dir)) mkdir($dir, 0755, true);
$existing = [];
if (file_exists($file)) {
  $raw = file_get_contents($file);
  $existing = json_decode($raw, true) ?: [];
}
$filtered = array_values(array_filter($existing, function($s) use ($endpoint) {
  return ($s['endpoint'] ?? null) !== $endpoint;
}));
file_put_contents($file, json_encode($filtered, JSON_PRETTY_PRINT));
echo json_encode(['status' => 'success', 'removed' => count($existing) - count($filtered)]);
