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
    📥 GET USERS (admin + user)
    ========================= */
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $result = $conn->query("SELECT login_id, email, profile_image FROM login WHERE account_type = 'user'");

    $users = [];
    while ($row = $result->fetch_assoc()) {
        $users[] = [
            "id" => $row["login_id"],
            "email" => $row["email"],
            "name" => explode("@", $row["email"])[0],
            "profile_image" => $row["profile_image"] ?? null
        ];
    }

    echo json_encode($users);
    exit;
}

echo json_encode(['status' => 'error', 'message' => 'Invalid request']);