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
   📥 GET PROJECTS
   ========================= */
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // First get all valid user IDs
    $users_result = $conn->query("SELECT login_id FROM login WHERE account_type = 'user'");
    $valid_user_ids = [];
    while ($user_row = $users_result->fetch_assoc()) {
        $valid_user_ids[] = $user_row['login_id'];
    }

    $result = $conn->query("SELECT * FROM projects");

    $projects = [];
    while ($row = $result->fetch_assoc()) {
      $assigned_users = json_decode($row["assigned_users"] ?? '[]', true);
      
      // Filter assigned_users to only include valid user IDs
      $valid_assigned_users = array_filter($assigned_users, function($user_id) use ($valid_user_ids) {
        return in_array($user_id, $valid_user_ids);
      });
      
      $projects[] = [
        "id" => $row["id"],
        "title" => $row["title"],
        "description" => $row["description"],
        "status" => $row["status"],
        "progress" => (int)$row["progress"],
        "deadline" => $row["deadline"],
        "manager" => $row["manager"],
        "team_users" => count($valid_assigned_users), // Count only valid assigned users
        "budget" => $row["budget"],
        "startDate" => $row["start_date"],
        "assignedUsers" => array_values($valid_assigned_users), // Return only valid user IDs
        "comments" => []
      ];
    }

    echo json_encode($projects);
    exit;
}

/* =========================
   📝 CREATE PROJECT (ADMIN)
   ========================= */
if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    if ($account_type !== 'admin') {
        echo json_encode(['status' => 'error', 'message' => 'Admin only']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);

    $title = trim($input['title'] ?? '');
    $description = trim($input['description'] ?? '');
    $status = $input['status'] ?? 'pending';
    $deadline = $input['deadline'] ?? null;
    $manager = trim($input['manager'] ?? '');
    $budget = trim($input['budget'] ?? '');
    $start_date = $input['startDate'] ?? null;
    $assigned_users_input = $input['assignedUsers'] ?? [];

    if (!$title) {
        echo json_encode(['status' => 'error', 'message' => 'Title is required']);
        exit;
    }

    // Validate assigned users against existing users
    if (!empty($assigned_users_input)) {
        $placeholders = str_repeat('?,', count($assigned_users_input) - 1) . '?';
        $stmt = $conn->prepare("SELECT login_id FROM login WHERE account_type = 'user' AND login_id IN ($placeholders)");
        $stmt->bind_param(str_repeat('i', count($assigned_users_input)), ...$assigned_users_input);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $valid_user_ids = [];
        while ($row = $result->fetch_assoc()) {
            $valid_user_ids[] = $row['login_id'];
        }
        $stmt->close();
        
        $assigned_users = $valid_user_ids;
    } else {
        $assigned_users = [];
    }

    $team_users = count($assigned_users);
    $assigned_users_json = json_encode($assigned_users);

    $stmt = $conn->prepare("
        INSERT INTO projects (title, description, status, progress, deadline, manager, team_users, budget, start_date, assigned_users)
        VALUES (?, ?, ?, 0, ?, ?, ?, ?, ?, ?)
    ");

    $stmt->bind_param("sssssssss", $title, $description, $status, $deadline, $manager, $team_users, $budget, $start_date, $assigned_users_json);
    $stmt->execute();

    echo json_encode([
        'status' => 'success',
        'message' => 'Project created'
    ]);
    exit;
}

echo json_encode(['status' => 'error', 'message' => 'Invalid request']);
