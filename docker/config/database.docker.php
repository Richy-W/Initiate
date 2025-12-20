<?php
// Docker-optimized database configuration
// Load .env file if it exists (simple implementation)
if (file_exists(__DIR__ . '/../../.env')) {
    $envContent = file_get_contents(__DIR__ . '/../../.env');
    $envLines = explode("\n", $envContent);
    foreach ($envLines as $line) {
        $line = trim($line);
        if ($line && substr($line, 0, 1) !== '#' && strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($value);
        }
    }
}

define('DB_HOST', $_ENV['DB_HOST'] ?? 'database');
define('DB_NAME', $_ENV['DB_NAME'] ?? 'initiate_db');
define('DB_USER', $_ENV['DB_USER'] ?? 'initiate_user');
define('DB_PASS', $_ENV['DB_PASSWORD'] ?? 'secure_password123');  // Development fallback
define('DB_CHARSET', 'utf8mb4');

// Application configuration
define('APP_NAME', 'Initiate');
define('APP_VERSION', '1.0.0');
define('BASE_URL', $_ENV['BASE_URL'] ?? 'http://localhost:8080/');
define('APP_ENV', $_ENV['APP_ENV'] ?? 'production');

// Security settings
define('SESSION_TIMEOUT', 2592000); // 30 days (30 * 24 * 60 * 60)
define('MAX_LOGIN_ATTEMPTS', 5);
define('LOCKOUT_DURATION', 900); // 15 minutes

// Enable CSRF protection
define('CSRF_TOKEN_EXPIRY', 1800); // 30 minutes

// Redis configuration for session storage (optional)
define('REDIS_HOST', $_ENV['REDIS_HOST'] ?? 'redis');
define('REDIS_PORT', $_ENV['REDIS_PORT'] ?? 6379);

// Error reporting based on environment
// Temporarily enable for debugging
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Original logic:
// if (APP_ENV === 'development') {
//     ini_set('display_errors', 1);
//     error_reporting(E_ALL);
// } else {
//     ini_set('display_errors', 0);
//     error_reporting(0);
// }

// Database connection with retry logic for container startup
$max_retries = 10;
$retry_delay = 3; // seconds
$pdo = null;

for ($i = 0; $i < $max_retries; $i++) {
    try {
        $pdo = new PDO(
            "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET,
            DB_USER,
            DB_PASS,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4",
                PDO::ATTR_TIMEOUT => 30,
            ]
        );
        
        // Test connection
        $pdo->query("SELECT 1");
        break; // Success, exit retry loop
        
    } catch (PDOException $e) {
        error_log("Database connection attempt " . ($i + 1) . " failed: " . $e->getMessage());
        
        if ($i < $max_retries - 1) {
            sleep($retry_delay);
        } else {
            // All retries failed
            if (APP_ENV === 'development') {
                die("Database connection failed after $max_retries attempts: " . $e->getMessage());
            } else {
                die("Database connection failed. Please check your configuration and try again later.");
            }
        }
    }
}

// Session configuration for Docker
if (PHP_SAPI !== 'cli' && session_status() === PHP_SESSION_NONE) {
    // Configure session settings before starting session
    ini_set('session.cookie_httponly', 1);
    ini_set('session.cookie_secure', 0); // Set to 1 in production with HTTPS
    ini_set('session.use_strict_mode', 1);
    
    // Use Redis for sessions if available, otherwise use default file storage
    if (extension_loaded('redis') && class_exists('Redis')) {
        $redis = new Redis();
        try {
            $redis->connect(REDIS_HOST, REDIS_PORT);
            $redis->ping();
            
            // Configure PHP to use Redis for sessions
            ini_set('session.save_handler', 'redis');
            ini_set('session.save_path', 'tcp://' . REDIS_HOST . ':' . REDIS_PORT);
            error_log("Using Redis for session storage");
        } catch (Exception $e) {
            error_log("Redis not available, using file sessions: " . $e->getMessage());
        }
    }
    
    // Session security settings
    ini_set('session.cookie_httponly', 1);
    ini_set('session.use_only_cookies', 1);
    ini_set('session.cookie_secure', isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on');
    ini_set('session.gc_maxlifetime', SESSION_TIMEOUT);
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

// Health check endpoint for Docker
if (isset($_GET['health']) && $_GET['health'] === 'check') {
    try {
        // Test database connection
        $stmt = $pdo->query("SELECT 1");
        
        header('Content-Type: application/json');
        echo json_encode([
            'status' => 'healthy',
            'timestamp' => date('Y-m-d H:i:s'),
            'database' => 'connected',
            'version' => APP_VERSION
        ]);
        exit;
    } catch (Exception $e) {
        http_response_code(503);
        header('Content-Type: application/json');
        echo json_encode([
            'status' => 'unhealthy',
            'timestamp' => date('Y-m-d H:i:s'),
            'error' => 'Database connection failed'
        ]);
        exit;
    }
}
?>