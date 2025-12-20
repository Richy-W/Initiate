# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Security Features

Initiate implements multiple layers of security to protect user data and prevent common web application vulnerabilities.

### Authentication & Session Security
- **Password Hashing**: Uses PHP's `password_hash()` with secure defaults
- **Session Management**: Secure session handling with configurable timeouts
- **Account Lockout**: Automatic lockout after failed login attempts
- **Rate Limiting**: Protection against brute force attacks

### Input Validation & Data Protection
- **SQL Injection Prevention**: All database queries use prepared statements
- **XSS Protection**: Input sanitization and output escaping
- **CSRF Protection**: Token-based protection on all forms
- **Input Validation**: Server-side validation of all user inputs

### Access Control
- **Role-Based Permissions**: Game Master vs Player access levels
- **Campaign Membership**: Access restricted to campaign members
- **Character Ownership**: Users can only edit their own characters (except GMs)

### Infrastructure Security
- **Security Headers**: Implements standard security headers
- **Error Handling**: No sensitive information exposed in error messages
- **Logging**: Security events are logged for monitoring

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please follow these steps:

### 1. Do NOT create a public issue

Please do not report security vulnerabilities through public GitHub issues, discussions, or pull requests.

### 2. Report via Email

Send details to: **security@initiate-app.com** (if available)

Include the following information:
- Type of vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if known)

### 3. Responsible Disclosure

Please allow us time to:
- Investigate and verify the vulnerability
- Develop and test a fix
- Prepare a security advisory
- Release the fix

We aim to respond within **48 hours** and provide a fix within **7 days** for critical vulnerabilities.

## Security Best Practices for Administrators

### Installation Security
```bash
# Set proper file permissions
chmod 644 *.php
chmod 755 logs/
chown -R www-data:www-data logs/

# Protect sensitive files
chmod 600 config/database.php
```

### Database Security
```sql
-- Use dedicated database user with minimal privileges
CREATE USER 'initiate_user'@'localhost' IDENTIFIED BY 'strong_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON initiate_db.* TO 'initiate_user'@'localhost';

-- Regular security updates
UPDATE mysql.user SET password_expired='Y' WHERE user='initiate_user';
```

### Web Server Configuration

**Apache (.htaccess)**
```apache
# Prevent direct access to sensitive files
<FilesMatch "\.(sql|log|ini)$">
    Require all denied
</FilesMatch>

# Security headers
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"
```

**Nginx**
```nginx
# Hide sensitive files
location ~ \.(sql|log|ini)$ {
    deny all;
}

# Security headers
add_header X-Content-Type-Options nosniff;
add_header X-Frame-Options DENY;
add_header X-XSS-Protection "1; mode=block";
```

### Production Checklist

- [ ] Change all default passwords
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Disable PHP error display (`display_errors = Off`)
- [ ] Remove or secure test accounts
- [ ] Set up regular database backups
- [ ] Configure log rotation
- [ ] Enable web application firewall (if available)
- [ ] Regular security updates for PHP/MySQL
- [ ] Monitor security logs

## Known Security Considerations

### Session Storage
- Sessions are stored server-side in PHP's default session storage
- Consider using database or Redis session storage for scalability
- Session data contains user ID and basic authentication state

### Password Policy
- Minimum 8 characters required
- No complexity requirements enforced (consider adding)
- No password history tracking
- No forced password expiration

### File Uploads
- Currently no file upload functionality implemented
- If added in future, implement proper validation and storage

### Rate Limiting
- Basic rate limiting implemented in session
- Consider implementing IP-based rate limiting for enhanced security
- Current limits: 5 failed logins per 15-minute window

## Security Monitoring

### Log Files to Monitor
- `logs/security.log` - Authentication and security events
- Web server access/error logs
- Database slow query logs

### Events to Watch For
- Multiple failed login attempts from same IP
- CSRF token validation failures
- Unauthorized access attempts
- Database errors or unusual query patterns

### Automated Monitoring
Consider implementing:
- Log aggregation (ELK Stack, Splunk, etc.)
- Intrusion detection system
- Database monitoring
- File integrity monitoring

## Security Updates

### Staying Current
- Monitor PHP security advisories
- Keep MySQL/MariaDB updated
- Update web server software regularly
- Review and update application dependencies

### Update Process
1. Test updates in development environment
2. Backup production database and files
3. Apply updates during maintenance window
4. Verify all functionality works correctly
5. Monitor logs for any issues

## Incident Response

### If Security Incident Occurs

1. **Immediate Response**
   - Change all passwords
   - Review recent log entries
   - Check for unauthorized access
   - Disable affected accounts if necessary

2. **Investigation**
   - Preserve log files
   - Document timeline of events
   - Identify scope of breach
   - Determine root cause

3. **Recovery**
   - Apply security patches
   - Restore from clean backups if necessary
   - Strengthen security measures
   - Monitor for continued threats

4. **Post-Incident**
   - Update security procedures
   - Improve monitoring
   - Consider security audit
   - Document lessons learned

## Additional Resources

### Security Tools
- **OWASP ZAP**: Web application security scanner
- **SQLmap**: SQL injection testing tool
- **Burp Suite**: Web application testing platform

### Security Guidelines
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [PHP Security Guide](https://www.php.net/manual/en/security.php)
- [MySQL Security Guidelines](https://dev.mysql.com/doc/refman/8.0/en/security.html)

### Compliance
While Initiate is designed for personal/hobby use, consider these frameworks if deploying in regulated environments:
- GDPR compliance for EU users
- CCPA compliance for California residents
- Industry-specific requirements (HIPAA, SOX, etc.)

## Contact

For security-related questions or concerns:
- Email: security@initiate-app.com
- Emergency: Create a private issue in the repository

Remember: Security is everyone's responsibility. If you see something, say something.