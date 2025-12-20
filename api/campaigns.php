<?php

/**
 * Campaigns API Endpoint
 * 
 * Handles campaign-related API requests including creation, joining,
 * leaving, and management of D&D campaign data.
 * 
 * @author Initiative Tracker Team
 * @version 1.0.0
 */

session_start();
require_once '../config/database.php';
require_once '../includes/auth.php';
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
        case 'create':
            try {
                $name = sanitizeInput($input['name'] ?? '');
                $description = sanitizeInput($input['description'] ?? '');
                $max_players = (int)($input['max_players'] ?? 6);

                $response = createCampaign($name, $description, $user_id, $max_players);
            } catch (Exception $e) {
                $response = ['success' => false, 'message' => 'Server error: ' . $e->getMessage()];
            }
            break;

        case 'join':
            $join_code = strtoupper(sanitizeInput($input['join_code'] ?? ''));
            $response = joinCampaign($join_code, $user_id);
            break;

        case 'leave':
            $campaign_id = (int)($input['campaign_id'] ?? 0);
            $response = leaveCampaign($campaign_id, $user_id);
            break;

        default:
            $response = ['success' => false, 'message' => 'Unknown action.'];
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? '';

    switch ($action) {
        case 'list':
            $campaigns = getUserCampaigns($user_id);
            $response = ['success' => true, 'campaigns' => $campaigns];
            break;

        case 'details':
            $campaign_id = (int)($_GET['campaign_id'] ?? 0);
            $response = getCampaignDetails($campaign_id, $user_id);
            break;

        default:
            $response = ['success' => false, 'message' => 'Unknown action.'];
    }
}

echo json_encode($response);
