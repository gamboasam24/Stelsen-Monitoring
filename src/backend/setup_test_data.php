<?php
header('Content-Type: application/json');
require_once 'db.php';

// 1. Check if progress comment exists
$check = $conn->query("
    SELECT COUNT(*) as count FROM project_comments 
    WHERE comment_type='progress' OR progress_percentage IS NOT NULL
");
$checkResult = $check->fetch_assoc();
$progressCount = $checkResult['count'];

// 2. If no progress comments, create one
if ($progressCount == 0) {
    $projectResult = $conn->query("SELECT id FROM projects LIMIT 1");
    $userResult = $conn->query("SELECT login_id FROM login LIMIT 1");
    
    if ($projectResult && $userResult) {
        $project = $projectResult->fetch_assoc();
        $user = $userResult->fetch_assoc();
        
        if ($project && $user) {
            $project_id = $project['id'];
            $user_id = $user['login_id'];
            
            // Create test image
            $test_image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
            
            $stmt = $conn->prepare("
                INSERT INTO project_comments 
                (project_id, user_id, comment, comment_type, progress_percentage, progress_status, 
                 evidence_photo, location_latitude, location_longitude, location_accuracy, approval_status, created_at)
                VALUES (?, ?, ?, 'progress', ?, ?, ?, ?, ?, ?, 'PENDING', NOW())
            ");
            
            $comment_text = 'TEST PROGRESS - Repair foundation walls';
            $progress_pct = 65;
            $progress_status = 'In Progress';
            $latitude = 14.5995;
            $longitude = 120.9842;
            $accuracy = 15.0;
            
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
                $insertId = $stmt->insert_id;
                
                // Verify it was inserted
                $verify = $conn->query("
                    SELECT comment_id, project_id, comment_type, progress_percentage, progress_status
                    FROM project_comments
                    WHERE comment_id = $insertId
                ");
                
                if ($verify) {
                    $verifyRow = $verify->fetch_assoc();
                    echo json_encode([
                        'status' => 'success',
                        'action' => 'created',
                        'message' => 'Test progress comment created successfully',
                        'data' => $verifyRow,
                        'project_id' => $project_id
                    ], JSON_PRETTY_PRINT);
                }
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Insert failed: ' . $stmt->error]);
            }
            
            $stmt->close();
        } else {
            echo json_encode(['status' => 'error', 'message' => 'No projects or users found']);
        }
    }
} else {
    // Progress comments exist, show them
    $result = $conn->query("
        SELECT 
            c.comment_id,
            c.project_id,
            c.comment_type,
            c.progress_percentage,
            c.progress_status,
            c.comment,
            c.created_at
        FROM project_comments c
        WHERE c.comment_type='progress' OR c.progress_percentage IS NOT NULL
        ORDER BY c.created_at DESC
        LIMIT 5
    ");
    
    $comments = $result->fetch_all(MYSQLI_ASSOC);
    
    echo json_encode([
        'status' => 'success',
        'action' => 'found_existing',
        'message' => 'Progress comments already exist',
        'total' => $progressCount,
        'samples' => $comments
    ], JSON_PRETTY_PRINT);
}
?>
