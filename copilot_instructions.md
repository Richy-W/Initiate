# D&D Initiative Tracker - System Documentation

## Project Overview
A comprehensive D&D 5e initiative tracker and character management system built with PHP 8.1, MySQL 8.0, and modern JavaScript. The application provides campaign management, turn-based combat tracking, and integrated D&D 5e SRD content browsing.

## Technical Architecture

### Backend Stack
- **PHP 8.1** - Server-side logic and API endpoints
- **MySQL 8.0** - Database for campaigns, characters, and combat data
- **Apache** - Web server (via Docker)
- **Redis** - Session and caching layer
- **Docker** - Containerized development environment

### Frontend Stack
- **JavaScript ES6+** - Modern class-based architecture
- **CSS3** - Responsive design with custom properties
- **D&D 5e SRD API** - External API integration (dnd5eapi.co)

## File Structure

### Core Application Files
```
/
├── index.php                 # Main application entry point and UI structure
├── config.php               # Database and application configuration
├── docker-compose.yml       # Docker container orchestration
├── assets/
│   ├── css/
│   │   └── styles.css       # Main stylesheet with responsive design
│   └── js/
│       ├── main.js          # Core application logic and initialization
│       ├── dnd-content.js   # D&D 5e SRD API integration and content browsers
│       └── character-management.js # Character creation and management system
└── api/
    ├── campaigns.php        # Campaign CRUD operations
    ├── combat.php          # Initiative tracking and turn management
    └── characters.php      # Character management endpoints
```

### Database Schema

#### Campaigns Table
- `id` (Primary Key)
- `name` - Campaign name
- `description` - Campaign description
- `dm_name` - Dungeon Master name
- `created_at` - Timestamp

#### Characters Table
- `id` (Primary Key)
- `campaign_id` (Foreign Key)
- `name` - Character name
- `class` - Character class
- `level` - Character level
- `race` - Character species (stores species name and subspecies if applicable)
- `background` - Character background
- `hit_points` - Current HP
- `max_hit_points` - Maximum HP
- `armor_class` - AC value
- `initiative_bonus` - Initiative modifier
- `created_at` - Timestamp

#### Combat_Sessions Table
- `id` (Primary Key)
- `campaign_id` (Foreign Key)
- `name` - Combat encounter name
- `current_turn` - Index of current turn
- `round_number` - Current combat round
- `is_active` - Combat status
- `created_at` - Timestamp

#### Combat_Participants Table
- `id` (Primary Key)
- `combat_session_id` (Foreign Key)
- `name` - Participant name
- `initiative` - Initiative roll result
- `hit_points` - Current HP
- `max_hit_points` - Maximum HP
- `armor_class` - AC value
- `turn_order` - Position in initiative order

## Implemented Features

### 1. Campaign Management
- **Create/Edit/Delete Campaigns** - Full CRUD operations
- **Campaign Dashboard** - Overview of all campaigns
- **DM Information** - Track Dungeon Master details

### 2. Character Management
- **Comprehensive Character Creation** - Full D&D 5e character forms
- **Character Library** - View and manage all characters
- **Character Import to Campaigns** - Add existing characters to campaigns
- **Top Navigation Integration** - Easy access from main interface

### 3. Initiative Tracking
- **Combat Session Management** - Start, pause, end combat encounters
- **Turn-Based System** - Automatic turn progression and round tracking
- **Initiative Rolling** - Automated or manual initiative entry
- **HP/AC Tracking** - Real-time health and armor class management
- **Participant Management** - Add/remove combatants during combat

### 4. D&D 5e Content Integration
- **Spell Browser** - Complete spell database with detailed information
- **Monster Browser** - Comprehensive creature stat blocks
- **Species Browser** - Detailed species traits and abilities with subspecies selection
- **Class Browser** - Class features and progression information
- **Search Functionality** - Quick content filtering and search

## Key JavaScript Classes

### `DnDContent` (dnd-content.js)
- **Purpose**: Handles D&D 5e SRD API integration and content browsers
- **Key Methods**:
  - `getSpells()`, `getMonsters()`, `getRaces()`, `getClasses()` - API data fetching (note: external API still uses 'races')
  - `formatSpell()`, `formatMonster()`, `formatRace()`, `formatClass()` - Rich content formatting
  - `loadContentList()`, `loadContentDetails()` - Browser functionality
  - `createBrowser()` - Modal browser creation

### `CharacterManagement` (character-management.js)
- **Purpose**: Character creation, editing, and management
- **Key Features**:
  - Character form generation and validation
  - API integration for character CRUD operations
  - Character import/export functionality
  - Integration with campaign system

### `main.js`
- **Purpose**: Core application initialization and coordination
- **Key Responsibilities**:
  - Application startup and initialization
  - Event handler registration
  - Cross-component communication
  - UI state management

## API Endpoints

### Campaign Management (`/api/campaigns.php`)
- `GET` - Retrieve all campaigns
- `POST` - Create new campaign
- `PUT` - Update existing campaign
- `DELETE` - Remove campaign

### Character Management (`/api/characters.php`)
- `GET` - Retrieve characters (all or by campaign)
- `POST` - Create new character
- `PUT` - Update character
- `DELETE` - Remove character

### Combat System (`/api/combat.php`)
- Combat session management
- Participant tracking
- Turn progression
- Combat state persistence

## D&D 5e SRD API Integration

### External API: `https://www.dnd5eapi.co/api/`
- **Spells**: Complete spell database with descriptions
- **Monsters**: Creature stat blocks and abilities
- **Species**: Species traits and characteristics (API endpoint still uses 'races')
- **Classes**: Class features and progression
- **Equipment**: Items and gear (potential future enhancement)

### Content Formatting Standards
- **Visual Organization**: Styled sections with background colors
- **Comprehensive Details**: Show all available API data
- **User-Friendly Presentation**: Clear headings and logical grouping
- **Professional Styling**: Matches D&D official presentation style

## Clean Coding Standards

### JavaScript Code Standards

#### Documentation Requirements
- **All classes and major functions must have JSDoc headers**
  ```javascript
  /**
   * Class Description
   * 
   * Brief explanation of the class purpose and functionality.
   * 
   * Features:
   * - Feature 1 description
   * - Feature 2 description
   * 
   * @author Initiative Tracker Team
   * @version 1.0.0
   */
  class ExampleClass {
  ```

- **Method documentation for complex functions**
  ```javascript
  /**
   * Method description
   * @param {string} param1 - Description of parameter
   * @param {Object} param2 - Description of object parameter
   * @returns {Promise<Object>} Description of return value
   */
  async exampleMethod(param1, param2) {
  ```

#### Debug Logging Standards
- **NEVER use console.log for debug output in production code**
- **Use console.error only for genuine error conditions that need investigation**
- **Use console.warn for important warnings that don't break functionality**
- **Remove all temporary debug statements before committing**

#### Code Organization
- **ES6+ JavaScript**: Use modern syntax and features consistently
- **Class-Based Architecture**: Organize functionality into logical classes
- **Async/Await**: Handle API calls with modern async patterns
- **Error Handling**: Comprehensive error catching with user-friendly messages

#### Naming Conventions
- **Classes**: PascalCase (e.g., `CharacterManager`, `DnDContent`)
- **Methods/Functions**: camelCase (e.g., `loadContentList`, `createCharacter`)
- **Variables**: camelCase (e.g., `characterData`, `selectedItem`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`, `MAX_RETRY_ATTEMPTS`)

#### Code Structure
- **Consistent indentation**: 4 spaces (no tabs)
- **Line length**: Maximum 120 characters
- **Semicolons**: Always use semicolons
- **Template literals**: Use for string interpolation instead of concatenation

### PHP Code Standards

#### File Headers
- **All API files must have professional headers**
  ```php
  <?php
  /**
   * API Endpoint Name
   * 
   * Brief description of the endpoint's purpose and functionality.
   * 
   * @author Initiative Tracker Team
   * @version 1.0.0
   */
  ```

#### Security & Error Handling
- **Always validate user input and sanitize data**
- **Use proper error handling without exposing sensitive information**
- **Implement CSRF protection for state-changing operations**
- **Log security-related errors appropriately**

#### Database Operations
- **Use prepared statements for all database queries**
- **Proper transaction handling for multi-step operations**
- **Consistent error response format**

### Production Readiness Standards

#### File Management
- **No test files in production builds**
- **Remove all development-only code and comments**
- **Clean up temporary files and unused resources**

#### Performance Considerations
- **Minimize HTTP requests where possible**
- **Implement caching for frequently accessed data**
- **Optimize database queries with proper indexing**
- **Use lazy loading for heavy content**

#### Error Handling & User Experience
- **Graceful degradation when external APIs fail**
- **Clear, user-friendly error messages**
- **Loading states for async operations**
- **Proper validation feedback**

### CSS Architecture
- **CSS Custom Properties**: Use CSS variables for theming consistency
- **Responsive Design**: Mobile-first approach with progressive enhancement
- **Component-Based Styles**: Modular CSS organization
- **Accessibility**: ARIA labels and keyboard navigation support
- **Performance**: Minimize CSS file sizes and avoid unused styles

### Database Design
- **Normalized Schema**: Proper relationships and foreign keys
- **Timestamp Tracking**: Created/updated timestamps on all entities
- **Data Integrity**: Constraints and validation rules
- **Performance**: Indexed columns for common queries

### Testing & Quality Assurance
- **Manual testing of all user flows before deployment**
- **Cross-browser compatibility verification**
- **Mobile responsiveness testing**
- **Security validation of all inputs and outputs**

### Version Control Standards
- **Clean commit messages describing changes**
- **No debug code or test files in commits**
- **Proper file organization and naming**
- **Documentation updates with code changes**

## Current Status

### ✅ Completed Features
- Campaign management system
- Character creation and management
- Initiative tracking with turn-based combat
- D&D 5e content browsers (spells, monsters, species, classes)
- Rich content formatting with detailed information
- Responsive web interface
- Docker development environment

### 🚧 Recent Enhancements
- Enhanced species/class detail loading with comprehensive information
- Added subspecies selection for character creation
- Updated terminology from 'race' to 'species' for modern D&D alignment
- Improved spell and monster formatting with professional presentation
- Added character import functionality to campaigns
- Integrated character management into top navigation

### 🔮 Future Enhancement Opportunities
- **Equipment Browser**: Add weapons, armor, and items
- **Character Sheet Integration**: Full character sheet view/edit
- **Combat Automation**: Damage calculation and status effects
- **Campaign Notes**: Session notes and campaign journal
- **Player Access**: Multi-user support with player views
- **Export/Import**: Character and campaign backup/restore
- **Advanced Search**: Cross-content search functionality
- **Mobile App**: Native mobile application
- **Roll20 Integration**: Connect with popular VTT platforms

## Development Environment Setup

### Docker Commands
```bash
# Start development environment
docker-compose up -d

# View logs
docker-compose logs -f

# Stop environment
docker-compose down
```

### Local URLs
- **Application**: http://localhost:8082 (Required - do not change port)
- **phpMyAdmin**: http://localhost:8081
- **Redis**: localhost:6379

### Port Configuration Notes
- **Port 8082 is required** for the application and should not be changed
- This port configuration is necessary for proper API integration and CORS handling
- Docker configuration is set up specifically for this port mapping

### File Watching
The application uses live file watching for CSS and JavaScript changes. No build process required for development.

## Troubleshooting & Development Tools

### Common Issues & Solutions
1. **Browser Caching**: Use Ctrl+F5 for hard refresh when changes don't appear
2. **API Rate Limits**: D&D 5e SRD API has rate limiting - caching implemented for performance
3. **Database Connections**: Ensure Docker containers are running and properly networked
4. **CORS Issues**: Handled by PHP proxy - API calls work within application domain
5. **Session Management**: Check Redis container status for session persistence
6. **File Permissions**: Ensure proper Docker volume permissions for file operations

### Development Debug Process
1. **Browser Developer Tools**: 
   - Console tab for JavaScript errors (should only show actual errors in production)
   - Network tab for API call inspection and performance monitoring
   - Sources tab for debugging with breakpoints
2. **PHP Error Logging**: Check Docker container logs for PHP errors
3. **Database Inspection**: Use phpMyAdmin at http://localhost:8081 for data verification
4. **API Testing**: Use browser dev tools or Postman for API endpoint testing

### Performance Monitoring
- **Page Load Times**: Monitor for under 3 seconds initial load
- **API Response Times**: D&D content should load within 2 seconds
- **Database Query Performance**: Monitor for queries under 100ms
- **Memory Usage**: Keep JavaScript memory usage reasonable for long sessions

### Production Deployment Checklist
- [ ] All debug logging removed from code
- [ ] Test files removed from deployment
- [ ] Professional documentation headers added
- [ ] Error handling provides user-friendly messages
- [ ] Database migrations tested
- [ ] API endpoints secured with proper authentication
- [ ] CORS policies configured correctly
- [ ] Performance tested under load
- [ ] Mobile responsiveness verified
- [ ] Cross-browser compatibility confirmed

---

This documentation serves as a comprehensive guide for continued development and maintenance of the D&D Initiative Tracker system. Update this file as new features are implemented or architectural changes are made.