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

    // Updated query to JOIN with project_progress table to get latest approved progress
    $result = $conn->query("
        SELECT 
            p.*,
            COALESCE(pp.progress_percentage, p.progress) as current_progress
        FROM projects p
        LEFT JOIN (
            SELECT project_id, progress_percentage
            FROM project_progress
            WHERE approval_status = 'APPROVED'
            ORDER BY created_at DESC
            LIMIT 1
        ) pp ON p.id = pp.project_id
        ORDER BY p.id DESC
    ");

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
        "progress" => (int)$row["current_progress"],
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

    // Check if this is FormData (add/remove user request)
    if (!empty($_POST['action'])) {
        if ($account_type !== 'admin') {
            echo json_encode(['status' => 'error', 'message' => 'Admin only']);
            exit;
        }

        $project_id = intval($_POST['project_id'] ?? 0);
        $user_id = intval($_POST['user_id'] ?? 0);
        $action = $_POST['action'];

        if (!$project_id || !$user_id) {
            echo json_encode(['status' => 'error', 'message' => 'Invalid project or user ID']);
            exit;
        }

        try {
            // Get current assigned users
            $stmt = $conn->prepare("SELECT assigned_users FROM projects WHERE id = ?");
            if (!$stmt) {
                throw new Exception("Prepare failed: " . $conn->error);
            }
            
            $stmt->bind_param("i", $project_id);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows === 0) {
                echo json_encode(['status' => 'error', 'message' => 'Project not found']);
                exit;
            }

            $project = $result->fetch_assoc();
            $assigned_users = json_decode($project['assigned_users'] ?? '[]', true);

            if ($action === 'add') {
                // Check if user is already assigned
                if (in_array($user_id, $assigned_users)) {
                    echo json_encode(['status' => 'error', 'message' => 'User is already assigned to this project']);
                    exit;
                }
                $assigned_users[] = $user_id;
            } elseif ($action === 'remove') {
                $assigned_users = array_filter($assigned_users, function($id) use ($user_id) {
                    return $id !== $user_id;
                });
                $assigned_users = array_values($assigned_users); // Re-index
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
                exit;
            }

            $team_users = count($assigned_users);
            $assigned_users_json = json_encode($assigned_users);

            // Update project
            $stmt = $conn->prepare("UPDATE projects SET assigned_users = ?, team_users = ? WHERE id = ?");
            if (!$stmt) {
                throw new Exception("Prepare failed: " . $conn->error);
            }
            
            $stmt->bind_param("sii", $assigned_users_json, $team_users, $project_id);
            $stmt->execute();

            // Get user info for notification (just email, since 'name' column doesn't exist)
            $stmt = $conn->prepare("SELECT email FROM login WHERE login_id = ?");
            if (!$stmt) {
                throw new Exception("Prepare failed: " . $conn->error);
            }
            
            $stmt->bind_param("i", $user_id);
            $stmt->execute();
            $user_result = $stmt->get_result();
            $user_info = $user_result->fetch_assoc();

            // Get project info
            $stmt = $conn->prepare("SELECT title FROM projects WHERE id = ?");
            if (!$stmt) {
                throw new Exception("Prepare failed: " . $conn->error);
            }
            
            $stmt->bind_param("i", $project_id);
            $stmt->execute();
            $proj_result = $stmt->get_result();
            $proj_info = $proj_result->fetch_assoc();

            // Send notification email (optional - don't fail if email fails)
            if ($action === 'add' && $user_info && !empty($user_info['email'])) {
                $email = $user_info['email'];
                $project_title = $proj_info['title'] ?? 'Your Project';

                $subject = "New Project Assignment: " . $project_title;
                $message = "Hello,\n\nYou have been assigned to a new project: $project_title\n\nPlease check your dashboard for more details.\n\nBest regards,\nMonitoring System";
                $headers = "Content-Type: text/plain; charset=UTF-8";
                
                // Silently attempt to send email
                @mail($email, $subject, $message, $headers);
            }

            echo json_encode([
                'status' => 'success',
                'message' => $action === 'add' ? 'User added to project' : 'User removed from project'
            ]);
            exit;
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'Server error: ' . $e->getMessage()]);
            exit;
        }
    }

    // JSON POST (create project)
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
