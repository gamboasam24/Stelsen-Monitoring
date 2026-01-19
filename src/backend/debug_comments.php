<?php
require_once 'db.php';

// Get all progress comments
$result = $conn->query("
    SELECT 
        comment_id, 
        project_id, 
        comment_type, 
        progress_percentage, 
        progress_status,
        comment
    FROM project_comments 
    WHERE comment_type='progress' OR progress_percentage IS NOT NULL
    LIMIT 10
");

if ($result) {
    $comments = $result->fetch_all(MYSQLI_ASSOC);
    echo json_encode([
        'status' => 'success',
        'total_progress_comments' => count($comments),
        'comments' => $comments
    ], JSON_PRETTY_PRINT);
} else {
    echo json_encode(['status' => 'error', 'message' => $conn->error]);
}
?>
