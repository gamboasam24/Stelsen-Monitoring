<?php
header('Content-Type: application/json');
$dir = __DIR__ . '/data';
$file = $dir . '/subscriptions.json';
if (!is_dir($dir)) mkdir($dir, 0755, true);
$existing = [];
if (file_exists($file)) {
  $raw = file_get_contents($file);
  $existing = json_decode($raw, true) ?: [];
}
echo json_encode(array_values($existing));
