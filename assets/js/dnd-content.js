// D&D 5e SRD Content Integration

class DnDContent {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 300000; // 5 minutes
    }

    async makeRequest(endpoint, params = {}) {
        const cacheKey = endpoint + JSON.stringify(params);
        
        // Check cache
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }

        try {
            const url = new URL('api/dnd-content.php', window.location.origin);
            url.searchParams.append('action', endpoint);
            
            Object.keys(params).forEach(key => {
                if (params[key]) {
                    url.searchParams.append(key, params[key]);
                }
            });

            const response = await fetch(url);
            const data = await response.json();

            // Cache successful responses
            if (data.success) {
                this.cache.set(cacheKey, {
                    data: data,
                    timestamp: Date.now()
                });
            }

            return data;
        } catch (error) {
            console.error('D&D Content API error:', error);
            return { success: false, message: 'Failed to fetch content' };
        }
    }

    async searchSpells(query = '') {
        return await this.makeRequest('search-spells', { query });
    }

    async getSpell(index) {
        return await this.makeRequest('get-spell', { index });
    }

    async searchMonsters(query = '') {
        return await this.makeRequest('search-monsters', { query });
    }

    async getMonster(index) {
        return await this.makeRequest('get-monster', { index });
    }

    async getClasses() {
        return await this.makeRequest('get-classes');
    }

    async getRaces() {
        return await this.makeRequest('get-races');
    }

    async getRace(index) {
        return await this.makeRequest('get-race', { index });
    }

    async getClass(index) {
        return await this.makeRequest('get-class', { index });
    }

    async getEquipment(category = '') {
        return await this.makeRequest('get-equipment', { category });
    }

    // Utility function to format spell information
    formatSpell(spell) {
        let formatted = `<div class="content-info">
            <h4>${spell.name}</h4>`;
            
        // Spell Level and School
        const levelText = spell.level === 0 ? 'Cantrip' : `${spell.level}${this.getOrdinalSuffix(spell.level)} Level`;
        const schoolText = spell.school?.name || 'Unknown School';
        formatted += `<div style="background-color: rgba(74, 85, 104, 0.3); padding: 1rem; border-radius: 4px; margin-bottom: 1rem;">`;
        formatted += `<p><strong>Level:</strong> ${levelText} ${schoolText} Spell</p>`;
        
        // Spell Basics
        if (spell.casting_time) {
            formatted += `<p><strong>Casting Time:</strong> ${spell.casting_time}</p>`;
        }
        
        if (spell.range) {
            formatted += `<p><strong>Range:</strong> ${spell.range}</p>`;
        }
        
        if (spell.duration) {
            formatted += `<p><strong>Duration:</strong> ${spell.duration}</p>`;
        }
        formatted += `</div>`;
        
        // Components Section
        if (spell.components?.length) {
            formatted += `<div style="background-color: rgba(74, 85, 104, 0.3); padding: 1rem; border-radius: 4px; margin-bottom: 1rem;">`;
            formatted += `<h5 style="color: var(--accent-color); margin-bottom: 0.5rem;">Components</h5>`;
            
            const componentNames = {
                'V': 'Verbal',
                'S': 'Somatic', 
                'M': 'Material'
            };
            
            const componentList = spell.components.map(comp => componentNames[comp] || comp);
            formatted += `<p><strong>Required:</strong> ${componentList.join(', ')}</p>`;
            
            if (spell.material) {
                formatted += `<p><strong>Materials:</strong> ${spell.material}</p>`;
            } else if (spell.components.includes('M')) {
                formatted += `<p><strong>Materials:</strong> A spellcasting focus or component pouch</p>`;
            }
            
            if (spell.ritual) {
                formatted += `<p><strong>Ritual:</strong> This spell can be cast as a ritual</p>`;
            }
            
            if (spell.concentration) {
                formatted += `<p><strong>Concentration:</strong> This spell requires concentration</p>`;
            }
            formatted += `</div>`;
        }
        
        // Description
        if (spell.desc?.length) {
            formatted += `<div style="background-color: rgba(74, 85, 104, 0.3); padding: 1rem; border-radius: 4px; margin-bottom: 1rem;">`;
            formatted += `<h5 style="color: var(--accent-color); margin-bottom: 0.5rem;">Description</h5>`;
            spell.desc.forEach(paragraph => {
                formatted += `<p>${paragraph}</p>`;
            });
            formatted += `</div>`;
        }
        
        // At Higher Levels
        if (spell.higher_level?.length) {
            formatted += `<div style="background-color: rgba(74, 85, 104, 0.3); padding: 1rem; border-radius: 4px; margin-bottom: 1rem;">`;
            formatted += `<h5 style="color: var(--accent-color); margin-bottom: 0.5rem;">At Higher Levels</h5>`;
            spell.higher_level.forEach(paragraph => {
                formatted += `<p>${paragraph}</p>`;
            });
            formatted += `</div>`;
        }
        
        // Classes that can use this spell
        if (spell.classes?.length) {
            formatted += `<div style="background-color: rgba(74, 85, 104, 0.3); padding: 1rem; border-radius: 4px; margin-bottom: 1rem;">`;
            formatted += `<h5 style="color: var(--accent-color); margin-bottom: 0.5rem;">Available To</h5>`;
            const classList = spell.classes.map(cls => cls.name).join(', ');
            formatted += `<p><strong>Classes:</strong> ${classList}</p>`;
            
            if (spell.subclasses?.length) {
                const subclassList = spell.subclasses.map(sub => sub.name).join(', ');
                formatted += `<p><strong>Subclasses:</strong> ${subclassList}</p>`;
            }
            formatted += `</div>`;
        }
        
        formatted += `</div>`;
        return formatted;
    }

    // Utility function to format monster information
    formatMonster(monster) {
        let formatted = `<div class="content-info">
            <h4>${monster.name}</h4>`;
        
        // Basic Info
        formatted += `<div style="background-color: rgba(74, 85, 104, 0.3); padding: 1rem; border-radius: 4px; margin-bottom: 1rem;">`;
        if (monster.size || monster.type) {
            const alignment = monster.alignment || 'Unspecified alignment';
            formatted += `<p><strong>Type:</strong> ${monster.size || 'Medium'} ${monster.type || 'creature'}, ${alignment}</p>`;
        }
        
        if (monster.armor_class?.length) {
            const ac = monster.armor_class[0];
            formatted += `<p><strong>Armor Class:</strong> ${ac.value}${ac.type ? ` (${ac.type})` : ''}</p>`;
        }
        
        if (monster.hit_points) {
            formatted += `<p><strong>Hit Points:</strong> ${monster.hit_points}${monster.hit_points_roll ? ` (${monster.hit_points_roll})` : ''}</p>`;
        }
        
        if (monster.speed) {
            formatted += `<p><strong>Speed:</strong> ${this.formatSpeed(monster.speed)}</p>`;
        }
        formatted += `</div>`;
        
        // Ability Scores with Modifiers
        if (monster.strength !== undefined) {
            formatted += `<div style="background-color: rgba(74, 85, 104, 0.3); padding: 1rem; border-radius: 4px; margin-bottom: 1rem;">`;
            formatted += `<h5 style="color: var(--accent-color); margin-bottom: 0.5rem;">Ability Scores</h5>`;
            
            formatted += `<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; text-align: center;">`;
            formatted += `<div><strong>STR</strong><br>${monster.strength} (${this.getModifier(monster.strength)})</div>`;
            formatted += `<div><strong>DEX</strong><br>${monster.dexterity} (${this.getModifier(monster.dexterity)})</div>`;
            formatted += `<div><strong>CON</strong><br>${monster.constitution} (${this.getModifier(monster.constitution)})</div>`;
            formatted += `<div><strong>INT</strong><br>${monster.intelligence} (${this.getModifier(monster.intelligence)})</div>`;
            formatted += `<div><strong>WIS</strong><br>${monster.wisdom} (${this.getModifier(monster.wisdom)})</div>`;
            formatted += `<div><strong>CHA</strong><br>${monster.charisma} (${this.getModifier(monster.charisma)})</div>`;
            formatted += `</div></div>`;
        }
        
        // Defenses and Resistances
        formatted += `<div style="background-color: rgba(74, 85, 104, 0.3); padding: 1rem; border-radius: 4px; margin-bottom: 1rem;">`;
        formatted += `<h5 style="color: var(--accent-color); margin-bottom: 0.5rem;">Defenses</h5>`;
        
        if (monster.saving_throws) {
            const saves = Object.entries(monster.saving_throws).map(([ability, bonus]) => 
                `${ability.toUpperCase()} ${bonus >= 0 ? '+' : ''}${bonus}`
            );
            formatted += `<p><strong>Saving Throws:</strong> ${saves.join(', ')}</p>`;
        }
        
        if (monster.skills) {
            const skills = Object.entries(monster.skills).map(([skill, bonus]) => 
                `${skill.charAt(0).toUpperCase() + skill.slice(1)} ${bonus >= 0 ? '+' : ''}${bonus}`
            );
            formatted += `<p><strong>Skills:</strong> ${skills.join(', ')}</p>`;
        }
        
        if (monster.damage_vulnerabilities?.length) {
            formatted += `<p><strong>Damage Vulnerabilities:</strong> ${monster.damage_vulnerabilities.join(', ')}</p>`;
        }
        
        if (monster.damage_resistances?.length) {
            formatted += `<p><strong>Damage Resistances:</strong> ${monster.damage_resistances.join(', ')}</p>`;
        }
        
        if (monster.damage_immunities?.length) {
            formatted += `<p><strong>Damage Immunities:</strong> ${monster.damage_immunities.join(', ')}</p>`;
        }
        
        if (monster.condition_immunities?.length) {
            const conditions = monster.condition_immunities.map(ci => ci.name || ci).join(', ');
            formatted += `<p><strong>Condition Immunities:</strong> ${conditions}</p>`;
        }
        
        if (monster.senses) {
            const senses = Object.entries(monster.senses).map(([type, range]) => 
                `${type} ${range}`
            );
            formatted += `<p><strong>Senses:</strong> ${senses.join(', ')}</p>`;
        }
        
        if (monster.languages) {
            formatted += `<p><strong>Languages:</strong> ${monster.languages}</p>`;
        }
        
        if (monster.challenge_rating !== undefined) {
            formatted += `<p><strong>Challenge Rating:</strong> ${monster.challenge_rating}${monster.xp ? ` (${monster.xp.toLocaleString()} XP)` : ''}</p>`;
        }
        
        const profBonus = monster.proficiency_bonus || Math.ceil(monster.challenge_rating / 4) + 1;
        formatted += `<p><strong>Proficiency Bonus:</strong> +${profBonus}</p>`;
        formatted += `</div>`;
        
        // Special Abilities
        if (monster.special_abilities?.length) {
            formatted += `<div style="background-color: rgba(74, 85, 104, 0.3); padding: 1rem; border-radius: 4px; margin-bottom: 1rem;">`;
            formatted += `<h5 style="color: var(--accent-color); margin-bottom: 0.5rem;">Special Abilities</h5>`;
            monster.special_abilities.forEach(ability => {
                formatted += `<div style="margin-bottom: 1rem;">`;
                formatted += `<h6 style="color: var(--accent-color); margin-bottom: 0.25rem;">${ability.name}</h6>`;
                formatted += `<p>${ability.desc || 'Consult the Monster Manual for details.'}</p>`;
                formatted += `</div>`;
            });
            formatted += `</div>`;
        }
        
        // Actions
        if (monster.actions?.length) {
            formatted += `<div style="background-color: rgba(74, 85, 104, 0.3); padding: 1rem; border-radius: 4px; margin-bottom: 1rem;">`;
            formatted += `<h5 style="color: var(--accent-color); margin-bottom: 0.5rem;">Actions</h5>`;
            monster.actions.forEach(action => {
                formatted += `<div style="margin-bottom: 1rem;">`;
                formatted += `<h6 style="color: var(--accent-color); margin-bottom: 0.25rem;">${action.name}</h6>`;
                formatted += `<p>${action.desc || 'Consult the Monster Manual for attack and damage details.'}</p>`;
                
                if (action.attack_bonus) {
                    formatted += `<p><em>Attack Bonus: +${action.attack_bonus}</em></p>`;
                }
                
                if (action.damage?.length) {
                    action.damage.forEach(dmg => {
                        formatted += `<p><em>Damage: ${dmg.damage_dice || dmg.damage_at_slot_level} ${dmg.damage_type?.name || ''}</em></p>`;
                    });
                }
                formatted += `</div>`;
            });
            formatted += `</div>`;
        }
        
        // Legendary Actions
        if (monster.legendary_actions?.length) {
            formatted += `<div style="background-color: rgba(74, 85, 104, 0.3); padding: 1rem; border-radius: 4px; margin-bottom: 1rem;">`;
            formatted += `<h5 style="color: var(--accent-color); margin-bottom: 0.5rem;">Legendary Actions</h5>`;
            formatted += `<p><em>The ${monster.name} can take 3 legendary actions, choosing from the options below. Only one legendary action option can be used at a time and only at the end of another creature's turn. The ${monster.name} regains spent legendary actions at the start of its turn.</em></p>`;
            monster.legendary_actions.forEach(action => {
                formatted += `<div style="margin-bottom: 0.5rem;">`;
                formatted += `<h6 style="color: var(--accent-color); margin-bottom: 0.25rem;">${action.name}</h6>`;
                formatted += `<p>${action.desc || 'See Monster Manual for details.'}</p>`;
                formatted += `</div>`;
            });
            formatted += `</div>`;
        }
        
        formatted += `</div>`;
        return formatted;
    }

    formatSpeed(speed) {
        if (!speed) return 'Unknown';
        
        const speeds = [];
        Object.keys(speed).forEach(type => {
            if (type === 'walk') {
                speeds.push(`${speed[type]}`);
            } else {
                speeds.push(`${type} ${speed[type]}`);
            }
        });
        
        return speeds.join(', ');
    }

    getModifier(score) {
        const mod = Math.floor((score - 10) / 2);
        return mod >= 0 ? `+${mod}` : `${mod}`;
    }

    // Helper function for ordinal suffixes
    getOrdinalSuffix(num) {
        const j = num % 10;
        const k = num % 100;
        if (j == 1 && k != 11) return 'st';
        if (j == 2 && k != 12) return 'nd';
        if (j == 3 && k != 13) return 'rd';
        return 'th';
    }

    // Helper function to get display name for content type
    getDisplayName(type, singular = false) {
        const displayNames = {
            'races': singular ? 'Species' : 'Species',
            'classes': singular ? 'Class' : 'Classes',
            'spells': singular ? 'Spell' : 'Spells',
            'monsters': singular ? 'Creature' : 'Creatures'
        };
        return displayNames[type] || type;
    }

    /**
     * Create a content browser modal for D&D content
     * @param {string} type - Content type ('spells', 'classes', 'races', 'monsters')
     * @param {function} onSelect - Callback function when item is selected
     * @param {string} context - Context ('reference' or 'character-creation')
     * @returns {HTMLElement} The created modal element
     */
    createContentBrowser(type = 'spells', onSelect = null, context = 'reference') {
        const modalId = `dnd-content-browser-${type}`;
        
        // Remove existing modal
        const existing = document.getElementById(modalId);
        if (existing) {
            existing.remove();
        }

        const modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'modal';
        modal.dataset.context = context;
        
        const selectButtonHtml = onSelect ? 
            `<button type="button" id="select-${type}" class="btn btn-primary" disabled>Select</button>` : '';
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 1000px; height: 80vh;">
                <div class="modal-header">
                    <h3>Browse ${this.getDisplayName(type)}</h3>
                    <button class="close">&times;</button>
                </div>
                <div class="modal-body" style="display: flex; height: calc(80vh - 120px);">
                    <div class="content-search" style="width: 280px; padding-right: 1rem; border-right: 1px solid var(--border-color);">
                        <div class="form-group">
                            <input type="text" id="${type}-search" placeholder="Search ${this.getDisplayName(type).toLowerCase()}..." class="form-control">
                        </div>
                        <div id="${type}-list" style="max-height: calc(100% - 60px); overflow-y: auto;">
                            <!-- Content will be loaded here -->
                        </div>
                    </div>
                    <div class="content-details" style="flex: 1; padding-left: 1rem; overflow-y: auto; overflow-x: hidden;">
                        <div id="${type}-details">
                            <p class="text-secondary">Select a ${this.getDisplayName(type, true).toLowerCase()} from the list to view details.</p>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    ${selectButtonHtml}
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Close</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.classList.add('show');
        
        // Set up event handlers after modal is rendered
        const self = this;
        setTimeout(() => {
            try {
                self.setupContentBrowser(type, modalId, onSelect, context);
            } catch (error) {
                console.error('Error setting up content browser:', error);
            }
        }, 100);
        
        return modal;
    }

    /**
     * Set up content browser functionality
     * @param {string} type - Content type
     * @param {string} modalId - Modal element ID
     * @param {function} onSelect - Selection callback
     * @param {string} context - Browser context
     */
    async setupContentBrowser(type, modalId, onSelect = null, context = 'reference') {
        // Ensure DOM is ready
        await new Promise(resolve => setTimeout(resolve, 50));
        
        const searchInput = document.getElementById(`${type}-search`);
        const listContainer = document.getElementById(`${type}-list`);
        const detailsContainer = document.getElementById(`${type}-details`);
        const selectButton = document.getElementById(`select-${type}`);

        if (!listContainer || !detailsContainer) {
            console.error('Required DOM elements not found for content browser');
            return;
        }

        // Track selected item for callback
        let selectedItem = null;

        // Set up select button if callback provided
        if (onSelect && selectButton) {
            selectButton.addEventListener('click', () => {
                if (selectedItem) {
                    // If this is a class selection, collect interactive selections first
                    if (type === 'classes' && window.characterManager) {
                        window.characterManager.updateCharacterWithClassSelections();
                    }
                    
                    onSelect(selectedItem);
                    const modal = document.getElementById(modalId);
                    if (modal) modal.remove();
                }
            });
        }

        // Load initial content
        try {
            listContainer.innerHTML = '<p>Loading...</p>';
            await this.loadContentList(type, '', listContainer, detailsContainer, (item) => {
                selectedItem = item;
                if (selectButton) {
                    selectButton.disabled = false;
                    selectButton.textContent = `Select ${item.name}`;
                }
            }, context);
        } catch (error) {
            console.error('Error loading content list:', error);
            listContainer.innerHTML = `<p class="text-danger">Error loading ${type}: ${error.message}</p>`;
        }

        // Set up search
        let searchTimeout;
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    selectedItem = null; // Reset selection on search
                    if (selectButton) {
                        selectButton.disabled = true;
                        selectButton.textContent = 'Select';
                    }
                    this.loadContentList(type, e.target.value, listContainer, detailsContainer, (item) => {
                        selectedItem = item;
                        if (selectButton) {
                            selectButton.disabled = false;
                            selectButton.textContent = `Select ${item.name}`;
                        }
                    }, context);
                }, 300);
            });
        }
    }

    /**
     * Load and display content list
     * @param {string} type - Content type
     * @param {string} query - Search query
     * @param {HTMLElement} listContainer - List container element
     * @param {HTMLElement} detailsContainer - Details container element
     * @param {function} onItemSelect - Item selection callback
     * @param {string} context - Browser context
     */
    async loadContentList(type, query, listContainer, detailsContainer, onItemSelect = null, context = 'reference') {
        let result = null;
        
        try {
            listContainer.innerHTML = '<p>Loading...</p>';

            switch (type) {
                case 'spells':
                    result = await this.searchSpells(query);
                    break;
                case 'monsters':
                    result = await this.searchMonsters(query);
                    break;
                case 'races':
                    result = await this.getRaces();
                    break;
                case 'classes':
                    result = await this.getClasses();
                    break;
                default:
                    listContainer.innerHTML = '<p class="text-danger">Unknown content type.</p>';
                    return;
            }
        } catch (error) {
            console.error(`Error loading ${type} content:`, error);
            listContainer.innerHTML = `<p class="text-danger">Error loading ${type}: ${error.message}</p>`;
            return;
        }

        if (!result || !result.success) {
            listContainer.innerHTML = `<p class="text-danger">Error: ${result?.message || 'Failed to load content'}</p>`;
            return;
        }

        const items = result[type] || [];
        
        // Filter items by query for races and classes (client-side filtering)
        let filteredItems = items;
        if ((type === 'races' || type === 'classes') && query.trim()) {
            filteredItems = items.filter(item => 
                item.name.toLowerCase().includes(query.toLowerCase())
            );
        }
        
        if (filteredItems.length === 0) {
            listContainer.innerHTML = '<p class="text-secondary">No results found.</p>';
            return;
        }

        listContainer.innerHTML = filteredItems.map(item => `
            <div class="content-item" data-index="${item.index}" style="padding: 0.5rem; margin-bottom: 0.5rem; border: 1px solid var(--border-color); border-radius: 4px; cursor: pointer;">
                <strong>${item.name}</strong>
                ${type === 'spells' && item.level !== undefined ? `<br><small>Level ${item.level === 0 ? 'Cantrip' : item.level}</small>` : ''}
                ${type === 'monsters' && item.challenge_rating !== undefined ? `<br><small>CR ${item.challenge_rating}</small>` : ''}
            </div>
        `).join('');

        // Add click handlers
        const contentItems = listContainer.querySelectorAll('.content-item');
        
        contentItems.forEach((item) => {
            item.addEventListener('click', () => {
                this.loadContentDetails(type, item.dataset.index, detailsContainer, context);
                
                // Handle selection callback if provided
                if (onItemSelect) {
                    const selectedItem = filteredItems.find(i => i.index === item.dataset.index);
                    if (selectedItem) {
                        onItemSelect(selectedItem);
                    }
                }
                
                // Update visual selection
                contentItems.forEach(ci => ci.classList.remove('selected'));
                item.classList.add('selected');
                
                // Highlight selected item
                listContainer.querySelectorAll('.content-item').forEach(i => i.style.backgroundColor = '');
                item.style.backgroundColor = 'var(--accent-color)';
                item.style.color = 'white';
            });
        });
        
        return { success: true, count: filteredItems.length };
    }

    /**
     * Load and display detailed content information
     * @param {string} type - Content type
     * @param {string} index - Content index/identifier
     * @param {HTMLElement} detailsContainer - Details display container
     * @param {string} context - Display context
     */
    async loadContentDetails(type, index, detailsContainer, context = 'reference') {
        detailsContainer.innerHTML = '<p>Loading details...</p>';

        let result;
        switch (type) {
            case 'spells':
                result = await this.getSpell(index);
                break;
            case 'monsters':
                result = await this.getMonster(index);
                break;
            case 'races':
                result = await this.getRace(index);
                break;
            case 'classes':
                result = await this.getClass(index);
                break;
            default:
                detailsContainer.innerHTML = '<p class="text-danger">Unknown content type.</p>';
                return;
        }

        if (!result || !result.success) {
            detailsContainer.innerHTML = `<p class="text-danger">Error loading details: ${result?.message || 'Failed to load'}</p>`;
            return;
        }

        const item = result[type.slice(0, -1)] || result.race || result.class;
        
        switch (type) {
            case 'spells':
                detailsContainer.innerHTML = this.formatSpell(item);
                break;
            case 'monsters':
                detailsContainer.innerHTML = this.formatMonster(item);
                break;
            case 'races':
                detailsContainer.innerHTML = this.formatRace(item);
                break;
            case 'classes':
                detailsContainer.innerHTML = this.formatClass(item, context);
                break;
        }
    }

    // Helper function for ordinal suffixes
    getOrdinalSuffix(num) {
        const j = num % 10;
        const k = num % 100;
        if (j == 1 && k != 11) return 'st';
        if (j == 2 && k != 12) return 'nd';
        if (j == 3 && k != 13) return 'rd';
        return 'th';
    }

    // Format race information  
    formatRace(race) {
        let formatted = `<div class="content-info">
            <h4>${race.name}</h4>`;
            
        if (race.ability_score_increases?.length) {
            formatted += `<p><strong>Ability Score Increases:</strong> `;
            const increases = race.ability_score_increases.map(asi => {
                const abilityName = asi.ability_score?.name || asi.ability_score?.index || 'Unknown';
                return `${abilityName} +${asi.bonus}`;
            });
            formatted += increases.join(', ') + '</p>';
        }
        
        if (race.size) {
            formatted += `<p><strong>Size:</strong> ${race.size}</p>`;
        }
        
        if (race.speed) {
            formatted += `<p><strong>Speed:</strong> ${race.speed} feet</p>`;
        }
        
        if (race.age) {
            formatted += `<p><strong>Age:</strong> ${race.age}</p>`;
        }
        
        if (race.size_description) {
            formatted += `<p><strong>Size Details:</strong> ${race.size_description}</p>`;
        }
        
        if (race.alignment) {
            formatted += `<p><strong>Alignment:</strong> ${race.alignment}</p>`;
        }
        
        if (race.languages?.length) {
            formatted += `<p><strong>Languages:</strong> `;
            const languages = race.languages.map(lang => lang.name);
            formatted += languages.join(', ') + '</p>';
        }
        
        if (race.language_desc) {
            formatted += `<p><strong>Language Details:</strong> ${race.language_desc}</p>`;
        }
        
        // Enhanced trait descriptions
        if (race.traits?.length) {
            formatted += `<h5>Racial Traits:</h5>`;
            race.traits.forEach(trait => {
                formatted += `<div style="margin: 1rem 0; padding: 1rem; background-color: rgba(74, 85, 104, 0.3); border-radius: 4px;">`;
                formatted += `<h6 style="color: var(--accent-color); margin-bottom: 0.5rem;">${trait.name}</h6>`;
                
                if (trait.desc && trait.desc.length > 0) {
                    trait.desc.forEach(desc => {
                        formatted += `<p>${desc}</p>`;
                    });
                } else {
                    // Provide helpful descriptions for common traits
                    const traitDescriptions = {
                        'Darkvision': 'You can see in dim light within 60 feet as if it were bright light, and in darkness as if it were dim light. You can\'t discern color in darkness, only shades of gray.',
                        'Lucky': 'When you roll a 1 on an attack roll, ability check, or saving throw, you can reroll the die and must use the new roll.',
                        'Brave': 'You have advantage on saving throws against being frightened.',
                        'Halfling Nimbleness': 'You can move through the space of any creature that is of a size larger than yours.',
                        'Draconic Ancestry': 'You have draconic ancestry. Choose one type of dragon from the table. Your breath weapon and damage resistance are determined by the dragon type.',
                        'Breath Weapon': 'You can use your action to exhale destructive energy. The damage type is determined by your draconic ancestry.',
                        'Damage Resistance': 'You have resistance to the damage type associated with your draconic ancestry.',
                        'Stonecunning': 'Whenever you make an Intelligence (History) check related to the origin of stonework, you are considered proficient and add double your proficiency bonus.',
                        'Trance': 'Elves don\'t need to sleep. Instead, they meditate deeply for 4 hours a day, remaining semiconscious.',
                        'Keen Senses': 'You have proficiency in the Perception skill.',
                        'Fey Ancestry': 'You have advantage on saving throws against being charmed, and magic can\'t put you to sleep.'
                    };
                    
                    if (traitDescriptions[trait.name]) {
                        formatted += `<p>${traitDescriptions[trait.name]}</p>`;
                    } else {
                        formatted += `<p><em>Consult the Player's Handbook for complete details on this racial trait.</em></p>`;
                    }
                }
                formatted += `</div>`;
            });
        }
        
        if (race.subraces?.length) {
            formatted += `<h5>Subraces:</h5>`;
            formatted += `<div style="background-color: rgba(74, 85, 104, 0.3); padding: 1rem; border-radius: 4px;">`;
            formatted += `<ul>${race.subraces.map(subrace => `<li><strong>${subrace.name}:</strong> Adds additional traits and abilities</li>`).join('')}</ul>`;
            formatted += `</div>`;
        }
        
        formatted += `</div>`;
        return formatted;
    }

    // Format class information
    formatClass(charClass, context = 'reference') {
        let formatted = `<div class="content-info">
            <h4>${charClass.name}</h4>`;
            
        if (charClass.hit_die) {
            formatted += `<p><strong>Hit Die:</strong> d${charClass.hit_die}</p>`;
        }
        
        if (charClass.primary_ability?.length) {
            formatted += `<p><strong>Primary Ability:</strong> ${charClass.primary_ability.join(', ')}</p>`;
        }
        
        if (charClass.saving_throw_proficiencies?.length) {
            const saves = charClass.saving_throw_proficiencies.map(save => save.name || save.index);
            formatted += `<p><strong>Saving Throw Proficiencies:</strong> ${saves.join(', ')}</p>`;
        }
        
        // Enhanced proficiency display - interactive only for character creation
        if (charClass.proficiencies?.length) {
            const skillProfs = charClass.proficiencies.filter(p => p.name?.includes('Skill:') || p.type === 'Skills');
            const armorProfs = charClass.proficiencies.filter(p => p.name?.includes('Armor') || p.type === 'Armor');
            const weaponProfs = charClass.proficiencies.filter(p => p.name?.includes('Weapon') || p.type === 'Weapons');
            const toolProfs = charClass.proficiencies.filter(p => p.name?.includes('Tool') || p.type === 'Tools');
            
            if (skillProfs.length) {
                formatted += `<p><strong>Skill Proficiencies:</strong> Choose from ${skillProfs.map(skill => skill.name.replace('Skill: ', '')).join(', ')}</p>`;
            }
            
            if (armorProfs.length) {
                formatted += `<p><strong>Armor Proficiencies:</strong> ${armorProfs.map(armor => armor.name).join(', ')}</p>`;
            }
            
            if (weaponProfs.length) {
                formatted += `<p><strong>Weapon Proficiencies:</strong> ${weaponProfs.map(weapon => weapon.name).join(', ')}</p>`;
            }
            
            if (toolProfs.length) {
                formatted += `<p><strong>Tool Proficiencies:</strong> ${toolProfs.map(tool => tool.name).join(', ')}</p>`;
            }
        }
        
        if (charClass.proficiency_choices?.length) {
            formatted += `<h5>Proficiency Choices:</h5>`;
            charClass.proficiency_choices.forEach((choice, choiceIndex) => {
                formatted += `<div style="margin: 0.5rem 0; padding: 1rem; background-color: rgba(74, 85, 104, 0.3); border-radius: 4px;">`;
                formatted += `<p><strong>Choose ${choice.choose || 'some'} from:</strong></p>`;
                if (choice.from?.options) {
                    // Only add interactive elements for character creation
                    if (context === 'character-creation') {
                        formatted += `<div class="proficiency-selection" data-choice-index="${choiceIndex}" data-max-choices="${choice.choose || 1}">`;
                        choice.from.options.forEach((opt, optIndex) => {
                            const profName = opt.item?.name || opt.name || 'Unknown';
                            const profValue = opt.item?.index || profName.toLowerCase().replace(/[^a-z0-9]/g, '-');
                            formatted += `
                                <label style="display: flex; align-items: center; margin: 0.2rem 0; cursor: pointer; font-size: 0.9rem;">
                                    <input type="checkbox" 
                                           class="proficiency-choice" 
                                           data-choice-group="${choiceIndex}"
                                           value="${profValue}" 
                                           data-name="${profName}"
                                           style="margin: 0 0.4rem 0 0; flex-shrink: 0; width: 16px; height: 16px;">
                                    <span style="line-height: 1.2;">${profName}</span>
                                </label>`;
                        });
                        formatted += `</div>`;
                        formatted += `<p class="selection-count" id="prof-count-${choiceIndex}" style="font-size: 0.9em; color: var(--accent-color); margin-top: 0.5rem;">Selected: 0/${choice.choose || 1}</p>`;
                    } else {
                        // For reference mode, just list the options
                        formatted += `<ul style="margin: 0.5rem 0;">`;
                        choice.from.options.forEach((opt, optIndex) => {
                            const profName = opt.item?.name || opt.name || 'Unknown';
                            formatted += `<li>${profName}</li>`;
                        });
                        formatted += `</ul>`;
                    }
                }
                formatted += `</div>`;
            });
        }
        
        if (charClass.starting_equipment?.length) {
            formatted += `<h5>Starting Equipment:</h5>`;
            formatted += `<div style="background-color: rgba(74, 85, 104, 0.3); padding: 1rem; border-radius: 4px;">`;
            formatted += `<ul>`;
            charClass.starting_equipment.forEach(item => {
                const itemName = item.equipment?.name || item.name || 'Equipment';
                const quantity = item.quantity ? ` (${item.quantity})` : '';
                formatted += `<li>${itemName}${quantity}</li>`;
            });
            formatted += `</ul></div>`;
        }
        
        if (charClass.starting_equipment_options?.length) {
            formatted += `<h5>Starting Equipment Options:</h5>`;
            charClass.starting_equipment_options.forEach((option, index) => {
                formatted += `<div style="margin: 0.5rem 0; padding: 1rem; background-color: rgba(74, 85, 104, 0.3); border-radius: 4px;">`;
                
                // Show the descriptive text first if available
                if (option.desc) {
                    formatted += `<p><strong>Option ${index + 1}:</strong> ${option.desc}</p>`;
                } else {
                    formatted += `<p><strong>Option ${index + 1}:</strong> Choose ${option.choose || 'some'} from the following:</p>`;
                }
                
                // Show detailed options with radio buttons for selection (only for character creation)
                if (option.from?.options?.length) {
                    if (context === 'character-creation') {
                        formatted += `<div style="margin-top: 0.5rem; padding-left: 1rem;" class="equipment-selection" data-option-index="${index}">`;
                        
                        option.from.options.forEach((opt, optIndex) => {
                            let optionText = '';
                            let optionValue = '';
                            
                            if (opt.option_type === 'counted_reference' && opt.of) {
                                const count = opt.count > 1 ? `${opt.count}x ` : '';
                                optionText = `${count}${opt.of.name}`;
                                optionValue = `${opt.count || 1}x${opt.of.name}`;
                            } else if (opt.option_type === 'choice' && opt.choice) {
                                optionText = opt.choice.desc || 'Equipment choice';
                                if (opt.choice.from?.equipment_category) {
                                optionText += ` (${opt.choice.from.equipment_category.name})`;
                            }
                            optionValue = optionText;
                        } else if (opt.item) {
                            optionText = opt.item.name;
                            optionValue = opt.item.name;
                        } else if (opt.name) {
                            optionText = opt.name;
                            optionValue = opt.name;
                        } else {
                            optionText = 'Equipment option';
                            optionValue = 'Equipment option';
                        }
                        
                        formatted += `
                            <label style="display: flex; align-items: center; margin: 0.2rem 0; cursor: pointer; font-size: 0.9rem;">
                                <input type="radio" 
                                       name="equipment-option-${index}"
                                       class="equipment-choice"
                                       value="${optionValue}"
                                       data-option-group="${index}"
                                       style="margin: 0 0.4rem 0 0; flex-shrink: 0; width: 16px; height: 16px;">
                                <span style="line-height: 1.2;">${optionText}</span>
                            </label>`;
                    });
                    
                    formatted += `</div>`;
                    } else {
                        // For reference mode, just list the options
                        formatted += `<ul style="margin-top: 0.5rem; padding-left: 1rem;">`;
                        option.from.options.forEach((opt, optIndex) => {
                            let optionText = '';
                            
                            if (opt.option_type === 'counted_reference' && opt.of) {
                                const count = opt.count > 1 ? `${opt.count}x ` : '';
                                optionText = `${count}${opt.of.name}`;
                            } else if (opt.option_type === 'choice' && opt.choice) {
                                optionText = opt.choice.desc || 'Equipment choice';
                                if (opt.choice.from?.equipment_category) {
                                    optionText += ` (${opt.choice.from.equipment_category.name})`;
                                }
                            } else if (opt.item) {
                                optionText = opt.item.name;
                            } else if (opt.name) {
                                optionText = opt.name;
                            } else {
                                optionText = 'Equipment option';
                            }
                            
                            formatted += `<li>${optionText}</li>`;
                        });
                        formatted += `</ul>`;
                    }
                }
                
                formatted += `</div>`;
            });
        }
        
        // Add class features information with detailed API data
        if (charClass.class_levels) {
            formatted += `<h5>Class Features by Level:</h5>`;
            formatted += `<div style="background-color: rgba(74, 85, 104, 0.3); padding: 1rem; border-radius: 4px;">`;
            
            // Fetch and display actual class level features
            formatted += `<div id="class-features-${charClass.index}" style="margin: 0;">`;
            formatted += `<p><em>Loading class features for your level...</em></p>`;
            formatted += `</div>`;
            formatted += `</div>`;
            
            // Load detailed features asynchronously
            setTimeout(() => {
                this.loadClassFeatures(charClass.index, charClass.class_levels, context);
                
                // Add listener to update features when level changes (only for character creation)
                if (context === 'character-creation') {
                    const levelInput = document.getElementById('char-level');
                    if (levelInput) {
                        levelInput.addEventListener('change', () => {
                            this.loadClassFeatures(charClass.index, charClass.class_levels, context);
                        });
                    }
                }
            }, 200);
        }
        
        if (charClass.spellcasting) {
            formatted += `<h5>Spellcasting:</h5>`;
            formatted += `<div style="background-color: rgba(74, 85, 104, 0.3); padding: 1rem; border-radius: 4px;">`;
            formatted += `<p><strong>Spellcasting Ability:</strong> ${charClass.spellcasting.spellcasting_ability?.name || 'See class description'}</p>`;
            formatted += `<p>This class has access to spells and magical abilities. The spellcasting progression and spell list are detailed in the Player's Handbook.</p>`;
            formatted += `</div>`;
        }
        
        formatted += `</div>`;
        
        // Add script to handle interactive selections
        setTimeout(() => {
            this.setupClassSelectionHandlers();
        }, 100);
        
        return formatted;
    }

    setupClassSelectionHandlers() {
        // Handle proficiency choice limitations
        document.querySelectorAll('.proficiency-choice').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const choiceGroup = e.target.dataset.choiceGroup;
                const maxChoices = parseInt(document.querySelector(`[data-choice-index="${choiceGroup}"]`)?.dataset.maxChoices || 1);
                const checkedBoxes = document.querySelectorAll(`.proficiency-choice[data-choice-group="${choiceGroup}"]:checked`);
                
                // Disable other checkboxes if max reached
                if (checkedBoxes.length >= maxChoices) {
                    document.querySelectorAll(`.proficiency-choice[data-choice-group="${choiceGroup}"]:not(:checked)`).forEach(cb => {
                        cb.disabled = true;
                    });
                } else {
                    document.querySelectorAll(`.proficiency-choice[data-choice-group="${choiceGroup}"]`).forEach(cb => {
                        cb.disabled = false;
                    });
                }
                
                // Update count display
                const countElement = document.getElementById(`prof-count-${choiceGroup}`);
                if (countElement) {
                    countElement.textContent = `Selected: ${checkedBoxes.length}/${maxChoices}`;
                    countElement.style.color = checkedBoxes.length === maxChoices ? 'var(--success-color)' : 'var(--accent-color)';
                }
            });
        });
    }

    collectClassSelections() {
        const selections = {
            proficiencies: [],
            equipment: []
        };

        // Collect proficiency selections
        document.querySelectorAll('.proficiency-choice:checked').forEach(checkbox => {
            selections.proficiencies.push({
                name: checkbox.dataset.name,
                value: checkbox.value,
                group: checkbox.dataset.choiceGroup
            });
        });

        // Collect equipment selections
        document.querySelectorAll('.equipment-choice:checked').forEach(radio => {
            selections.equipment.push({
                option: radio.dataset.optionGroup,
                choice: radio.value
            });
        });

        return selections;
    }

    /**
     * Load class features for display
     * @param {string} classIndex - Class identifier
     * @param {string} classLevelsUrl - URL for class levels
     * @param {string} context - Display context
     */
    async loadClassFeatures(classIndex, classLevelsUrl, context = 'reference') {
        try {
            // Get character level from form if available (only for character creation)
            const levelInput = document.getElementById('char-level');
            const characterLevel = (context === 'character-creation' && levelInput) ? parseInt(levelInput.value) || 1 : 20;
            
            const container = document.getElementById(`class-features-${classIndex}`);
            if (!container) {
                console.error(`Class features container not found: class-features-${classIndex}`);
                return;
            }
            
            // Attempt to fetch detailed class level data
            const classUrl = `https://www.dnd5eapi.co/api/classes/${classIndex}`;
            const proxyUrl = `/api_proxy.php?endpoint=${encodeURIComponent(classUrl)}`;
            
            try {
                const response = await fetch(proxyUrl);
                if (response.ok) {
                    const responseText = await response.text();
                    if (responseText.trim().startsWith('{')) {
                        const classData = JSON.parse(responseText);
                        
                        if (classData.class_levels) {
                            let levelsUrl = '';
                            if (typeof classData.class_levels === 'string') {
                                levelsUrl = `https://www.dnd5eapi.co${classData.class_levels}`;
                            } else if (classData.class_levels.url) {
                                levelsUrl = `https://www.dnd5eapi.co${classData.class_levels.url}`;
                            }
                            
                            if (levelsUrl) {
                                const levelsProxyUrl = `/api_proxy.php?endpoint=${encodeURIComponent(levelsUrl)}`;
                                const levelsResponse = await fetch(levelsProxyUrl);
                                
                                if (levelsResponse.ok) {
                                    const levelsText = await levelsResponse.text();
                                    
                                    if (levelsText.trim().startsWith('[') || levelsText.trim().startsWith('{')) {
                                        const levelData = JSON.parse(levelsText);
                                        this.displayClassFeatures(levelData, characterLevel, context, container);
                                        return;
                                    }
                                }
                            }
                        }
                    }
                }
            } catch (apiError) {
                console.warn('Could not fetch detailed class features, using placeholder');
            }
            
            // Fall back to placeholder if detailed data unavailable
            this.displayPlaceholderFeatures(classIndex, characterLevel, context, container);
            
        } catch (error) {
            console.error('Error loading class features:', error);
            const container = document.getElementById(`class-features-${classIndex}`);
            if (container) {
                container.innerHTML = `<p style="margin: 0; color: #ff6b6b;">Unable to load class features. Please try again.<br><small style="color: #aaa;">Error: ${error.message}</small></p>`;
            }
        }
    }
    
    /**
     * Display class features from API data
     * @param {Array} levelData - Array of level data from API
     * @param {number} characterLevel - Current character level
     * @param {string} context - Display context
     * @param {HTMLElement} container - Container to display features
     */
    displayClassFeatures(levelData, characterLevel, context, container) {
        let featuresHtml = '<div style="max-height: 300px; overflow-y: auto; margin: 0;">';
        
        // For reference mode, show all levels; for character creation, show only up to current level
        const availableLevels = context === 'reference' ? levelData : levelData.filter(level => level.level <= characterLevel);
        
        if (availableLevels.length === 0) {
            featuresHtml += '<p style="margin: 0;">No features available at this level.</p>';
        } else {
            availableLevels.forEach(level => {
                if (level.features && level.features.length > 0) {
                    featuresHtml += `<div style="margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.1);">`;
                    const currentMarker = (context === 'character-creation' && level.level === characterLevel) ? ' (Current)' : '';
                    featuresHtml += `<h6 style="color: var(--accent-color); margin: 0 0 0.5rem 0;">Level ${level.level}${currentMarker}</h6>`;
                    featuresHtml += `<ul style="margin: 0; padding-left: 1.2rem; list-style-type: disc;">`;
                    
                    level.features.forEach(feature => {
                        featuresHtml += `<li style="margin: 0.25rem 0; line-height: 1.4;"><strong>${feature.name}</strong></li>`;
                    });
                    featuresHtml += `</ul>`;
                    featuresHtml += `</div>`;
                }
            });
        }
        
        featuresHtml += '</div>';
        container.innerHTML = featuresHtml;
    }
    
    /**
     * Display placeholder features when detailed API data is unavailable
     * @param {string} classIndex - Class identifier
     * @param {number} characterLevel - Character level
     * @param {string} context - Display context
     * @param {HTMLElement} container - Container element
     */
    displayPlaceholderFeatures(classIndex, characterLevel, context, container) {
        let featuresHtml = '<div style="max-height: 300px; overflow-y: auto; margin: 0;">';
        
        if (context === 'reference') {
            featuresHtml += `
                <div style="padding: 1rem; background-color: rgba(74, 85, 104, 0.3); border-radius: 4px; text-align: center;">
                    <h6 style="color: var(--accent-color); margin: 0 0 0.5rem 0;">Class Features by Level</h6>
                    <p style="margin: 0; color: #ccc; font-style: italic;">
                        Detailed class features are available in the Player's Handbook.<br>
                        This class gains new features and abilities as you level up from 1-20.
                    </p>
                    <p style="margin: 0.5rem 0 0 0; font-size: 0.9em; color: #aaa;">
                        Features include class abilities, spell progression (if applicable), and improved capabilities.
                    </p>
                </div>`;
        } else {
            featuresHtml += `
                <div style="padding: 1rem; background-color: rgba(74, 85, 104, 0.3); border-radius: 4px; text-align: center;">
                    <h6 style="color: var(--accent-color); margin: 0 0 0.5rem 0;">Level ${characterLevel} Features</h6>
                    <p style="margin: 0; color: #ccc; font-style: italic;">
                        Your ${classIndex} character will have all class features available up to level ${characterLevel}.<br>
                        Consult the Player's Handbook for detailed feature descriptions.
                    </p>
                    ${characterLevel < 20 ? `<p style="margin: 0.5rem 0 0 0; font-size: 0.9em; color: #aaa;">
                        Additional features unlock as you gain levels (up to level 20).
                    </p>` : ''}
                </div>`;
        }
        
        featuresHtml += '</div>';
        container.innerHTML = featuresHtml;
    }
}

// Initialize global D&D content handler
window.dndContent = new DnDContent();