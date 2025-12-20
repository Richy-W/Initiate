-- Initiate D&D Tracker Database Schema
-- Run this file to set up the database structure

CREATE DATABASE IF NOT EXISTS initiate_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE initiate_db;

-- Users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    failed_login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP NULL,
    INDEX idx_username (username),
    INDEX idx_email (email)
);

-- Campaigns table
CREATE TABLE campaigns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    game_master_id INT NOT NULL,
    join_code VARCHAR(8) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    max_players INT DEFAULT 6,
    FOREIGN KEY (game_master_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_join_code (join_code),
    INDEX idx_gm (game_master_id)
);

-- Campaign members (players in campaigns)
CREATE TABLE campaign_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    campaign_id INT NOT NULL,
    user_id INT NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE KEY unique_member (campaign_id, user_id),
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_campaign (campaign_id),
    INDEX idx_user (user_id)
);

-- Character sheets
CREATE TABLE characters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    campaign_id INT NOT NULL,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    race VARCHAR(50),
    class VARCHAR(50),
    level INT DEFAULT 1,
    
    -- Basic stats
    strength INT DEFAULT 10,
    dexterity INT DEFAULT 10,
    constitution INT DEFAULT 10,
    intelligence INT DEFAULT 10,
    wisdom INT DEFAULT 10,
    charisma INT DEFAULT 10,
    
    -- Health and combat
    max_hit_points INT DEFAULT 0,
    current_hit_points INT DEFAULT 0,
    armor_class INT DEFAULT 10,
    initiative_bonus INT DEFAULT 0,
    speed INT DEFAULT 30,
    
    -- Additional character data (stored as JSON for flexibility)
    character_data JSON,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_campaign_character (campaign_id),
    INDEX idx_user_character (user_id)
);

-- Initiative tracker
CREATE TABLE initiative_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    campaign_id INT NOT NULL,
    started_by INT NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    current_turn INT DEFAULT 0,
    round_number INT DEFAULT 1,
    
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (started_by) REFERENCES users(id),
    INDEX idx_campaign_initiative (campaign_id)
);

-- Initiative order entries
CREATE TABLE initiative_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    character_id INT NULL, -- NULL for NPCs/monsters
    name VARCHAR(100) NOT NULL, -- Character name or NPC/monster name
    initiative_roll INT NOT NULL,
    initiative_bonus INT DEFAULT 0,
    is_player BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    order_position INT NOT NULL,
    
    FOREIGN KEY (session_id) REFERENCES initiative_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE SET NULL,
    INDEX idx_session_initiative (session_id),
    INDEX idx_order (session_id, order_position)
);

-- Session management for security
CREATE TABLE user_sessions (
    id VARCHAR(128) PRIMARY KEY,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_session (user_id),
    INDEX idx_expires (expires_at)
);

-- Login attempts tracking
CREATE TABLE login_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email_or_username VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    was_successful BOOLEAN DEFAULT FALSE,
    
    INDEX idx_email_ip (email_or_username, ip_address),
    INDEX idx_attempted_at (attempted_at)
);

-- Insert sample data for testing (optional)
-- Default admin user (password: admin123 - change in production!)
INSERT INTO users (username, email, password_hash) VALUES 
('admin', 'admin@initiate.local', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

-- Clean up old sessions and login attempts (run periodically)
-- DELETE FROM user_sessions WHERE expires_at < NOW();
-- DELETE FROM login_attempts WHERE attempted_at < DATE_SUB(NOW(), INTERVAL 24 HOUR);