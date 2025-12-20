<?php
// D&D 5e SRD API Integration
session_start();
require_once '../config/database.php';
require_once '../includes/auth.php';

// Ensure user is logged in
requireLogin();

header('Content-Type: application/json');

$response = ['success' => false, 'message' => 'Invalid request.'];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? '';
    
    switch ($action) {
        case 'search-spells':
            $response = searchSpells($_GET['query'] ?? '');
            break;
            
        case 'get-spell':
            $response = getSpell($_GET['index'] ?? '');
            break;
            
        case 'search-monsters':
            $response = searchMonsters($_GET['query'] ?? '');
            break;
            
        case 'get-monster':
            $response = getMonster($_GET['index'] ?? '');
            break;
            
        case 'get-classes':
            $response = getClasses();
            break;
            
        case 'get-class':
            $response = getClass($_GET['index'] ?? '');
            break;
            
        case 'get-races':
            $response = getRaces();
            break;
            
        case 'get-race':
            $response = getRace($_GET['index'] ?? '');
            break;
            
        case 'get-equipment':
            $response = getEquipment($_GET['category'] ?? '');
            break;
            
        default:
            $response = ['success' => false, 'message' => 'Unknown action.'];
    }
}

echo json_encode($response);

function makeApiRequest($endpoint) {
    $base_url = 'https://www.dnd5eapi.co/api/';
    $url = $base_url . $endpoint;
    
    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => [
                'User-Agent: Initiate D&D Tracker/1.0',
                'Accept: application/json'
            ],
            'timeout' => 10
        ]
    ]);
    
    $response = @file_get_contents($url, false, $context);
    
    if ($response === false) {
        return ['success' => false, 'message' => 'Failed to connect to D&D API'];
    }
    
    $data = json_decode($response, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        return ['success' => false, 'message' => 'Invalid API response'];
    }
    
    return ['success' => true, 'data' => $data];
}

function searchSpells($query = '') {
    $endpoint = 'spells';
    if (!empty($query)) {
        $endpoint .= '?name=' . urlencode($query);
    }
    
    $result = makeApiRequest($endpoint);
    
    if (!$result['success']) {
        return $result;
    }
    
    // Filter spells if query provided
    $spells = $result['data']['results'] ?? [];
    
    if (!empty($query)) {
        $spells = array_filter($spells, function($spell) use ($query) {
            return stripos($spell['name'], $query) !== false;
        });
    }
    
    return [
        'success' => true,
        'spells' => array_values($spells),
        'count' => count($spells)
    ];
}

function getSpell($index) {
    if (empty($index)) {
        return ['success' => false, 'message' => 'Spell index required'];
    }
    
    $result = makeApiRequest('spells/' . urlencode($index));
    
    if (!$result['success']) {
        return $result;
    }
    
    return [
        'success' => true,
        'spell' => $result['data']
    ];
}

function searchMonsters($query = '') {
    $endpoint = 'monsters';
    
    $result = makeApiRequest($endpoint);
    
    if (!$result['success']) {
        return $result;
    }
    
    $monsters = $result['data']['results'] ?? [];
    
    // Filter monsters if query provided
    if (!empty($query)) {
        $monsters = array_filter($monsters, function($monster) use ($query) {
            return stripos($monster['name'], $query) !== false;
        });
    }
    
    return [
        'success' => true,
        'monsters' => array_values($monsters),
        'count' => count($monsters)
    ];
}

function getMonster($index) {
    if (empty($index)) {
        return ['success' => false, 'message' => 'Monster index required'];
    }
    
    $result = makeApiRequest('monsters/' . urlencode($index));
    
    if (!$result['success']) {
        return $result;
    }
    
    return [
        'success' => true,
        'monster' => $result['data']
    ];
}

function getClasses() {
    $result = makeApiRequest('classes');
    
    if (!$result['success']) {
        return $result;
    }
    
    return [
        'success' => true,
        'classes' => $result['data']['results'] ?? []
    ];
}

function getRaces() {
    $result = makeApiRequest('races');
    
    if (!$result['success']) {
        return $result;
    }
    
    return [
        'success' => true,
        'races' => $result['data']['results'] ?? []
    ];
}

function getRace($index) {
    if (empty($index)) {
        return ['success' => false, 'message' => 'Race index required'];
    }
    
    $result = makeApiRequest('races/' . urlencode($index));
    
    if (!$result['success']) {
        return $result;
    }
    
    return [
        'success' => true,
        'race' => $result['data']
    ];
}

function getClass($index) {
    if (empty($index)) {
        return ['success' => false, 'message' => 'Class index required'];
    }
    
    $result = makeApiRequest('classes/' . urlencode($index));
    
    if (!$result['success']) {
        return $result;
    }
    
    return [
        'success' => true,
        'class' => $result['data']
    ];
}

function getEquipment($category = '') {
    $endpoint = 'equipment';
    if (!empty($category)) {
        $endpoint = 'equipment-categories/' . urlencode($category);
    }
    
    $result = makeApiRequest($endpoint);
    
    if (!$result['success']) {
        return $result;
    }
    
    return [
        'success' => true,
        'equipment' => $result['data']['results'] ?? $result['data']['equipment'] ?? []
    ];
}
?>