<?php
session_start();
require_once '../config/database.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit();
}

$csrfToken = generateCSRFToken();
echo json_encode(['success' => true, 'token' => $csrfToken]);
?>