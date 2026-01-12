<?php
$tempDir = sys_get_temp_dir() . '/php_sessions';
if (!is_dir($tempDir)) mkdir($tempDir, 0777, true);
session_save_path($tempDir);
session_start();
header('Content-Type: application/json');
require_once 'db.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

$user_id = $_SESSION['user_id'];

$input = json_decode(file_get_contents('php://input'), true);
$announcement_id = $input['announcement_id'] ?? null;

if (!$announcement_id) {
    echo json_encode(['status' => 'error', 'message' => 'Missing announcement ID']);
    exit;
}

$stmt = $conn->prepare("
    INSERT IGNORE INTO announcement_reads (announcement_id, user_id)
    VALUES (?, ?)
");

$stmt->bind_param("ii", $announcement_id, $user_id);
$stmt->execute();

echo json_encode([
    'status' => 'success',
    'message' => 'Marked as read'
]);
