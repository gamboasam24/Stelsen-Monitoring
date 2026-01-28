<?php
// Simple admin endpoint to test push notifications.
// POST JSON: { title, body, url, icon }
header('Content-Type: application/json');
$input = file_get_contents('php://input');
$data = $input ? json_decode($input, true) : [];

if (empty($data)) {
  // default test payload
  $data = [
    'title' => 'Test Notification',
    'body' => 'This is a test push from Stelsen',
    'url' => '/',
    'icon' => '/img/stelsenlogo.png'
  ];
}

// Proxy to send_push.php
$ch = curl_init();
$payload = json_encode($data);
curl_setopt($ch, CURLOPT_URL, dirname($_SERVER['REQUEST_SCHEME'] . '://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI']) . '/send_push.php');
// If the above produces a bad URL in some setups, fall back to local file include
$base = __DIR__;
$sendPushPath = $base . '/send_push.php';
if (file_exists($sendPushPath)) {
  // call internal script directly to avoid HTTP loop
  $response = include $sendPushPath;
  // send_push echoes JSON and exits; but include may not return; instead just forward request by invoking via CLI function
  // For simplicity, we'll call send_push.php via shell command with php
  $cmd = 'php ' . escapeshellarg($sendPushPath);
  $proc = proc_open($cmd, [ ['pipe','r'], ['pipe','w'], ['pipe','w'] ], $pipes);
  if (is_resource($proc)) {
    fwrite($pipes[0], $payload);
    fclose($pipes[0]);
    $output = stream_get_contents($pipes[1]);
    fclose($pipes[1]);
    $err = stream_get_contents($pipes[2]);
    fclose($pipes[2]);
    $exit = proc_close($proc);
    if ($exit === 0) {
      echo $output;
      exit;
    }
  }
}

// Last-resort: attempt POST to send_push.php via HTTP on same host
$host = ($_SERVER['HTTP_HOST'] ?? 'localhost');
$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$target = $protocol . '://' . $host . dirname($_SERVER['SCRIPT_NAME']) . '/send_push.php';
$ch = curl_init($target);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
$res = curl_exec($ch);
$err = curl_error($ch);
curl_close($ch);
if ($err) {
  http_response_code(500);
  echo json_encode(['status' => 'error', 'message' => $err]);
} else {
  echo $res;
}
