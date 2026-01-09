<?php
require "db.php";
header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"), true);
$idToken = $data["id_token"] ?? "";

if (!$idToken) {
    echo json_encode(["status" => "error", "message" => "Missing token"]);
    exit;
}

/* 🔐 VERIFY ID TOKEN WITH GOOGLE */
$googleResponse = file_get_contents(
    "https://oauth2.googleapis.com/tokeninfo?id_token=" . $idToken
);

$googleUser = json_decode($googleResponse, true);

if (!isset($googleUser["email"])) {
    echo json_encode(["status" => "error", "message" => "Invalid Google token"]);
    exit;
}

/* 📩 GOOGLE USER DATA */
$email   = $googleUser["email"];
$picture = $googleUser["picture"] ?? null;
$googleId = $googleUser["sub"];

/* 🔍 CHECK IF USER EXISTS */
$stmt = $conn->prepare("
    SELECT login_id, account_type 
    FROM login 
    WHERE email = ?
");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

/* 🆕 IF NOT EXISTS → CREATE */
if ($result->num_rows === 0) {

    $accountType = "user";
    $isVerified = 1; // Google already verified email

    $stmt = $conn->prepare("
        INSERT INTO login (email, profile_image, account_type, is_verified)
        VALUES (?, ?, ?, ?)
    ");
    $stmt->bind_param("sssi", $email, $picture, $accountType, $isVerified);
    $stmt->execute();

    $userId = $stmt->insert_id;

} else {
    $user = $result->fetch_assoc();
    $userId = $user["login_id"];
    $accountType = $user["account_type"];
}

/* 🔑 START SESSION */
session_start();
$_SESSION["user_id"] = $userId;
$_SESSION["email"] = $email;
$_SESSION["account_type"] = $accountType;

echo json_encode([
    "status" => "success",
    "message" => "Google login successful",
    "user" => [
        "id" => $userId,
        "email" => $email,
        "profile_image" => $picture,
        "account_type" => $accountType
    ]
]);
