/**
 * Character Management System
 * 
 * Handles character creation, editing, and management functionality
 * for the D&D Initiative Tracker application.
 * 
 * Features:
 * - Character creation with D&D 5e integration
 * - Ability score generation (roll/standard array)
 * - Skill proficiency management
 * - Class and race selection with API integration
 * - Character import/export functionality
 * 
 * @author Initiative Tracker Team
 * @version 1.0.0
 */

class CharacterManager {
    constructor() {
        this.currentCharacter = null;
        this.characters = [];
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Character creation button
        const createBtn = document.getElementById('create-character-btn');
        if (createBtn) {
            console.log('Setting up create character button listener');
            createBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Create character button clicked');
                this.openCharacterCreation();
            });
        } else {
            console.warn('Create character button not found');
        }

        // My characters button
        const myCharsBtn = document.getElementById('my-characters-btn');
        if (myCharsBtn) {
            myCharsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.openMyCharacters();
            });
        }

        // Hide character display button
        const hideBtn = document.getElementById('hide-character-btn');
        if (hideBtn) {
            hideBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.hideCharacterDisplay();
            });
        }

        // Modal close buttons
        this.setupModalCloseHandlers();
    }

    setupModalCloseHandlers() {
        const modals = ['character-creation-modal', 'my-characters-modal', 'character-sheet-modal'];
        modals.forEach(modalId => {
            this.setupModalCloseHandler(modalId);
        });
    }

    setupModalCloseHandler(modalId) {
        // ModalFactory handles this automatically now
        // This method kept for backward compatibility
    }

    closeModal(modal) {
        ModalFactory.close(modal);
    }

    closeCurrentModal() {
        // Close any visible character modals using ModalFactory
        ModalFactory.closeAll();
    }

    openCharacterCreation() {
        console.log('openCharacterCreation called');
        try {
            this.showCharacterCreationView();
        } catch (error) {
            console.error('Error opening character creation:', error);
            alert('Error opening character creation form: ' + error.message);
        }
    }

    generateCharacterCreationForm(character = null, campaignId = null, isNPC = false) {
        const isEditing = character !== null;
        const formId = 'character-form';
        
        return `
            <form id="${formId}" class="character-form">
                ${campaignId ? `<input type="hidden" name="campaign_id" value="${campaignId}">` : ''}
                ${isNPC ? `<input type="hidden" name="is_npc" value="true">` : ''}
                ${isEditing ? `<input type="hidden" name="character_id" value="${character.id}">` : ''}
                
                <div class="character-form-grid">
                    ${!isEditing && isNPC ? `
                        <div class="character-section">
                            <h4>📋 Import Options</h4>
                            <div class="form-group">
                                <button type="button" class="btn btn-accent btn-sm" onclick="initiate.importFromMonster()">
                                    Import from Monster Manual
                                </button>
                                <small class="text-secondary">Automatically populate stats from D&D 5e monsters</small>
                            </div>
                        </div>
                    ` : ''}
                    
                    <!-- Basic Information -->
                    <div class="character-section character-basics-section">
                        <h4>🎭 Character Basics</h4>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="char-name">Character Name *</label>
                                <input type="text" id="char-name" name="name" class="form-control" value="${character?.name || ''}" required>
                            </div>
                            <div class="form-group">
                                <label for="char-level">Level</label>
                                <input type="number" id="char-level" name="level" class="form-control" value="${character?.level || 1}" min="1" max="20">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="char-species">Species *</label>
                                <div class="input-with-browse">
                                    <input type="text" id="char-species" name="species" class="form-control" value="${this.extractSpecies(character?.race)}" required>
                                    <button type="button" class="btn btn-sm btn-secondary" onclick="window.dndContent.createContentBrowser('races', (selectedRace) => { 
                                        document.getElementById('char-species').value = selectedRace.name; 
                                        window.characterManager.updateSubspeciesOptions(selectedRace);
                                    }, 'character-creation')">Browse</button>
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="char-subspecies">Subspecies</label>
                                <select id="char-subspecies" name="subspecies" class="form-control">
                                    <option value="">Select subspecies...</option>
                                    ${this.getSubspeciesOptions(character?.race)}
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="char-class">Class *</label>
                                <div class="input-with-browse">
                                    <input type="text" id="char-class" name="char_class" class="form-control" value="${character?.char_class || character?.class || ''}" required>
                                    <button type="button" class="btn btn-sm btn-secondary" onclick="window.dndContent.createContentBrowser('classes', (selectedClass) => { 
                                        document.getElementById('char-class').value = selectedClass.name;
                                        window.characterManager.handleClassSelection(selectedClass);
                                    }, 'character-creation')">Browse</button>
                                </div>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="char-background">Background</label>
                                <input type="text" id="char-background" name="background" class="form-control" value="${character?.background || ''}">
                            </div>
                            <div class="form-group">
                                <label for="char-alignment">Alignment</label>
                                <select id="char-alignment" name="alignment" class="form-control">
                                    <option value="">Select alignment...</option>
                                    <option value="Lawful Good" ${character?.alignment === 'Lawful Good' ? 'selected' : ''}>Lawful Good</option>
                                    <option value="Neutral Good" ${character?.alignment === 'Neutral Good' ? 'selected' : ''}>Neutral Good</option>
                                    <option value="Chaotic Good" ${character?.alignment === 'Chaotic Good' ? 'selected' : ''}>Chaotic Good</option>
                                    <option value="Lawful Neutral" ${character?.alignment === 'Lawful Neutral' ? 'selected' : ''}>Lawful Neutral</option>
                                    <option value="True Neutral" ${character?.alignment === 'True Neutral' ? 'selected' : ''}>True Neutral</option>
                                    <option value="Chaotic Neutral" ${character?.alignment === 'Chaotic Neutral' ? 'selected' : ''}>Chaotic Neutral</option>
                                    <option value="Lawful Evil" ${character?.alignment === 'Lawful Evil' ? 'selected' : ''}>Lawful Evil</option>
                                    <option value="Neutral Evil" ${character?.alignment === 'Neutral Evil' ? 'selected' : ''}>Neutral Evil</option>
                                    <option value="Chaotic Evil" ${character?.alignment === 'Chaotic Evil' ? 'selected' : ''}>Chaotic Evil</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- Ability Scores -->
                    <div class="character-section ability-scores-section">
                        <h4>💪 Ability Scores</h4>
                        <div class="ability-scores">
                            ${this.generateAbilityInputs(character)}
                        </div>
                        <div class="dice-roll-section">
                            <button type="button" id="roll-stats-btn" class="btn btn-accent">🎲 Roll 4d6 (drop lowest)</button>
                            <button type="button" id="standard-array-btn" class="btn btn-secondary">📊 Standard Array</button>
                        </div>
                        
                        <!-- Saving Throws Section -->
                        <div class="saving-throws-section">
                            <h5>🛡️ Saving Throws</h5>
                            <div class="saving-throws-compact">
                                ${this.generateSavingThrowsCheckboxes(character)}
                            </div>
                        </div>
                    </div>

                    <!-- Character Details -->
                    <div class="character-section character-details-section">
                        <h4>📜 Character Details</h4>
                        <div class="character-details-grid">
                            <div class="form-group">
                                <label for="char-ac">Armor Class</label>
                                <input type="number" id="char-ac" name="armor_class" class="form-control" value="${character?.armor_class || 10}" min="1">
                            </div>
                            <div class="form-group">
                                <label for="char-hp">Hit Points</label>
                                <input type="number" id="char-hp" name="hit_points" class="form-control" value="${character?.hit_points || 8}" min="1">
                            </div>
                            <div class="form-group">
                                <label for="char-speed">Speed</label>
                                <input type="number" id="char-speed" name="speed" class="form-control" value="${character?.speed || 30}" min="0">
                            </div>
                            <div class="form-group">
                                <label for="char-proficiency">Proficiency Bonus</label>
                                <input type="number" id="char-proficiency" name="proficiency_bonus" class="form-control" value="${character?.proficiency_bonus || 2}" min="2" max="6">
                            </div>
                            <div class="form-group">
                                <label for="char-initiative">Initiative Modifier</label>
                                <input type="number" id="char-initiative" name="initiative_modifier" class="form-control" value="${character?.initiative_modifier || 0}">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Skills & Proficiencies Section (Full Width) -->
                <div class="character-section skills-section">
                    <h4>🎯 Skills & Proficiencies</h4>
                    <div class="skills-proficiencies-grid">
                        <div class="skills-column">
                            <h5>Skills</h5>
                            <div class="skills-grid">
                                ${this.generateSkillsCheckboxes(character)}
                            </div>
                        </div>
                        <div class="other-proficiencies-column">
                            <h5>Other Proficiencies</h5>
                            <div class="form-group">
                                <label for="selected-proficiencies">Languages, Tools & Instruments</label>
                                <textarea id="selected-proficiencies" name="selected_proficiencies" class="form-control" rows="4" placeholder="Languages, tools, instruments, etc...">${character?.selected_proficiencies || ''}</textarea>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Equipment Section -->
                <div class="character-section equipment-section">
                    <h4>🎒 Equipment</h4>
                    <div class="form-group">
                        <label for="char-equipment">Equipment & Gear</label>
                        <textarea id="char-equipment" name="equipment" class="form-control" rows="3" placeholder="List your character's weapons, armor, items, and other equipment...">${this.formatEquipmentText(character?.equipment || character?.additional_data?.equipment)}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="char-features">Features & Traits</label>
                        <textarea id="char-features" name="features_traits" class="form-control" rows="3" placeholder="Racial traits, class features, feats, etc...">${character?.features_traits || character?.additional_data?.features_traits || ''}</textarea>
                    </div>
                </div>

                <!-- Character Story -->
                <div class="character-section character-story-section">
                    <h4>📖 Character Story</h4>
                    <div class="form-group">
                        <label for="char-backstory">Backstory</label>
                        <textarea id="char-backstory" name="backstory" class="form-control" rows="4" placeholder="Your character's background, motivations, and history...">${character?.backstory || character?.additional_data?.backstory || ''}</textarea>
                    </div>
                </div>

                <!-- Hidden fields for class selections -->
                <input type="hidden" id="selected-proficiencies" name="selected_proficiencies" value="">
                <input type="hidden" id="selected-equipment" name="selected_equipment" value="">

                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">✨ ${isEditing ? 'Update Character' : 'Create Character'}</button>
                    <button type="button" class="btn btn-secondary" onclick="window.characterManager.closeCurrentModal()">Cancel</button>
                    ${isEditing && campaignId ? `
                        <button type="button" class="btn btn-danger" onclick="initiate.deleteCharacter(${character.id})">Delete Character</button>
                    ` : ''}
                </div>
            </form>
        `;
    }

    // Public method for other components to use the unified character form
    showCharacterCreationView(character = null, campaignId = null, isNPC = false) {
        const isEditing = character !== null;
        const title = isEditing ? `Edit ${character.name}` : 'Create New Character';
        
        // Get the main content area
        const mainContent = document.querySelector('.dashboard-main');
        if (!mainContent) {
            console.error('Main content area not found');
            return;
        }
        
        // Store the original content so we can restore it
        if (!this.originalDashboardContent) {
            this.originalDashboardContent = mainContent.innerHTML;
        }
        
        // Create the character creation view
        const characterCreationView = `
            <div class="character-creation-view">
                <div class="character-creation-header">
                    <div class="header-left">
                        <button id="back-to-dashboard" class="btn btn-secondary">
                            <span>← Back to Dashboard</span>
                        </button>
                        <h2>${title}</h2>
                    </div>
                    <div class="header-right">
                        <button type="submit" form="character-form" class="btn btn-accent">
                            <span>💾 Save Character</span>
                        </button>
                    </div>
                </div>
                <div class="character-creation-content">
                    ${this.generateCharacterCreationForm(character, campaignId, isNPC)}
                </div>
            </div>
        `;
        
        // Replace the main content
        mainContent.innerHTML = characterCreationView;
        
        // Setup form handlers
        this.setupCharacterForm();
        this.setupAbilityModifiers();
        this.setupViewNavigation();
    }

    showCharacterForm(character = null, campaignId = null, isNPC = false, containerId = 'character-creation-modal', modalTitle = null) {
        const isEditing = character !== null;
        const title = modalTitle || (isEditing ? `Edit ${character.name}` : (campaignId ? 'Create Campaign Character' : 'Create New Character'));
        
        // Always create a new modal to ensure proper structure
        const existingModal = document.getElementById(containerId);
        if (existingModal) {
            existingModal.remove();
        }
        
        // Create the modal
        const modal = ModalFactory.create({
            id: containerId,
            title: title,
            size: 'xlarge',
            content: this.generateCharacterCreationForm(character, campaignId, isNPC),
            customClasses: ['character-modal']
        });
        
        console.log('Created modal:', modal);
        console.log('Modal classes:', modal.className);
        console.log('Modal content element:', modal.querySelector('.modal-content'));
        console.log('Modal content classes:', modal.querySelector('.modal-content')?.className);
        
        ModalFactory.show(containerId);
        
        // Setup form handlers
        this.setupCharacterForm();
        this.setupAbilityModifiers();
    }

    // Helper methods for unified form
    extractSpecies(race) {
        if (!race) return '';
        return race.split('(')[0].trim();
    }

    getSubspeciesOptions(race) {
        if (!race || !race.includes('(')) return '';
        const subspecies = race.match(/\((.+)\)/);
        if (subspecies) {
            return `<option value="${subspecies[1]}" selected>${subspecies[1]}</option>`;
        }
        return '';
    }

    formatEquipmentText(equipment) {
        if (Array.isArray(equipment)) {
            return equipment.join('\n');
        }
        return equipment || '';
    }

    generateAbilityInputs(character = null) {
        const abilities = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
        return abilities.map(ability => `
            <div class="ability-score">
                <label for="char-${ability}">${ability.charAt(0).toUpperCase() + ability.slice(1)}</label>
                <input type="number" id="char-${ability}" name="${ability}" value="${character?.[ability] || 10}" min="3" max="20" class="form-control">
                <div class="ability-modifier" id="${ability}-modifier">+0</div>
            </div>
        `).join('');
    }

    generateSkillsCheckboxes(character = null) {
        const characterSkills = character?.additional_data?.skills || character?.skills || [];
        const skills = [
            { name: 'acrobatics', ability: 'dexterity', label: 'Acrobatics (Dex)' },
            { name: 'animal_handling', ability: 'wisdom', label: 'Animal Handling (Wis)' },
            { name: 'arcana', ability: 'intelligence', label: 'Arcana (Int)' },
            { name: 'athletics', ability: 'strength', label: 'Athletics (Str)' },
            { name: 'deception', ability: 'charisma', label: 'Deception (Cha)' },
            { name: 'history', ability: 'intelligence', label: 'History (Int)' },
            { name: 'insight', ability: 'wisdom', label: 'Insight (Wis)' },
            { name: 'intimidation', ability: 'charisma', label: 'Intimidation (Cha)' },
            { name: 'investigation', ability: 'intelligence', label: 'Investigation (Int)' },
            { name: 'medicine', ability: 'wisdom', label: 'Medicine (Wis)' },
            { name: 'nature', ability: 'intelligence', label: 'Nature (Int)' },
            { name: 'perception', ability: 'wisdom', label: 'Perception (Wis)' },
            { name: 'performance', ability: 'charisma', label: 'Performance (Cha)' },
            { name: 'persuasion', ability: 'charisma', label: 'Persuasion (Cha)' },
            { name: 'religion', ability: 'intelligence', label: 'Religion (Int)' },
            { name: 'sleight_of_hand', ability: 'dexterity', label: 'Sleight of Hand (Dex)' },
            { name: 'stealth', ability: 'dexterity', label: 'Stealth (Dex)' },
            { name: 'survival', ability: 'wisdom', label: 'Survival (Wis)' }
        ];

        return skills.map(skill => `
            <div class="skill-item">
                <input type="checkbox" id="skill-${skill.name}" name="skills[]" value="${skill.name}" ${characterSkills.includes(skill.name) ? 'checked' : ''}>
                <label for="skill-${skill.name}">${skill.label}</label>
            </div>
        `).join('');
    }

    generateSavingThrowsCheckboxes(character = null) {
        const characterSavingThrows = character?.additional_data?.saving_throws || character?.saving_throws || [];
        const savingThrows = [
            { name: 'strength', label: 'Strength' },
            { name: 'dexterity', label: 'Dexterity' },
            { name: 'constitution', label: 'Constitution' },
            { name: 'intelligence', label: 'Intelligence' },
            { name: 'wisdom', label: 'Wisdom' },
            { name: 'charisma', label: 'Charisma' }
        ];

        return savingThrows.map(save => `
            <div class="save-item">
                <input type="checkbox" id="save-${save.name}" name="saving_throws[]" value="${save.name}" ${characterSavingThrows.includes(save.name) ? 'checked' : ''}>
                <label for="save-${save.name}">${save.label}</label>
            </div>
        `).join('');
    }

    setupViewNavigation() {
        const backButton = document.getElementById('back-to-dashboard');
        if (backButton) {
            backButton.addEventListener('click', () => {
                this.returnToDashboard();
            });
        }
    }

    returnToDashboard() {
        const mainContent = document.querySelector('.dashboard-main');
        if (mainContent && this.originalDashboardContent) {
            mainContent.innerHTML = this.originalDashboardContent;
            // Reinitialize dashboard if needed
            if (window.dashboardManager) {
                window.dashboardManager.loadCampaigns();
            }
        }
    }

    setupCharacterForm() {
        // Setup ability score modifiers
        this.setupAbilityModifiers();

        // Setup roll stats button
        document.getElementById('roll-stats-btn')?.addEventListener('click', () => {
            this.rollAbilityScores();
        });

        // Setup standard array button
        document.getElementById('standard-array-btn')?.addEventListener('click', () => {
            this.applyStandardArray();
        });

        // Setup form submission - handle both old and new form IDs
        const characterForm = document.getElementById('character-form') || 
                             document.getElementById('new-character-form') || 
                             document.getElementById('campaign-character-form');
        
        if (characterForm) {
            characterForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitCharacterForm(e.target);
            });
        }
    }

    setupAbilityModifiers() {
        const abilities = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
        
        abilities.forEach(ability => {
            const input = document.getElementById(`char-${ability}`);
            const modifierDiv = document.getElementById(`${ability}-modifier`);
            
            if (input && modifierDiv) {
                const updateModifier = () => {
                    const score = parseInt(input.value) || 10;
                    const modifier = Math.floor((score - 10) / 2);
                    modifierDiv.textContent = modifier >= 0 ? `+${modifier}` : `${modifier}`;
                    
                    // If this is dexterity, also update initiative modifier
                    if (ability === 'dexterity') {
                        const initiativeInput = document.getElementById('char-initiative');
                        if (initiativeInput) {
                            initiativeInput.value = modifier;
                        }
                    }
                };

                input.addEventListener('input', updateModifier);
                updateModifier(); // Initial calculation
            }
        });
    }

    rollAbilityScores() {
        const abilities = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
        
        abilities.forEach(ability => {
            // Roll 4d6, drop the lowest
            let rolls = [];
            for (let i = 0; i < 4; i++) {
                rolls.push(Math.floor(Math.random() * 6) + 1);
            }
            rolls.sort((a, b) => b - a); // Sort descending
            const total = rolls.slice(0, 3).reduce((sum, roll) => sum + roll, 0); // Take top 3
            
            const input = document.getElementById(`char-${ability}`);
            if (input) {
                input.value = total;
                input.dispatchEvent(new Event('input')); // Trigger modifier update
            }
        });
    }

    applyStandardArray() {
        const standardArray = [15, 14, 13, 12, 10, 8];
        const abilities = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
        
        abilities.forEach((ability, index) => {
            const input = document.getElementById(`char-${ability}`);
            if (input) {
                input.value = standardArray[index];
                input.dispatchEvent(new Event('input')); // Trigger modifier update
            }
        });
    }

    async submitCharacterForm(form) {
        // Validate form using FormUtils
        const validationRules = {
            name: { required: true, minLength: 2, maxLength: 50, label: 'Character Name' },
            species: { required: true, label: 'Species' },
            char_class: { required: true, label: 'Class' },
            background: { required: true, label: 'Background' },
            level: { required: true, label: 'Level' }
        };

        const validation = FormUtils.validate(form, validationRules);
        if (!validation.isValid) {
            FormUtils.showErrors(form, validation.errors);
            return;
        }

        try {
            const formData = new FormData(form);
            
            // Collect skill proficiencies
            const skills = Array.from(form.querySelectorAll('input[name="skills[]"]:checked'))
                .map(checkbox => checkbox.value);
            
            // Collect saving throw proficiencies
            const savingThrows = Array.from(form.querySelectorAll('input[name="saving_throws[]"]:checked'))
                .map(checkbox => checkbox.value);
            
            const characterData = {
                name: formData.get('name'),
                level: parseInt(formData.get('level')),
                race: formData.get('species') + (formData.get('subspecies') ? ' (' + formData.get('subspecies') + ')' : ''),
                char_class: formData.get('char_class'),
                background: formData.get('background'),
                alignment: formData.get('alignment'),
                strength: parseInt(formData.get('strength')),
                dexterity: parseInt(formData.get('dexterity')),
                constitution: parseInt(formData.get('constitution')),
                intelligence: parseInt(formData.get('intelligence')),
                wisdom: parseInt(formData.get('wisdom')),
                charisma: parseInt(formData.get('charisma')),
                armor_class: parseInt(formData.get('armor_class')),
                hit_points: parseInt(formData.get('hit_points')),
                speed: parseInt(formData.get('speed')),
                proficiency_bonus: parseInt(formData.get('proficiency_bonus')),
                initiative_modifier: parseInt(formData.get('initiative_modifier')),
                skills: skills,
                saving_throws: savingThrows,
                equipment: formData.get('equipment'),
                features_traits: formData.get('features_traits'),
                backstory: formData.get('backstory'),
                selected_proficiencies: formData.get('selected_proficiencies'),
                selected_equipment: formData.get('selected_equipment')
            };

            const result = await APIService.request('api/characters.php?action=create_standalone', {
                method: 'POST',
                data: characterData,
                showLoading: true,
                loadingTarget: form
            });

            if (result.success) {
                this.showAlert('Character created successfully!', 'success');
                // Return to dashboard instead of closing modals
                this.returnToDashboard();
                this.loadMyCharacters(); // Refresh character list
            } else {
                this.showAlert('Error creating character: ' + result.message, 'error');
            }
        } catch (error) {
            console.error('Error creating character:', error);
            this.showAlert('Error creating character. Please try again.', 'error');
        }
    }

    async openMyCharacters() {
        // Create modal if it doesn't exist
        if (!document.getElementById('my-characters-modal')) {
            ModalFactory.create({
                id: 'my-characters-modal',
                title: 'My Characters',
                size: 'large',
                content: '<div id="my-characters-list">Loading characters...</div>',
                customClasses: ['my-characters-modal']
            });
        }
        
        ModalFactory.show('my-characters-modal');
        await this.loadMyCharacters();
    }

    async loadMyCharacters() {
        try {
            const result = await APIService.request('api/characters.php', {
                method: 'GET',
                data: { action: 'list_personal' },
                showLoading: true,
                loadingTarget: 'my-characters-list'
            });

            const listContainer = DOMUtils.safeQuery('#my-characters-list');
            if (!listContainer) return;

            if (result.success && result.characters) {
                this.characters = result.characters;
                listContainer.innerHTML = this.generateCharacterList(result.characters);
                this.setupCharacterListEvents();
            } else {
                listContainer.innerHTML = '<p class="text-secondary">No characters found. Create your first character!</p>';
            }
        } catch (error) {
            console.error('Error loading characters:', error);
            document.getElementById('my-characters-list').innerHTML = '<p class="text-danger">Error loading characters.</p>';
        }
    }

    generateCharacterList(characters) {
        if (!characters.length) {
            return '<p class="text-secondary">No characters found. Create your first character!</p>';
        }

        return `
            <div class="character-list">
                ${characters.map(char => `
                    <div class="character-card" data-character-id="${char.id}">
                        <h4>${char.name}</h4>
                        <div class="character-info">
                            <p><strong>Level ${char.level} ${char.race} ${char.char_class}</strong></p>
                            <p>${char.background ? char.background : 'No background set'}</p>
                            <p>${char.alignment || 'Alignment not set'}</p>
                            <p><strong>AC:</strong> ${char.armor_class} | <strong>HP:</strong> ${char.hit_points} | <strong>Speed:</strong> ${char.speed}</p>
                        </div>
                        <div class="character-actions">
                            <button class="btn btn-sm btn-primary view-character" data-character-id="${char.id}">👁️ View</button>
                            <button class="btn btn-sm btn-accent display-character" data-character-id="${char.id}">📺 Display</button>
                            <button class="btn btn-sm btn-secondary edit-character" data-character-id="${char.id}">✏️ Edit</button>
                            <button class="btn btn-sm btn-warning import-character" data-character-id="${char.id}">📥 Import to Campaign</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    setupCharacterListEvents() {
        // View character
        document.querySelectorAll('.view-character').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const characterId = e.target.dataset.characterId;
                this.viewCharacterSheet(characterId);
            });
        });

        // Display character (read-only on page)
        document.querySelectorAll('.display-character').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const characterId = e.target.dataset.characterId;
                this.displayCharacterOnPage(characterId);
            });
        });

        // Import character to campaign
        document.querySelectorAll('.import-character').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const characterId = e.target.dataset.characterId;
                this.importCharacterToCampaign(characterId);
            });
        });
    }

    async viewCharacterSheet(characterId) {
        // Close the my characters modal first
        document.getElementById('my-characters-modal').style.display = 'none';
        
        // Open the character in the main character sheet modal (existing functionality)
        if (window.initiate && window.initiate.viewCharacter) {
            window.initiate.viewCharacter(characterId);
        }
    }

    async displayCharacterOnPage(characterId) {
        try {
            const response = await fetch(`api/characters.php?action=get&character_id=${characterId}`);
            const result = await response.json();

            if (result.success) {
                this.currentCharacter = result.character;
                this.showCharacterDisplay(result.character);
                document.getElementById('my-characters-modal').style.display = 'none';
            } else {
                this.showAlert('Error loading character: ' + result.message, 'error');
            }
        } catch (error) {
            console.error('Error loading character:', error);
            this.showAlert('Error loading character for display.', 'error');
        }
    }

    showCharacterDisplay(character) {
        const displayPanel = document.getElementById('character-display');
        const contentContainer = document.getElementById('character-display-content');
        
        // Generate read-only character sheet
        contentContainer.innerHTML = this.generateReadOnlyCharacterSheet(character);
        
        // Show the display panel
        displayPanel.style.display = 'block';
        
        // Scroll to it smoothly
        displayPanel.scrollIntoView({ behavior: 'smooth' });
    }

    generateReadOnlyCharacterSheet(character) {
        const getModifier = (score) => {
            const mod = Math.floor((score - 10) / 2);
            return mod >= 0 ? `+${mod}` : `${mod}`;
        };

        return `
            <div class="character-sheet-display">
                <div class="character-form-grid">
                    <!-- Character Header -->
                    <div class="character-section">
                        <h4>🎭 ${character.name}</h4>
                        <div class="character-basic-info">
                            <p><strong>Level ${character.level} ${character.race} ${character.char_class}</strong></p>
                            ${character.background ? `<p><strong>Background:</strong> ${character.background}</p>` : ''}
                            ${character.alignment ? `<p><strong>Alignment:</strong> ${character.alignment}</p>` : ''}
                        </div>
                    </div>

                    <!-- Quick Stats -->
                    <div class="character-section">
                        <h4>⚡ Quick Stats</h4>
                        <div class="character-stats-grid">
                            <div class="stat-card">
                                <div class="stat-label">Armor Class</div>
                                <div class="stat-value">${character.armor_class}</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-label">Hit Points</div>
                                <div class="stat-value">${character.hit_points}</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-label">Speed</div>
                                <div class="stat-value">${character.speed} ft</div>
                            </div>
                        </div>
                    </div>

                    <!-- Ability Scores -->
                    <div class="character-section">
                        <h4>💪 Ability Scores</h4>
                        <div class="ability-scores">
                            <div class="ability-score">
                                <div class="ability-label">STR</div>
                                <div class="ability-value">${character.strength}</div>
                                <div class="ability-modifier">${getModifier(character.strength)}</div>
                            </div>
                            <div class="ability-score">
                                <div class="ability-label">DEX</div>
                                <div class="ability-value">${character.dexterity}</div>
                                <div class="ability-modifier">${getModifier(character.dexterity)}</div>
                            </div>
                            <div class="ability-score">
                                <div class="ability-label">CON</div>
                                <div class="ability-value">${character.constitution}</div>
                                <div class="ability-modifier">${getModifier(character.constitution)}</div>
                            </div>
                            <div class="ability-score">
                                <div class="ability-label">INT</div>
                                <div class="ability-value">${character.intelligence}</div>
                                <div class="ability-modifier">${getModifier(character.intelligence)}</div>
                            </div>
                            <div class="ability-score">
                                <div class="ability-label">WIS</div>
                                <div class="ability-value">${character.wisdom}</div>
                                <div class="ability-modifier">${getModifier(character.wisdom)}</div>
                            </div>
                            <div class="ability-score">
                                <div class="ability-label">CHA</div>
                                <div class="ability-value">${character.charisma}</div>
                                <div class="ability-modifier">${getModifier(character.charisma)}</div>
                            </div>
                        </div>
                    </div>
                </div>

                ${character.equipment ? `
                    <div class="character-section">
                        <h4>🎒 Equipment</h4>
                        <div class="equipment-text">${character.equipment}</div>
                    </div>
                ` : ''}

                ${character.features_traits ? `
                    <div class="character-section">
                        <h4>✨ Features & Traits</h4>
                        <div class="features-text">${character.features_traits}</div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    hideCharacterDisplay() {
        document.getElementById('character-display').style.display = 'none';
    }

    async importCharacterToCampaign(characterId) {
        if (!window.initiate || !window.initiate.currentCampaign) {
            this.showAlert('Please select a campaign first.', 'warning');
            return;
        }

        try {
            const response = await fetch('api/characters.php?action=import', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    character_id: characterId,
                    campaign_id: window.initiate.currentCampaign.campaign.id
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showAlert('Character imported to campaign successfully!', 'success');
                document.getElementById('my-characters-modal').style.display = 'none';
                
                // Refresh campaign if available
                if (window.initiate.loadCampaignCharacters) {
                    window.initiate.loadCampaignCharacters();
                }
            } else {
                this.showAlert('Error importing character: ' + result.message, 'error');
            }
        } catch (error) {
            console.error('Error importing character:', error);
            this.showAlert('Error importing character to campaign.', 'error');
        }
    }

    async updateSubspeciesOptions(selectedRace) {
        const subspeciesSelect = document.getElementById('char-subspecies');
        if (!subspeciesSelect) return;

        // Clear existing options
        subspeciesSelect.innerHTML = '<option value="">Select subspecies...</option>';

        // If the race has subraces, add them as options
        if (selectedRace.subraces && selectedRace.subraces.length > 0) {
            selectedRace.subraces.forEach(subrace => {
                const option = document.createElement('option');
                option.value = subrace.name;
                option.textContent = subrace.name;
                subspeciesSelect.appendChild(option);
            });
            subspeciesSelect.disabled = false;
        } else {
            // Check if we need to fetch detailed race data to get subraces
            try {
                const raceDetails = await window.dndContent.getRace(selectedRace.index);
                if (raceDetails.success && raceDetails.race && raceDetails.race.subraces && raceDetails.race.subraces.length > 0) {
                    raceDetails.race.subraces.forEach(subrace => {
                        const option = document.createElement('option');
                        option.value = subrace.name;
                        option.textContent = subrace.name;
                        subspeciesSelect.appendChild(option);
                    });
                    subspeciesSelect.disabled = false;
                } else {
                    // No subraces available
                    subspeciesSelect.disabled = true;
                }
            } catch (error) {
                console.error('Error fetching race details for subraces:', error);
                subspeciesSelect.disabled = true;
            }
        }
    }

    handleClassSelection(selectedClass) {
        // Store the class data for later reference
        this.selectedClassData = selectedClass;
        
        // Show a notification that the user should select proficiencies and equipment
        this.showAlert('Class selected! Please make your proficiency and equipment choices in the class details, then click "Select [Class Name]" to save your selections.', 'info');
    }

    updateCharacterWithClassSelections() {
        // This method will be called when the class is actually selected in the browser
        const selections = window.dndContent.collectClassSelections();
        
        if (selections) {
            // Store proficiencies in hidden field
            document.getElementById('selected-proficiencies').value = JSON.stringify(selections.proficiencies);
            
            // Store equipment in hidden field  
            document.getElementById('selected-equipment').value = JSON.stringify(selections.equipment);
            
            // Auto-select saving throw proficiencies from class data
            if (this.selectedClassData && this.selectedClassData.saving_throw_proficiencies) {
                this.selectedClassData.saving_throw_proficiencies.forEach(save => {
                    const saveName = (save.name || save.index || save).toLowerCase();
                    // Map API names to our form field names
                    const saveMapping = {
                        'strength': 'strength',
                        'dexterity': 'dexterity', 
                        'constitution': 'constitution',
                        'intelligence': 'intelligence',
                        'wisdom': 'wisdom',
                        'charisma': 'charisma',
                        'str': 'strength',
                        'dex': 'dexterity',
                        'con': 'constitution',
                        'int': 'intelligence',
                        'wis': 'wisdom',
                        'cha': 'charisma'
                    };
                    
                    const mappedSave = saveMapping[saveName] || saveName;
                    const saveCheckbox = document.getElementById(`save-${mappedSave}`);
                    if (saveCheckbox) {
                        saveCheckbox.checked = true;
                    }
                });
            }
            
            // Update equipment field with selected items
            const equipmentField = document.getElementById('char-equipment');
            if (equipmentField && selections.equipment.length > 0) {
                const equipmentText = selections.equipment.map(eq => eq.choice).join(', ');
                const currentEquipment = equipmentField.value.trim();
                
                if (currentEquipment) {
                    equipmentField.value = currentEquipment + ', ' + equipmentText;
                } else {
                    equipmentField.value = equipmentText;
                }
            }
            
            // Update Skills & Proficiencies checkboxes instead of features field
            if (selections.proficiencies.length > 0) {
                selections.proficiencies.forEach(prof => {
                    const profName = prof.name.toLowerCase();
                    
                    // Check if this is a skill proficiency
                    if (profName.includes('skill:')) {
                        const skillName = profName.replace('skill:', '').trim()
                            .toLowerCase()
                            .replace(/\s+/g, '_')  // Convert spaces to underscores
                            .replace(/[^a-z0-9_]/g, ''); // Remove special characters
                        
                        const skillCheckbox = document.getElementById(`skill-${skillName}`);
                        if (skillCheckbox) {
                            skillCheckbox.checked = true;
                        } else {
                            console.warn(`Could not find skill checkbox for: ${skillName}`);
                        }
                    } else {
                        // Non-skill proficiencies go in features (armor, weapons, tools, etc.)
                        const featuresField = document.getElementById('char-features');
                        if (featuresField) {
                            const currentFeatures = featuresField.value.trim();
                            const newFeature = prof.name;
                            
                            if (currentFeatures) {
                                if (!currentFeatures.includes(newFeature)) {
                                    featuresField.value = currentFeatures + ', ' + newFeature;
                                }
                            } else {
                                featuresField.value = newFeature;
                            }
                        }
                    }
                });
                
                this.showAlert('✅ Class proficiencies, equipment, and saving throws have been added to your character!', 'success');
            }
        }
    }

    showAlert(message, type = 'info') {
        // Use existing alert system if available
        if (window.initiate && window.initiate.showAlert) {
            window.initiate.showAlert(message, type);
        } else {
            // Fallback alert
            alert(message);
        }
    }
}

// Initialize character manager when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing CharacterManager');
    window.characterManager = new CharacterManager();
    console.log('CharacterManager initialized:', window.characterManager);
});

// Fallback for immediate initialization if DOM is already loaded
if (document.readyState === 'loading') {
    // Document is still loading, wait for DOMContentLoaded
} else {
    // Document is already loaded, initialize immediately
    console.log('Document already loaded, initializing CharacterManager immediately');
    window.characterManager = new CharacterManager();
}