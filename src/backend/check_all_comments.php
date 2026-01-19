<?php
header('Content-Type: application/json');
require_once 'db.php';

// Check all project comments
$result = $conn->query("
    SELECT 
        comment_id,
        project_id,
        comment_type,
        progress_percentage,
        progress_status,
        created_at
    FROM project_comments
    ORDER BY created_at DESC
    LIMIT 20
");

if ($result) {
    $comments = $result->fetch_all(MYSQLI_ASSOC);
    echo json_encode([
        'status' => 'success',
        'total_comments' => count($comments),
        'comments' => $comments
    ], JSON_PRETTY_PRINT);
} else {
    echo json_encode(['status' => 'error', 'message' => $conn->error]);
}
?>
