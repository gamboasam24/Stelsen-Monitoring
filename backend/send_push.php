<?php
header('Content-Type: application/json');
require_once __DIR__ . '/vapid_keys.php';

// Require composer autoload - ensure `composer install` has been run in backend/
$autoload = __DIR__ . '/vendor/autoload.php';
if (!file_exists($autoload)) {
  http_response_code(500);
  echo json_encode(['status' => 'error', 'message' => 'Dependencies not installed. Run composer install in backend/']);
  exit;
}
require_once $autoload;

use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;

$input = file_get_contents('php://input');
$payloadInput = $input ? json_decode($input, true) : null;

$payload = [
  'title' => $payloadInput['title'] ?? 'Stelsen',
  'body' => $payloadInput['body'] ?? 'You have a new notification',
  'icon' => $payloadInput['icon'] ?? '/img/stelsenlogo.png',
  'url'  => $payloadInput['url'] ?? '/',
  'tag'  => $payloadInput['tag'] ?? 'general'
];
$payloadJson = json_encode($payload);

$subsFile = __DIR__ . '/data/subscriptions.json';
if (!file_exists($subsFile)) {
  http_response_code(404);
  echo json_encode(['status' => 'error', 'message' => 'No subscriptions found']);
  exit;
}

$raw = file_get_contents($subsFile);
$subscriptions = json_decode($raw, true) ?: [];
if (empty($subscriptions)) {
  echo json_encode(['status' => 'ok', 'sent' => 0, 'results' => []]);
  exit;
}

$auth = [
  'VAPID' => [
    'subject' => $VAPID_SUBJECT ?? 'mailto:admin@example.com',
    'publicKey' => $VAPID_PUBLIC,
    'privateKey' => $VAPID_PRIVATE
  ]
];

$webPush = new WebPush($auth);
$results = [];

foreach ($subscriptions as $s) {
  try {
    // Ensure we have an array with endpoint and keys
    $sub = Subscription::create($s);
    $report = $webPush->sendOneNotification($sub, $payloadJson);
    $results[] = [
      'endpoint' => $s['endpoint'] ?? null,
      'success' => $report->isSuccess(),
      'statusCode' => $report->getStatusCode(),
      'reason' => $report->getReason()
    ];
  } catch (\Exception $e) {
    $results[] = [
      'endpoint' => $s['endpoint'] ?? null,
      'success' => false,
      'error' => $e->getMessage()
    ];
  }
}

// Flush any queued messages
$webPush->flush();

echo json_encode(['status' => 'ok', 'sent' => count($results), 'results' => $results]);
