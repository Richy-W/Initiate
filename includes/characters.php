<?php
// Database config and auth should already be loaded by calling script

function createCharacter($campaign_id, $user_id, $character_data) {
    // Check if this is an NPC being created by GM
    $is_npc = (bool)($character_data['is_npc'] ?? false);
    
    // Only GMs can create NPCs
    if ($is_npc) {
        global $pdo;
        $stmt = $pdo->prepare("SELECT game_master_id FROM campaigns WHERE id = ?");
        $stmt->execute([$campaign_id]);
        $campaign = $stmt->fetch();
        
        if (!$campaign || $campaign['game_master_id'] != $user_id) {
            return ['success' => false, 'message' => 'Only Game Masters can create NPCs.'];
        }
    }
    
    // Normalize the character data to match standalone format
    if (isset($character_data['class'])) {
        $character_data['char_class'] = $character_data['class'];
        unset($character_data['class']);
    }
    
    // Set default values for campaign characters
    $character_data['hit_points'] = $character_data['max_hit_points'] ?? $character_data['hit_points'] ?? 8;
    $character_data['initiative_modifier'] = $character_data['initiative_bonus'] ?? $character_data['initiative_modifier'] ?? 0;
    
    // Use the unified standalone character creation with campaign_id
    return createStandaloneCharacter($user_id, $character_data, $campaign_id);
}

function updateCharacter($character_id, $user_id, $character_data, $is_gm = false) {
    global $pdo;
    
    try {
        // Check permissions
        if ($is_gm) {
            // GM can edit any character in their campaigns
            $stmt = $pdo->prepare("
                SELECT c.id, c.campaign_id 
                FROM characters c 
                JOIN campaigns camp ON c.campaign_id = camp.id 
                WHERE c.id = ? AND camp.game_master_id = ? AND c.is_active = TRUE
            ");
            $stmt->execute([$character_id, $user_id]);
        } else {
            // Players can only edit their own characters
            $stmt = $pdo->prepare("SELECT id, campaign_id FROM characters WHERE id = ? AND user_id = ? AND is_active = TRUE");
            $stmt->execute([$character_id, $user_id]);
        }
        
        $character = $stmt->fetch();
        if (!$character) {
            return ['success' => false, 'message' => 'Character not found or you do not have permission to edit it.'];
        }
        
        // Validate and sanitize input
        $name = sanitizeInput($character_data['name'] ?? '');
        if (strlen($name) < 1 || strlen($name) > 100) {
            return ['success' => false, 'message' => 'Character name must be between 1 and 100 characters.'];
        }
        
        // Validate stats
        $stats = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
        foreach ($stats as $stat) {
            if (isset($character_data[$stat])) {
                $value = (int)$character_data[$stat];
                if ($value < 1 || $value > 30) {
                    return ['success' => false, 'message' => ucfirst($stat) . ' must be between 1 and 30.'];
                }
                $character_data[$stat] = $value;
            }
        }
        
        // Build update query
        $updates = [];
        $params = [];
        
        if (isset($character_data['name'])) {
            $updates[] = "name = ?";
            $params[] = $name;
        }
        if (isset($character_data['race'])) {
            $updates[] = "race = ?";
            $params[] = sanitizeInput($character_data['race']);
        }
        if (isset($character_data['class'])) {
            $updates[] = "class = ?";
            $params[] = sanitizeInput($character_data['class']);
        }
        if (isset($character_data['level'])) {
            $updates[] = "level = ?";
            $params[] = max(1, (int)$character_data['level']);
        }
        
        foreach ($stats as $stat) {
            if (isset($character_data[$stat])) {
                $updates[] = "$stat = ?";
                $params[] = $character_data[$stat];
            }
        }
        
        if (isset($character_data['max_hit_points'])) {
            $updates[] = "max_hit_points = ?";
            $params[] = max(1, (int)$character_data['max_hit_points']);
        }
        if (isset($character_data['current_hit_points'])) {
            $updates[] = "current_hit_points = ?";
            $params[] = max(0, (int)$character_data['current_hit_points']);
        }
        if (isset($character_data['armor_class'])) {
            $updates[] = "armor_class = ?";
            $params[] = max(1, (int)$character_data['armor_class']);
        }
        if (isset($character_data['speed'])) {
            $updates[] = "speed = ?";
            $params[] = max(0, (int)$character_data['speed']);
        }
        
        // Calculate initiative bonus if dexterity changed
        if (isset($character_data['dexterity']) || isset($character_data['initiative_bonus_extra'])) {
            $stmt = $pdo->prepare("SELECT dexterity FROM characters WHERE id = ?");
            $stmt->execute([$character_id]);
            $current_dex = $stmt->fetchColumn();
            
            $dex = $character_data['dexterity'] ?? $current_dex;
            $dex_modifier = floor(($dex - 10) / 2);
            $extra_bonus = (int)($character_data['initiative_bonus_extra'] ?? 0);
            
            $updates[] = "initiative_bonus = ?";
            $params[] = $dex_modifier + $extra_bonus;
        }
        
        // Handle additional character data
        if (isset($character_data['additional_data'])) {
            $updates[] = "character_data = ?";
            $params[] = json_encode($character_data['additional_data']);
        }
        
        if (empty($updates)) {
            return ['success' => false, 'message' => 'No valid data to update.'];
        }
        
        $updates[] = "updated_at = NOW()";
        $params[] = $character_id;
        
        $sql = "UPDATE characters SET " . implode(', ', $updates) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        return ['success' => true, 'message' => 'Character updated successfully.'];
        
    } catch (PDOException $e) {
        error_log("Error updating character: " . $e->getMessage());
        return ['success' => false, 'message' => 'An error occurred while updating the character.'];
    }
}

function getCharacter($character_id, $user_id, $is_gm = false) {
    global $pdo;
    
    try {
        if ($is_gm) {
            // GM can view any character in their campaigns
            $stmt = $pdo->prepare("
                SELECT c.*, u.username as player_username
                FROM characters c 
                JOIN users u ON c.user_id = u.id
                JOIN campaigns camp ON c.campaign_id = camp.id 
                WHERE c.id = ? AND camp.game_master_id = ? AND c.is_active = TRUE
            ");
            $stmt->execute([$character_id, $user_id]);
        } else {
            // Players can view characters in campaigns they're members of
            $stmt = $pdo->prepare("
                SELECT c.*, u.username as player_username
                FROM characters c 
                JOIN users u ON c.user_id = u.id
                JOIN campaign_members cm ON c.campaign_id = cm.campaign_id
                WHERE c.id = ? AND cm.user_id = ? AND cm.is_active = TRUE AND c.is_active = TRUE
            ");
            $stmt->execute([$character_id, $user_id]);
        }
        
        $character = $stmt->fetch();
        if (!$character) {
            return ['success' => false, 'message' => 'Character not found or you do not have permission to view it.'];
        }
        
        // Parse additional data
        $character['additional_data'] = json_decode($character['character_data'] ?? '{}', true);
        
        // Calculate ability modifiers
        $stats = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
        foreach ($stats as $stat) {
            $character[$stat . '_modifier'] = floor(($character[$stat] - 10) / 2);
        }
        
        return ['success' => true, 'character' => $character];
        
    } catch (PDOException $e) {
        error_log("Error fetching character: " . $e->getMessage());
        return ['success' => false, 'message' => 'An error occurred while fetching the character.'];
    }
}

function deleteCharacter($character_id, $user_id, $is_gm = false) {
    global $pdo;
    
    try {
        if ($is_gm) {
            // GM can delete any character in their campaigns
            $stmt = $pdo->prepare("
                SELECT c.id 
                FROM characters c 
                JOIN campaigns camp ON c.campaign_id = camp.id 
                WHERE c.id = ? AND camp.game_master_id = ? AND c.is_active = TRUE
            ");
            $stmt->execute([$character_id, $user_id]);
        } else {
            // Players can only delete their own characters
            $stmt = $pdo->prepare("SELECT id FROM characters WHERE id = ? AND user_id = ? AND is_active = TRUE");
            $stmt->execute([$character_id, $user_id]);
        }
        
        if (!$stmt->fetch()) {
            return ['success' => false, 'message' => 'Character not found or you do not have permission to delete it.'];
        }
        
        // Soft delete
        $stmt = $pdo->prepare("UPDATE characters SET is_active = FALSE WHERE id = ?");
        $stmt->execute([$character_id]);
        
        return ['success' => true, 'message' => 'Character deleted successfully.'];
        
    } catch (PDOException $e) {
        error_log("Error deleting character: " . $e->getMessage());
        return ['success' => false, 'message' => 'An error occurred while deleting the character.'];
    }
}

function getCampaignCharacters($campaign_id, $user_id) {
    global $pdo;
    
    try {
        // Check if user is a member of the campaign and get GM status
        $stmt = $pdo->prepare("
            SELECT cm.id, c.game_master_id 
            FROM campaign_members cm 
            JOIN campaigns c ON cm.campaign_id = c.id 
            WHERE cm.campaign_id = ? AND cm.user_id = ? AND cm.is_active = TRUE
        ");
        $stmt->execute([$campaign_id, $user_id]);
        $member = $stmt->fetch();
        
        if (!$member) {
            return ['success' => false, 'message' => 'You are not a member of this campaign.'];
        }
        
        $is_gm = $member['game_master_id'] == $user_id;
        
        // Get characters - include NPCs if user is GM
        if ($is_gm) {
            $stmt = $pdo->prepare("
                SELECT c.*, u.username as player_username
                FROM characters c
                LEFT JOIN users u ON c.user_id = u.id
                WHERE c.campaign_id = ? AND c.is_active = TRUE
                ORDER BY c.is_npc ASC, c.name
            ");
        } else {
            $stmt = $pdo->prepare("
                SELECT c.*, u.username as player_username
                FROM characters c
                JOIN users u ON c.user_id = u.id
                WHERE c.campaign_id = ? AND c.is_active = TRUE AND c.is_npc = FALSE
                ORDER BY c.name
            ");
        }
        $stmt->execute([$campaign_id]);
        $characters = $stmt->fetchAll();
        
        // Add calculated modifiers
        foreach ($characters as &$character) {
            $stats = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
            foreach ($stats as $stat) {
                $character[$stat . '_modifier'] = floor(($character[$stat] - 10) / 2);
            }
            $character['additional_data'] = json_decode($character['character_data'] ?? '{}', true);
        }
        
        return ['success' => true, 'characters' => $characters];
        
    } catch (PDOException $e) {
        error_log("Error fetching campaign characters: " . $e->getMessage());
        return ['success' => false, 'message' => 'An error occurred while fetching characters.'];
    }
}

function createStandaloneCharacter($user_id, $character_data, $campaign_id = null) {
    global $pdo;
    
    // Validate required fields
    $name = sanitizeInput($character_data['name'] ?? '');
    if (strlen($name) < 1 || strlen($name) > 100) {
        return ['success' => false, 'message' => 'Character name must be between 1 and 100 characters.'];
    }
    
    // If campaign_id is provided, validate campaign membership
    if ($campaign_id) {
        $stmt = $pdo->prepare("SELECT id, game_master_id FROM campaigns WHERE id = ?");
        $stmt->execute([$campaign_id]);
        $campaign = $stmt->fetch();
        
        if (!$campaign) {
            return ['success' => false, 'message' => 'Campaign not found.'];
        }
        
        $is_gm = $campaign['game_master_id'] == $user_id;
        
        // Validate campaign membership for non-NPCs
        if (!($character_data['is_npc'] ?? false)) {
            $stmt = $pdo->prepare("SELECT id FROM campaign_members WHERE campaign_id = ? AND user_id = ? AND is_active = TRUE");
            $stmt->execute([$campaign_id, $user_id]);
            if (!$stmt->fetch()) {
                return ['success' => false, 'message' => 'You are not a member of this campaign.'];
            }
        }
    }
    
    try {
        // Validate stats (must be between 3 and 20 for standalone, 1 and 30 for campaign)
        $min_stat = $campaign_id ? 1 : 3;
        $max_stat = $campaign_id ? 30 : 20;
        $stats = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
        foreach ($stats as $stat) {
            $value = (int)($character_data[$stat] ?? 10);
            if ($value < $min_stat || $value > $max_stat) {
                return ['success' => false, 'message' => ucfirst($stat) . ' must be between ' . $min_stat . ' and ' . $max_stat . '.'];
            }
            $character_data[$stat] = $value;
        }
        
        // Prepare additional data
        $additional_data = [
            'equipment' => $character_data['equipment'] ?? [],
            'features_traits' => sanitizeInput($character_data['features_traits'] ?? ''),
            'backstory' => sanitizeInput($character_data['backstory'] ?? ''),
            'skills' => $character_data['skills'] ?? [],
            'saving_throws' => $character_data['saving_throws'] ?? [],
            'spells' => $character_data['spells'] ?? [],
            'features' => $character_data['features'] ?? [],
            'notes' => sanitizeInput($character_data['notes'] ?? '')
        ];
        
        // Determine if this is an NPC
        $is_npc = (bool)($character_data['is_npc'] ?? false);
        
        $stmt = $pdo->prepare("
            INSERT INTO characters (
                campaign_id, user_id, name, race, char_class, level, background, alignment,
                strength, dexterity, constitution, intelligence, wisdom, charisma,
                armor_class, hit_points, speed, proficiency_bonus, initiative_modifier,
                character_data, is_npc
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?,
                ?, ?
            )
        ");
        
        $result = $stmt->execute([
            $campaign_id, // Can be null for standalone characters
            $is_npc ? null : $user_id, // NPCs don't have a user_id owner
            $name,
            sanitizeInput($character_data['race'] ?? ''),
            sanitizeInput($character_data['char_class'] ?? ''),
            max(1, min(20, (int)($character_data['level'] ?? 1))),
            sanitizeInput($character_data['background'] ?? ''),
            sanitizeInput($character_data['alignment'] ?? ''),
            $character_data['strength'],
            $character_data['dexterity'],
            $character_data['constitution'],
            $character_data['intelligence'],
            $character_data['wisdom'],
            $character_data['charisma'],
            max(1, (int)($character_data['armor_class'] ?? 10)),
            max(1, (int)($character_data['hit_points'] ?? 8)),
            max(0, (int)($character_data['speed'] ?? 30)),
            max(2, min(6, (int)($character_data['proficiency_bonus'] ?? 2))),
            (int)($character_data['initiative_modifier'] ?? 0),
            json_encode($additional_data),
            $is_npc
        ]);
        
        if ($result) {
            $character_id = $pdo->lastInsertId();
            return ['success' => true, 'character_id' => $character_id, 'message' => 'Character created successfully.'];
        }
        
        return ['success' => false, 'message' => 'Failed to create character.'];
        
    } catch (PDOException $e) {
        error_log("Error creating standalone character: " . $e->getMessage());
        return ['success' => false, 'message' => 'An error occurred while creating the character.'];
    }
}

function getUserCharacters($user_id) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare("
            SELECT id, name, race, char_class, level, background, alignment,
                   armor_class, hit_points, speed, created_at,
                   strength, dexterity, constitution, intelligence, wisdom, charisma
            FROM characters 
            WHERE user_id = ? AND is_npc = FALSE
            ORDER BY created_at DESC
        ");
        
        $stmt->execute([$user_id]);
        $characters = $stmt->fetchAll();
        
        // Add calculated modifiers
        foreach ($characters as &$character) {
            $stats = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
            foreach ($stats as $stat) {
                $character[$stat . '_modifier'] = floor(($character[$stat] - 10) / 2);
            }
        }
        
        return ['success' => true, 'characters' => $characters];
        
    } catch (PDOException $e) {
        error_log("Error fetching user characters: " . $e->getMessage());
        return ['success' => false, 'message' => 'An error occurred while fetching characters.'];
    }
}

function importCharacterToCampaign($character_id, $campaign_id, $user_id) {
    global $pdo;
    
    try {
        // Check if character exists and belongs to user
        $stmt = $pdo->prepare("SELECT * FROM characters WHERE id = ? AND user_id = ? AND is_npc = FALSE");
        $stmt->execute([$character_id, $user_id]);
        $character = $stmt->fetch();
        
        if (!$character) {
            return ['success' => false, 'message' => 'Character not found or access denied.'];
        }
        
        // Check if user is member of campaign
        $stmt = $pdo->prepare("SELECT id FROM campaign_members WHERE campaign_id = ? AND user_id = ? AND is_active = TRUE");
        $stmt->execute([$campaign_id, $user_id]);
        if (!$stmt->fetch()) {
            return ['success' => false, 'message' => 'You are not a member of this campaign.'];
        }
        
        // Check if character is already in this campaign
        $stmt = $pdo->prepare("SELECT id FROM campaign_characters WHERE campaign_id = ? AND character_id = ?");
        $stmt->execute([$campaign_id, $character_id]);
        if ($stmt->fetch()) {
            return ['success' => false, 'message' => 'Character is already in this campaign.'];
        }
        
        // Add character to campaign
        $stmt = $pdo->prepare("
            INSERT INTO campaign_characters (campaign_id, character_id, added_at) 
            VALUES (?, ?, NOW())
        ");
        
        $result = $stmt->execute([$campaign_id, $character_id]);
        
        if ($result) {
            return ['success' => true, 'message' => 'Character imported to campaign successfully.'];
        }
        
        return ['success' => false, 'message' => 'Failed to import character to campaign.'];
        
    } catch (PDOException $e) {
        error_log("Error importing character to campaign: " . $e->getMessage());
        return ['success' => false, 'message' => 'An error occurred while importing the character.'];
    }
}

function getPersonalCharacter($character_id, $user_id) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare("
            SELECT *, character_data 
            FROM characters 
            WHERE id = ? AND user_id = ? AND is_npc = FALSE
        ");
        
        $stmt->execute([$character_id, $user_id]);
        $character = $stmt->fetch();
        
        if (!$character) {
            return ['success' => false, 'message' => 'Character not found or access denied.'];
        }
        
        // Add calculated modifiers
        $stats = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
        foreach ($stats as $stat) {
            $character[$stat . '_modifier'] = floor(($character[$stat] - 10) / 2);
        }
        
        // Parse additional data
        $character['additional_data'] = json_decode($character['character_data'] ?? '{}', true);
        
        return ['success' => true, 'character' => $character];
        
    } catch (PDOException $e) {
        error_log("Error fetching personal character: " . $e->getMessage());
        return ['success' => false, 'message' => 'An error occurred while fetching the character.'];
    }
}
?>