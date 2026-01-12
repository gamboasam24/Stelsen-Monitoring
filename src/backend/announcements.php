<?php
$tempDir = sys_get_temp_dir() . '/php_sessions';
if (!is_dir($tempDir)) mkdir($tempDir, 0777, true);
session_save_path($tempDir);
session_start();
header('Content-Type: application/json');
require_once 'db.php';

/* 🔐 Auth check */
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

$user_id = $_SESSION['user_id'];
$account_type = $_SESSION['account_type'];

/* =========================
   📥 GET ANNOUNCEMENTS
   ========================= */
if ($_SERVER['REQUEST_METHOD'] === 'GET') {

    $stmt = $conn->prepare("
        SELECT 
            a.announcement_id,
            a.title,
            a.content,
            a.type,
            a.priority,
            a.created_at,
            l.email AS author,
            CASE 
                WHEN ar.id IS NULL THEN 1
                ELSE 0
            END AS unread
        FROM announcements a
        JOIN login l ON a.created_by = l.login_id
        LEFT JOIN announcement_reads ar 
            ON ar.announcement_id = a.announcement_id 
            AND ar.user_id = ?
        WHERE a.is_active = 1
        ORDER BY a.created_at DESC
    ");

    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();

    $announcements = [];
    while ($row = $result->fetch_assoc()) {
        $announcements[] = $row;
    }

echo json_encode($announcements);

    exit;
}

/* =========================
   📝 CREATE ANNOUNCEMENT (ADMIN)
   ========================= */
if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    if ($account_type !== 'admin') {
        echo json_encode(['status' => 'error', 'message' => 'Admin only']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);

    $title = trim($input['title'] ?? '');
    $content = trim($input['content'] ?? '');
    $type = $input['type'] ?? 'general';
    $priority = $input['priority'] ?? 'medium';

    if (!$title || !$content) {
        echo json_encode(['status' => 'error', 'message' => 'Title and content required']);
        exit;
    }

    $stmt = $conn->prepare("
        INSERT INTO announcements (title, content, type, priority, created_by)
        VALUES (?, ?, ?, ?, ?)
    ");

    $stmt->bind_param("ssssi", $title, $content, $type, $priority, $user_id);
    $stmt->execute();

    echo json_encode([
        'status' => 'success',
        'message' => 'Announcement posted'
    ]);
    exit;
}

echo json_encode(['status' => 'error', 'message' => 'Invalid request']);
