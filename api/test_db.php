<?php
/**
 * Database Connection Test
 * Simple endpoint to test database connectivity after environment variable changes
 */

session_start();
require_once '../config/database.php';

header('Content-Type: application/json');

$response = ['success' => false, 'message' => 'Database test failed.'];

try {
    // Test database connection
    $testStmt = $pdo->prepare("SELECT 1 as test");
    $testStmt->execute();
    $result = $testStmt->fetch();
    
    if ($result && $result['test'] == 1) {
        $response = [
            'success' => true, 
            'message' => 'Database connection successful',
            'config' => [
                'host' => DB_HOST,
                'name' => DB_NAME,
                'user' => DB_USER,
                'has_password' => !empty(DB_PASS)
            ]
        ];
    }
} catch (PDOException $e) {
    $response = [
        'success' => false, 
        'message' => 'Database connection failed: ' . $e->getMessage(),
        'config' => [
            'host' => DB_HOST,
            'name' => DB_NAME,
            'user' => DB_USER,
            'has_password' => !empty(DB_PASS)
        ]
    ];
} catch (Exception $e) {
    $response = [
        'success' => false, 
        'message' => 'Error: ' . $e->getMessage()
    ];
}

echo json_encode($response, JSON_PRETTY_PRINT);