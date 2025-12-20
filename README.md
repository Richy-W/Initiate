# Initiate - D&D Campaign Tracker

A comprehensive Dungeons and Dragons initiative tracker and digital character sheet application built with PHP, MySQL, JavaScript, and AJAX.

## Features

### Core Functionality
- **User Registration & Authentication**: Secure user accounts with password hashing and session management
- **Campaign Management**: Create and join campaigns with unique join codes
- **Role-Based Access**: Game Masters have additional controls and permissions
- **Digital Character Sheets**: Complete character creation and management system
- **Initiative Tracker**: Real-time combat initiative tracking with automatic turn management
- **Real-Time Updates**: AJAX-powered interface for seamless user experience

### Security Features
- CSRF protection on all forms
- SQL injection prevention with prepared statements
- XSS protection with input sanitization
- Rate limiting on login attempts
- Account lockout after failed login attempts
- Secure password hashing with PHP's password_hash()
- Session timeout management

## Installation

### Prerequisites
- PHP 7.4 or higher
- MySQL 5.7 or higher
- Web server (Apache/Nginx)

### Setup Instructions

1. **Clone/Download** the project to your web server directory

2. **Database Setup**:
   ```bash
   # Create database and import schema
   mysql -u root -p < database/schema.sql
   ```

3. **Configuration**:
   - Edit `config/database.php` with your database credentials:
   ```php
   define('DB_HOST', 'your_host');
   define('DB_NAME', 'initiate_db');
   define('DB_USER', 'your_username');
   define('DB_PASS', 'your_password');
   ```

4. **Set Permissions**:
   ```bash
   # Create logs directory
   mkdir logs
   chmod 755 logs
   
   # Ensure web server can write to logs
   chown -R www-data:www-data logs/
   ```

5. **Virtual Host Setup** (Apache example):
   ```apache
   <VirtualHost *:80>
       DocumentRoot /path/to/initiate
       ServerName initiate.local
       
       <Directory /path/to/initiate>
           AllowOverride All
           Require all granted
       </Directory>
   </VirtualHost>
   ```

6. **Default Admin Account**:
   - Username: `admin`
   - Email: `admin@initiate.local`
   - Password: `admin123`
   
   **⚠️ IMPORTANT**: Change the default admin password immediately in production!

## Project Structure

```
initiate/
├── assets/
│   ├── css/
│   │   ├── main.css          # Main styles
│   │   ├── auth.css          # Authentication page styles
│   │   └── dashboard.css     # Dashboard styles
│   └── js/
│       ├── main.js           # Core application logic
│       ├── auth.js           # Authentication functionality
│       ├── dashboard.js      # Dashboard functionality
│       ├── initiative.js     # Initiative tracker
│       └── character-sheet.js # Character sheet functionality
├── auth/
│   ├── login.php            # Login/registration page
│   └── logout.php           # Logout handler
├── api/
│   ├── campaigns.php        # Campaign API endpoints
│   ├── characters.php       # Character API endpoints
│   ├── initiative.php       # Initiative API endpoints
│   └── csrf.php             # CSRF token endpoint
├── config/
│   └── database.php         # Database configuration
├── includes/
│   ├── auth.php             # Authentication functions
│   ├── campaigns.php        # Campaign management functions
│   ├── characters.php       # Character management functions
│   ├── initiative.php       # Initiative management functions
│   └── security.php         # Security functions
├── database/
│   └── schema.sql           # Database schema
├── logs/
│   └── security.log         # Security event logs
└── index.php                # Main application entry point
```

## API Documentation

### Authentication Required
All API endpoints require user authentication via session.

### Campaigns API (`api/campaigns.php`)

#### GET Endpoints
- `GET ?action=list` - Get user's campaigns
- `GET ?action=details&campaign_id={id}` - Get campaign details

#### POST Endpoints
- `POST {action: 'create', name, description, max_players}` - Create campaign
- `POST {action: 'join', join_code}` - Join campaign
- `POST {action: 'leave', campaign_id}` - Leave campaign

### Characters API (`api/characters.php`)

#### GET Endpoints
- `GET ?action=list&campaign_id={id}` - Get campaign characters
- `GET ?action=get&character_id={id}&campaign_id={id}` - Get character details

#### POST Endpoints
- `POST {action: 'create', campaign_id, character_data}` - Create character
- `POST {action: 'update', character_id, campaign_id, character_data}` - Update character
- `POST {action: 'delete', character_id, campaign_id}` - Delete character

### Initiative API (`api/initiative.php`)

#### GET Endpoints
- `GET ?action=status&campaign_id={id}` - Get initiative status

#### POST Endpoints
- `POST {action: 'start', campaign_id}` - Start initiative (GM only)
- `POST {action: 'end', campaign_id}` - End initiative (GM only)
- `POST {action: 'add', session_id, entries}` - Add entries to initiative
- `POST {action: 'next', campaign_id}` - Advance turn (GM only)
- `POST {action: 'remove', entry_id, campaign_id}` - Remove entry

## Database Schema

### Users
- User accounts with authentication data
- Failed login tracking and account locking

### Campaigns
- Campaign information with unique join codes
- Game Master assignment

### Campaign Members
- User membership in campaigns

### Characters
- Complete character sheet data
- JSON field for flexible additional data storage

### Initiative System
- Initiative sessions and turn tracking
- Initiative entries with ordering

## Security Considerations

### Input Validation
- All user inputs are sanitized and validated
- SQL injection prevention with prepared statements
- XSS protection through proper escaping

### Authentication Security
- Password hashing using PHP's password_hash()
- Session management with timeouts
- CSRF token protection
- Rate limiting on login attempts

### Access Control
- Role-based permissions (Game Master vs Player)
- Campaign membership validation
- Character ownership verification

### Additional Security
- Security headers set on all responses
- Error logging for security events
- Session cleanup for old/expired sessions

## Usage Guide

### Getting Started
1. Register a new account or login
2. Create a new campaign (as Game Master) or join existing campaign with join code
3. Create characters for the campaign
4. Use initiative tracker during combat sessions

### Game Master Features
- Create and manage campaigns
- View and edit all character sheets in campaign
- Control initiative tracker (start, end, advance turns)
- Add NPCs/monsters to initiative

### Player Features
- Join campaigns with join codes
- Create and manage own characters
- View other characters in campaign (read-only)
- Add own characters to initiative

### Initiative Tracker
- Automatic turn order based on initiative rolls + bonuses
- Real-time updates for all campaign members
- Current turn highlighting
- Round counting

## Development

### Adding New Features
1. Create database migrations if needed
2. Add backend logic in appropriate `includes/` file
3. Create API endpoints in `api/` directory
4. Implement frontend JavaScript functionality
5. Add CSS styling as needed

### Code Organization
- **Backend**: PHP with procedural functions organized by feature
- **Frontend**: JavaScript classes with modular functionality
- **Styling**: CSS with CSS custom properties for theming
- **Database**: MySQL with proper indexing and relationships

## Deployment

### Production Checklist
- [ ] Change default database credentials
- [ ] Update default admin password
- [ ] Enable HTTPS
- [ ] Set up proper error logging
- [ ] Configure backup strategy
- [ ] Set up monitoring
- [ ] Review and update security settings

### Environment Configuration
```php
// Production settings in config/database.php
define('DB_HOST', 'production_host');
define('DB_NAME', 'production_db');
define('DB_USER', 'production_user');
define('DB_PASS', 'secure_production_password');

// Update base URL
define('BASE_URL', 'https://yourdomain.com/initiate/');
```

### Backup Strategy
- Regular database backups
- Code deployment backup
- User uploaded content backup (if applicable)

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check database credentials in `config/database.php`
   - Ensure MySQL service is running
   - Verify database exists and schema is imported

2. **Login Issues**
   - Check session configuration
   - Verify password hashing compatibility
   - Clear browser cache and cookies

3. **CSRF Token Errors**
   - Ensure sessions are working properly
   - Check if cookies are enabled
   - Verify CSRF token generation

4. **Permission Errors**
   - Check file permissions on logs directory
   - Verify web server user can write to required directories

### Debug Mode
To enable debug mode, add to `config/database.php`:
```php
// Enable error reporting for debugging
ini_set('display_errors', 1);
error_reporting(E_ALL);
```

**⚠️ Important**: Never enable debug mode in production!

## Contributing

### Code Standards
- Follow PSR-12 coding standards for PHP
- Use meaningful variable and function names
- Comment complex logic
- Validate all inputs
- Use prepared statements for database queries

### Security Guidelines
- Always validate and sanitize user inputs
- Use CSRF protection on forms
- Implement proper access controls
- Log security events
- Follow principle of least privilege

## License

This project is open source and available under the MIT License.

## Support

For issues or questions:
1. Check this documentation
2. Review error logs in `logs/` directory
3. Verify database schema is properly imported
4. Check file permissions

## Version History

### v1.0.0 (Initial Release)
- User authentication system
- Campaign management
- Character sheet functionality
- Initiative tracker
- Real-time AJAX updates
- Security implementation