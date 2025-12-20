<?php
// Security functions and middleware

function sanitizeString($input, $max_length = null) {
    if (!is_string($input)) {
        return '';
    }
    
    $input = trim($input);
    $input = strip_tags($input);
    $input = htmlspecialchars($input, ENT_QUOTES, 'UTF-8');
    
    if ($max_length && strlen($input) > $max_length) {
        $input = substr($input, 0, $max_length);
    }
    
    return $input;
}

function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) && strlen($email) <= 255;
}

function validateUsername($username) {
    return preg_match('/^[a-zA-Z0-9_]{3,50}$/', $username);
}

function isValidCampaignJoinCode($code) {
    return preg_match('/^[A-Z0-9]{8}$/', $code);
}

function rateLimitCheck($identifier, $max_attempts = 10, $time_window = 300) {
    // Simple rate limiting using session
    $key = 'rate_limit_' . $identifier;
    $now = time();
    
    if (!isset($_SESSION[$key])) {
        $_SESSION[$key] = ['count' => 1, 'start' => $now];
        return true;
    }
    
    $data = $_SESSION[$key];
    
    // Reset if time window has passed
    if ($now - $data['start'] > $time_window) {
        $_SESSION[$key] = ['count' => 1, 'start' => $now];
        return true;
    }
    
    // Check if limit exceeded
    if ($data['count'] >= $max_attempts) {
        return false;
    }
    
    // Increment counter
    $_SESSION[$key]['count']++;
    return true;
}

function logSecurityEvent($type, $message, $user_id = null, $ip_address = null) {
    global $pdo;
    
    try {
        $ip_address = $ip_address ?: $_SERVER['REMOTE_ADDR'];
        $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? '';
        
        // Log to file (you might want to use a proper logging library)
        $log_entry = date('Y-m-d H:i:s') . " - {$type} - {$message} - User: {$user_id} - IP: {$ip_address}\n";
        error_log($log_entry, 3, '../logs/security.log');
        
    } catch (Exception $e) {
        error_log("Failed to log security event: " . $e->getMessage());
    }
}

function validateCampaignAccess($campaign_id, $user_id) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare("
            SELECT cm.id 
            FROM campaign_members cm 
            WHERE cm.campaign_id = ? AND cm.user_id = ? AND cm.is_active = TRUE
        ");
        $stmt->execute([$campaign_id, $user_id]);
        
        return $stmt->fetch() !== false;
        
    } catch (PDOException $e) {
        error_log("Error validating campaign access: " . $e->getMessage());
        return false;
    }
}

function validateCharacterAccess($character_id, $user_id, $is_gm = false) {
    global $pdo;
    
    try {
        if ($is_gm) {
            // GMs can access characters in their campaigns
            $stmt = $pdo->prepare("
                SELECT c.id 
                FROM characters c 
                JOIN campaigns camp ON c.campaign_id = camp.id 
                WHERE c.id = ? AND camp.game_master_id = ? AND c.is_active = TRUE
            ");
            $stmt->execute([$character_id, $user_id]);
        } else {
            // Players can access characters in campaigns they're members of
            $stmt = $pdo->prepare("
                SELECT c.id 
                FROM characters c 
                JOIN campaign_members cm ON c.campaign_id = cm.campaign_id
                WHERE c.id = ? AND cm.user_id = ? AND cm.is_active = TRUE AND c.is_active = TRUE
            ");
            $stmt->execute([$character_id, $user_id]);
        }
        
        return $stmt->fetch() !== false;
        
    } catch (PDOException $e) {
        error_log("Error validating character access: " . $e->getMessage());
        return false;
    }
}

function cleanupOldSessions() {
    global $pdo;
    
    try {
        // Remove expired sessions
        $stmt = $pdo->prepare("DELETE FROM user_sessions WHERE expires_at < NOW()");
        $stmt->execute();
        
        // Remove old login attempts (older than 24 hours)
        $stmt = $pdo->prepare("DELETE FROM login_attempts WHERE attempted_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)");
        $stmt->execute();
        
    } catch (PDOException $e) {
        error_log("Error cleaning up old sessions: " . $e->getMessage());
    }
}

function validateInput($input, $rules) {
    $errors = [];
    
    foreach ($rules as $field => $rule) {
        $value = $input[$field] ?? null;
        
        // Required check
        if (isset($rule['required']) && $rule['required'] && empty($value)) {
            $errors[$field] = ucfirst($field) . ' is required.';
            continue;
        }
        
        // Skip validation if not required and empty
        if (empty($value) && !isset($rule['required'])) {
            continue;
        }
        
        // Type validation
        if (isset($rule['type'])) {
            switch ($rule['type']) {
                case 'string':
                    if (!is_string($value)) {
                        $errors[$field] = ucfirst($field) . ' must be a string.';
                    }
                    break;
                case 'integer':
                    if (!is_numeric($value) || !ctype_digit(strval($value))) {
                        $errors[$field] = ucfirst($field) . ' must be a valid integer.';
                    }
                    break;
                case 'email':
                    if (!validateEmail($value)) {
                        $errors[$field] = ucfirst($field) . ' must be a valid email address.';
                    }
                    break;
            }
        }
        
        // Length validation
        if (isset($rule['min_length']) && strlen($value) < $rule['min_length']) {
            $errors[$field] = ucfirst($field) . ' must be at least ' . $rule['min_length'] . ' characters.';
        }
        
        if (isset($rule['max_length']) && strlen($value) > $rule['max_length']) {
            $errors[$field] = ucfirst($field) . ' must be no more than ' . $rule['max_length'] . ' characters.';
        }
        
        // Range validation for numbers
        if (isset($rule['min']) && is_numeric($value) && $value < $rule['min']) {
            $errors[$field] = ucfirst($field) . ' must be at least ' . $rule['min'] . '.';
        }
        
        if (isset($rule['max']) && is_numeric($value) && $value > $rule['max']) {
            $errors[$field] = ucfirst($field) . ' must be no more than ' . $rule['max'] . '.';
        }
        
        // Pattern validation
        if (isset($rule['pattern']) && !preg_match($rule['pattern'], $value)) {
            $errors[$field] = isset($rule['pattern_message']) 
                ? $rule['pattern_message'] 
                : ucfirst($field) . ' format is invalid.';
        }
    }
    
    return $errors;
}

// Security headers
function setSecurityHeaders() {
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('X-XSS-Protection: 1; mode=block');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    
    // Content Security Policy
    $csp = "default-src 'self'; " .
           "script-src 'self' 'unsafe-inline'; " .
           "style-src 'self' 'unsafe-inline'; " .
           "img-src 'self' data:; " .
           "font-src 'self'; " .
           "connect-src 'self'";
    header("Content-Security-Policy: $csp");
}

// IP Whitelisting for admin functions (if needed)
function isAdminIP() {
    $admin_ips = [
        '127.0.0.1',
        '::1'
        // Add more admin IPs as needed
    ];
    
    $client_ip = $_SERVER['REMOTE_ADDR'];
    return in_array($client_ip, $admin_ips);
}

// Call cleanup periodically (you might want to set up a cron job for this)
if (rand(1, 100) == 1) {
    cleanupOldSessions();
}

// Set security headers on every request
setSecurityHeaders();
?>