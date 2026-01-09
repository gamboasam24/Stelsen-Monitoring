<?php
require 'db.php';
header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['email'], $data['code'])) {
    echo json_encode(['status'=>'error','message'=>'Invalid request']);
    exit;
}

$email = trim($data['email']);
$code  = trim($data['code']);

// 1️⃣ Get user by email
$stmt = $conn->prepare("
    SELECT is_verified, verification_code 
    FROM login 
    WHERE email = ?
");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if (!$user = $result->fetch_assoc()) {
    echo json_encode(['status'=>'error','message'=>'Account not found']);
    exit;
}

// 2️⃣ Block already verified accounts
if ($user['is_verified']) {
    echo json_encode([
        'status'=>'error',
        'message'=>'Account already verified'
    ]);
    exit;
}

// 3️⃣ STRICT code match (no guessing allowed)
if ($user['verification_code'] != $code) {
    echo json_encode([
        'status'=>'error',
        'message'=>'Invalid verification code'
    ]);
    exit;
}

// 4️⃣ Verify for real
$stmt = $conn->prepare("
    UPDATE login
    SET is_verified = 1, verification_code = NULL
    WHERE email = ?
      AND verification_code = ?
      AND is_verified = 0
");
$stmt->bind_param("ss", $email, $code);
$stmt->execute();

if ($stmt->affected_rows === 0) {
    echo json_encode([
        "status" => "error",
        "message" => "Invalid or expired verification code"
    ]);
    exit;
}

echo json_encode([
    "status" => "success",
    "message" => "Email verified successfully"
]);
