<?php
session_start();
header('Content-Type: application/json');
require_once 'db.php';

if (!isset($_SESSION['user_id'])) {
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
            $comments[] = [
                'comment_id' => $row['comment_id'],
                'comment' => $row['comment'],
                'created_at' => $row['created_at'],
                'email' => $row['email'],
                'profile_image' => $row['profile_image'],
                'user' => $row['account_type'] === 'admin' ? 'Admin' : explode('@', $row['email'])[0]
            ];
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

    $input = json_decode(file_get_contents('php://input'), true);

    $announcement_id = $input['announcement_id'] ?? null;
    $project_id = $input['project_id'] ?? null;
    $comment = trim($input['text'] ?? $input['comment'] ?? '');

    if (!$comment) {
        echo json_encode(['status' => 'error', 'message' => 'Comment text required']);
        exit;
    }

    // Handle announcement comment
    if ($announcement_id) {
        $stmt = $conn->prepare("
            INSERT INTO announcement_comments (announcement_id, user_id, comment)
            VALUES (?, ?, ?)
        ");

        $stmt->bind_param("iis", $announcement_id, $user_id, $comment);
        
        if ($stmt->execute()) {
            $comment_id = $conn->insert_id;
            
            // Fetch user details for response
            $userStmt = $conn->prepare("SELECT email, profile_image, account_type FROM login WHERE login_id = ?");
            $userStmt->bind_param("i", $user_id);
            $userStmt->execute();
            $userData = $userStmt->get_result()->fetch_assoc();
            
            echo json_encode([
                'status' => 'success',
                'message' => 'Comment added',
                'comment_id' => $comment_id,
                'user' => $userData['account_type'] === 'admin' ? 'Admin' : explode('@', $userData['email'])[0],
                'profile_image' => $userData['profile_image']
            ]);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to add comment']);
        }
        exit;
    }

    // Handle project comment
    if ($project_id) {
        $stmt = $conn->prepare("
            INSERT INTO project_comments (project_id, user_id, comment)
            VALUES (?, ?, ?)
        ");

        $stmt->bind_param("iis", $project_id, $user_id, $comment);
        
        if ($stmt->execute()) {
            $comment_id = $conn->insert_id;
            
            // Fetch user details for response
            $userStmt = $conn->prepare("SELECT email, profile_image, account_type FROM login WHERE login_id = ?");
            $userStmt->bind_param("i", $user_id);
            $userStmt->execute();
            $userData = $userStmt->get_result()->fetch_assoc();
            
            echo json_encode([
                'status' => 'success',
                'message' => 'Comment added',
                'comment_id' => $comment_id,
                'user' => $userData['account_type'] === 'admin' ? 'Admin' : explode('@', $userData['email'])[0],
                'profile_image' => $userData['profile_image'],
                'email' => $userData['email']
            ]);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to add comment']);
        }
        exit;
    }

    echo json_encode(['status' => 'error', 'message' => 'Missing announcement_id or project_id']);
    exit;
}

echo json_encode(['status' => 'error', 'message' => 'Invalid request']);
