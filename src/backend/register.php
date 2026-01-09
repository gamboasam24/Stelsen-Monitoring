<?php
require __DIR__ . '/db.php';
require __DIR__ . '/send_email.php';
header('Content-Type: application/json');

// Decode JSON
$data = json_decode(file_get_contents('php://input'), true);

// Guard: prevent browser access
if (!$data || empty($data['email']) || empty($data['password'])) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Invalid request'
    ]);
    exit;
}

$email    = trim($data['email']);
$phone    = $data['phone'] ?? null;
$password = $data['password'];

// 1️⃣ Check if email already exists (FIXED TABLE)
$stmt = $conn->prepare("SELECT login_id FROM login WHERE email=?");
$stmt->bind_param("s", $email);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows > 0) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Email already registered'
    ]);
    exit;
}

// 2️⃣ Hash password
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

// 3️⃣ Generate verification code
$verificationCode = rand(100000, 999999);

// 4️⃣ Insert user
$stmt = $conn->prepare("
    INSERT INTO login 
    (email, phone, password, account_type, is_verified, verification_code) 
    VALUES (?, ?, ?, 'user', 0, ?)
");
$stmt->bind_param("sssi", $email, $phone, $hashedPassword, $verificationCode);
$stmt->execute();

// 5️⃣ Send verification email
if (sendVerificationEmail($email, $verificationCode)) {
    echo json_encode([
        'status' => 'success',
        'message' => 'Verification code sent'
    ]);
} else {
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to send verification email'
    ]);
}

$conn->close();
