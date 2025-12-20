# Docker Deployment Guide for Initiate

## Overview

This guide covers deploying Initiate D&D Campaign Tracker using Docker containers. Docker provides consistent environments, easy scaling, and simplified deployment.

## Architecture

The Docker setup includes:
- **Web Container**: PHP 8.1 with Apache
- **Database Container**: MySQL 8.0
- **Redis Container**: For session storage (optional)
- **phpMyAdmin**: Database management (development only)

## Quick Start

### 1. Prerequisites
```bash
# Verify Docker installation
docker --version
docker-compose --version

# Minimum versions:
# Docker 20.10+
# Docker Compose 2.0+
```

### 2. Environment Setup
```bash
# Clone the repository
git clone <your-repo-url> initiate
cd initiate

# Create environment file
cp .env.example .env

# Edit environment variables (optional)
nano .env
```

### 3. Launch Application
```bash
# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

### 4. Access Application
- **Main Application**: http://localhost:8080
- **Database Admin**: http://localhost:8081 (development profile)
- **Default Credentials**: admin / admin123

## Environment Configuration

### .env File Options
```bash
# Database Settings
DB_ROOT_PASSWORD=your_secure_root_password
DB_NAME=initiate_db
DB_USER=initiate_user
DB_PASSWORD=your_secure_db_password

# Application Settings
APP_ENV=production
BASE_URL=http://localhost:8080

# Security Keys (generate unique values!)
SESSION_SECRET=your-unique-session-secret
CSRF_SECRET=your-unique-csrf-secret
```

### Generate Secure Keys
```bash
# Generate random secrets
openssl rand -base64 32  # For SESSION_SECRET
openssl rand -base64 32  # For CSRF_SECRET
```

## Docker Services

### Web Container (initiate_web)
- **Image**: Built from custom Dockerfile
- **Ports**: 8080:80
- **Health Check**: HTTP endpoint monitoring
- **Volumes**: Logs and uploads persistence

### Database Container (initiate_database)
- **Image**: MySQL 8.0
- **Ports**: 3307:3306
- **Volumes**: Persistent data storage
- **Health Check**: MySQL ping test

### Redis Container (initiate_redis)
- **Image**: Redis 7 Alpine
- **Purpose**: Session storage and caching
- **Volumes**: Persistent Redis data

## Production Deployment

### 1. Update Environment
```bash
# Production .env example
APP_ENV=production
BASE_URL=https://yourdomain.com
DB_ROOT_PASSWORD=super-secure-root-password
DB_PASSWORD=super-secure-db-password
```

### 2. Security Hardening
```bash
# Remove development services
docker-compose --profile production up -d

# Or create production compose file
docker-compose -f docker-compose.prod.yml up -d
```

### 3. SSL/TLS Setup
Add reverse proxy (Nginx/Traefik) for HTTPS:
```yaml
# Add to docker-compose.yml
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - web
```

## Management Commands

### Container Management
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart specific service
docker-compose restart web

# View service logs
docker-compose logs -f web
docker-compose logs -f database

# Execute commands in container
docker-compose exec web bash
docker-compose exec database mysql -u root -p
```

### Database Operations
```bash
# Backup database
docker-compose exec database mysqldump -u root -p initiate_db > backup.sql

# Restore database
docker-compose exec -T database mysql -u root -p initiate_db < backup.sql

# Access MySQL CLI
docker-compose exec database mysql -u initiate_user -p initiate_db
```

### File Operations
```bash
# Copy files to container
docker cp local-file.txt initiate_web:/var/www/html/

# Copy files from container
docker cp initiate_web:/var/www/html/logs ./local-logs
```

## Monitoring & Logging

### Health Checks
```bash
# Check container health
docker-compose ps

# Manual health check
curl http://localhost:8080/health
```

### Log Management
```bash
# View all logs
docker-compose logs

# Follow specific service logs
docker-compose logs -f web

# View last 50 lines
docker-compose logs --tail=50 database
```

### Log Rotation
```bash
# Configure log rotation in docker-compose.yml
services:
  web:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## Scaling & Performance

### Horizontal Scaling
```bash
# Scale web containers
docker-compose up -d --scale web=3

# Load balancer needed for multiple web containers
```

### Resource Limits
```yaml
services:
  web:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'
```

## Backup Strategy

### Automated Backup Script
```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"

mkdir -p $BACKUP_DIR

# Database backup
docker-compose exec -T database mysqldump -u root -p$DB_ROOT_PASSWORD initiate_db > $BACKUP_DIR/db_$DATE.sql

# Application files backup
tar -czf $BACKUP_DIR/files_$DATE.tar.gz ./logs ./uploads

# Cleanup old backups (keep last 7 days)
find $BACKUP_DIR -type f -mtime +7 -delete
```

### Schedule with Cron
```bash
# Add to crontab
0 2 * * * /path/to/initiate/backup.sh
```

## Troubleshooting

### Common Issues

**Container won't start:**
```bash
# Check logs
docker-compose logs web

# Check if ports are in use
netstat -tulpn | grep :8080

# Rebuild container
docker-compose build --no-cache web
```

**Database connection errors:**
```bash
# Check database health
docker-compose exec database mysqladmin ping -h localhost

# Verify credentials
docker-compose exec database mysql -u $DB_USER -p$DB_PASSWORD

# Reset database
docker-compose down
docker volume rm initiate_db_data
docker-compose up -d
```

**Permission issues:**
```bash
# Fix file permissions
docker-compose exec web chown -R www-data:www-data /var/www/html/logs
docker-compose exec web chmod -R 755 /var/www/html
```

### Debug Mode
```bash
# Enable debug logging
# In .env file:
APP_ENV=development

# Restart containers
docker-compose restart
```

## Security Considerations

### Container Security
- Run containers as non-root user
- Use specific image tags, not 'latest'
- Regularly update base images
- Scan images for vulnerabilities

### Network Security
```yaml
# Isolate services
networks:
  frontend:
    internal: false
  backend:
    internal: true
```

### Secrets Management
```bash
# Use Docker secrets for sensitive data
echo "db_password" | docker secret create mysql_password -
```

## Updates & Maintenance

### Application Updates
```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose build --no-cache
docker-compose up -d
```

### Container Updates
```bash
# Update base images
docker-compose pull
docker-compose up -d

# Clean unused images
docker system prune -a
```

## Migration from Traditional Setup

### Export Data
```bash
# From traditional MySQL
mysqldump -u username -p database_name > export.sql
```

### Import to Docker
```bash
# Copy SQL file to container
docker cp export.sql initiate_database:/tmp/

# Import data
docker-compose exec database mysql -u root -p initiate_db < /tmp/export.sql
```

## Support & Resources

- **Docker Documentation**: https://docs.docker.com/
- **Docker Compose Reference**: https://docs.docker.com/compose/
- **Application Issues**: Check main README.md
- **Security**: Review SECURITY.md

## Performance Tuning

### Database Optimization
```yaml
# In docker-compose.yml
database:
  command: >
    --innodb_buffer_pool_size=1G
    --innodb_log_file_size=256M
    --max_connections=200
```

### Web Server Optimization
```yaml
# PHP-FPM settings in Dockerfile
RUN echo "pm.max_children = 50" >> /usr/local/etc/php-fpm.d/www.conf
RUN echo "pm.max_requests = 500" >> /usr/local/etc/php-fpm.d/www.conf
```

This Docker setup provides a robust, scalable, and maintainable deployment solution for the Initiate D&D Campaign Tracker.