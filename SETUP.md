# Initiate D&D Campaign Tracker - Setup Guide

## Quick Start

This guide will help you get Initiate up and running quickly. Choose between Docker (recommended) or traditional setup.

## 🐳 Docker Setup (Recommended)

### Prerequisites for Docker
- **Docker** 20.10+ and **Docker Compose** 2.0+
- No need for PHP, MySQL, or web server installation

### Quick Docker Start
1. **Clone and navigate to the project**
   ```bash
   git clone <repository-url> initiate
   cd initiate
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   # Edit .env file with your preferred settings
   ```

3. **Start the application**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Main app: http://localhost:8080
   - phpMyAdmin: http://localhost:8081 (development only)
   - Default login: username `admin`, password `admin123`

### Docker Commands
```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f web

# Stop services
docker-compose down

# Rebuild after code changes
docker-compose build --no-cache

# Run with development tools
docker-compose --profile development up -d
```

## 📋 Traditional Setup

### Prerequisites for Traditional Setup
- **PHP 7.4+** with extensions: PDO, PDO_MySQL, session, json
- **MySQL 5.7+** or **MariaDB 10.2+**
- **Web Server** (Apache, Nginx, or PHP built-in server)

### Installation Steps

1. **Download the Application**
   ```bash
   # If you have git
   git clone <repository-url> initiate
   cd initiate
   
   # Or extract the ZIP file to your web directory
   ```

2. **Create the Database**
   ```sql
   -- Connect to MySQL as root or admin user
   mysql -u root -p
   
   -- Create database
   CREATE DATABASE initiate_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   
   -- Create user (recommended for security)
   CREATE USER 'initiate_user'@'localhost' IDENTIFIED BY 'secure_password_here';
   GRANT ALL PRIVILEGES ON initiate_db.* TO 'initiate_user'@'localhost';
   FLUSH PRIVILEGES;
   
   -- Exit MySQL
   EXIT;
   ```

3. **Import Database Schema**
   ```bash
   mysql -u initiate_user -p initiate_db < database/schema.sql
   ```

4. **Configure Database Connection**
   
   Edit `config/database.php`:
   ```php
   <?php
   // Database configuration
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'initiate_db');
   define('DB_USER', 'initiate_user');
   define('DB_PASS', 'your_secure_password_here');
   ```

5. **Set Up Directory Permissions**
   ```bash
   # Create logs directory
   mkdir logs
   chmod 755 logs
   
   # If using Apache/Nginx, set ownership
   sudo chown -R www-data:www-data logs/
   ```

6. **Configure Web Server**

   **Option A: PHP Built-in Server (Development Only)**
   ```bash
   cd /path/to/initiate
   php -S localhost:8000
   ```
   Then visit: http://localhost:8000

   **Option B: Apache Virtual Host**
   ```apache
   <VirtualHost *:80>
       DocumentRoot "/path/to/initiate"
       ServerName initiate.local
       
       <Directory "/path/to/initiate">
           AllowOverride All
           Require all granted
           DirectoryIndex index.php
       </Directory>
       
       ErrorLog logs/initiate_error.log
       CustomLog logs/initiate_access.log combined
   </VirtualHost>
   ```

   **Option B: Nginx Configuration**
   ```nginx
   server {
       listen 80;
       server_name initiate.local;
       root /path/to/initiate;
       index index.php index.html;
       
       location / {
           try_files $uri $uri/ /index.php?$query_string;
       }
       
       location ~ \.php$ {
           fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;
           fastcgi_index index.php;
           fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
           include fastcgi_params;
       }
   }
   ```

7. **Test the Installation**
   - Visit your configured URL (e.g., http://initiate.local or http://localhost:8000)
   - You should see the login page
   - Try logging in with the default admin account:
     - **Username:** `admin`
     - **Password:** `admin123`

### Default Test Account

The database schema includes a default admin account for testing:
- **Username:** `admin`
- **Email:** `admin@initiate.local`
- **Password:** `admin123`

**⚠️ IMPORTANT:** Change this password immediately, especially in production!

## Configuration Options

### Security Configuration

Edit the security constants in `config/database.php`:

```php
// Session timeout (in seconds)
define('SESSION_TIMEOUT', 3600); // 1 hour

// Maximum login attempts before lockout
define('MAX_LOGIN_ATTEMPTS', 5);

// Lockout duration (in seconds)
define('LOCKOUT_DURATION', 900); // 15 minutes

// CSRF token expiry (in seconds)
define('CSRF_TOKEN_EXPIRY', 1800); // 30 minutes
```

### Application Configuration

```php
// Application settings
define('APP_NAME', 'Initiate');
define('BASE_URL', 'http://localhost:8000/'); // Update for your setup

// Email settings (if implementing email features)
define('SMTP_HOST', 'your-smtp-host.com');
define('SMTP_PORT', 587);
define('SMTP_USER', 'your-email@domain.com');
define('SMTP_PASS', 'your-email-password');
```

## Verification Checklist

After installation, verify these features work:

### ✅ Authentication
- [ ] User can register new account
- [ ] User can login with valid credentials
- [ ] Invalid login attempts are blocked
- [ ] User can logout successfully
- [ ] Sessions expire after timeout

### ✅ Campaign Management
- [ ] User can create new campaign
- [ ] Generated join codes are unique
- [ ] User can join campaign with join code
- [ ] Campaign details display correctly
- [ ] User can leave campaign (if not GM)

### ✅ Character Management
- [ ] User can create character in campaign
- [ ] Character sheet saves and loads correctly
- [ ] Ability score modifiers calculate properly
- [ ] Only authorized users can edit characters

### ✅ Initiative Tracker
- [ ] GM can start initiative session
- [ ] Users can add characters to initiative
- [ ] Initiative order sorts correctly
- [ ] Turn advancement works
- [ ] Real-time updates function

## Troubleshooting

### Common Issues

**1. "Database connection failed"**
- Check database credentials in `config/database.php`
- Verify MySQL service is running: `sudo service mysql status`
- Test connection: `mysql -u initiate_user -p initiate_db`

**2. "Permission denied" errors**
- Check file permissions: `ls -la logs/`
- Set correct ownership: `sudo chown -R www-data:www-data logs/`
- Verify web server user has write access

**3. "CSRF token error"**
- Clear browser cookies and cache
- Check if sessions are working: `<?php session_start(); var_dump($_SESSION); ?>`
- Verify session.save_path is writable

**4. "404 Not Found" on API calls**
- Check web server configuration
- Verify .htaccess is working (Apache)
- Test direct API access: `/api/csrf.php`

**5. JavaScript errors in console**
- Check browser developer tools for errors
- Verify all JS files are loading correctly
- Check for CORS issues if using different domains

### Debug Mode

For development, enable error reporting by adding to `config/database.php`:

```php
// Development only - remove in production!
ini_set('display_errors', 1);
error_reporting(E_ALL);
```

### Log Files

Check these log files for errors:
- `logs/security.log` - Security events and authentication
- Web server error logs (location varies by setup)
- PHP error logs (check php.ini for log_errors setting)

## Next Steps

1. **Change Default Password**
   - Login as admin and change the password
   - Or delete the default admin account after creating your own

2. **Create Test Campaign**
   - Create a campaign as Game Master
   - Create some test characters
   - Test the initiative tracker

3. **Customize Appearance**
   - Modify CSS variables in `assets/css/main.css`
   - Update application name and branding

4. **Security Hardening**
   - Review security settings
   - Set up HTTPS for production
   - Configure proper backup strategy

## Production Deployment

When deploying to production:

1. **Update Configuration**
   ```php
   define('DB_HOST', 'production-host');
   define('DB_NAME', 'production_db');
   define('DB_USER', 'production_user');
   define('DB_PASS', 'strong_production_password');
   define('BASE_URL', 'https://yourdomain.com/initiate/');
   ```

2. **Security Checklist**
   - [ ] Change all default passwords
   - [ ] Enable HTTPS with SSL certificate
   - [ ] Disable PHP error display
   - [ ] Set up regular database backups
   - [ ] Configure proper file permissions
   - [ ] Enable web server security headers

3. **Performance Optimization**
   - Enable PHP OPcache
   - Configure database query caching
   - Set up content compression (gzip)
   - Optimize images and assets

## Support

If you encounter issues:
1. Check this setup guide thoroughly
2. Review the main README.md for detailed documentation
3. Check log files for error messages
4. Verify all prerequisites are met

## Success!

If everything is working correctly, you should be able to:
- Login to the application
- Create and join campaigns
- Create and manage characters
- Use the initiative tracker during game sessions

Welcome to Initiate - your D&D campaign management solution!