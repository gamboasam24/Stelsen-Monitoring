<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, GET');

session_unset();
session_destroy();

echo json_encode(['status' => 'success', 'message' => 'Logged out successfully']);
