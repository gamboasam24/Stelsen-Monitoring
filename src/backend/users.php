<?php
session_start();
header('Content-Type: application/json');
require_once 'db.php';

/* 🔐 Auth check */
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

$user_id = $_SESSION['user_id'];
$account_type = $_SESSION['account_type'];

if ($account_type !== 'admin') {
    echo json_encode(['status' => 'error', 'message' => 'Admin only']);
    exit;
}

/* =========================
   📥 GET USERS
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