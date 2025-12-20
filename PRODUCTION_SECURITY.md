# Production Security Setup

## Environment Configuration

### 1. Create Production .env File
Copy `.env.example` to `.env` and update all placeholder values:

```bash
cp .env.example .env
```

### 2. Generate Secure Passwords
Replace all `CHANGE_ME_*` values with secure, randomly generated strings:

```bash
# Database passwords (32+ characters recommended)
DB_ROOT_PASSWORD=<generate-strong-password>
DB_PASSWORD=<generate-strong-password>

# Security secrets (32+ characters required)
SESSION_SECRET=<generate-32-char-random-string>
CSRF_SECRET=<generate-32-char-random-string>
```

### 3. Password Generation Examples

#### Linux/macOS:
```bash
# Generate 32-character random string
openssl rand -base64 32

# Generate multiple passwords
for i in {1..4}; do openssl rand -base64 32; done
```

#### Windows PowerShell:
```powershell
# Generate secure random password
[System.Web.Security.Membership]::GeneratePassword(32, 8)

# Or using .NET crypto
[System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes([System.Guid]::NewGuid().ToString() + [System.Guid]::NewGuid().ToString()))
```

#### Online Tools:
- Use a secure password generator (minimum 32 characters)
- Never use dictionary words or personal information

### 4. File Permissions
Ensure `.env` has restricted permissions:

```bash
chmod 600 .env
chown root:root .env  # or appropriate user
```

### 5. Environment Variables Checklist

- [ ] `DB_ROOT_PASSWORD` - MySQL root password
- [ ] `DB_PASSWORD` - Application database password  
- [ ] `SESSION_SECRET` - PHP session encryption key (32+ chars)
- [ ] `CSRF_SECRET` - CSRF token encryption key (32+ chars)
- [ ] `SMTP_PASSWORD` - Email service password (if using)
- [ ] `BASE_URL` - Your production domain
- [ ] `APP_ENV` - Set to "production"

### 6. Additional Security Steps

#### Database Security:
- Remove default/test users from MySQL
- Use separate database user with minimal privileges
- Enable MySQL SSL if possible
- Set up regular database backups

#### Web Server:
- Configure HTTPS with valid SSL certificate
- Set security headers (CSP, HSTS, etc.)
- Disable server signature/version disclosure
- Configure proper file permissions

#### Application:
- Review all admin/default accounts
- Enable rate limiting
- Configure proper session timeout
- Set up monitoring and logging

### 7. Never Commit to Git:
- `.env` files (any environment)
- Database dumps with real data
- SSL certificates/keys
- Any file containing passwords, tokens, or secrets

### 8. Production Deployment Checklist:
- [ ] All environment variables configured
- [ ] Database passwords changed from defaults
- [ ] SSL certificate installed
- [ ] Security headers configured
- [ ] Default admin password changed
- [ ] File permissions set correctly
- [ ] Backups configured
- [ ] Monitoring enabled
- [ ] Error logging configured (not displayed to users)