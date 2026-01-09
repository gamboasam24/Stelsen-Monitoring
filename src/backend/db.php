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
?>
