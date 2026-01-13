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

// Ensure user_pins table exists for user-specific pinning
$conn->query("CREATE TABLE IF NOT EXISTS user_pins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    announcement_id INT NOT NULL,
    pinned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_pin (user_id, announcement_id)
)");

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
            CASE 
                WHEN up.id IS NOT NULL THEN 1
                ELSE 0
            END AS is_pinned,
            l.email AS author,
            CASE 
                WHEN ar.id IS NULL THEN 1
                ELSE 0
            END AS unread
        FROM announcements a
        JOIN login l ON a.created_by = l.login_id
        LEFT JOIN user_pins up 
            ON up.announcement_id = a.announcement_id 
            AND up.user_id = ?
        LEFT JOIN announcement_reads ar 
            ON ar.announcement_id = a.announcement_id 
            AND ar.user_id = ?
        WHERE a.is_active = 1
        ORDER BY (up.id IS NOT NULL) DESC, a.created_at DESC
    ");

    $stmt->bind_param("ii", $user_id, $user_id);
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

    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    $action = $input['action'] ?? null;

    // Toggle pin (user-specific)
    if ($action === 'pin') {
        $announcement_id = isset($input['id']) ? (int)$input['id'] : 0;
        $pinned = isset($input['pinned']) ? (int)!!$input['pinned'] : null;
        if ($announcement_id <= 0 || $pinned === null) {
            echo json_encode(['status' => 'error', 'message' => 'Missing parameters']);
            exit;
        }
        
        if ($pinned) {
            // Insert pin record for this user
            $stmt = $conn->prepare("INSERT IGNORE INTO user_pins (user_id, announcement_id) VALUES (?, ?)");
            $stmt->bind_param('ii', $user_id, $announcement_id);
            $stmt->execute();
        } else {
            // Remove pin record for this user
            $stmt = $conn->prepare("DELETE FROM user_pins WHERE user_id = ? AND announcement_id = ?");
            $stmt->bind_param('ii', $user_id, $announcement_id);
            $stmt->execute();
        }
        echo json_encode(['status' => 'success', 'message' => 'Pin state updated', 'pinned' => $pinned]);
        exit;
    }

    // Mark a single announcement as read (any logged-in user)
    if ($action === 'mark_read') {
        $conn->query("CREATE TABLE IF NOT EXISTS announcement_reads (\n            id INT AUTO_INCREMENT PRIMARY KEY,\n            announcement_id INT NOT NULL,\n            user_id INT NOT NULL,\n            read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n            UNIQUE KEY unique_read (announcement_id, user_id)\n        )");

        $announcement_id = isset($input['id']) ? (int)$input['id'] : 0;
        if ($announcement_id <= 0) {
            echo json_encode(['status' => 'error', 'message' => 'Missing announcement ID']);
            exit;
        }
        $stmt = $conn->prepare("INSERT IGNORE INTO announcement_reads (announcement_id, user_id) VALUES (?, ?)");
        $stmt->bind_param('ii', $announcement_id, $user_id);
        $stmt->execute();
        echo json_encode(['status' => 'success', 'message' => 'Marked as read']);
        exit;
    }

    // Mark all announcements as read for the user (any logged-in user)
    if ($action === 'mark_all_read') {
        $conn->query("CREATE TABLE IF NOT EXISTS announcement_reads (\n            id INT AUTO_INCREMENT PRIMARY KEY,\n            announcement_id INT NOT NULL,\n            user_id INT NOT NULL,\n            read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n            UNIQUE KEY unique_read (announcement_id, user_id)\n        )");

        $stmt = $conn->prepare("INSERT IGNORE INTO announcement_reads (announcement_id, user_id)\n            SELECT a.announcement_id, ? FROM announcements a WHERE a.is_active = 1");
        $stmt->bind_param('i', $user_id);
        $stmt->execute();
        echo json_encode(['status' => 'success', 'message' => 'All announcements marked as read']);
        exit;
    }

    // Default: create announcement (admin only)
    if (!in_array($action, ['mark_read', 'mark_all_read']) && $account_type !== 'admin') {
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
