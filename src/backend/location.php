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

/* =========================
   📍 CREATE/UPDATE USER LOCATION
   ========================= */
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Create table if it doesn't exist
    $createTableSQL = "
    CREATE TABLE IF NOT EXISTS user_locations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        longitude DECIMAL(10, 7) NOT NULL,
        latitude DECIMAL(10, 7) NOT NULL,
        location_name VARCHAR(255) DEFAULT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES login(login_id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_updated_at (updated_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ";
    
    $conn->query($createTableSQL);
    
    $input = json_decode(file_get_contents('php://input'), true);
    $longitude = $input['longitude'] ?? null;
    $latitude = $input['latitude'] ?? null;
    $location_name = $input['location_name'] ?? null;

    if ($longitude === null || $latitude === null) {
        echo json_encode(['status' => 'error', 'message' => 'Longitude and latitude are required']);
        exit;
    }

    // Check if user already has a location record
    $checkStmt = $conn->prepare("SELECT id FROM user_locations WHERE user_id = ?");
    $checkStmt->bind_param("i", $user_id);
    $checkStmt->execute();
    $result = $checkStmt->get_result();
    
    if ($result->num_rows > 0) {
        // Update existing location
        $stmt = $conn->prepare("UPDATE user_locations SET longitude = ?, latitude = ?, location_name = ?, updated_at = NOW() WHERE user_id = ?");
        $stmt->bind_param("ddsi", $longitude, $latitude, $location_name, $user_id);
    } else {
        // Insert new location
        $stmt = $conn->prepare("INSERT INTO user_locations (user_id, longitude, latitude, location_name) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("idds", $user_id, $longitude, $latitude, $location_name);
    }
    
    if ($stmt->execute()) {
        echo json_encode([
            'status' => 'success', 
            'message' => 'Location updated',
            'data' => [
                'longitude' => $longitude,
                'latitude' => $latitude,
                'location_name' => $location_name
            ]
        ]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to update location: ' . $stmt->error]);
    }
    
    $stmt->close();
    $checkStmt->close();
    exit;
}

/* =========================
   📍 GET USER LOCATION(S)
   ========================= */
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $target_user_id = $_GET['user_id'] ?? $user_id;
    
    // Admin can view all users' locations, regular users can only view their own
    if ($_SESSION['account_type'] !== 'admin' && $target_user_id != $user_id) {
        http_response_code(403);
        echo json_encode(['status' => 'error', 'message' => 'Forbidden']);
        exit;
    }
    
    if ($target_user_id === 'all' && $_SESSION['account_type'] === 'admin') {
        // Get all users' locations with their profile info
        $sql = "
            SELECT 
                ul.id,
                ul.user_id,
                ul.longitude,
                ul.latitude,
                ul.location_name,
                ul.updated_at,
                l.email,
                l.profile_image
            FROM user_locations ul
            JOIN login l ON ul.user_id = l.login_id
            ORDER BY ul.updated_at DESC
        ";
        $result = $conn->query($sql);
        
        $locations = [];
        while ($row = $result->fetch_assoc()) {
            $locations[] = [
                'id' => $row['id'],
                'user_id' => $row['user_id'],
                'longitude' => (float)$row['longitude'],
                'latitude' => (float)$row['latitude'],
                'location_name' => $row['location_name'],
                'updated_at' => $row['updated_at'],
                'email' => $row['email'],
                'profile_image' => $row['profile_image']
            ];
        }
        
        echo json_encode(['status' => 'success', 'locations' => $locations]);
    } else {
        // Get specific user's location
        $stmt = $conn->prepare("
            SELECT 
                ul.id,
                ul.user_id,
                ul.longitude,
                ul.latitude,
                ul.location_name,
                ul.updated_at,
                l.email,
                l.profile_image
            FROM user_locations ul
            JOIN login l ON ul.user_id = l.login_id
            WHERE ul.user_id = ?
            ORDER BY ul.updated_at DESC
            LIMIT 1
        ");
        $stmt->bind_param("i", $target_user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($row = $result->fetch_assoc()) {
            echo json_encode([
                'status' => 'success',
                'location' => [
                    'id' => $row['id'],
                    'user_id' => $row['user_id'],
                    'longitude' => (float)$row['longitude'],
                    'latitude' => (float)$row['latitude'],
                    'location_name' => $row['location_name'],
                    'updated_at' => $row['updated_at'],
                    'email' => $row['email'],
                    'profile_image' => $row['profile_image']
                ]
            ]);
        } else {
            echo json_encode(['status' => 'success', 'location' => null]);
        }
        
        $stmt->close();
    }
    exit;
}

echo json_encode(['status' => 'error', 'message' => 'Invalid request']);
?>
