<?php
// Include security functions in auth
require_once 'security.php';

// Update existing auth functions to use security features

function loginUser($username_or_email, $password, $ip_address) {
    global $pdo;
    
    // Rate limiting check
    if (!rateLimitCheck($ip_address, MAX_LOGIN_ATTEMPTS, LOCKOUT_DURATION)) {
        logSecurityEvent('LOGIN_RATE_LIMIT', "Rate limit exceeded for IP: $ip_address", null, $ip_address);
        return ['success' => false, 'message' => 'Too many failed login attempts. Please try again later.'];
    }
    
    // Input validation
    $validation_rules = [
        'username_or_email' => ['required' => true, 'max_length' => 255],
        'password' => ['required' => true, 'min_length' => 1]
    ];
    
    $validation_errors = validateInput([
        'username_or_email' => $username_or_email,
        'password' => $password
    ], $validation_rules);
    
    if (!empty($validation_errors)) {
        return ['success' => false, 'message' => 'Invalid input provided.'];
    }
    
    // Sanitize input
    $username_or_email = sanitizeString($username_or_email, 255);
    
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
            logSecurityEvent('LOGIN_FAILED', "Login attempt with invalid username/email: $username_or_email", null, $ip_address);
            return ['success' => false, 'message' => 'Invalid credentials.'];
        }
        
        if (!$user['is_active']) {
            logSecurityEvent('LOGIN_INACTIVE', "Login attempt on inactive account: {$user['username']}", $user['id'], $ip_address);
            return ['success' => false, 'message' => 'Account is deactivated.'];
        }
        
        if ($user['locked_until'] && strtotime($user['locked_until']) > time()) {
            logSecurityEvent('LOGIN_LOCKED', "Login attempt on locked account: {$user['username']}", $user['id'], $ip_address);
            return ['success' => false, 'message' => 'Account is temporarily locked.'];
        }
        
        if (!verifyPassword($password, $user['password_hash'])) {
            incrementFailedLoginAttempts($user['id']);
            logSecurityEvent('LOGIN_FAILED', "Failed password for user: {$user['username']}", $user['id'], $ip_address);
            return ['success' => false, 'message' => 'Invalid credentials.'];
        }
        
        // Successful login
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['login_time'] = time();
        
        // Log successful attempt
        logLoginAttempt($username_or_email, $ip_address, true);
        logSecurityEvent('LOGIN_SUCCESS', "Successful login for user: {$user['username']}", $user['id'], $ip_address);
        
        // Update last login and reset failed attempts
        $updateStmt = $pdo->prepare("UPDATE users SET last_login = NOW(), failed_login_attempts = 0, locked_until = NULL WHERE id = ?");
        $updateStmt->execute([$user['id']]);
        
        return ['success' => true, 'message' => 'Login successful.', 'user' => $user];
        
    } catch (PDOException $e) {
        error_log("Login error: " . $e->getMessage());
        logSecurityEvent('LOGIN_ERROR', "Database error during login: " . $e->getMessage(), null, $ip_address);
        return ['success' => false, 'message' => 'An error occurred during login.'];
    }
}

function registerUser($username, $email, $password) {
    global $pdo;
    
    // Input validation with security rules
    $validation_rules = [
        'username' => [
            'required' => true, 
            'min_length' => 3, 
            'max_length' => 50,
            'pattern' => '/^[a-zA-Z0-9_]+$/',
            'pattern_message' => 'Username can only contain letters, numbers, and underscores.'
        ],
        'email' => ['required' => true, 'type' => 'email', 'max_length' => 255],
        'password' => ['required' => true, 'min_length' => 8, 'max_length' => 255]
    ];
    
    $validation_errors = validateInput([
        'username' => $username,
        'email' => $email,
        'password' => $password
    ], $validation_rules);
    
    if (!empty($validation_errors)) {
        return ['success' => false, 'message' => implode(' ', $validation_errors)];
    }
    
    // Additional validation
    if (!validateUsername($username)) {
        return ['success' => false, 'message' => 'Username format is invalid.'];
    }
    
    if (!validateEmail($email)) {
        return ['success' => false, 'message' => 'Email format is invalid.'];
    }
    
    // Sanitize inputs
    $username = sanitizeString($username, 50);
    $email = sanitizeString($email, 255);
    
    try {
        // Check if username or email already exists
        $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
        $stmt->execute([$username, $email]);
        
        if ($stmt->fetch()) {
            logSecurityEvent('REGISTRATION_DUPLICATE', "Attempted registration with existing username/email: $username/$email");
            return ['success' => false, 'message' => 'Username or email already exists.'];
        }
        
        // Create new user
        $passwordHash = hashPassword($password);
        $stmt = $pdo->prepare("INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)");
        $stmt->execute([$username, $email, $passwordHash]);
        
        $userId = $pdo->lastInsertId();
        logSecurityEvent('REGISTRATION_SUCCESS', "New user registered: $username", $userId);
        
        return ['success' => true, 'message' => 'Registration successful.'];
        
    } catch (PDOException $e) {
        error_log("Registration error: " . $e->getMessage());
        logSecurityEvent('REGISTRATION_ERROR', "Database error during registration: " . $e->getMessage());
        return ['success' => false, 'message' => 'An error occurred during registration.'];
    }
}

// Rest of the auth.php functions remain the same but should include security logging
?>