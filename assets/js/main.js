/**
 * Initiative Tracker - Main Application Controller
 * 
 * Core application logic for the D&D Initiative Tracker web application.
 * Manages campaign selection, D&D content browsing, and primary UI interactions.
 * 
 * Features:
 * - Campaign management and selection
 * - D&D 5e SRD content integration
 * - Initiative tracking system
 * - User authentication handling
 * - Responsive dashboard interface
 * 
 * @author Initiative Tracker Team
 * @version 1.0.0
 */

class Initiate {
    constructor() {
        this.currentCampaign = null;
        this.user = null;
        this.csrfToken = null;
        this.pollingInterval = null;
        this.archiveSearchTimeout = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.getCsrfToken();
        this.loadCampaigns();
        this.startPolling();
    }

    bindEvents() {
        // Modal events
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('close') || e.target.classList.contains('modal')) {
                this.closeModals();
            }
        });

        // Escape key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModals();
            }
        });

        // View Archives button
        document.getElementById('view-archives-btn')?.addEventListener('click', () => {
            this.showArchivesView();
        });
    }

    async getCsrfToken() {
        try {
            const response = await fetch('api/csrf.php');
            const data = await response.json();
            if (data.success) {
                this.csrfToken = data.token;
            }
        } catch (error) {
            console.error('Error getting CSRF token:', error);
        }
    }

    async loadCampaigns() {
        try {
            const response = await fetch('api/campaigns.php?action=list');
            const data = await response.json();
            
            if (data.success) {
                this.renderCampaignList(data.campaigns);
            } else {
                this.showAlert('Error loading campaigns: ' + data.message, 'error');
            }
        } catch (error) {
            console.error('Error loading campaigns:', error);
            this.showAlert('Error loading campaigns', 'error');
        }
    }

    renderCampaignList(campaigns) {
        const container = document.getElementById('campaign-list');
        container.innerHTML = '';

        if (campaigns.length === 0) {
            container.innerHTML = '<p class="text-secondary">No campaigns found. Create or join a campaign to get started!</p>';
            return;
        }

        campaigns.forEach(campaign => {
            const item = document.createElement('div');
            item.className = 'campaign-item';
            item.dataset.campaignId = campaign.id;
            
            item.innerHTML = `
                <div class="campaign-name">${this.escapeHtml(campaign.name)}</div>
                <div class="campaign-role">
                    <span class="role-${campaign.role.toLowerCase()}">${campaign.role}</span>
                    ${campaign.role === 'GM' ? '• ' + this.escapeHtml(campaign.gm_username) : '• GM: ' + this.escapeHtml(campaign.gm_username)}
                </div>
            `;
            
            item.addEventListener('click', () => this.selectCampaign(campaign.id));
            container.appendChild(item);
        });
    }

    async selectCampaign(campaignId) {
        try {
            // Update UI
            document.querySelectorAll('.campaign-item').forEach(item => {
                item.classList.remove('active');
            });
            document.querySelector(`[data-campaign-id="${campaignId}"]`).classList.add('active');

            // Load campaign details for active campaigns
            const response = await fetch(`api/campaigns.php?action=details&campaign_id=${campaignId}`);
            const data = await response.json();
            
            if (data.success) {
                this.currentCampaign = data;
                this.renderCampaignContent(data);
                this.loadInitiativeStatus(campaignId);
            } else {
                this.showAlert('Error loading campaign: ' + data.message, 'error');
            }
        } catch (error) {
            console.error('Error selecting campaign:', error);
            this.showAlert('Error loading campaign', 'error');
        }
    }

    async showArchivedCampaignCharacters(campaignId) {
        try {
            const response = await fetch(`api/campaigns.php?action=archived_characters&campaign_id=${campaignId}`);
            const data = await response.json();
            
            if (data.success) {
                this.renderArchivedCharactersInline(data, campaignId);
            } else {
                this.showAlert('Error loading archived campaign: ' + data.message, 'error');
            }
        } catch (error) {
            console.error('Error loading archived campaign characters:', error);
            this.showAlert('Error loading archived campaign', 'error');
        }
    }

    renderArchivedCharactersInline(data, campaignId) {
        // Find or create a characters section within the archives view
        let charactersSection = document.getElementById('archived-characters-section');
        
        if (!charactersSection) {
            charactersSection = document.createElement('div');
            charactersSection.id = 'archived-characters-section';
            charactersSection.className = 'archived-characters-section';
            document.querySelector('.archives-view').appendChild(charactersSection);
        }
        
        charactersSection.innerHTML = `
            <div class="section-header">
                <h3>Characters from "${this.escapeHtml(data.campaign_name)}"</h3>
                <p class="text-secondary">${data.characters.length} character(s) available for import</p>
            </div>
            
            <div class="archived-character-grid">
                ${this.renderArchivedCharacters(data.characters, campaignId)}
            </div>
        `;
        
        // Scroll to the characters section
        charactersSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    renderArchivedCharacters(characters, campaignId) {
        if (characters.length === 0) {
            return '<p class="text-secondary">No characters found in this campaign.</p>';
        }

        return characters.map(character => `
            <div class="archived-character-card" data-character-id="${character.id}">
                <div class="character-header">
                    <h4>${this.escapeHtml(character.name)}</h4>
                    <span class="character-class">${this.escapeHtml(character.class || 'Unknown')} ${character.level || 1}</span>
                </div>
                <div class="character-details">
                    <p><strong>Race:</strong> ${this.escapeHtml(character.race || 'Unknown')}</p>
                    <p><strong>Background:</strong> ${this.escapeHtml(character.background || 'None')}</p>
                    <p><strong>Alignment:</strong> ${this.escapeHtml(character.alignment || 'None')}</p>
                </div>
                <div class="character-actions">
                    <button class="btn btn-primary btn-sm" onclick="initiate.importCharacterFromArchive(${character.id}, ${campaignId})">
                        Import to Active Campaign
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="initiate.viewArchivedCharacter(${character.id})">
                        View Details
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderCampaignContent(data) {
        const mainContent = document.querySelector('.dashboard-main');
        const campaign = data.campaign;
        
        mainContent.innerHTML = `
            <div class="campaign-content active">
                <div class="campaign-header">
                    <h2 class="campaign-title">${this.escapeHtml(campaign.name)}</h2>
                    <p>${this.escapeHtml(campaign.description || 'No description')}</p>
                    
                    <div class="campaign-meta">
                        <div class="meta-item">
                            <span class="meta-label">Game Master</span>
                            <span class="meta-value">${this.escapeHtml(campaign.gm_username)}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">Players</span>
                            <span class="meta-value">${data.members.length}/${campaign.max_players}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">Join Code</span>
                            <span class="meta-value">${campaign.join_code}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">Created</span>
                            <span class="meta-value">${this.formatDate(campaign.created_at)}</span>
                        </div>
                    </div>
                    
                    <div class="campaign-actions">
                        <div class="primary-actions">
                            <button class="btn btn-accent" onclick="initiate.createCharacter()">Create Character</button>
                            ${data.is_gm ? `
                                <button class="btn btn-secondary" onclick="initiate.createNPC()">Create NPC</button>
                                <button class="btn btn-primary" onclick="initiate.startInitiative()">Start Initiative</button>
                                <button class="btn btn-warning" onclick="initiate.endInitiative()">End Initiative</button>
                            ` : `
                                <button class="btn btn-danger" onclick="initiate.leaveCampaign()">Leave Campaign</button>
                            `}
                        </div>
                        ${data.is_gm ? `
                            <div class="danger-actions">
                                <button class="btn btn-danger" onclick="initiate.endCampaign()">⚠️ End Campaign</button>
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="characters-section">
                    <div class="section-header">
                        <h3>Characters</h3>
                        <div class="section-actions">
                            <button class="btn btn-sm btn-accent" onclick="dndContent.createContentBrowser('spells')">Browse Spells</button>
                            <button class="btn btn-sm btn-secondary" onclick="dndContent.createContentBrowser('monsters')">Browse Monsters</button>
                        </div>
                    </div>
                    <div class="character-grid" id="character-grid">
                        ${this.renderCharacters(data.characters)}
                    </div>
                </div>
            </div>
        `;
    }

    renderCharacters(characters) {
        if (characters.length === 0) {
            return '<p class="text-secondary">No characters in this campaign yet.</p>';
        }

        return characters.map(character => `
            <div class="character-card" onclick="initiate.viewCharacter(${character.id})">
                <div class="character-header">
                    <div>
                        <h4 class="character-name">${this.escapeHtml(character.name)}</h4>
                        <div class="character-class-level">
                            Level ${character.level} ${this.escapeHtml(character.race)} ${this.escapeHtml(character.class)}
                        </div>
                    </div>
                </div>
                
                <div class="character-stats">
                    <div class="stat-item">
                        <div class="stat-label">HP</div>
                        <div class="stat-value">${character.current_hit_points}/${character.max_hit_points}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">AC</div>
                        <div class="stat-value">${character.armor_class}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Initiative</div>
                        <div class="stat-value">${character.initiative_bonus >= 0 ? '+' : ''}${character.initiative_bonus}</div>
                    </div>
                </div>
                
                <div class="character-actions">
                    <small class="text-secondary">
                        ${character.is_npc ? 'NPC' : 'Player: ' + this.escapeHtml(character.player_username || 'Unknown')}
                    </small>
                </div>
            </div>
        `).join('');
    }

    showArchivesView() {
        // Clear any selected campaign
        this.currentCampaign = null;
        document.querySelectorAll('.campaign-item').forEach(item => {
            item.classList.remove('active');
        });
        
        this.renderArchivesView();
        this.loadArchivedCampaigns();
    }

    renderArchivesView() {
        const mainContent = document.querySelector('.dashboard-main');
        
        mainContent.innerHTML = `
            <div class="archives-view">
                <div class="archives-header">
                    <h2>📁 Campaign Archives</h2>
                    <p>Browse your completed campaigns and import characters for reuse in new adventures.</p>
                </div>
                
                <div class="archives-controls">
                    <div class="archives-search">
                        <input type="text" id="archives-search" placeholder="Search archived campaigns..." />
                    </div>
                    <button class="btn btn-secondary" onclick="initiate.loadCampaigns()">
                        ← Back to Active Campaigns
                    </button>
                </div>
                
                <div id="archived-campaigns-container">
                    <div class="loading">Loading archived campaigns...</div>
                </div>
            </div>
        `;
        
        // Bind search event
        document.getElementById('archives-search').addEventListener('input', (e) => {
            clearTimeout(this.archiveSearchTimeout);
            this.archiveSearchTimeout = setTimeout(() => {
                this.loadArchivedCampaigns(e.target.value);
            }, 300);
        });
    }

    async loadArchivedCampaigns(searchTerm = '') {
        try {
            const url = new URL('api/campaigns.php', window.location.origin);
            url.searchParams.set('action', 'list_archived');
            if (searchTerm) {
                url.searchParams.set('search', searchTerm);
            }

            const response = await fetch(url);
            const data = await response.json();
            
            if (data.success) {
                this.renderArchivedCampaignsList(data.campaigns);
            } else {
                console.error('Error loading archived campaigns:', data.message);
            }
        } catch (error) {
            console.error('Error loading archived campaigns:', error);
        }
    }

    renderArchivedCampaignsList(campaigns) {
        const container = document.getElementById('archived-campaigns-container');
        
        if (campaigns.length === 0) {
            container.innerHTML = `
                <div class="no-archives">
                    <h3>No archived campaigns found</h3>
                    <p>Campaigns that have been ended will appear here.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="archived-campaigns-grid">
                ${campaigns.map(campaign => `
                    <div class="archived-campaign-card" data-campaign-id="${campaign.id}" onclick="initiate.selectArchivedCampaign(${campaign.id})">
                        <h3>${this.escapeHtml(campaign.name)}</h3>
                        <p>${this.escapeHtml(campaign.description || 'No description available')}</p>
                        
                        <div class="campaign-meta">
                            <div class="meta-item">
                                <strong>Role:</strong> ${campaign.role}
                            </div>
                            <div class="meta-item">
                                <strong>GM:</strong> ${this.escapeHtml(campaign.gm_username)}
                            </div>
                            <div class="meta-item">
                                <strong>Ended:</strong> ${this.formatDate(campaign.updated_at)}
                            </div>
                            <div class="meta-item">
                                <strong>Duration:</strong> ${this.calculateCampaignDuration(campaign.created_at, campaign.updated_at)}
                            </div>
                        </div>
                        
                        <div class="character-count">
                            📝 ${campaign.character_count || 0} characters available
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    calculateCampaignDuration(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 30) {
            return `${diffDays} days`;
        } else if (diffDays < 365) {
            const months = Math.floor(diffDays / 30);
            return `${months} month${months > 1 ? 's' : ''}`;
        } else {
            const years = Math.floor(diffDays / 365);
            return `${years} year${years > 1 ? 's' : ''}`;
        }
    }

    async selectArchivedCampaign(campaignId) {
        // Remove selection from other cards
        document.querySelectorAll('.archived-campaign-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        // Select this card
        document.querySelector(`[data-campaign-id="${campaignId}"]`).classList.add('selected');
        
        // Show characters for this campaign
        this.showArchivedCampaignCharacters(campaignId);
    }

    searchArchivedCampaigns(searchTerm) {
        if (this.isShowingArchives) {
            this.loadArchivedCampaigns(searchTerm);
        }
    }

    async loadInitiativeStatus(campaignId) {
        try {
            const response = await fetch(`api/initiative.php?action=status&campaign_id=${campaignId}`);
            const data = await response.json();
            
            if (data.success) {
                this.renderInitiativeTracker(data);
            }
        } catch (error) {
            console.error('Error loading initiative status:', error);
        }
    }

    renderInitiativeTracker(data) {
        const tracker = document.querySelector('.initiative-tracker');
        
        if (!data.active) {
            tracker.innerHTML = `
                <h3>Initiative Tracker</h3>
                <div class="initiative-status">
                    <p class="text-secondary">No active initiative session</p>
                </div>
            `;
            return;
        }

        const session = data.session;
        const entries = data.entries || [];

        tracker.innerHTML = `
            <h3>Initiative Tracker</h3>
            
            <div class="initiative-status">
                <div class="round-info">Round ${session.round_number}</div>
                <div class="turn-info">Turn ${session.current_turn} of ${entries.length}</div>
            </div>
            
            ${this.currentCampaign.is_gm ? `
                <div class="initiative-controls">
                    <button class="btn btn-primary btn-sm" onclick="initiate.nextTurn()">Next Turn</button>
                    <button class="btn btn-secondary btn-sm" onclick="initiate.addToInitiative()">Add Entry</button>
                </div>
            ` : ''}
            
            <div id="initiative-list">
                ${this.renderInitiativeEntries(entries, session.current_turn)}
            </div>
        `;
    }

    renderInitiativeEntries(entries, currentTurn) {
        return entries.map((entry, index) => {
            const isCurrentTurn = (index + 1) === currentTurn;
            return `
                <div class="initiative-entry ${isCurrentTurn ? 'current-turn' : ''}">
                    <div class="initiative-header">
                        <div class="initiative-name">${this.escapeHtml(entry.name)}</div>
                        <div class="initiative-total">${entry.total_initiative}</div>
                    </div>
                    <div class="initiative-details">
                        <span class="initiative-${entry.is_player ? 'player' : 'npc'}">
                            ${entry.is_player ? 'Player' : 'NPC'}
                        </span>
                        ${this.currentCampaign.is_gm ? `
                            <button class="remove-initiative" onclick="initiate.removeFromInitiative(${entry.id})">
                                Remove
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    startPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }
        
        this.pollingInterval = setInterval(() => {
            if (this.currentCampaign) {
                this.loadInitiativeStatus(this.currentCampaign.campaign.id);
            }
        }, 3000); // Poll every 3 seconds
    }

    createCharacter() {
        // Implementation handled by character-sheet.js
        this.showCharacterSheet(null, true, false);
    }

    createNPC() {
        // Create NPC character sheet for GM
        this.showCharacterSheet(null, true, true);
    }

    browseRaces() {
        try {
            this.createDnDContentBrowser('races', 'race');
        } catch (error) {
            console.error('Error in browseRaces:', error);
        }
    }

    browseClasses() {
        try {
            this.createDnDContentBrowser('classes', 'class');
        } catch (error) {
            console.error('Error in browseClasses:', error);
        }
    }

    createDnDContentBrowser(contentType, fieldType) {
        const modalId = `${contentType}-browser`;
        
        // Remove existing modal
        const existing = document.getElementById(modalId);
        if (existing) {
            existing.remove();
        }

        const modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content content-modal">
                <div class="modal-header">
                    <h3>Browse D&D ${contentType.charAt(0).toUpperCase() + contentType.slice(1)}</h3>
                    <button class="close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="content-search">
                        <div class="form-group">
                            <input type="text" id="${contentType}-search" placeholder="Search ${contentType}..." class="form-control">
                        </div>
                        <div id="${contentType}-list" class="content-list">
                            <p>Loading ${contentType}...</p>
                        </div>
                    </div>
                    <div class="content-details">
                        <div id="${contentType}-details">
                            <p class="text-secondary">Select a ${fieldType} from the list to view details.</p>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" id="select-${fieldType}-btn" disabled>Select This ${fieldType.charAt(0).toUpperCase() + fieldType.slice(1)}</button>
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.classList.add('show');

        this.setupDnDContentBrowser(contentType, fieldType);
    }

    async setupDnDContentBrowser(contentType, fieldType) {
        const searchInput = document.getElementById(`${contentType}-search`);
        const listContainer = document.getElementById(`${contentType}-list`);
        const detailsContainer = document.getElementById(`${contentType}-details`);
        const selectBtn = document.getElementById(`select-${fieldType}-btn`);
        
        let selectedItem = null;
        let allItems = [];

        // Load content from API
        try {
            const result = contentType === 'races' ? await dndContent.getRaces() : await dndContent.getClasses();
            
            if (result.success) {
                allItems = result[contentType] || [];
                this.displayContentItems(allItems, listContainer, detailsContainer, selectBtn, fieldType);
            } else {
                listContainer.innerHTML = `<p class="text-danger">Error loading ${contentType}: ${result.message}</p>`;
            }
        } catch (error) {
            console.error(`Error loading ${contentType}:`, error);
            listContainer.innerHTML = `<p class="text-danger">Error loading ${contentType}</p>`;
        }

        // Set up search
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = allItems.filter(item => 
                item.name.toLowerCase().includes(query)
            );
            this.displayContentItems(filtered, listContainer, detailsContainer, selectBtn, fieldType);
        });

        // Set up select button
        selectBtn.addEventListener('click', () => {
            if (selectedItem) {
                const targetField = document.getElementById(`char-${fieldType}`);
                if (targetField) {
                    targetField.value = selectedItem.name;
                    this.showAlert(`Selected ${selectedItem.name}!`, 'success');
                }
                document.getElementById(contentType + '-browser').remove();
            }
        });

        // Store reference to update selected item
        window[`${contentType}Browser`] = {
            setSelected: (item) => {
                selectedItem = item;
                selectBtn.disabled = !item;
            }
        };
    }

    displayContentItems(items, listContainer, detailsContainer, selectBtn, fieldType) {
        if (items.length === 0) {
            listContainer.innerHTML = '<p class="text-secondary">No results found.</p>';
            return;
        }

        listContainer.innerHTML = items.map(item => `
            <div class="content-item" data-index="${item.index}">
                <strong>${item.name}</strong>
            </div>
        `).join('');

        // Add click handlers
        listContainer.querySelectorAll('.content-item').forEach((itemElement, index) => {
            itemElement.addEventListener('click', async () => {
                // Highlight selected
                listContainer.querySelectorAll('.content-item').forEach(i => {
                    i.classList.remove('active');
                });
                itemElement.classList.add('active');

                const selectedItem = items[index];
                
                // Show details
                detailsContainer.innerHTML = `
                    <div class="content-details">
                        <h4>${selectedItem.name}</h4>
                        <div class="spell-details-section">
                            <p><strong>Click "Select This ${fieldType.charAt(0).toUpperCase() + fieldType.slice(1)}" to add this to your character.</strong></p>
                        </div>
                    </div>
                `;

                // Update selected item
                if (window[`${contentType}Browser`]) {
                    window[`${contentType}Browser`].setSelected(selectedItem);
                }
            });
        });
    }



    async importFromMonster() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content content-modal">
                <div class="modal-header">
                    <h3>Import from Monster Manual</h3>
                    <button class="close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="content-search">
                        <div class="form-group">
                            <input type="text" id="monster-search" placeholder="Search monsters..." class="form-control">
                        </div>
                        <div id="monster-list" class="content-list">
                            <!-- Monsters will be loaded here -->
                        </div>
                    </div>
                    <div class="content-details">
                        <div id="monster-details">
                            <p class="text-secondary">Select a monster to view stats and import.</p>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" id="import-monster-btn" disabled>Import Selected Monster</button>
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.classList.add('show');

        let selectedMonster = null;

        // Set up search functionality
        const searchInput = document.getElementById('monster-search');
        const listContainer = document.getElementById('monster-list');
        const detailsContainer = document.getElementById('monster-details');
        const importBtn = document.getElementById('import-monster-btn');

        // Load initial monsters
        this.loadMonsterList('', listContainer, detailsContainer);

        // Search functionality
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.loadMonsterList(e.target.value, listContainer, detailsContainer);
            }, 300);
        });

        // Import button handler
        importBtn.addEventListener('click', () => {
            if (selectedMonster) {
                this.populateNPCFromMonster(selectedMonster);
                modal.remove();
            }
        });

        // Store reference for use in list click handlers
        this.selectedMonsterModal = {
            setSelected: (monster) => {
                selectedMonster = monster;
                importBtn.disabled = !monster;
            }
        };
    }

    async loadMonsterList(query, listContainer, detailsContainer) {
        listContainer.innerHTML = '<p>Loading monsters...</p>';

        try {
            const result = await dndContent.searchMonsters(query);
            
            if (result.success) {
                const monsters = result.monsters || [];
                
                if (monsters.length === 0) {
                    listContainer.innerHTML = '<p class="text-secondary">No monsters found.</p>';
                    return;
                }

                listContainer.innerHTML = monsters.map(monster => `
                    <div class="content-item monster-item" data-index="${monster.index}">
                        <strong>${monster.name}</strong>
                        ${monster.challenge_rating !== undefined ? `<br><small>CR ${monster.challenge_rating}</small>` : ''}
                    </div>
                `).join('');

                // Add click handlers
                listContainer.querySelectorAll('.content-item').forEach(item => {
                    item.addEventListener('click', async () => {
                        // Highlight selected
                        listContainer.querySelectorAll('.content-item').forEach(i => i.classList.remove('active'));
                        item.classList.add('active');

                        // Load monster details
                        await this.loadMonsterDetails(item.dataset.index, detailsContainer);
                    });
                });
            } else {
                listContainer.innerHTML = `<p class="text-danger">Error loading monsters: ${result.message}</p>`;
            }
        } catch (error) {
            console.error('Error loading monsters:', error);
            listContainer.innerHTML = '<p class="text-danger">Error loading monsters</p>';
        }
    }

    async loadMonsterDetails(index, detailsContainer) {
        detailsContainer.innerHTML = '<p>Loading monster details...</p>';

        try {
            const result = await dndContent.getMonster(index);
            
            if (result.success) {
                const monster = result.monster;
                this.selectedMonsterModal.setSelected(monster);
                
                detailsContainer.innerHTML = dndContent.formatMonster(monster) + `
                    <div class="monster-stat-block">
                        <p><strong>This will import:</strong></p>
                        <ul>
                            <li>Name: ${monster.name}</li>
                            <li>Race/Type: ${monster.type}</li>
                            <li>Hit Points: ${monster.hit_points}</li>
                            <li>Armor Class: ${monster.armor_class?.[0]?.value || 'Unknown'}</li>
                            <li>All ability scores</li>
                            <li>Challenge Rating as level</li>
                        </ul>
                    </div>
                `;
            } else {
                detailsContainer.innerHTML = `<p class="text-danger">Error loading monster details: ${result.message}</p>`;
                this.selectedMonsterModal.setSelected(null);
            }
        } catch (error) {
            console.error('Error loading monster details:', error);
            detailsContainer.innerHTML = '<p class="text-danger">Error loading monster details</p>';
            this.selectedMonsterModal.setSelected(null);
        }
    }

    populateNPCFromMonster(monster) {
        // Populate the character form with monster data
        const fields = {
            'char-name': monster.name,
            'char-race': monster.size + ' ' + monster.type,
            'char-level': Math.max(1, Math.floor(monster.challenge_rating) || 1),
            'char-strength': monster.strength || 10,
            'char-dexterity': monster.dexterity || 10,
            'char-constitution': monster.constitution || 10,
            'char-intelligence': monster.intelligence || 10,
            'char-wisdom': monster.wisdom || 10,
            'char-charisma': monster.charisma || 10,
            'char-max-hp': monster.hit_points || 1,
            'char-current-hp': monster.hit_points || 1,
            'char-ac': monster.armor_class?.[0]?.value || 10,
            'char-speed': Object.values(monster.speed || {walk: 30})[0] || 30
        };

        Object.keys(fields).forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.value = fields[fieldId];
                
                // Trigger change event for ability scores to update modifiers
                if (fieldId.includes('strength') || fieldId.includes('dexterity') || 
                    fieldId.includes('constitution') || fieldId.includes('intelligence') || 
                    fieldId.includes('wisdom') || fieldId.includes('charisma')) {
                    field.dispatchEvent(new Event('input'));
                }
            }
        });

        this.showAlert(`Imported stats from ${monster.name}!`, 'success');
    }

    setupSearchableDropdowns(character) {
        this.setupRaceSearch(character?.race || '');
        this.setupClassSearch(character?.class || '');
    }

    async setupRaceSearch(selectedRace) {
        const input = document.getElementById('char-race');
        const dropdown = document.getElementById('race-dropdown');
        
        if (!input || !dropdown) return;

        let races = [];
        
        // Load races from API
        try {
            const result = await dndContent.getRaces();
            if (result.success) {
                races = result.races || [];
            }
        } catch (error) {
            console.error('Error loading races:', error);
        }

        // Set up search functionality
        input.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            
            if (query.length === 0) {
                dropdown.style.display = 'none';
                return;
            }

            const filtered = races.filter(race => 
                race.name.toLowerCase().includes(query)
            );

            if (filtered.length > 0) {
                dropdown.innerHTML = filtered.map(race => 
                    `<div class="dropdown-item" data-value="${race.name}">${race.name}</div>`
                ).join('');
                dropdown.style.display = 'block';
                
                // Add click handlers
                dropdown.querySelectorAll('.dropdown-item').forEach(item => {
                    item.addEventListener('click', () => {
                        input.value = item.dataset.value;
                        dropdown.style.display = 'none';
                    });
                });
            } else {
                dropdown.style.display = 'none';
            }
        });

        // Hide dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!input.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });

        // Show all options on focus if empty
        input.addEventListener('focus', () => {
            if (input.value === '' && races.length > 0) {
                dropdown.innerHTML = races.slice(0, 10).map(race => 
                    `<div class="dropdown-item" data-value="${race.name}">${race.name}</div>`
                ).join('');
                dropdown.style.display = 'block';
                
                dropdown.querySelectorAll('.dropdown-item').forEach(item => {
                    item.addEventListener('click', () => {
                        input.value = item.dataset.value;
                        dropdown.style.display = 'none';
                    });
                });
            }
        });
    }

    async setupClassSearch(selectedClass) {
        const input = document.getElementById('char-class');
        const dropdown = document.getElementById('class-dropdown');
        
        if (!input || !dropdown) return;

        let classes = [];
        
        // Load classes from API
        try {
            const result = await dndContent.getClasses();
            if (result.success) {
                classes = result.classes || [];
            }
        } catch (error) {
            console.error('Error loading classes:', error);
        }

        // Set up search functionality
        input.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            
            if (query.length === 0) {
                dropdown.style.display = 'none';
                return;
            }

            const filtered = classes.filter(cls => 
                cls.name.toLowerCase().includes(query)
            );

            if (filtered.length > 0) {
                dropdown.innerHTML = filtered.map(cls => 
                    `<div class="dropdown-item" data-value="${cls.name}">${cls.name}</div>`
                ).join('');
                dropdown.style.display = 'block';
                
                // Add click handlers
                dropdown.querySelectorAll('.dropdown-item').forEach(item => {
                    item.addEventListener('click', () => {
                        input.value = item.dataset.value;
                        dropdown.style.display = 'none';
                    });
                });
            } else {
                dropdown.style.display = 'none';
            }
        });

        // Hide dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!input.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });

        // Show all options on focus if empty
        input.addEventListener('focus', () => {
            if (input.value === '' && classes.length > 0) {
                dropdown.innerHTML = classes.map(cls => 
                    `<div class="dropdown-item" data-value="${cls.name}">${cls.name}</div>`
                ).join('');
                dropdown.style.display = 'block';
                
                dropdown.querySelectorAll('.dropdown-item').forEach(item => {
                    item.addEventListener('click', () => {
                        input.value = item.dataset.value;
                        dropdown.style.display = 'none';
                    });
                });
            }
        });
    }

    // Utility functions
    escapeHtml(text) {
        if (!text) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.toString().replace(/[&<>"']/g, (m) => map[m]);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    }

    showAlert(message, type = 'info') {
        const existingAlert = document.querySelector('.alert');
        if (existingAlert) {
            existingAlert.remove();
        }

        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;
        
        const container = document.querySelector('.dashboard-main') || document.body;
        container.insertBefore(alert, container.firstChild);
        
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 5000);
    }

    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('show');
        });
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
        }
    }
}

// Initialize the application
// Initialize the application
const initiate = new Initiate();
window.initiate = initiate;