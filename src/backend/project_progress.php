<?php
// Set error handling to prevent HTML output on errors
error_reporting(E_ALL);
ini_set('display_errors', '0');

// Early JSON header to ensure JSON response
header('Content-Type: application/json');

// Debug: confirm file is loaded
$debug = isset($_GET['debug']);

set_error_handler(function($errno, $errstr, $errfile, $errline) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => "PHP Error: $errstr"
    ]);
    exit;
});

set_exception_handler(function($exception) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => "Exception: " . $exception->getMessage()
    ]);
    exit;
});

try {
    $tempDir = sys_get_temp_dir() . '/php_sessions';
    if (!is_dir($tempDir)) {
        @mkdir($tempDir, 0777, true);
    }
    session_save_path($tempDir);
    session_start();
    
    // Check if db.php exists
    if (!file_exists('db.php')) {
        throw new Exception('db.php not found in ' . __DIR__);
    }
    
    require_once 'db.php';
    
    if (!isset($conn)) {
        throw new Exception('Database connection object not created');
    }
    
    if ($conn->connect_error) {
        throw new Exception('Database connection failed: ' . $conn->connect_error);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
    exit;
}

/* 🔐 Auth check */
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized - please login']);
    exit;
}

$user_id = intval($_SESSION['user_id']);
$account_type = $_SESSION['account_type'] ?? 'user';

/* =========================
   🗂️ ENSURE TABLE EXISTS
   ========================= */
try {
    $conn->query("CREATE TABLE IF NOT EXISTS project_progress (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        user_id INT NOT NULL,
        progress_percentage INT NOT NULL,
        status VARCHAR(50) DEFAULT 'In Progress',
        notes TEXT,
        evidence_photo LONGTEXT,
        location_latitude DECIMAL(10, 8),
        location_longitude DECIMAL(11, 8),
        location_accuracy FLOAT,
        approved_by_admin INT,
        approval_status VARCHAR(50) DEFAULT 'PENDING',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_project_id (project_id),
        INDEX idx_user_id (user_id),
        INDEX idx_approval_status (approval_status)
    )");
    
    if ($conn->error && strpos($conn->error, 'already exists') === false) {
        throw new Exception('Table creation error: ' . $conn->error);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Setup error: ' . $e->getMessage()
    ]);
    exit;
}

/* =========================
   📝 UPDATE PROGRESS (USER)
   ========================= */
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'update_progress') {
    try {
        // Validate input
        $project_id = intval($_POST['project_id'] ?? 0);
        $progress_percentage = intval($_POST['progress_percentage'] ?? 0);
        $status = $_POST['status'] ?? 'In Progress';
        $notes = $_POST['notes'] ?? '';
        $evidence_photo = $_POST['evidence_photo'] ?? null;
        $location_lat = floatval($_POST['location_latitude'] ?? 0);
        $location_lng = floatval($_POST['location_longitude'] ?? 0);
        $location_accuracy = floatval($_POST['location_accuracy'] ?? 0);

        // Validation
        if ($project_id <= 0) {
            throw new Exception('Invalid project ID');
        }
        
        if ($progress_percentage < 0 || $progress_percentage > 100) {
            throw new Exception('Progress percentage must be between 0 and 100');
        }

        if ($status !== 'Not Started' && $status !== 'In Progress' && $status !== 'Completed') {
            throw new Exception('Invalid status value');
        }

        if (!$evidence_photo) {
            throw new Exception('Photo evidence is required');
        }

        // Prepare statement to insert progress update
        $stmt = $conn->prepare("
            INSERT INTO project_progress 
            (project_id, user_id, progress_percentage, status, notes, evidence_photo, 
             location_latitude, location_longitude, location_accuracy, approval_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
        ");

        if (!$stmt) {
            throw new Exception("Prepare failed: " . $conn->error);
        }

        // Bind parameters: i=int, s=string, d=double
        $stmt->bind_param(
            "iiisssdd",
            $project_id,
            $user_id,
            $progress_percentage,
            $status,
            $notes,
            $evidence_photo,
            $location_lat,
            $location_lng,
            $location_accuracy
        );

        if (!$stmt->execute()) {
            throw new Exception("Execute failed: " . $stmt->error);
        }

        echo json_encode([
            'status' => 'success',
            'message' => 'Progress update submitted successfully! Awaiting admin approval.',
            'progress_id' => $conn->insert_id
        ]);
        
        $stmt->close();
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'message' => $e->getMessage()
        ]);
        exit;
    }
}

/* =========================
   📊 GET PENDING UPDATES (ADMIN)
   ========================= */
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'get_pending') {
    
    if ($account_type !== 'admin') {
        http_response_code(403);
        echo json_encode(['status' => 'error', 'message' => 'Admin only']);
        exit;
    }

    try {
        $result = $conn->query("
            SELECT 
                pp.id,
                pp.project_id,
                pp.user_id,
                pp.progress_percentage,
                pp.status,
                pp.notes,
                pp.location_latitude,
                pp.location_longitude,
                pp.location_accuracy,
                pp.created_at,
                l.email as user_email,
                l.profile_image,
                p.title as project_title
            FROM project_progress pp
            JOIN login l ON pp.user_id = l.login_id
            LEFT JOIN projects p ON pp.project_id = p.id
            WHERE pp.approval_status = 'PENDING'
            ORDER BY pp.created_at DESC
        ");

        $updates = [];
        while ($row = $result->fetch_assoc()) {
            // Don't include photo blob in the listing (too large)
            $updates[] = [
                'id' => $row['id'],
                'project_id' => $row['project_id'],
                'user_id' => $row['user_id'],
                'user_email' => $row['user_email'],
                'user_profile_image' => $row['profile_image'],
                'project_title' => $row['project_title'],
                'progress_percentage' => (int)$row['progress_percentage'],
                'status' => $row['status'],
                'notes' => $row['notes'],
                'location' => [
                    'latitude' => (float)$row['location_latitude'],
                    'longitude' => (float)$row['location_longitude'],
                    'accuracy' => (float)$row['location_accuracy']
                ],
                'submitted_at' => $row['created_at']
            ];
        }

        echo json_encode([
            'status' => 'success',
            'data' => $updates
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'message' => 'Database error: ' . $e->getMessage()
        ]);
    }
    exit;
}

/* =========================
   ✅ APPROVE/REJECT (ADMIN)
   ========================= */
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $_POST['action'] === 'review_progress') {
    
    if ($account_type !== 'admin') {
        http_response_code(403);
        echo json_encode(['status' => 'error', 'message' => 'Admin only']);
        exit;
    }

    $progress_id = intval($_POST['progress_id'] ?? 0);
    $approval_status = $_POST['approval_status'] ?? ''; // 'APPROVED' or 'REJECTED'
    $rejection_reason = $_POST['rejection_reason'] ?? '';

    if (!in_array($approval_status, ['APPROVED', 'REJECTED'])) {
        echo json_encode(['status' => 'error', 'message' => 'Invalid approval status']);
        exit;
    }

    try {
        $stmt = $conn->prepare("
            UPDATE project_progress 
            SET approval_status = ?, approved_by_admin = ?
            WHERE id = ?
        ");

        if (!$stmt) {
            throw new Exception("Prepare failed: " . $conn->error);
        }

        $stmt->bind_param("sii", $approval_status, $user_id, $progress_id);

        if ($stmt->execute()) {
            echo json_encode([
                'status' => 'success',
                'message' => 'Progress update ' . strtolower($approval_status) . ' successfully!'
            ]);
        } else {
            throw new Exception("Execute failed: " . $stmt->error);
        }

        $stmt->close();
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'message' => 'Database error: ' . $e->getMessage()
        ]);
    }
    exit;
}

/* =========================
   🖼️ GET EVIDENCE PHOTO
   ========================= */
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'get_photo') {
    
    $progress_id = intval($_GET['progress_id'] ?? 0);

    if ($progress_id <= 0) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Invalid progress ID']);
        exit;
    }

    try {
        $stmt = $conn->prepare("
            SELECT evidence_photo FROM project_progress WHERE id = ?
        ");

        if (!$stmt) {
            throw new Exception("Prepare failed: " . $conn->error);
        }

        $stmt->bind_param("i", $progress_id);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            http_response_code(404);
            echo json_encode(['status' => 'error', 'message' => 'Photo not found']);
            exit;
        }

        $row = $result->fetch_assoc();
        
        // Send image
        header('Content-Type: image/jpeg');
        header('Content-Length: ' . strlen($row['evidence_photo']));
        echo $row['evidence_photo'];

        $stmt->close();
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'message' => 'Database error: ' . $e->getMessage()
        ]);
    }
    exit;
}

/* =========================
   ❌ INVALID REQUEST
   ========================= */
http_response_code(400);
echo json_encode([
    'status' => 'error',
    'message' => 'Invalid request method or action'
]);
exit;
