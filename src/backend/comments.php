<?php
session_start();
header('Content-Type: application/json');
require_once 'db.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

$user_id = $_SESSION['user_id'];

/* =========================
   📥 GET COMMENTS
   ========================= */
if ($_SERVER['REQUEST_METHOD'] === 'GET') {

    $announcement_id = $_GET['announcement_id'] ?? null;

    if (!$announcement_id) {
        echo json_encode(['status' => 'error', 'message' => 'Missing announcement ID']);
        exit;
    }

    $stmt = $conn->prepare("
        SELECT 
            c.comment_id,
            c.comment,
            c.created_at,
            l.email
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

/* =========================
   💬 POST COMMENT
   ========================= */
if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    $input = json_decode(file_get_contents('php://input'), true);

    $announcement_id = $input['announcement_id'] ?? null;
    $comment = trim($input['comment'] ?? '');

    if (!$announcement_id || !$comment) {
        echo json_encode(['status' => 'error', 'message' => 'Invalid input']);
        exit;
    }

    $stmt = $conn->prepare("
        INSERT INTO announcement_comments (announcement_id, user_id, comment)
        VALUES (?, ?, ?)
    ");

    $stmt->bind_param("iis", $announcement_id, $user_id, $comment);
    $stmt->execute();

    echo json_encode([
        'status' => 'success',
        'message' => 'Comment added'
    ]);
    exit;
}

echo json_encode(['status' => 'error', 'message' => 'Invalid request']);
