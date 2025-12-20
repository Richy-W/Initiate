<?php
// Database config should already be loaded by the calling script

// Session timeout in seconds (30 days)
if (!defined('SESSION_TIMEOUT')) {
    define('SESSION_TIMEOUT', 2592000); // 30 days (30 * 24 * 60 * 60)
}

// Authentication functions
function hashPassword($password) {
    return password_hash($password, PASSWORD_DEFAULT);
}

function verifyPassword($password, $hash) {
    return password_verify($password, $hash);
}

function isLoggedIn() {
    return isset($_SESSION['user_id']) && $_SESSION['user_id'] > 0;
}

function requireLogin() {
    if (!isLoggedIn()) {
        header('Location: auth/login.php');
        exit();
    }
}

function getCurrentUser() {
    global $pdo;
    
    if (!isLoggedIn()) {
        return null;
    }
    
    try {
        $stmt = $pdo->prepare("SELECT id, username, email, created_at FROM users WHERE id = ?");
        $stmt->execute([$_SESSION['user_id']]);
        return $stmt->fetch();
    } catch (PDOException $e) {
        error_log("Error fetching current user: " . $e->getMessage());
        return null;
    }
}

function loginUser($username_or_email, $password, $ip_address) {
    global $pdo;
    
    // Check for too many failed attempts
    if (hasExceededLoginAttempts($username_or_email, $ip_address)) {
        return ['success' => false, 'message' => 'Too many failed login attempts. Please try again later.'];
    }
    
    try {
        // Find user by username or email
        $stmt = $pdo->prepare("SELECT id, username, email, password_hash, is_active, locked_until FROM users WHERE username = ? OR email = ?");
        $stmt->execute([$username_or_email, $username_or_email]);
        $user = $stmt->fetch();
        
        // Log the attempt
        logLoginAttempt($username_or_email, $ip_address, false);
        
        if (!$user) {
            return ['success' => false, 'message' => 'Invalid credentials.'];
        }
        
        if (!$user['is_active']) {
            return ['success' => false, 'message' => 'Account is deactivated.'];
        }
        
        if ($user['locked_until'] && strtotime($user['locked_until']) > time()) {
            return ['success' => false, 'message' => 'Account is temporarily locked.'];
        }
        
        if (!verifyPassword($password, $user['password_hash'])) {
            incrementFailedLoginAttempts($user['id']);
            return ['success' => false, 'message' => 'Invalid credentials.'];
        }
        
        // Successful login
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['login_time'] = time();
        
        // Log successful attempt
        logLoginAttempt($username_or_email, $ip_address, true);
        
        // Update last login and reset failed attempts
        $updateStmt = $pdo->prepare("UPDATE users SET last_login = NOW(), failed_login_attempts = 0, locked_until = NULL WHERE id = ?");
        $updateStmt->execute([$user['id']]);
        
        return ['success' => true, 'message' => 'Login successful.', 'user' => $user];
        
    } catch (PDOException $e) {
        error_log("Login error: " . $e->getMessage());
        return ['success' => false, 'message' => 'An error occurred during login.'];
    }
}

function registerUser($username, $email, $password) {
    global $pdo;
    
    // Validate input
    if (strlen($username) < 3 || strlen($username) > 50) {
        return ['success' => false, 'message' => 'Username must be between 3 and 50 characters.'];
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return ['success' => false, 'message' => 'Invalid email format.'];
    }
    
    if (strlen($password) < 8) {
        return ['success' => false, 'message' => 'Password must be at least 8 characters long.'];
    }
    
    try {
        // Check if username or email already exists
        $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
        $stmt->execute([$username, $email]);
        
        if ($stmt->fetch()) {
            return ['success' => false, 'message' => 'Username or email already exists.'];
        }
        
        // Create new user
        $passwordHash = hashPassword($password);
        $stmt = $pdo->prepare("INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)");
        $stmt->execute([$username, $email, $passwordHash]);
        
        return ['success' => true, 'message' => 'Registration successful.'];
        
    } catch (PDOException $e) {
        error_log("Registration error: " . $e->getMessage());
        return ['success' => false, 'message' => 'An error occurred during registration.'];
    }
}

function logoutUser() {
    session_unset();
    session_destroy();
    session_start();
}

function hasExceededLoginAttempts($username_or_email, $ip_address) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as attempts 
            FROM login_attempts 
            WHERE (email_or_username = ? OR ip_address = ?) 
            AND attempted_at > DATE_SUB(NOW(), INTERVAL 15 MINUTE)
            AND was_successful = FALSE
        ");
        $stmt->execute([$username_or_email, $ip_address]);
        $result = $stmt->fetch();
        
        return $result['attempts'] >= MAX_LOGIN_ATTEMPTS;
        
    } catch (PDOException $e) {
        error_log("Error checking login attempts: " . $e->getMessage());
        return false;
    }
}

function logLoginAttempt($username_or_email, $ip_address, $successful) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare("INSERT INTO login_attempts (email_or_username, ip_address, was_successful) VALUES (?, ?, ?)");
        $stmt->execute([$username_or_email, $ip_address, $successful]);
    } catch (PDOException $e) {
        error_log("Error logging login attempt: " . $e->getMessage());
    }
}

function incrementFailedLoginAttempts($user_id) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare("UPDATE users SET failed_login_attempts = failed_login_attempts + 1 WHERE id = ?");
        $stmt->execute([$user_id]);
        
        // Check if we need to lock the account
        $stmt = $pdo->prepare("SELECT failed_login_attempts FROM users WHERE id = ?");
        $stmt->execute([$user_id]);
        $attempts = $stmt->fetchColumn();
        
        if ($attempts >= MAX_LOGIN_ATTEMPTS) {
            $lockUntil = date('Y-m-d H:i:s', time() + LOCKOUT_DURATION);
            $stmt = $pdo->prepare("UPDATE users SET locked_until = ? WHERE id = ?");
            $stmt->execute([$lockUntil, $user_id]);
        }
    } catch (PDOException $e) {
        error_log("Error incrementing failed login attempts: " . $e->getMessage());
    }
}

function checkSessionTimeout() {
    if (isset($_SESSION['login_time']) && (time() - $_SESSION['login_time']) > SESSION_TIMEOUT) {
        logoutUser();
        return false;
    }
    return true;
}

// Check session timeout on each request
if (isLoggedIn() && !checkSessionTimeout()) {
    header('Location: auth/login.php?timeout=1');
    exit();
}
?>