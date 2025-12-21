<?php
// Database config and auth should already be loaded by calling script

function generateJoinCode()
{
    return strtoupper(substr(md5(uniqid(rand(), true)), 0, 8));
}

function createCampaign($name, $description, $gm_id, $max_players = 6)
{
    global $pdo;

    // Validate input
    if (strlen($name) < 3 || strlen($name) > 100) {
        return ['success' => false, 'message' => 'Campaign name must be between 3 and 100 characters.'];
    }

    if ($max_players < 1 || $max_players > 10) {
        return ['success' => false, 'message' => 'Maximum players must be between 1 and 10.'];
    }

    try {
        $join_code = generateJoinCode();

        // Ensure join code is unique
        $stmt = $pdo->prepare("SELECT id FROM campaigns WHERE join_code = ?");
        $stmt->execute([$join_code]);
        while ($stmt->fetch()) {
            $join_code = generateJoinCode();
            $stmt = $pdo->prepare("SELECT id FROM campaigns WHERE join_code = ?");
            $stmt->execute([$join_code]);
        }

        $stmt = $pdo->prepare("
            INSERT INTO campaigns (name, description, game_master_id, join_code, max_players) 
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->execute([$name, $description, $gm_id, $join_code, $max_players]);

        $campaign_id = $pdo->lastInsertId();

        // Add GM as a member
        $stmt = $pdo->prepare("INSERT INTO campaign_members (campaign_id, user_id) VALUES (?, ?)");
        $stmt->execute([$campaign_id, $gm_id]);

        return ['success' => true, 'message' => 'Campaign created successfully.', 'campaign_id' => $campaign_id, 'join_code' => $join_code];
    } catch (PDOException $e) {
        error_log("Error creating campaign: " . $e->getMessage());
        return ['success' => false, 'message' => 'An error occurred while creating the campaign.'];
    }
}

function joinCampaign($join_code, $user_id)
{
    global $pdo;

    try {
        // Find campaign
        $stmt = $pdo->prepare("SELECT id, name, game_master_id, max_players FROM campaigns WHERE join_code = ? AND is_active = TRUE");
        $stmt->execute([$join_code]);
        $campaign = $stmt->fetch();

        if (!$campaign) {
            return ['success' => false, 'message' => 'Invalid join code or campaign not found.'];
        }

        // Check if user is already a member
        $stmt = $pdo->prepare("SELECT id FROM campaign_members WHERE campaign_id = ? AND user_id = ? AND is_active = TRUE");
        $stmt->execute([$campaign['id'], $user_id]);

        if ($stmt->fetch()) {
            return ['success' => false, 'message' => 'You are already a member of this campaign.'];
        }

        // Check if campaign is full
        $stmt = $pdo->prepare("SELECT COUNT(*) as member_count FROM campaign_members WHERE campaign_id = ? AND is_active = TRUE");
        $stmt->execute([$campaign['id']]);
        $member_count = $stmt->fetchColumn();

        if ($member_count >= $campaign['max_players']) {
            return ['success' => false, 'message' => 'This campaign is full.'];
        }

        // Add user to campaign
        $stmt = $pdo->prepare("INSERT INTO campaign_members (campaign_id, user_id) VALUES (?, ?)");
        $stmt->execute([$campaign['id'], $user_id]);

        return ['success' => true, 'message' => 'Successfully joined campaign: ' . $campaign['name']];
    } catch (PDOException $e) {
        error_log("Error joining campaign: " . $e->getMessage());
        return ['success' => false, 'message' => 'An error occurred while joining the campaign.'];
    }
}

function getUserCampaigns($user_id)
{
    global $pdo;

    try {
        $stmt = $pdo->prepare("
            SELECT c.*, cm.joined_at,
                   CASE WHEN c.game_master_id = ? THEN 'GM' ELSE 'Player' END as role,
                   u.username as gm_username
            FROM campaigns c 
            JOIN campaign_members cm ON c.id = cm.campaign_id 
            JOIN users u ON c.game_master_id = u.id
            WHERE cm.user_id = ? AND cm.is_active = TRUE AND c.is_active = TRUE 
            ORDER BY c.updated_at DESC
        ");
        $stmt->execute([$user_id, $user_id]);

        return $stmt->fetchAll();
    } catch (PDOException $e) {
        error_log("Error fetching user campaigns: " . $e->getMessage());
        return [];
    }
}

function getUserArchivedCampaigns($user_id, $search_term = '')
{
    global $pdo;

    try {
        $search_sql = '';
        $params = [$user_id, $user_id];
        
        if (!empty($search_term)) {
            $search_sql = ' AND (c.name LIKE ? OR c.description LIKE ? OR u.username LIKE ?)';
            $search_param = '%' . $search_term . '%';
            $params[] = $search_param;
            $params[] = $search_param;
            $params[] = $search_param;
        }

        $stmt = $pdo->prepare("
            SELECT c.*, cm.joined_at,
                   CASE WHEN c.game_master_id = ? THEN 'GM' ELSE 'Player' END as role,
                   u.username as gm_username,
                   (SELECT COUNT(*) FROM characters WHERE campaign_id = c.id AND is_active = FALSE) as character_count
            FROM campaigns c 
            JOIN campaign_members cm ON c.id = cm.campaign_id 
            JOIN users u ON c.game_master_id = u.id
            WHERE cm.user_id = ? AND c.is_active = FALSE {$search_sql}
            ORDER BY c.updated_at DESC
        ");
        $stmt->execute($params);

        return $stmt->fetchAll();
    } catch (PDOException $e) {
        error_log("Error fetching archived campaigns: " . $e->getMessage());
        return [];
    }
}

function getCampaignDetails($campaign_id, $user_id)
{
    global $pdo;

    try {
        // Check if user is a member
        $stmt = $pdo->prepare("SELECT id FROM campaign_members WHERE campaign_id = ? AND user_id = ? AND is_active = TRUE");
        $stmt->execute([$campaign_id, $user_id]);

        if (!$stmt->fetch()) {
            return ['success' => false, 'message' => 'You are not a member of this campaign.'];
        }

        // Get campaign details
        $stmt = $pdo->prepare("
            SELECT c.*, u.username as gm_username 
            FROM campaigns c 
            JOIN users u ON c.game_master_id = u.id 
            WHERE c.id = ?
        ");
        $stmt->execute([$campaign_id]);
        $campaign = $stmt->fetch();

        if (!$campaign) {
            return ['success' => false, 'message' => 'Campaign not found.'];
        }

        // Get campaign members
        $stmt = $pdo->prepare("
            SELECT u.id, u.username, cm.joined_at,
                   CASE WHEN c.game_master_id = u.id THEN 'GM' ELSE 'Player' END as role
            FROM users u
            JOIN campaign_members cm ON u.id = cm.user_id
            JOIN campaigns c ON cm.campaign_id = c.id
            WHERE cm.campaign_id = ? AND cm.is_active = TRUE
            ORDER BY cm.joined_at
        ");
        $stmt->execute([$campaign_id]);
        $members = $stmt->fetchAll();

        // Get characters in this campaign
        $stmt = $pdo->prepare("
            SELECT ch.*, u.username as player_username
            FROM characters ch
            JOIN users u ON ch.user_id = u.id
            WHERE ch.campaign_id = ? AND ch.is_active = TRUE
            ORDER BY ch.name
        ");
        $stmt->execute([$campaign_id]);
        $characters = $stmt->fetchAll();

        return [
            'success' => true,
            'campaign' => $campaign,
            'members' => $members,
            'characters' => $characters,
            'is_gm' => $campaign['game_master_id'] == $user_id
        ];
    } catch (PDOException $e) {
        error_log("Error fetching campaign details: " . $e->getMessage());
        return ['success' => false, 'message' => 'An error occurred while fetching campaign details.'];
    }
}

function isGameMaster($campaign_id, $user_id)
{
    global $pdo;

    try {
        $stmt = $pdo->prepare("SELECT game_master_id FROM campaigns WHERE id = ?");
        $stmt->execute([$campaign_id]);
        $gm_id = $stmt->fetchColumn();

        return $gm_id == $user_id;
    } catch (PDOException $e) {
        error_log("Error checking GM status: " . $e->getMessage());
        return false;
    }
}

function leaveCampaign($campaign_id, $user_id)
{
    global $pdo;

    try {
        // Check if user is the GM
        if (isGameMaster($campaign_id, $user_id)) {
            return ['success' => false, 'message' => 'Game Masters cannot leave their own campaigns. Transfer ownership or delete the campaign instead.'];
        }

        // Remove user from campaign
        $stmt = $pdo->prepare("UPDATE campaign_members SET is_active = FALSE WHERE campaign_id = ? AND user_id = ?");
        $stmt->execute([$campaign_id, $user_id]);

        // Deactivate user's characters in this campaign
        $stmt = $pdo->prepare("UPDATE characters SET is_active = FALSE WHERE campaign_id = ? AND user_id = ?");
        $stmt->execute([$campaign_id, $user_id]);

        return ['success' => true, 'message' => 'Successfully left the campaign.'];
    } catch (PDOException $e) {
        error_log("Error leaving campaign: " . $e->getMessage());
        return ['success' => false, 'message' => 'An error occurred while leaving the campaign.'];
    }
}

function endCampaign($campaign_id, $user_id)
{
    global $pdo;

    try {
        // Check if user is the GM of this campaign
        if (!isGameMaster($campaign_id, $user_id)) {
            return ['success' => false, 'message' => 'Only the Game Master can end the campaign.'];
        }

        // Set campaign to inactive
        $stmt = $pdo->prepare("UPDATE campaigns SET is_active = FALSE WHERE id = ? AND game_master_id = ?");
        $stmt->execute([$campaign_id, $user_id]);

        // Optionally deactivate all characters in the campaign (they can be reactivated if needed)
        $stmt = $pdo->prepare("UPDATE characters SET is_active = FALSE WHERE campaign_id = ?");
        $stmt->execute([$campaign_id]);

        return ['success' => true, 'message' => 'Campaign has been ended successfully. All characters have been archived.'];
    } catch (PDOException $e) {
        error_log("Error ending campaign: " . $e->getMessage());
        return ['success' => false, 'message' => 'An error occurred while ending the campaign.'];
    }
}

function getArchivedCampaignCharacters($campaign_id, $user_id)
{
    global $pdo;

    error_log("DEBUG: getArchivedCampaignCharacters called with campaign_id=$campaign_id, user_id=$user_id");

    try {
        // First verify the user was a member of this campaign (regardless of member active status for archived campaigns)
        $stmt = $pdo->prepare("
            SELECT c.name as campaign_name 
            FROM campaigns c 
            JOIN campaign_members cm ON c.id = cm.campaign_id 
            WHERE c.id = ? AND cm.user_id = ? AND c.is_active = FALSE
        ");
        $stmt->execute([$campaign_id, $user_id]);
        $campaign = $stmt->fetch();

        error_log("DEBUG: Campaign lookup result: " . json_encode($campaign));

        if (!$campaign) {
            error_log("DEBUG: Campaign not found or access denied");
            return ['success' => false, 'message' => 'Campaign not found or access denied.'];
        }

        // Get characters from the archived campaign
        $stmt = $pdo->prepare("
            SELECT id, name, race, 
                   COALESCE(char_class, class) as class, 
                   level, ability_scores, skills, background, alignment,
                   created_at
            FROM characters 
            WHERE campaign_id = ? AND user_id = ? AND is_active = FALSE
            ORDER BY created_at DESC
        ");
        $stmt->execute([$campaign_id, $user_id]);
        $characters = $stmt->fetchAll();

        error_log("DEBUG: Found " . count($characters) . " characters");

        return [
            'success' => true,
            'campaign_name' => $campaign['campaign_name'],
            'characters' => $characters
        ];
    } catch (PDOException $e) {
        error_log("ERROR fetching archived characters: " . $e->getMessage());
        error_log("ERROR SQL State: " . $e->getCode());
        return ['success' => false, 'message' => 'An error occurred while fetching characters.'];
    }
}
