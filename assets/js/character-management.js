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
        document.getElementById('create-character-btn')?.addEventListener('click', () => {
            this.openCharacterCreation();
        });

        // My characters button
        document.getElementById('my-characters-btn')?.addEventListener('click', () => {
            this.openMyCharacters();
        });

        // Hide character display button
        document.getElementById('hide-character-btn')?.addEventListener('click', () => {
            this.hideCharacterDisplay();
        });

        // Modal close buttons
        this.setupModalCloseHandlers();
    }

    setupModalCloseHandlers() {
        const modals = ['character-creation-modal', 'my-characters-modal'];
        modals.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (modal) {
                const closeBtn = modal.querySelector('.close');
                closeBtn?.addEventListener('click', () => {
                    modal.style.display = 'none';
                });

                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modal.style.display = 'none';
                    }
                });
            }
        });
    }

    openCharacterCreation() {
        const modal = document.getElementById('character-creation-modal');
        const formContainer = document.getElementById('character-creation-form');
        
        formContainer.innerHTML = this.generateCharacterCreationForm();
        this.setupCharacterForm();
        modal.style.display = 'block';
    }

    generateCharacterCreationForm() {
        return `
            <form id="new-character-form" class="character-form">
                <div class="character-form-grid">
                    <!-- Basic Information -->
                    <div class="character-section">
                        <h4>🎭 Character Basics</h4>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="char-name">Character Name *</label>
                                <input type="text" id="char-name" name="name" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label for="char-level">Level</label>
                                <input type="number" id="char-level" name="level" class="form-control" value="1" min="1" max="20">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="char-species">Species *</label>
                                <div class="input-with-browse">
                                    <input type="text" id="char-species" name="species" class="form-control" required>
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
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="char-class">Class *</label>
                                <div class="input-with-browse">
                                    <input type="text" id="char-class" name="char_class" class="form-control" required>
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
                                <input type="text" id="char-background" name="background" class="form-control">
                            </div>
                            <div class="form-group">
                                <label for="char-alignment">Alignment</label>
                                <select id="char-alignment" name="alignment" class="form-control">
                                    <option value="">Select alignment...</option>
                                    <option value="Lawful Good">Lawful Good</option>
                                    <option value="Neutral Good">Neutral Good</option>
                                    <option value="Chaotic Good">Chaotic Good</option>
                                    <option value="Lawful Neutral">Lawful Neutral</option>
                                    <option value="True Neutral">True Neutral</option>
                                    <option value="Chaotic Neutral">Chaotic Neutral</option>
                                    <option value="Lawful Evil">Lawful Evil</option>
                                    <option value="Neutral Evil">Neutral Evil</option>
                                    <option value="Chaotic Evil">Chaotic Evil</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- Ability Scores -->
                    <div class="character-section">
                        <h4>💪 Ability Scores</h4>
                        <div class="ability-scores">
                            ${this.generateAbilityInputs()}
                        </div>
                        <div style="margin-top: 1rem; text-align: center;">
                            <button type="button" id="roll-stats-btn" class="btn btn-accent">🎲 Roll 4d6 (drop lowest)</button>
                            <button type="button" id="standard-array-btn" class="btn btn-secondary">📊 Standard Array</button>
                        </div>
                    </div>

                    <!-- Character Details -->
                    <div class="character-section">
                        <h4>📜 Character Details</h4>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="char-ac">Armor Class</label>
                                <input type="number" id="char-ac" name="armor_class" class="form-control" value="10" min="1">
                            </div>
                            <div class="form-group">
                                <label for="char-hp">Hit Points</label>
                                <input type="number" id="char-hp" name="hit_points" class="form-control" value="8" min="1">
                            </div>
                            <div class="form-group">
                                <label for="char-speed">Speed</label>
                                <input type="number" id="char-speed" name="speed" class="form-control" value="30" min="0">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="char-proficiency">Proficiency Bonus</label>
                                <input type="number" id="char-proficiency" name="proficiency_bonus" class="form-control" value="2" min="2" max="6">
                            </div>
                            <div class="form-group">
                                <label for="char-initiative">Initiative Modifier</label>
                                <input type="number" id="char-initiative" name="initiative_modifier" class="form-control" value="0">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Skills Section -->
                <div class="character-section">
                    <h4>🎯 Skills & Proficiencies</h4>
                    <div class="skills-grid">
                        ${this.generateSkillsCheckboxes()}
                    </div>
                </div>

                <!-- Equipment Section -->
                <div class="character-section">
                    <h4>🎒 Equipment</h4>
                    <div class="form-group">
                        <label for="char-equipment">Equipment & Gear</label>
                        <textarea id="char-equipment" name="equipment" class="form-control" rows="3" placeholder="List your character's weapons, armor, items, and other equipment..."></textarea>
                    </div>
                    <div class="form-group">
                        <label for="char-features">Features & Traits</label>
                        <textarea id="char-features" name="features_traits" class="form-control" rows="3" placeholder="Racial traits, class features, feats, etc..."></textarea>
                    </div>
                </div>

                <!-- Character Story -->
                <div class="character-section">
                    <h4>📖 Character Story</h4>
                    <div class="form-group">
                        <label for="char-backstory">Backstory</label>
                        <textarea id="char-backstory" name="backstory" class="form-control" rows="4" placeholder="Your character's background, motivations, and history..."></textarea>
                    </div>
                </div>

                <!-- Hidden fields for class selections -->
                <input type="hidden" id="selected-proficiencies" name="selected_proficiencies" value="">
                <input type="hidden" id="selected-equipment" name="selected_equipment" value="">

                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">✨ Create Character</button>
                    <button type="button" class="btn btn-secondary" onclick="document.getElementById('character-creation-modal').style.display='none'">Cancel</button>
                </div>
            </form>
        `;
    }

    generateAbilityInputs() {
        const abilities = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
        return abilities.map(ability => `
            <div class="ability-score">
                <label for="char-${ability}">${ability.charAt(0).toUpperCase() + ability.slice(1)}</label>
                <input type="number" id="char-${ability}" name="${ability}" value="10" min="3" max="20" class="form-control">
                <div class="ability-modifier" id="${ability}-modifier">+0</div>
            </div>
        `).join('');
    }

    generateSkillsCheckboxes() {
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
                <input type="checkbox" id="skill-${skill.name}" name="skills[]" value="${skill.name}">
                <label for="skill-${skill.name}">${skill.label}</label>
            </div>
        `).join('');
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

        // Setup form submission
        document.getElementById('new-character-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitCharacterForm(e.target);
        });
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
        try {
            const formData = new FormData(form);
            
            // Collect skill proficiencies
            const skills = [];
            const skillCheckboxes = form.querySelectorAll('input[name="skills[]"]:checked');
            skillCheckboxes.forEach(checkbox => {
                skills.push(checkbox.value);
            });
            
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
                equipment: formData.get('equipment'),
                features_traits: formData.get('features_traits'),
                backstory: formData.get('backstory'),
                selected_proficiencies: formData.get('selected_proficiencies'),
                selected_equipment: formData.get('selected_equipment')
            };

            const response = await fetch('api/characters.php?action=create_standalone', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(characterData)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                this.showAlert('Character created successfully!', 'success');
                document.getElementById('character-creation-modal').style.display = 'none';
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
        const modal = document.getElementById('my-characters-modal');
        const listContainer = document.getElementById('my-characters-list');
        
        listContainer.innerHTML = '<p>Loading characters...</p>';
        modal.style.display = 'block';
        
        await this.loadMyCharacters();
    }

    async loadMyCharacters() {
        try {
            const response = await fetch('api/characters.php?action=list_personal');
            const result = await response.json();

            const listContainer = document.getElementById('my-characters-list');

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
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
                            <div style="text-align: center; padding: 0.5rem; background-color: rgba(74, 85, 104, 0.5); border-radius: 4px;">
                                <div style="font-size: 0.8rem; color: var(--text-secondary);">Armor Class</div>
                                <div style="font-size: 1.4rem; font-weight: bold;">${character.armor_class}</div>
                            </div>
                            <div style="text-align: center; padding: 0.5rem; background-color: rgba(74, 85, 104, 0.5); border-radius: 4px;">
                                <div style="font-size: 0.8rem; color: var(--text-secondary);">Hit Points</div>
                                <div style="font-size: 1.4rem; font-weight: bold;">${character.hit_points}</div>
                            </div>
                            <div style="text-align: center; padding: 0.5rem; background-color: rgba(74, 85, 104, 0.5); border-radius: 4px;">
                                <div style="font-size: 0.8rem; color: var(--text-secondary);">Speed</div>
                                <div style="font-size: 1.4rem; font-weight: bold;">${character.speed} ft</div>
                            </div>
                        </div>
                    </div>

                    <!-- Ability Scores -->
                    <div class="character-section">
                        <h4>💪 Ability Scores</h4>
                        <div class="ability-scores">
                            <div class="ability-score">
                                <div style="font-weight: bold;">STR</div>
                                <div style="font-size: 1.2rem;">${character.strength}</div>
                                <div class="ability-modifier">${getModifier(character.strength)}</div>
                            </div>
                            <div class="ability-score">
                                <div style="font-weight: bold;">DEX</div>
                                <div style="font-size: 1.2rem;">${character.dexterity}</div>
                                <div class="ability-modifier">${getModifier(character.dexterity)}</div>
                            </div>
                            <div class="ability-score">
                                <div style="font-weight: bold;">CON</div>
                                <div style="font-size: 1.2rem;">${character.constitution}</div>
                                <div class="ability-modifier">${getModifier(character.constitution)}</div>
                            </div>
                            <div class="ability-score">
                                <div style="font-weight: bold;">INT</div>
                                <div style="font-size: 1.2rem;">${character.intelligence}</div>
                                <div class="ability-modifier">${getModifier(character.intelligence)}</div>
                            </div>
                            <div class="ability-score">
                                <div style="font-weight: bold;">WIS</div>
                                <div style="font-size: 1.2rem;">${character.wisdom}</div>
                                <div class="ability-modifier">${getModifier(character.wisdom)}</div>
                            </div>
                            <div class="ability-score">
                                <div style="font-weight: bold;">CHA</div>
                                <div style="font-size: 1.2rem;">${character.charisma}</div>
                                <div class="ability-modifier">${getModifier(character.charisma)}</div>
                            </div>
                        </div>
                    </div>
                </div>

                ${character.equipment ? `
                    <div class="character-section">
                        <h4>🎒 Equipment</h4>
                        <div style="white-space: pre-wrap;">${character.equipment}</div>
                    </div>
                ` : ''}

                ${character.features_traits ? `
                    <div class="character-section">
                        <h4>✨ Features & Traits</h4>
                        <div style="white-space: pre-wrap;">${character.features_traits}</div>
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
                
                this.showAlert('✅ Class proficiencies and equipment have been added to your character!', 'success');
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

// Initialize character manager when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.characterManager = new CharacterManager();
});