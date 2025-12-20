<?php
// Database configuration for Docker environment
define('DB_HOST', 'database');  // Docker container name
define('DB_NAME', 'initiate_db');
define('DB_USER', 'initiate_user');
define('DB_PASS', 'secure_password123');  // Matches docker-compose.yml
define('DB_CHARSET', 'utf8mb4');

// Application configuration
define('APP_NAME', 'Initiate');
define('APP_VERSION', '1.0.0');
define('BASE_URL', 'http://localhost/initiate/');

// Security settings
define('SESSION_TIMEOUT', 2592000); // 30 days (30 * 24 * 60 * 60)
define('MAX_LOGIN_ATTEMPTS', 5);
define('LOCKOUT_DURATION', 900); // 15 minutes

// Enable CSRF protection
define('CSRF_TOKEN_EXPIRY', 1800); // 30 minutes

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET,
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
} catch (PDOException $e) {
    // Log error (don't expose database details to users)
    error_log("Database connection failed: " . $e->getMessage());
    die("Database connection failed. Please check your configuration.");
}

// Utility functions
function generateCSRFToken() {
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        $_SESSION['csrf_token_time'] = time();
    }
    return $_SESSION['csrf_token'];
}

function validateCSRFToken($token) {
    if (!isset($_SESSION['csrf_token']) || !isset($_SESSION['csrf_token_time'])) {
        return false;
    }
    
    if (time() - $_SESSION['csrf_token_time'] > CSRF_TOKEN_EXPIRY) {
        unset($_SESSION['csrf_token'], $_SESSION['csrf_token_time']);
        return false;
    }
    
    return hash_equals($_SESSION['csrf_token'], $token);
}

function sanitizeInput($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data);
    return $data;
}
?>