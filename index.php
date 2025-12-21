<?php
// Main entry point for Initiate D&D Tracker
session_start();
require_once 'config/database.php';
require_once 'includes/auth.php';

// Check if user is logged in
if (!isLoggedIn()) {
    header('Location: auth/login.php');
    exit();
}

// Get user info
$user = getCurrentUser();
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Initiate - D&D Campaign Tracker</title>
    <link rel="stylesheet" href="assets/css/main.css">
    <link rel="stylesheet" href="assets/css/dashboard.css">
</head>

<body>
    <div id="app">
        <!-- Navigation -->
        <nav class="navbar">
            <div class="nav-brand">
                <h1>Initiate</h1>
            </div>
            <div class="nav-menu">
                <button id="create-character-btn" class="btn btn-accent">
                    <span>⚔️ Create Character</span>
                </button>
                <button id="my-characters-btn" class="btn btn-secondary">
                    <span>📝 My Characters</span>
                </button>
            </div>
            <div class="nav-user">
                <span>Welcome, <?php echo htmlspecialchars($user['username']); ?></span>
                <a href="auth/logout.php" class="btn btn-secondary">Logout</a>
            </div>
        </nav>

        <!-- Dashboard Sidebar -->
        <div class="dashboard-sidebar">
            <h2>Your Campaigns</h2>
            <div id="campaign-list">
                <!-- Campaigns will be loaded here via AJAX -->
            </div>
            <div class="sidebar-buttons">
                <button id="create-campaign-btn" class="btn btn-primary">Create New Campaign</button>
                <button id="join-campaign-btn" class="btn btn-secondary">Join Campaign</button>
                <button id="view-archives-btn" class="btn btn-outline">📁 View Archives</button>
            </div>

            <!-- D&D Quick Reference -->
            <div class="quick-reference">
                <h3>D&D Quick Reference</h3>
                <div class="reference-buttons">
                    <button class="btn btn-sm btn-accent" onclick="window.dndContent.createContentBrowser('spells')">📜 Browse Spells</button>
                    <button class="btn btn-sm btn-warning" onclick="window.dndContent.createContentBrowser('monsters')">🐉 Browse Monsters</button>
                    <button class="btn btn-sm btn-accent" onclick="window.dndContent.createContentBrowser('races')">🧬 Browse Species</button>
                    <button class="btn btn-sm btn-accent" onclick="window.dndContent.createContentBrowser('classes')">⚔️ Browse Classes</button>
                </div>
            </div>
        </div>
        <div class="dashboard-main">
            <div id="active-campaign">
                <!-- Active campaign content will be loaded here -->
                <div class="welcome-message">
                    <h2>Welcome to Initiate</h2>
                    <p>Select a campaign from the sidebar or create a new one to get started!</p>
                </div>
            </div>

            <!-- Character Display Panel -->
            <div id="character-display" class="character-display hidden">
                <div class="character-header">
                    <h3>Active Character</h3>
                    <button id="hide-character-btn" class="btn btn-sm btn-secondary">Hide</button>
                </div>
                <div id="character-display-content">
                    <!-- Character sheet will be displayed here in read-only mode -->
                </div>
            </div>
        </div>

        <!-- Initiative Tracker (Right Panel) -->
        <aside class="initiative-tracker">
            <h3>Initiative Tracker</h3>
            <div id="initiative-list">
                <!-- Initiative order will be displayed here -->
            </div>
        </aside>
    </div>

    <!-- Modals -->
    <div id="character-sheet-modal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                <div id="character-sheet-content">
                    <!-- Character sheet will be loaded here -->
                </div>
            </div>
        </div>
    </div>

    <!-- Character Creation Modal -->
    <div id="character-creation-modal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="modal-title">Create New Character</h2>
                <button class="close">&times;</button>
            </div>
            <div class="modal-body">
                <!-- Character creation form will be loaded here -->
            </div>
        </div>
    </div>

    <!-- My Characters Modal -->
    <div id="my-characters-modal" class="modal">
        <div class="modal-content my-characters-modal-content">
            <div class="modal-header">
                <h3>My Characters</h3>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                <div id="my-characters-list">
                    <!-- Character list will be loaded here -->
                </div>
            </div>
        </div>
    </div>
    </div>
    </div>
    </div>

    <script src="assets/js/utils.js"></script>
    <script src="assets/js/main.js"></script>
    <script src="assets/js/dashboard.js"></script>
    <script src="assets/js/initiative.js"></script>
    <script src="assets/js/character-management.js"></script>
    <script src="assets/js/character-sheet.js"></script>
    <script src="assets/js/dnd-content.js"></script>
</body>

</html>