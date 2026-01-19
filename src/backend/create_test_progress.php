<?php
session_start();
header('Content-Type: application/json');
require_once 'db.php';

// Get the first project and first user for testing
$projectResult = $conn->query("SELECT id FROM projects LIMIT 1");
$userResult = $conn->query("SELECT login_id FROM login WHERE account_type='user' LIMIT 1");

if (!$projectResult || !$userResult) {
    echo json_encode(['status' => 'error', 'message' => 'Could not fetch project or user']);
    exit;
}

$project = $projectResult->fetch_assoc();
$user = $userResult->fetch_assoc();

if (!$project || !$user) {
    echo json_encode(['status' => 'error', 'message' => 'No project or user found']);
    exit;
}

$project_id = $project['id'];
$user_id = $user['login_id'];

// Create a simple test image (1x1 pixel PNG in base64)
$test_image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// Insert test progress comment
$stmt = $conn->prepare("
    INSERT INTO project_comments 
    (project_id, user_id, comment, comment_type, progress_percentage, progress_status, 
     evidence_photo, location_latitude, location_longitude, location_accuracy, approval_status, created_at)
    VALUES (?, ?, ?, 'progress', ?, ?, ?, ?, ?, ?, 'PENDING', NOW())
");

$comment_text = 'Test progress update - This is a sample progress card!';
$progress_pct = 45;
$progress_status = 'In Progress';
$latitude = 14.5995;
$longitude = 120.9842;
$accuracy = 25.5;

$stmt->bind_param(
    "iisisddd",
    $project_id,
    $user_id,
    $comment_text,
    $progress_pct,
    $progress_status,
    $test_image,
    $latitude,
    $longitude,
    $accuracy
);

if ($stmt->execute()) {
    echo json_encode([
        'status' => 'success',
        'message' => 'Test progress comment created!',
        'project_id' => $project_id,
        'comment_id' => $stmt->insert_id
    ]);
} else {
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to insert: ' . $stmt->error
    ]);
}

$stmt->close();
?>
