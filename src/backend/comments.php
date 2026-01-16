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
$account_type = $_SESSION['account_type'] ?? 'user';

/* =========================
   📥 GET COMMENTS
   ========================= */
if ($_SERVER['REQUEST_METHOD'] === 'GET') {

    $announcement_id = $_GET['announcement_id'] ?? null;
    $project_id = $_GET['project_id'] ?? null;

    // Handle announcement comments
    if ($announcement_id) {
        $stmt = $conn->prepare("
            SELECT 
                c.comment_id,
                c.comment,
                c.created_at,
                l.email,
                l.profile_image
            FROM announcement_comments c
            JOIN login l ON c.user_id = l.login_id
            WHERE c.announcement_id = ?
            ORDER BY c.created_at ASC
        ");

        $stmt->bind_param("i", $announcement_id);
        $stmt->execute();
        $result = $stmt->get_result();

        $comments = [];
        while ($row = $result->fetch_assoc()) {
            $comments[] = $row;
        }

        echo json_encode([
            'status' => 'success',
            'comments' => $comments
        ]);
        exit;
    }

    // Handle project comments
    if ($project_id) {
        $stmt = $conn->prepare("
            SELECT 
                c.comment_id,
                c.comment,
                c.attachments,
                c.progress_percentage,
                c.progress_status,
                c.evidence_photo,
                c.location_latitude,
                c.location_longitude,
                c.location_accuracy,
                c.comment_type,
                c.progress_id,
                c.approval_status,
                c.created_at,
                l.email,
                l.profile_image,
                l.account_type
            FROM project_comments c
            JOIN login l ON c.user_id = l.login_id
            WHERE c.project_id = ?
            ORDER BY c.created_at ASC
        ");

        $stmt->bind_param("i", $project_id);
        $stmt->execute();
        $result = $stmt->get_result();

        $comments = [];
        while ($row = $result->fetch_assoc()) {
            $attachments = null;
            if ($row['attachments']) {
                $attachments = json_decode($row['attachments'], true);
            }
            
            $comment_data = [
                'comment_id' => $row['comment_id'],
                'comment' => $row['comment'],
                'attachments' => $attachments,
                'comment_type' => $row['comment_type'],
                'created_at' => $row['created_at'],
                'email' => $row['email'],
                'profile_image' => $row['profile_image'],
                'user' => $row['account_type'] === 'admin' ? 'Admin' : explode('@', $row['email'])[0],
                'progress_id' => $row['progress_id'],
                'approval_status' => $row['approval_status']
            ];

            // Add progress fields if this is a progress comment
            if ($row['comment_type'] === 'progress') {
                $comment_data['progress'] = [
                    'percentage' => (int)$row['progress_percentage'],
                    'status' => $row['progress_status'],
                    'photo' => $row['evidence_photo'],  // Base64 image data
                    'location' => [
                        'latitude' => (float)$row['location_latitude'],
                        'longitude' => (float)$row['location_longitude'],
                        'accuracy' => (float)$row['location_accuracy']
                    ]
                ];
            }

            $comments[] = $comment_data;
        }

        echo json_encode([
            'status' => 'success',
            'comments' => $comments
        ]);
        exit;
    }

    echo json_encode(['status' => 'error', 'message' => 'Missing announcement_id or project_id']);
    exit;
}

/* =========================
   💬 POST COMMENT
   ========================= */
if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    $project_id = $_POST['project_id'] ?? null;
    $announcement_id = $_POST['announcement_id'] ?? null;
    $comment_text = trim($_POST['text'] ?? $_POST['comment'] ?? '');
    
    // Handle PROJECT comments
    if ($project_id) {
        if (!$comment_text && empty($_FILES['attachments'])) {
            echo json_encode(['status' => 'error', 'message' => 'Comment text or attachments required']);
            exit;
        }

        // Handle file uploads
        $attachment_paths = [];
        if (!empty($_FILES['attachments'])) {
            $uploads_dir = __DIR__ . '/uploads/comments/';
            
            // Create directory if it doesn't exist
            if (!is_dir($uploads_dir)) {
                mkdir($uploads_dir, 0755, true);
            }

            foreach ($_FILES['attachments']['name'] as $key => $filename) {
                if ($_FILES['attachments']['error'][$key] === UPLOAD_ERR_OK) {
                    $tmp_name = $_FILES['attachments']['tmp_name'][$key];
                    $file_ext = pathinfo($filename, PATHINFO_EXTENSION);
                    $unique_filename = uniqid() . '_' . sanitize_filename($filename);
                    $file_path = $uploads_dir . $unique_filename;

                    if (move_uploaded_file($tmp_name, $file_path)) {
                        $attachment_paths[] = [
                            'name' => $filename,
                            'path' => '/backend/uploads/comments/' . $unique_filename,
                            'size' => $_FILES['attachments']['size'][$key],
                            'type' => $_FILES['attachments']['type'][$key]
                        ];
                    }
                }
            }
        }

        // Insert comment with file paths
        $stmt = $conn->prepare("
            INSERT INTO project_comments (project_id, user_id, comment, attachments, created_at)
            VALUES (?, ?, ?, ?, NOW())
        ");

        $attachments_json = !empty($attachment_paths) ? json_encode($attachment_paths) : null;
        $stmt->bind_param("iiss", $project_id, $user_id, $comment_text, $attachments_json);
        $stmt->execute();
        $comment_id = $stmt->insert_id;

        // Get user info
        $userStmt = $conn->prepare("SELECT email, profile_image, account_type FROM login WHERE login_id = ?");
        $userStmt->bind_param("i", $user_id);
        $userStmt->execute();
        $userResult = $userStmt->get_result();
        $userData = $userResult->fetch_assoc();

        echo json_encode([
            'status' => 'success',
            'message' => 'Comment added',
            'comment_id' => $comment_id,
            'email' => $userData['email'],
            'profile_image' => $userData['profile_image'],
            'user' => $userData['account_type'] === 'admin' ? 'Admin' : explode('@', $userData['email'])[0],
            'attachments' => $attachment_paths
        ]);
        exit;
    }

    // Handle ANNOUNCEMENT comments
    if ($announcement_id && $comment_text) {
        $stmt = $conn->prepare("
            INSERT INTO announcement_comments (announcement_id, user_id, comment)
            VALUES (?, ?, ?)
        ");

        $stmt->bind_param("iis", $announcement_id, $user_id, $comment_text);
        $stmt->execute();

        echo json_encode([
            'status' => 'success',
            'message' => 'Comment added'
        ]);
        exit;
    }

    echo json_encode(['status' => 'error', 'message' => 'Invalid input - missing project_id or announcement_id']);
    exit;
}

// Helper function to sanitize filename
function sanitize_filename($filename) {
    $filename = preg_replace('/[^a-zA-Z0-9._-]/', '_', $filename);
    return trim($filename, '._-');
}

echo json_encode(['status' => 'error', 'message' => 'Invalid request']);
