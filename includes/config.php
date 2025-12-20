<?php
/**
 * Database Configuration for Docker Environment
 */

// Database configuration
define('DB_HOST', 'database');  // Container name from docker-compose.yml
define('DB_NAME', 'initiate_db');
define('DB_USER', 'initiate_user');
define('DB_PASS', 'secure_password123');
define('DB_CHARSET', 'utf8mb4');

// Redis configuration for session storage
define('REDIS_HOST', 'redis');  // Container name from docker-compose.yml
define('REDIS_PORT', 6379);

// Application configuration
define('APP_NAME', 'Initiate');
define('APP_VERSION', '1.0.0');
define('DEBUG', false);

// Security configuration
define('CSRF_TOKEN_EXPIRE', 3600); // 1 hour
define('SESSION_LIFETIME', 86400); // 24 hours

// File upload configuration
define('UPLOAD_MAX_SIZE', 5242880); // 5MB
define('ALLOWED_IMAGE_TYPES', ['jpg', 'jpeg', 'png', 'gif']);

// Database connection function
function getDatabase() {
    static $pdo = null;
    
    if ($pdo === null) {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET sql_mode='STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO'"
            ];
            
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            error_log("Database connection failed: " . $e->getMessage());
            throw new Exception("Database connection failed. Please check your configuration.");
        }
    }
    
    return $pdo;
}

// Redis connection function
function getRedis() {
    static $redis = null;
    
    if ($redis === null) {
        try {
            $redis = new Redis();
            $redis->connect(REDIS_HOST, REDIS_PORT);
        } catch (Exception $e) {
            error_log("Redis connection failed: " . $e->getMessage());
            // Fall back to file-based sessions if Redis fails
            return false;
        }
    }
    
    return $redis;
}