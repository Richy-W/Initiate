<?php

/**
 * Characters API Endpoint
 * 
 * Handles character-related API requests including creation, editing,
 * importing, and management of D&D character data.
 * 
 * @author Initiative Tracker Team
 * @version 1.0.0
 */

session_start();
require_once '../config/database.php';
require_once '../includes/auth.php';
require_once '../includes/characters.php';
require_once '../includes/campaigns.php';

// Ensure user is logged in
requireLogin();

header('Content-Type: application/json');

$user_id = $_SESSION['user_id'];
$response = ['success' => false, 'message' => 'Invalid request.'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $_GET['action'] ?? $input['action'] ?? '';

    // For standalone character creation, we don't need CSRF token validation
    if ($action !== 'create_standalone' && $action !== 'import') {
        // Validate CSRF token
        if (!isset($input['csrf_token']) || !validateCSRFToken($input['csrf_token'])) {
            $response = ['success' => false, 'message' => 'Invalid request token.'];
            echo json_encode($response);
            exit();
        }
    }

    switch ($action) {
        case 'create':
            $campaign_id = (int)($input['campaign_id'] ?? 0);
            $character_data = $input['character_data'] ?? [];
            $response = createCharacter($campaign_id, $user_id, $character_data);
            break;

        case 'create_standalone':
            // Create character without campaign association
            $response = createStandaloneCharacter($user_id, $input);
            break;

        case 'import':
            // Import existing character to campaign
            $character_id = (int)($input['character_id'] ?? 0);
            $campaign_id = (int)($input['campaign_id'] ?? 0);
            $response = importCharacterToCampaign($character_id, $campaign_id, $user_id);
            break;
            $response = createCharacter($campaign_id, $user_id, $character_data);
            break;

        case 'update':
            $character_id = (int)($input['character_id'] ?? 0);
            $campaign_id = (int)($input['campaign_id'] ?? 0);
            $character_data = $input['character_data'] ?? [];

            // Check if user is GM of the campaign
            $is_gm = isGameMaster($campaign_id, $user_id);
            $response = updateCharacter($character_id, $user_id, $character_data, $is_gm);
            break;

        case 'delete':
            $character_id = (int)($input['character_id'] ?? 0);
            $campaign_id = (int)($input['campaign_id'] ?? 0);

            // Check if user is GM of the campaign
            $is_gm = isGameMaster($campaign_id, $user_id);
            $response = deleteCharacter($character_id, $user_id, $is_gm);
            break;

        default:
            $response = ['success' => false, 'message' => 'Unknown action.'];
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? '';

    switch ($action) {
        case 'get':
            $character_id = (int)($_GET['character_id'] ?? 0);
            $campaign_id = (int)($_GET['campaign_id'] ?? 0);

            if ($campaign_id > 0) {
                // Campaign character - check if user is GM of the campaign
                $is_gm = isGameMaster($campaign_id, $user_id);
                $response = getCharacter($character_id, $user_id, $is_gm);
            } else {
                // Personal character - just check ownership
                $response = getPersonalCharacter($character_id, $user_id);
            }
            break;

        case 'list':
            $campaign_id = (int)($_GET['campaign_id'] ?? 0);
            $response = getCampaignCharacters($campaign_id, $user_id);
            break;

        case 'list_personal':
            // List user's personal characters (not campaign-specific)
            $response = getUserCharacters($user_id);
            break;

        default:
            $response = ['success' => false, 'message' => 'Unknown action.'];
    }
}

echo json_encode($response);
