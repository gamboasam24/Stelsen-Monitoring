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

$account_type = $_SESSION['account_type'] ?? 'user';
if ($account_type !== 'admin') {
    echo json_encode(['status' => 'error', 'message' => 'Admin only']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request']);
    exit;
}

// Ensure column exists
$colCheck = $conn->query("SHOW COLUMNS FROM announcements LIKE 'is_pinned'");
if ($colCheck && $colCheck->num_rows === 0) {
    $conn->query("ALTER TABLE announcements ADD COLUMN is_pinned TINYINT(1) NOT NULL DEFAULT 0");
}

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$announcement_id = isset($input['id']) ? (int)$input['id'] : 0;
$pinned = isset($input['pinned']) ? (int)!!$input['pinned'] : null;

if ($announcement_id <= 0 || $pinned === null) {
    echo json_encode(['status' => 'error', 'message' => 'Missing parameters']);
    exit;
}

$stmt = $conn->prepare("UPDATE announcements SET is_pinned = ? WHERE announcement_id = ?");
$stmt->bind_param('ii', $pinned, $announcement_id);
$stmt->execute();

echo json_encode(['status' => 'success', 'message' => 'Pin state updated', 'pinned' => $pinned]);
