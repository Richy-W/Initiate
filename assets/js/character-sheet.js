/**
 * Character Sheet Display & Editor
 * 
 * Provides comprehensive character sheet viewing and editing capabilities
 * with support for D&D 5e character statistics and features.
 * 
 * Features:
 * - Character sheet rendering
 * - In-line editing capabilities
 * - Skill modifier calculations
 * - Equipment and feature management
 * - Character deletion and updates
 * 
 * @author Initiative Tracker Team
 * @version 1.0.0
 */

// Add character sheet methods to the main Initiate class
Object.assign(Initiate.prototype, {
    async viewCharacter(characterId) {
        if (!this.currentCampaign) return;
        
        try {
            const response = await fetch(`api/characters.php?action=get&character_id=${characterId}&campaign_id=${this.currentCampaign.campaign.id}`);
            const data = await response.json();
            
            if (data.success) {
                this.showCharacterSheet(data.character);
            } else {
                this.showAlert('Error loading character: ' + data.message, 'error');
            }
        } catch (error) {
            console.error('Error loading character:', error);
            this.showAlert('Error loading character', 'error');
        }
    },

    showCharacterSheet(character, forceEdit = false, isNPC = false) {
        // Create modal if it doesn't exist
        if (!document.getElementById('character-sheet-modal')) {
            this.createCharacterSheetModal();
        }
        
        const modal = document.getElementById('character-sheet-modal');
        const content = document.getElementById('character-sheet-content');
        
        const isEditing = character !== null && !forceEdit;
        const isOwner = character && character.user_id === this.user?.id;
        const canEdit = forceEdit || !isEditing || isOwner || this.currentCampaign.is_gm;
        

        
        content.innerHTML = `
            <div class="character-sheet">
                <div class="character-header">
                    <h2>${isEditing ? 'Character Sheet: ' + this.escapeHtml(character.name) : (isNPC ? 'Create New NPC' : 'Create New Character')}</h2>
                    ${isEditing && !isOwner && !character.is_npc ? `<p class="text-secondary">Player: ${this.escapeHtml(character.player_username)}</p>` : ''}
                    ${isEditing && character.is_npc ? `<p class="text-secondary">NPC</p>` : ''}
                    ${!isEditing && isNPC ? `<p class="text-secondary">Non-Player Character</p>` : ''}
                </div>
                
                <form id="character-form">
                    <input type="hidden" name="character_id" value="${character?.id || ''}">
                    <input type="hidden" name="campaign_id" value="${this.currentCampaign.campaign.id}">
                    <input type="hidden" name="is_npc" value="${isNPC ? 'true' : 'false'}">
                    
                    <!-- Basic Information -->
                    <div class="character-section">
                        <h3>Character Details</h3>
                        ${!isEditing && isNPC && canEdit ? `
                            <div class="form-group">
                                <button type="button" class="btn btn-accent btn-sm" onclick="initiate.importFromMonster()">
                                    Import from Monster Manual
                                </button>
                                <small class="text-secondary">Automatically populate stats from D&D 5e monsters</small>
                            </div>
                        ` : ''}
                        
                        <div class="grid-3">
                            <div class="form-group">
                                <label for="char-name">Character Name *</label>
                                <input type="text" id="char-name" name="name" value="${character?.name || ''}" 
                                       required maxlength="100" ${canEdit ? '' : 'readonly'}>
                            </div>
                            <div class="form-group">
                                <label for="char-level">Level</label>
                                <input type="number" id="char-level" name="level" value="${character?.level || 1}" 
                                       min="1" max="20" ${canEdit ? '' : 'readonly'}>
                            </div>
                            <div class="form-group">
                                <label for="char-experience">Experience Points</label>
                                <input type="number" id="char-experience" name="experience" value="${character?.additional_data?.experience || 0}" 
                                       min="0" ${canEdit ? '' : 'readonly'}>
                            </div>
                        </div>
                        
                        <div class="grid-3">
                            <div class="form-group">
                                <label for="char-race">Race</label>
                                ${canEdit ? `
                                    <div class="input-with-button">
                                        <input type="text" id="char-race" name="race" value="${character?.race || ''}" 
                                               maxlength="50" placeholder="Enter race or browse D&D races">
                                        <button type="button" class="btn btn-sm btn-secondary" onclick="window.dndContent.createContentBrowser('races')">Browse</button>
                                    </div>
                                ` : `
                                    <input type="text" id="char-race" name="race" value="${character?.race || ''}" readonly>
                                `}
                            </div>
                            <div class="form-group">
                                <label for="char-class">Class</label>
                                ${canEdit ? `
                                    <div class="input-with-button">
                                        <input type="text" id="char-class" name="class" value="${character?.class || ''}" 
                                               maxlength="50" placeholder="Enter class or browse D&D classes">
                                        <button type="button" class="btn btn-sm btn-secondary" onclick="window.dndContent.createContentBrowser('classes')">Browse</button>
                                    </div>
                                ` : `
                                    <input type="text" id="char-class" name="class" value="${character?.class || ''}" readonly>
                                `}
                            </div>
                            <div class="form-group">
                                <label for="char-background">Background</label>
                                <input type="text" id="char-background" name="background" 
                                       value="${character?.additional_data?.background || ''}" maxlength="50" ${canEdit ? '' : 'readonly'}>
                            </div>
                        </div>
                        
                        <div class="grid-2">
                            <div class="form-group">
                                <label for="char-alignment">Alignment</label>
                                <select id="char-alignment" name="alignment" ${canEdit ? '' : 'disabled'}>
                                    <option value="">Select Alignment</option>
                                    <option value="Lawful Good" ${character?.additional_data?.alignment === 'Lawful Good' ? 'selected' : ''}>Lawful Good</option>
                                    <option value="Neutral Good" ${character?.additional_data?.alignment === 'Neutral Good' ? 'selected' : ''}>Neutral Good</option>
                                    <option value="Chaotic Good" ${character?.additional_data?.alignment === 'Chaotic Good' ? 'selected' : ''}>Chaotic Good</option>
                                    <option value="Lawful Neutral" ${character?.additional_data?.alignment === 'Lawful Neutral' ? 'selected' : ''}>Lawful Neutral</option>
                                    <option value="True Neutral" ${character?.additional_data?.alignment === 'True Neutral' ? 'selected' : ''}>True Neutral</option>
                                    <option value="Chaotic Neutral" ${character?.additional_data?.alignment === 'Chaotic Neutral' ? 'selected' : ''}>Chaotic Neutral</option>
                                    <option value="Lawful Evil" ${character?.additional_data?.alignment === 'Lawful Evil' ? 'selected' : ''}>Lawful Evil</option>
                                    <option value="Neutral Evil" ${character?.additional_data?.alignment === 'Neutral Evil' ? 'selected' : ''}>Neutral Evil</option>
                                    <option value="Chaotic Evil" ${character?.additional_data?.alignment === 'Chaotic Evil' ? 'selected' : ''}>Chaotic Evil</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="char-proficiency">Proficiency Bonus</label>
                                <input type="number" id="char-proficiency" name="proficiency_bonus" 
                                       value="${character?.additional_data?.proficiency_bonus || Math.floor((character?.level || 1 - 1) / 4) + 2}" 
                                       min="2" max="6" ${canEdit ? '' : 'readonly'}>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Ability Scores -->
                    <div class="character-section">
                        <h3>Ability Scores</h3>
                        <div class="ability-scores grid-3">
                            ${this.renderAbilityScores(character, canEdit)}
                        </div>
                    </div>
                    
                    <!-- Skills & Proficiencies -->
                    <div class="character-section">
                        <h3>Skills</h3>
                        <div class="skills-grid">
                            ${this.renderSkills(character, canEdit)}
                        </div>
                        
                        <div class="grid-2" style="margin-top: 1rem;">
                            <div class="form-group">
                                <label for="char-languages">Languages</label>
                                <textarea id="char-languages" name="languages" rows="2" 
                                          ${canEdit ? '' : 'readonly'}>${character?.additional_data?.languages || ''}</textarea>
                            </div>
                            <div class="form-group">
                                <label for="char-proficiencies">Other Proficiencies</label>
                                <textarea id="char-proficiencies" name="other_proficiencies" rows="2" 
                                          ${canEdit ? '' : 'readonly'}>${character?.additional_data?.other_proficiencies || ''}</textarea>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Combat Stats -->
                    <div class="character-section">
                        <h3>Combat & Health</h3>
                        <div class="grid-4">
                            <div class="form-group">
                                <label for="char-ac">Armor Class</label>
                                <input type="number" id="char-ac" name="armor_class" value="${character?.armor_class || 10}" 
                                       min="1" max="30" ${canEdit ? '' : 'readonly'}>
                            </div>
                            <div class="form-group">
                                <label for="char-speed">Speed</label>
                                <input type="number" id="char-speed" name="speed" value="${character?.speed || 30}" 
                                       min="0" max="120" ${canEdit ? '' : 'readonly'}>
                            </div>
                            <div class="form-group">
                                <label for="char-max-hp">Max Hit Points</label>
                                <input type="number" id="char-max-hp" name="max_hit_points" value="${character?.max_hit_points || 1}" 
                                       min="1" max="999" ${canEdit ? '' : 'readonly'}>
                            </div>
                            <div class="form-group">
                                <label for="char-current-hp">Current Hit Points</label>
                                <input type="number" id="char-current-hp" name="current_hit_points" 
                                       value="${character?.current_hit_points || character?.max_hit_points || 1}" 
                                       min="0" max="999" ${canEdit ? '' : 'readonly'}>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Additional Information -->
                    <div class="character-section">
                        <h3>Notes & Equipment</h3>
                        <div class="form-group">
                            <label for="char-notes">Notes</label>
                            <textarea id="char-notes" name="notes" rows="3" 
                                      ${canEdit ? '' : 'readonly'}>${character?.additional_data?.notes || ''}</textarea>
                        </div>
                        
                        <div class="form-group">
                            <label for="char-equipment">Equipment</label>
                            <textarea id="char-equipment" name="equipment" rows="3" 
                                      ${canEdit ? '' : 'readonly'}>${character?.additional_data?.equipment?.join('\\n') || ''}</textarea>
                            <small class="text-secondary">List each item on a separate line</small>
                        </div>
                    </div>
                    
                    ${canEdit ? `
                        <div class="character-actions">
                            <button type="submit" class="btn btn-primary">
                                ${isEditing ? 'Update Character' : 'Create Character'}
                            </button>
                            <button type="button" class="btn btn-secondary" onclick="initiate.closeModals()">Cancel</button>
                            ${isEditing && (isOwner || this.currentCampaign.is_gm) ? `
                                <button type="button" class="btn btn-danger" onclick="initiate.deleteCharacter(${character.id})">Delete Character</button>
                            ` : ''}
                        </div>
                    ` : `
                        <div class="character-actions">
                            <button type="button" class="btn btn-secondary" onclick="initiate.closeModals()">Close</button>
                        </div>
                    `}
                </form>
            </div>
        `;
        
        // Bind form submission
        if (canEdit) {
            document.getElementById('character-form').addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveCharacter(new FormData(e.target), isEditing);
            });
        }
        
        // Auto-calculate ability modifiers
        this.setupAbilityModifiers();
        
        this.showModal('character-sheet-modal');
    },

    createCharacterSheetModal() {
        const modal = document.createElement('div');
        modal.id = 'character-sheet-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 900px; max-height: 90vh; overflow-y: auto;">
                <div class="modal-header">
                    <button class="close">&times;</button>
                </div>
                <div class="modal-body">
                    <div id="character-sheet-content">
                        <!-- Character sheet content will be loaded here -->
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    renderAbilityScores(character, canEdit) {
        const abilities = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
        
        return abilities.map(ability => {
            const value = character?.[ability] || 10;
            const modifier = Math.floor((value - 10) / 2);
            const modifierStr = modifier >= 0 ? `+${modifier}` : `${modifier}`;
            
            return `
                <div class="ability-score-container">
                    <label for="char-${ability}">${ability.charAt(0).toUpperCase() + ability.slice(1)}</label>
                    <div class="ability-score">
                        <input type="number" id="char-${ability}" name="${ability}" value="${value}" 
                               min="1" max="30" class="ability-input" ${canEdit ? '' : 'readonly'}>
                        <div class="ability-modifier" id="${ability}-modifier">${modifierStr}</div>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderSkills(character, canEdit) {
        const skills = [
            { name: 'acrobatics', ability: 'dexterity', label: 'Acrobatics' },
            { name: 'animal_handling', ability: 'wisdom', label: 'Animal Handling' },
            { name: 'arcana', ability: 'intelligence', label: 'Arcana' },
            { name: 'athletics', ability: 'strength', label: 'Athletics' },
            { name: 'deception', ability: 'charisma', label: 'Deception' },
            { name: 'history', ability: 'intelligence', label: 'History' },
            { name: 'insight', ability: 'wisdom', label: 'Insight' },
            { name: 'intimidation', ability: 'charisma', label: 'Intimidation' },
            { name: 'investigation', ability: 'intelligence', label: 'Investigation' },
            { name: 'medicine', ability: 'wisdom', label: 'Medicine' },
            { name: 'nature', ability: 'intelligence', label: 'Nature' },
            { name: 'perception', ability: 'wisdom', label: 'Perception' },
            { name: 'performance', ability: 'charisma', label: 'Performance' },
            { name: 'persuasion', ability: 'charisma', label: 'Persuasion' },
            { name: 'religion', ability: 'intelligence', label: 'Religion' },
            { name: 'sleight_of_hand', ability: 'dexterity', label: 'Sleight of Hand' },
            { name: 'stealth', ability: 'dexterity', label: 'Stealth' },
            { name: 'survival', ability: 'wisdom', label: 'Survival' }
        ];

        const skillProficiencies = character?.additional_data?.skill_proficiencies || [];
        
        return `
            <div class="skills-container" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; margin-bottom: 1rem;">
                ${skills.map(skill => {
                    const isProficient = skillProficiencies.includes(skill.name);
                    const abilityScore = character?.[skill.ability] || 10;
                    const abilityModifier = Math.floor((abilityScore - 10) / 2);
                    const proficiencyBonus = character?.additional_data?.proficiency_bonus || Math.floor(((character?.level || 1) - 1) / 4) + 2;
                    const skillModifier = abilityModifier + (isProficient ? proficiencyBonus : 0);
                    const modifierStr = skillModifier >= 0 ? `+${skillModifier}` : `${skillModifier}`;
                    
                    return `
                        <div class="skill-item" style="display: flex; align-items: center; padding: 0.25rem;">
                            <input type="checkbox" id="skill-${skill.name}" name="skill_proficiencies[]" value="${skill.name}" 
                                   ${isProficient ? 'checked' : ''} ${canEdit ? '' : 'disabled'} style="margin-right: 0.5rem;">
                            <label for="skill-${skill.name}" style="flex: 1; font-size: 0.9rem;">${skill.label} (${skill.ability.substr(0,3).toUpperCase()})</label>
                            <span class="skill-modifier" style="font-weight: bold; min-width: 2rem; text-align: right;">${modifierStr}</span>
                        </div>
                    `;
                }).join('')}
            </div>
            
            <div class="saving-throws" style="margin-top: 1rem;">
                <h4>Saving Throws</h4>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem;">
                    ${['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'].map(ability => {
                        const saveProficiencies = character?.additional_data?.saving_throw_proficiencies || [];
                        const isProficient = saveProficiencies.includes(ability);
                        const abilityScore = character?.[ability] || 10;
                        const abilityModifier = Math.floor((abilityScore - 10) / 2);
                        const proficiencyBonus = character?.additional_data?.proficiency_bonus || Math.floor(((character?.level || 1) - 1) / 4) + 2;
                        const saveModifier = abilityModifier + (isProficient ? proficiencyBonus : 0);
                        const modifierStr = saveModifier >= 0 ? `+${saveModifier}` : `${saveModifier}`;
                        
                        return `
                            <div class="save-item" style="display: flex; align-items: center; padding: 0.25rem;">
                                <input type="checkbox" id="save-${ability}" name="saving_throw_proficiencies[]" value="${ability}" 
                                       ${isProficient ? 'checked' : ''} ${canEdit ? '' : 'disabled'} style="margin-right: 0.5rem;">
                                <label for="save-${ability}" style="flex: 1; font-size: 0.9rem;">${ability.charAt(0).toUpperCase() + ability.slice(1)}</label>
                                <span class="save-modifier" style="font-weight: bold; min-width: 2rem; text-align: right;">${modifierStr}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    },

    setupAbilityModifiers() {
        const abilities = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
        
        abilities.forEach(ability => {
            const input = document.getElementById(`char-${ability}`);
            const modifierDiv = document.getElementById(`${ability}-modifier`);
            
            if (input && modifierDiv) {
                const updateModifier = () => {
                    const value = parseInt(input.value) || 10;
                    const modifier = Math.floor((value - 10) / 2);
                    modifierDiv.textContent = modifier >= 0 ? `+${modifier}` : `${modifier}`;
                };
                
                input.addEventListener('input', updateModifier);
                updateModifier(); // Initial calculation
            }
        });
    },

    async saveCharacter(formData, isEditing) {
        try {
            // Prepare character data
            const characterData = {
                name: formData.get('name'),
                race: formData.get('race'),
                class: formData.get('class'),
                level: parseInt(formData.get('level')) || 1,
                strength: parseInt(formData.get('strength')) || 10,
                dexterity: parseInt(formData.get('dexterity')) || 10,
                constitution: parseInt(formData.get('constitution')) || 10,
                intelligence: parseInt(formData.get('intelligence')) || 10,
                wisdom: parseInt(formData.get('wisdom')) || 10,
                charisma: parseInt(formData.get('charisma')) || 10,
                armor_class: parseInt(formData.get('armor_class')) || 10,
                speed: parseInt(formData.get('speed')) || 30,
                max_hit_points: parseInt(formData.get('max_hit_points')) || 1,
                current_hit_points: parseInt(formData.get('current_hit_points')) || 1,
                additional_data: {
                    background: formData.get('background') || '',
                    notes: formData.get('notes') || '',
                    equipment: formData.get('equipment') ? formData.get('equipment').split('\\n').filter(item => item.trim()) : []
                }
            };

            const data = {
                action: isEditing ? 'update' : 'create',
                campaign_id: parseInt(formData.get('campaign_id')),
                character_data: characterData,
                csrf_token: this.csrfToken
            };

            if (isEditing) {
                data.character_id = parseInt(formData.get('character_id'));
            }

            const response = await fetch('api/characters.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                this.closeModals();
                this.showAlert(isEditing ? 'Character updated successfully!' : 'Character created successfully!', 'success');
                
                // Refresh campaign data
                if (this.currentCampaign) {
                    this.selectCampaign(this.currentCampaign.campaign.id);
                }
            } else {
                this.showAlert('Error saving character: ' + result.message, 'error');
            }
        } catch (error) {
            console.error('Error saving character:', error);
            this.showAlert('Error saving character', 'error');
        }
    },

    async deleteCharacter(characterId) {
        if (!confirm('Are you sure you want to delete this character? This action cannot be undone.')) {
            return;
        }

        try {
            const data = {
                action: 'delete',
                character_id: characterId,
                campaign_id: this.currentCampaign.campaign.id,
                csrf_token: this.csrfToken
            };

            const response = await fetch('api/characters.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                this.closeModals();
                this.showAlert('Character deleted successfully!', 'success');
                
                // Refresh campaign data
                if (this.currentCampaign) {
                    this.selectCampaign(this.currentCampaign.campaign.id);
                }
            } else {
                this.showAlert('Error deleting character: ' + result.message, 'error');
            }
        } catch (error) {
            console.error('Error deleting character:', error);
            this.showAlert('Error deleting character', 'error');
        }
    }
});

// Add CSS for character sheet styling
const characterSheetCSS = `
<style>
.character-sheet {
    padding: 1rem;
}

.character-section {
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--border-color);
}

.character-section:last-child {
    border-bottom: none;
}

.character-section h3 {
    color: var(--accent-color);
    margin-bottom: 1rem;
    font-size: 1.25rem;
}

.ability-scores {
    gap: 1rem;
}

.ability-score-container {
    text-align: center;
}

.ability-score-container label {
    display: block;
    font-size: 0.875rem;
    font-weight: 600;
    text-transform: capitalize;
    margin-bottom: 0.5rem;
    color: var(--text-primary);
}

.ability-score {
    background-color: var(--background-color);
    border: 2px solid var(--border-color);
    border-radius: var(--border-radius);
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
}

.ability-input {
    width: 60px;
    text-align: center;
    font-size: 1.125rem;
    font-weight: 600;
    border: none;
    background: transparent;
    color: var(--text-primary);
}

.ability-input:focus {
    outline: none;
}

.ability-modifier {
    background-color: var(--accent-color);
    color: var(--background-color);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.875rem;
    font-weight: 600;
    min-width: 40px;
}

.character-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 2rem;
    padding-top: 1rem;
    border-top: 1px solid var(--border-color);
}

@media (max-width: 768px) {
    .ability-scores {
        grid-template-columns: repeat(2, 1fr);
    }
    
    .character-actions {
        flex-direction: column;
    }
}
</style>
`;

// Add the CSS to the document head
if (!document.getElementById('character-sheet-css')) {
    const style = document.createElement('style');
    style.id = 'character-sheet-css';
    style.textContent = characterSheetCSS.replace(/<style>|<\/style>/g, '');
    document.head.appendChild(style);
}