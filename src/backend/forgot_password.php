<?php
header("Content-Type: application/json");
require "db.php";
require "send_email.php"; // PHPMailer function

$data = json_decode(file_get_contents("php://input"), true);
$action = $data["action"] ?? "";

if (!$action) {
    echo json_encode(["status"=>"error","message"=>"Invalid request"]);
    exit;
}

/* =========================
   📩 SEND RESET CODE
   ========================= */
if ($action === "send_code") {
    $email = trim($data["email"] ?? "");

    if (!$email) {
        echo json_encode(["status"=>"error","message"=>"Email required"]);
        exit;
    }

    // Make sure account exists and is verified
    $stmt = $conn->prepare("SELECT login_id FROM login WHERE email=? AND is_verified = 1");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        echo json_encode(["status"=>"error","message"=>"Email not found or account not verified"]);
        exit;
    }

    $code = random_int(100000, 999999);
    $expires = date("Y-m-d H:i:s", strtotime("+10 minutes"));

    $stmt = $conn->prepare("UPDATE login SET reset_code=?, reset_expires=? WHERE email=?");
    $stmt->bind_param("sss", $code, $expires, $email);
    $stmt->execute();

    // Send email
    $sent = sendVerificationEmail($email, $code); // reuse your sendVerificationEmail function
    if (!$sent) {
        echo json_encode(["status"=>"error","message"=>"Failed to send reset email"]);
        exit;
    }

    echo json_encode([
        "status"=>"success",
        "message"=>"Reset code sent to email"
    ]);
    exit;
}

/* =========================
   🔍 VERIFY RESET CODE
   ========================= */
if ($action === "verify_code") {
    $email = trim($data["email"] ?? "");
    $code  = trim($data["code"] ?? "");

    if (!$email || !$code) {
        echo json_encode(["status"=>"error","message"=>"Missing data"]);
        exit;
    }

    // ✅ Select the reset_code and reset_expires directly to debug
    $stmt = $conn->prepare("
        SELECT reset_code, reset_expires 
        FROM login 
        WHERE email=?
    ");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();

    if (!$user) {
        echo json_encode(["status"=>"error","message"=>"Account not found"]);
        exit;
    }

    // Check code
    if ($user['reset_code'] !== $code) {
        echo json_encode(["status"=>"error","message"=>"Invalid code"]);
        exit;
    }

    // Check expiration
    $now = new DateTime("now", new DateTimeZone("Asia/Manila")); // adjust timezone if needed
    $expires = new DateTime($user['reset_expires']);
    if ($expires < $now) {
        echo json_encode(["status"=>"error","message"=>"Code expired"]);
        exit;
    }

    // Success
    echo json_encode([
        "status"=>"success",
        "message"=>"Code verified"
    ]);
    exit;
}

/* =========================
   🔐 RESET PASSWORD
   ========================= */
if ($action === "reset_password") {
    $email = trim($data["email"] ?? "");
    $password = $data["password"] ?? "";

    if (!$email || !$password) {
        echo json_encode(["status"=>"error","message"=>"Missing data"]);
        exit;
    }

    $hashed = password_hash($password, PASSWORD_DEFAULT);

    $stmt = $conn->prepare("
        UPDATE login 
        SET password=?, reset_code=NULL, reset_expires=NULL 
        WHERE email=?
    ");
    $stmt->bind_param("ss", $hashed, $email);
    $stmt->execute();

    echo json_encode([
        "status"=>"success",
        "message"=>"Password reset successful"
    ]);
    exit;
}

/* =========================
   ❌ FALLBACK
   ========================= */
echo json_encode(["status"=>"error","message"=>"Invalid action"]);
