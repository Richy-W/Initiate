<?php
// Database config and auth should already be loaded by calling script

function startInitiative($campaign_id, $user_id)
{
    global $pdo;

    try {
        // Check if user is GM of the campaign
        $stmt = $pdo->prepare("SELECT game_master_id FROM campaigns WHERE id = ?");
        $stmt->execute([$campaign_id]);
        $gm_id = $stmt->fetchColumn();

        if ($gm_id != $user_id) {
            return ['success' => false, 'message' => 'Only the Game Master can start initiative.'];
        }

        // Check if there's already an active initiative session
        $stmt = $pdo->prepare("SELECT id FROM initiative_sessions WHERE campaign_id = ? AND is_active = TRUE");
        $stmt->execute([$campaign_id]);

        if ($stmt->fetch()) {
            return ['success' => false, 'message' => 'Initiative session is already active.'];
        }

        // Create new initiative session
        $stmt = $pdo->prepare("INSERT INTO initiative_sessions (campaign_id, started_by) VALUES (?, ?)");
        $stmt->execute([$campaign_id, $user_id]);

        $session_id = $pdo->lastInsertId();

        return ['success' => true, 'message' => 'Initiative started.', 'session_id' => $session_id];
    } catch (PDOException $e) {
        error_log("Error starting initiative: " . $e->getMessage());
        return ['success' => false, 'message' => 'An error occurred while starting initiative.'];
    }
}

function endInitiative($campaign_id, $user_id)
{
    global $pdo;

    try {
        // Check if user is GM of the campaign
        $stmt = $pdo->prepare("SELECT game_master_id FROM campaigns WHERE id = ?");
        $stmt->execute([$campaign_id]);
        $gm_id = $stmt->fetchColumn();

        if ($gm_id != $user_id) {
            return ['success' => false, 'message' => 'Only the Game Master can end initiative.'];
        }

        // End active initiative session
        $stmt = $pdo->prepare("UPDATE initiative_sessions SET is_active = FALSE WHERE campaign_id = ? AND is_active = TRUE");
        $stmt->execute([$campaign_id]);

        return ['success' => true, 'message' => 'Initiative ended.'];
    } catch (PDOException $e) {
        error_log("Error ending initiative: " . $e->getMessage());
        return ['success' => false, 'message' => 'An error occurred while ending initiative.'];
    }
}

function addToInitiative($session_id, $user_id, $entries)
{
    global $pdo;

    try {
        error_log("Adding to initiative - session_id: {$session_id}, entries: " . json_encode($entries));

        // Check if session exists and user has permission
        $stmt = $pdo->prepare("
            SELECT s.id, c.game_master_id 
            FROM initiative_sessions s 
            JOIN campaigns c ON s.campaign_id = c.id 
            WHERE s.id = ? AND s.is_active = TRUE
        ");
        $stmt->execute([$session_id]);
        $session = $stmt->fetch();

        if (!$session) {
            return ['success' => false, 'message' => 'Initiative session not found or not active.'];
        }

        $is_gm = $session['game_master_id'] == $user_id;

        foreach ($entries as $entry) {
            error_log("Processing entry: " . json_encode($entry));

            $character_id = (int)($entry['character_id'] ?? 0);
            $name = sanitizeInput($entry['name'] ?? '');
            $initiative_roll = (int)($entry['initiative_roll'] ?? 0);
            $initiative_bonus = (int)($entry['initiative_bonus'] ?? 0);

            // Fix boolean conversion - handle string 'true'/'false' from JSON
            $is_player_raw = $entry['is_player'] ?? true;
            if (is_string($is_player_raw)) {
                $is_player = $is_player_raw === 'true';
            } else {
                $is_player = (bool)$is_player_raw;
            }

            // If adding a character, verify permissions
            if ($character_id > 0) {
                if ($is_player && !$is_gm) {
                    // Players can only add their own characters
                    $stmt = $pdo->prepare("SELECT id FROM characters WHERE id = ? AND user_id = ?");
                    $stmt->execute([$character_id, $user_id]);
                    if (!$stmt->fetch()) {
                        continue; // Skip this entry
                    }
                } elseif (!$is_gm && !$is_player) {
                    // Only GM can add NPCs
                    continue;
                }

                // Get character data
                $stmt = $pdo->prepare("SELECT name, initiative_bonus FROM characters WHERE id = ?");
                $stmt->execute([$character_id]);
                $character = $stmt->fetch();

                if ($character) {
                    $name = $character['name'];
                    $initiative_bonus = $character['initiative_bonus'];
                }
            } else {
                // NPC/Monster - only GM can add
                if (!$is_gm) {
                    continue;
                }
                $is_player = false;
                error_log("Adding NPC: name={$name}, is_player=false, character_id=0");
            }

            if (empty($name)) {
                error_log("Skipping entry with empty name");
                continue;
            }

            if ($initiative_roll < 1 || $initiative_roll > 20) {
                error_log("Invalid initiative roll: {$initiative_roll}");
                continue;
            }

            // Calculate total initiative
            $total_initiative = $initiative_roll + $initiative_bonus;

            // Get current max order position
            $stmt = $pdo->prepare("SELECT COALESCE(MAX(order_position), 0) FROM initiative_entries WHERE session_id = ?");
            $stmt->execute([$session_id]);
            $max_position = $stmt->fetchColumn();

            // Add entry
            error_log("Inserting initiative entry: name={$name}, is_player=" . ($is_player ? 'true' : 'false') . ", character_id={$character_id}");
            $stmt = $pdo->prepare("
                INSERT INTO initiative_entries (session_id, character_id, name, initiative_roll, initiative_bonus, is_player, order_position) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([$session_id, $character_id ?: null, $name, $initiative_roll, $initiative_bonus, $is_player ? 1 : 0, $max_position + 1]);
        }

        // Re-sort initiative order
        sortInitiativeOrder($session_id);

        return ['success' => true, 'message' => 'Entries added to initiative.'];
    } catch (PDOException $e) {
        error_log("Error adding to initiative: " . $e->getMessage());
        return ['success' => false, 'message' => 'An error occurred while adding to initiative.'];
    }
}

function sortInitiativeOrder($session_id)
{
    global $pdo;

    try {
        // Get all entries sorted by initiative (roll + bonus) descending, then by roll descending
        $stmt = $pdo->prepare("
            SELECT id, (initiative_roll + initiative_bonus) as total_initiative, initiative_roll
            FROM initiative_entries 
            WHERE session_id = ? AND is_active = TRUE
            ORDER BY total_initiative DESC, initiative_roll DESC
        ");
        $stmt->execute([$session_id]);
        $entries = $stmt->fetchAll();

        // Update order positions
        $position = 1;
        foreach ($entries as $entry) {
            $stmt = $pdo->prepare("UPDATE initiative_entries SET order_position = ? WHERE id = ?");
            $stmt->execute([$position, $entry['id']]);
            $position++;
        }

        return true;
    } catch (PDOException $e) {
        error_log("Error sorting initiative: " . $e->getMessage());
        return false;
    }
}

function nextTurn($campaign_id, $user_id)
{
    global $pdo;

    try {
        // Check if user is GM
        $stmt = $pdo->prepare("SELECT game_master_id FROM campaigns WHERE id = ?");
        $stmt->execute([$campaign_id]);
        $gm_id = $stmt->fetchColumn();

        if ($gm_id != $user_id) {
            return ['success' => false, 'message' => 'Only the Game Master can advance initiative.'];
        }

        // Get active session
        $stmt = $pdo->prepare("SELECT id, current_turn, round_number FROM initiative_sessions WHERE campaign_id = ? AND is_active = TRUE");
        $stmt->execute([$campaign_id]);
        $session = $stmt->fetch();

        if (!$session) {
            return ['success' => false, 'message' => 'No active initiative session.'];
        }

        // Get total number of active entries
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM initiative_entries WHERE session_id = ? AND is_active = TRUE");
        $stmt->execute([$session['id']]);
        $total_entries = $stmt->fetchColumn();

        if ($total_entries == 0) {
            return ['success' => false, 'message' => 'No entries in initiative.'];
        }

        $new_turn = $session['current_turn'] + 1;
        $new_round = $session['round_number'];

        // Check if we've completed a round
        if ($new_turn > $total_entries) {
            $new_turn = 1;
            $new_round++;
        }

        // Update session
        $stmt = $pdo->prepare("UPDATE initiative_sessions SET current_turn = ?, round_number = ? WHERE id = ?");
        $stmt->execute([$new_turn, $new_round, $session['id']]);

        return ['success' => true, 'message' => 'Advanced to next turn.', 'turn' => $new_turn, 'round' => $new_round];
    } catch (PDOException $e) {
        error_log("Error advancing turn: " . $e->getMessage());
        return ['success' => false, 'message' => 'An error occurred while advancing turn.'];
    }
}

function removeFromInitiative($entry_id, $user_id, $campaign_id)
{
    global $pdo;

    try {
        // Check permissions
        $stmt = $pdo->prepare("
            SELECT ie.id, ie.character_id, c.game_master_id, ch.user_id as character_owner
            FROM initiative_entries ie
            JOIN initiative_sessions is_sess ON ie.session_id = is_sess.id
            JOIN campaigns c ON is_sess.campaign_id = c.id
            LEFT JOIN characters ch ON ie.character_id = ch.id
            WHERE ie.id = ? AND c.id = ?
        ");
        $stmt->execute([$entry_id, $campaign_id]);
        $entry = $stmt->fetch();

        if (!$entry) {
            return ['success' => false, 'message' => 'Initiative entry not found.'];
        }

        $is_gm = $entry['game_master_id'] == $user_id;
        $is_character_owner = $entry['character_owner'] == $user_id;

        if (!$is_gm && !$is_character_owner) {
            return ['success' => false, 'message' => 'You do not have permission to remove this entry.'];
        }

        // Remove entry
        $stmt = $pdo->prepare("UPDATE initiative_entries SET is_active = FALSE WHERE id = ?");
        $stmt->execute([$entry_id]);

        // Re-sort remaining entries
        $stmt = $pdo->prepare("SELECT session_id FROM initiative_entries WHERE id = ?");
        $stmt->execute([$entry_id]);
        $session_id = $stmt->fetchColumn();

        sortInitiativeOrder($session_id);

        return ['success' => true, 'message' => 'Entry removed from initiative.'];
    } catch (PDOException $e) {
        error_log("Error removing from initiative: " . $e->getMessage());
        return ['success' => false, 'message' => 'An error occurred while removing from initiative.'];
    }
}

function getInitiativeStatus($campaign_id, $user_id)
{
    global $pdo;

    try {
        // Check if user is a member of the campaign
        $stmt = $pdo->prepare("SELECT id FROM campaign_members WHERE campaign_id = ? AND user_id = ? AND is_active = TRUE");
        $stmt->execute([$campaign_id, $user_id]);

        if (!$stmt->fetch()) {
            return ['success' => false, 'message' => 'You are not a member of this campaign.'];
        }

        // Get active session
        $stmt = $pdo->prepare("
            SELECT id, current_turn, round_number, started_at, started_by 
            FROM initiative_sessions 
            WHERE campaign_id = ? AND is_active = TRUE
        ");
        $stmt->execute([$campaign_id]);
        $session = $stmt->fetch();

        if (!$session) {
            return ['success' => true, 'active' => false, 'message' => 'No active initiative session.'];
        }

        // Get initiative entries
        $stmt = $pdo->prepare("
            SELECT ie.*, c.name as character_name, u.username as player_username,
                   (ie.initiative_roll + ie.initiative_bonus) as total_initiative
            FROM initiative_entries ie
            LEFT JOIN characters c ON ie.character_id = c.id
            LEFT JOIN users u ON c.user_id = u.id
            WHERE ie.session_id = ? AND ie.is_active = TRUE
            ORDER BY ie.order_position
        ");
        $stmt->execute([$session['id']]);
        $entries = $stmt->fetchAll();

        return [
            'success' => true,
            'active' => true,
            'session' => $session,
            'entries' => $entries
        ];
    } catch (PDOException $e) {
        error_log("Error getting initiative status: " . $e->getMessage());
        return ['success' => false, 'message' => 'An error occurred while getting initiative status.'];
    }
}
