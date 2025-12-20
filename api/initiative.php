<?php
session_start();
require_once '../config/database.php';
require_once '../includes/auth.php';
require_once '../includes/initiative.php';
require_once '../includes/campaigns.php';

// Ensure user is logged in
requireLogin();

header('Content-Type: application/json');

$user_id = $_SESSION['user_id'];
$response = ['success' => false, 'message' => 'Invalid request.'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';
    
    // Validate CSRF token
    if (!isset($input['csrf_token']) || !validateCSRFToken($input['csrf_token'])) {
        $response = ['success' => false, 'message' => 'Invalid request token.'];
        echo json_encode($response);
        exit();
    }
    
    switch ($action) {
        case 'start':
            $campaign_id = (int)($input['campaign_id'] ?? 0);
            $response = startInitiative($campaign_id, $user_id);
            break;
            
        case 'end':
            $campaign_id = (int)($input['campaign_id'] ?? 0);
            $response = endInitiative($campaign_id, $user_id);
            break;
            
        case 'add':
            $session_id = (int)($input['session_id'] ?? 0);
            $entries = $input['entries'] ?? [];
            $response = addToInitiative($session_id, $user_id, $entries);
            break;
            
        case 'next':
            $campaign_id = (int)($input['campaign_id'] ?? 0);
            $response = nextTurn($campaign_id, $user_id);
            break;
            
        case 'remove':
            $entry_id = (int)($input['entry_id'] ?? 0);
            $campaign_id = (int)($input['campaign_id'] ?? 0);
            $response = removeFromInitiative($entry_id, $user_id, $campaign_id);
            break;
            
        default:
            $response = ['success' => false, 'message' => 'Unknown action.'];
    }
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? '';
    
    switch ($action) {
        case 'status':
            $campaign_id = (int)($_GET['campaign_id'] ?? 0);
            $response = getInitiativeStatus($campaign_id, $user_id);
            break;
            
        default:
            $response = ['success' => false, 'message' => 'Unknown action.'];
    }
}

echo json_encode($response);
?>