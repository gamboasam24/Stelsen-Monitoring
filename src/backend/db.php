<?php
// Database connection
$host = "127.0.0.1";   // localhost
$user = "root";        // XAMPP default
$pass = "";            // XAMPP default
$dbname = "stelsen";  // your DB name

// Connect without database to create it if needed
$conn = new mysqli($host, $user, $pass);

if ($conn->connect_error) {
    die(json_encode([
        "status" => "error",
        "message" => "Connection failed: " . $conn->connect_error
    ]));
}

// Create database if it doesn't exist
$conn->query("CREATE DATABASE IF NOT EXISTS `$dbname`");

$conn->select_db($dbname);

if ($conn->error) {
    die(json_encode([
        "status" => "error",
        "message" => "Database selection failed: " . $conn->error
    ]));
}

// Create tables if they don't exist
$conn->query("CREATE TABLE IF NOT EXISTS login (
    login_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    account_type VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

$conn->query("CREATE TABLE IF NOT EXISTS announcements (
    announcement_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'general',
    priority VARCHAR(50) DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT NOT NULL,
    is_active TINYINT DEFAULT 1
)");

$conn->query("CREATE TABLE IF NOT EXISTS announcement_reads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    announcement_id INT NOT NULL,
    user_id INT NOT NULL,
    UNIQUE KEY unique_read (announcement_id, user_id)
)");

$conn->query("CREATE TABLE IF NOT EXISTS project_comments (
    comment_id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    user_id INT NOT NULL,
    comment TEXT,
    attachments JSON,
    progress_percentage INT DEFAULT NULL,
    progress_status VARCHAR(50) DEFAULT NULL,
    evidence_photo LONGTEXT DEFAULT NULL,
    location_latitude DECIMAL(10,8) DEFAULT NULL,
    location_longitude DECIMAL(11,8) DEFAULT NULL,
    location_accuracy FLOAT DEFAULT NULL,
    comment_type VARCHAR(50) DEFAULT 'text',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_project_id (project_id),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    INDEX idx_comment_type (comment_type)
)");

// Add missing columns to project_comments if they don't exist
$result = $conn->query("DESCRIBE project_comments");
$columns = [];
while ($row = $result->fetch_assoc()) {
    $columns[] = $row['Field'];
}

if (!in_array('attachments', $columns)) {
    $conn->query("ALTER TABLE project_comments ADD COLUMN attachments JSON DEFAULT NULL");
}
if (!in_array('progress_percentage', $columns)) {
    $conn->query("ALTER TABLE project_comments ADD COLUMN progress_percentage INT DEFAULT NULL");
}
if (!in_array('progress_status', $columns)) {
    $conn->query("ALTER TABLE project_comments ADD COLUMN progress_status VARCHAR(50) DEFAULT NULL");
}
if (!in_array('evidence_photo', $columns)) {
    $conn->query("ALTER TABLE project_comments ADD COLUMN evidence_photo LONGTEXT DEFAULT NULL");
}
if (!in_array('location_latitude', $columns)) {
    $conn->query("ALTER TABLE project_comments ADD COLUMN location_latitude DECIMAL(10,8) DEFAULT NULL");
}
if (!in_array('location_longitude', $columns)) {
    $conn->query("ALTER TABLE project_comments ADD COLUMN location_longitude DECIMAL(11,8) DEFAULT NULL");
}
if (!in_array('location_accuracy', $columns)) {
    $conn->query("ALTER TABLE project_comments ADD COLUMN location_accuracy FLOAT DEFAULT NULL");
}
if (!in_array('comment_type', $columns)) {
    $conn->query("ALTER TABLE project_comments ADD COLUMN comment_type VARCHAR(50) DEFAULT 'text'");
}

// Add index if it doesn't exist
$indexes = $conn->query("SHOW INDEX FROM project_comments WHERE Key_name = 'idx_comment_type'");
if ($indexes->num_rows === 0) {
    $conn->query("ALTER TABLE project_comments ADD INDEX idx_comment_type (comment_type)");
}
?>
