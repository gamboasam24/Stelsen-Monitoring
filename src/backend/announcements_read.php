<?php
$tempDir = sys_get_temp_dir() . '/php_sessions';
if (!is_dir($tempDir)) mkdir($tempDir, 0777, true);
session_save_path($tempDir);
session_start();
header('Content-Type: application/json');
require_once 'db.php';

// Auth check
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

$user_id = (int)$_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request']);
    exit;
}

// Ensure table exists
$conn->query("CREATE TABLE IF NOT EXISTS announcement_reads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    announcement_id INT NOT NULL,
    user_id INT NOT NULL,
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_read (announcement_id, user_id)
)");

$input = json_decode(file_get_contents('php://input'), true) ?? [];

// Mark ALL as read for this user
if (!empty($input['all'])) {
    $stmt = $conn->prepare("INSERT IGNORE INTO announcement_reads (announcement_id, user_id)
        SELECT a.announcement_id, ? FROM announcements a WHERE a.is_active = 1");
    $stmt->bind_param('i', $user_id);
    $stmt->execute();
    echo json_encode(['status' => 'success', 'message' => 'All announcements marked as read']);
    exit;
}

// Mark a single announcement as read
$announcement_id = isset($input['id']) ? (int)$input['id'] : 0;
if ($announcement_id <= 0) {
    echo json_encode(['status' => 'error', 'message' => 'Missing announcement ID']);
    exit;
}

$stmt = $conn->prepare("INSERT IGNORE INTO announcement_reads (announcement_id, user_id) VALUES (?, ?)");
$stmt->bind_param('ii', $announcement_id, $user_id);
$stmt->execute();

echo json_encode(['status' => 'success', 'message' => 'Marked as read']);
