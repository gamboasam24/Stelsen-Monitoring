<?php
// Use system temp directory for sessions to avoid permission issues
$tempDir = sys_get_temp_dir() . '/php_sessions';
if (!is_dir($tempDir)) {
    mkdir($tempDir, 0777, true);
}
session_save_path($tempDir);

// Start session with error suppression and check
@session_start();
if (session_status() !== PHP_SESSION_ACTIVE) {
    http_response_code(500);
    die(json_encode([
        'status' => 'error',
        'message' => 'Session error. Check XAMPP tmp directory permissions.'
    ]));
}
header('Content-Type: application/json');

$allowed_origins = ["http://localhost:5173", "http://127.0.0.1:5173"];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
    header("Access-Control-Allow-Credentials: true");
    header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once 'db.php';

/* =========================
   🔵 SESSION CHECK (GET)
   ========================= */
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_SESSION['user_id'])) {
        $stmt = $conn->prepare("SELECT profile_image FROM login WHERE login_id=?");
        $stmt->bind_param("i", $_SESSION['user_id']);
        $stmt->execute();
        $userData = $stmt->get_result()->fetch_assoc();

        echo json_encode([
            'status' => 'success',
            'message' => 'Session active',
            'user' => [
                'id' => $_SESSION['user_id'],
                'email' => $_SESSION['email'],
                'account_type' => $_SESSION['account_type'],
                'profile_image' => $userData['profile_image'] ?? null
            ]
        ]);
        exit;
    }
    echo json_encode(['status' => 'error', 'message' => 'No active session']);
    exit;
}

/* =========================
   🔴 LOGIN (POST)
   ========================= */
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$email = trim($input['email'] ?? '');
$password = $input['password'] ?? '';

if (!$email || !$password) {
    echo json_encode(['status'=>'error','message'=>'Email and password are required']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['status'=>'error','message'=>'Invalid email format']);
    exit;
}

/* 🔍 CHECK IF ACCOUNT EXISTS */
$stmt = $conn->prepare("SELECT login_id, email, password, account_type, profile_image, is_verified FROM login WHERE email=?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(['status'=>'error','message'=>'Account does not exist.']);
    exit;
}

$user = $result->fetch_assoc();

if ((int)$user['is_verified'] === 0) {
    echo json_encode(['status'=>'error','message'=>'Please verify your email before logging in.']);
    exit;
}

if (!password_verify($password, $user['password'])) {
    echo json_encode(['status'=>'error','message'=>'Incorrect password']);
    exit;
}

/* ✅ LOGIN SUCCESS */
$_SESSION['user_id'] = $user['login_id'];
$_SESSION['email'] = $user['email'];
$_SESSION['account_type'] = $user['account_type'];

echo json_encode([
    'status' => 'success',
    'message' => 'Login successful',
    'token' => session_id(),
    'user' => [
        'id' => $user['login_id'],
        'email' => $user['email'],
        'account_type' => $user['account_type'],
        'profile_image' => $user['profile_image'] ?? null
    ]
]);

$stmt->close();
$conn->close();
