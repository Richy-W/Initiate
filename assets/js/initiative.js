/**
 * Initiative Management System
 * 
 * Handles turn-based initiative tracking for D&D combat encounters.
 * Provides real-time updates and interactive combat management.
 * 
 * Features:
 * - Turn order management
 * - Initiative roll tracking
 * - Character/NPC turn advancement
 * - Real-time status updates
 * - Combat encounter management
 * 
 * @author Initiative Tracker Team
 * @version 1.0.0
 */

// Add initiative methods to the main Initiate class
Object.assign(Initiate.prototype, {
    async startInitiative() {
        if (!this.currentCampaign) return;
        
        try {
            const data = {
                action: 'start',
                campaign_id: this.currentCampaign.campaign.id,
                csrf_token: this.csrfToken
            };

            const response = await fetch('api/initiative.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                this.showAlert('Initiative started!', 'success');
                this.loadInitiativeStatus(this.currentCampaign.campaign.id);
                this.showAddToInitiativeModal();
            } else {
                this.showAlert('Error starting initiative: ' + result.message, 'error');
            }
        } catch (error) {
            console.error('Error starting initiative:', error);
            this.showAlert('Error starting initiative', 'error');
        }
    },

    async endInitiative() {
        if (!this.currentCampaign) return;
        
        if (confirm('Are you sure you want to end the current initiative session?')) {
            try {
                const data = {
                    action: 'end',
                    campaign_id: this.currentCampaign.campaign.id,
                    csrf_token: this.csrfToken
                };

                const response = await fetch('api/initiative.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (result.success) {
                    this.showAlert('Initiative ended!', 'success');
                    this.loadInitiativeStatus(this.currentCampaign.campaign.id);
                } else {
                    this.showAlert('Error ending initiative: ' + result.message, 'error');
                }
            } catch (error) {
                console.error('Error ending initiative:', error);
                this.showAlert('Error ending initiative', 'error');
            }
        }
    },

    async nextTurn() {
        if (!this.currentCampaign) return;
        
        try {
            const data = {
                action: 'next',
                campaign_id: this.currentCampaign.campaign.id,
                csrf_token: this.csrfToken
            };

            const response = await fetch('api/initiative.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                this.loadInitiativeStatus(this.currentCampaign.campaign.id);
            } else {
                this.showAlert('Error advancing turn: ' + result.message, 'error');
            }
        } catch (error) {
            console.error('Error advancing turn:', error);
            this.showAlert('Error advancing turn', 'error');
        }
    },

    async removeFromInitiative(entryId) {
        if (!this.currentCampaign) return;
        
        if (confirm('Remove this entry from initiative?')) {
            try {
                const data = {
                    action: 'remove',
                    entry_id: entryId,
                    campaign_id: this.currentCampaign.campaign.id,
                    csrf_token: this.csrfToken
                };

                const response = await fetch('api/initiative.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (result.success) {
                    this.loadInitiativeStatus(this.currentCampaign.campaign.id);
                } else {
                    this.showAlert('Error removing entry: ' + result.message, 'error');
                }
            } catch (error) {
                console.error('Error removing entry:', error);
                this.showAlert('Error removing entry', 'error');
            }
        }
    },

    addToInitiative() {
        this.showAddToInitiativeModal();
    },

    showAddToInitiativeModal() {
        // Create modal if it doesn't exist
        if (!document.getElementById('add-initiative-modal')) {
            this.createAddToInitiativeModal();
        }
        
        // Populate with campaign characters
        this.populateInitiativeModal();
        this.showModal('add-initiative-modal');
    },

    createAddToInitiativeModal() {
        const modal = document.createElement('div');
        modal.id = 'add-initiative-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h3>Add to Initiative</h3>
                    <button class="close">&times;</button>
                </div>
                <div class="modal-body">
                    <div id="initiative-entries">
                        <!-- Entries will be populated here -->
                    </div>
                    
                    <button type="button" class="btn btn-secondary" onclick="initiate.addInitiativeEntry()">Add Entry</button>
                    
                    <div class="form-group mt-3">
                        <button type="button" class="btn btn-primary" onclick="initiate.submitInitiativeEntries()">Add to Initiative</button>
                        <button type="button" class="btn btn-secondary" onclick="initiate.closeModals()">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    populateInitiativeModal() {
        if (!this.currentCampaign) return;
        
        const container = document.getElementById('initiative-entries');
        container.innerHTML = '';
        
        // Add existing characters as options
        this.currentCampaign.characters.forEach(character => {
            this.addInitiativeEntry(character);
        });
        
        // Add one empty entry for NPCs/Monsters
        this.addInitiativeEntry();
    },

    addInitiativeEntry(character = null) {
        const container = document.getElementById('initiative-entries');
        const entryId = 'entry-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        
        const entry = document.createElement('div');
        entry.className = 'card mb-2';
        entry.innerHTML = `
            <div class="grid-3">
                <div class="form-group">
                    <label>Name</label>
                    <input type="text" name="name" value="${character ? this.escapeHtml(character.name) : ''}" 
                           ${character ? 'readonly' : ''} required>
                    <input type="hidden" name="character_id" value="${character ? character.id : ''}">
                    <input type="hidden" name="is_player" value="${character ? 'true' : 'false'}">
                </div>
                <div class="form-group">
                    <label>Initiative Roll</label>
                    <input type="number" name="initiative_roll" min="1" max="20" value="" required>
                </div>
                <div class="form-group">
                    <label>Initiative Bonus</label>
                    <input type="number" name="initiative_bonus" value="${character ? character.initiative_bonus : '0'}" 
                           ${character ? 'readonly' : ''}>
                </div>
            </div>
            <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">Remove</button>
        `;
        
        container.appendChild(entry);
    },

    async submitInitiativeEntries() {
        const entries = [];
        const entryElements = document.querySelectorAll('#initiative-entries .card');
        
        entryElements.forEach(element => {
            const name = element.querySelector('input[name="name"]').value.trim();
            const initiativeRoll = parseInt(element.querySelector('input[name="initiative_roll"]').value);
            const initiativeBonus = parseInt(element.querySelector('input[name="initiative_bonus"]').value) || 0;
            const characterId = parseInt(element.querySelector('input[name="character_id"]').value) || 0;
            const isPlayer = element.querySelector('input[name="is_player"]').value === 'true';
            
            if (name && !isNaN(initiativeRoll)) {
                entries.push({
                    name,
                    initiative_roll: initiativeRoll,
                    initiative_bonus: initiativeBonus,
                    character_id: characterId,
                    is_player: isPlayer
                });
            }
        });
        
        if (entries.length === 0) {
            this.showAlert('Please add at least one entry with a name and initiative roll.', 'warning');
            return;
        }
        
        // Get the current initiative session
        try {
            const statusResponse = await fetch(`api/initiative.php?action=status&campaign_id=${this.currentCampaign.campaign.id}`);
            const statusData = await statusResponse.json();
            
            if (!statusData.success || !statusData.active) {
                this.showAlert('No active initiative session found.', 'error');
                return;
            }
            
            const data = {
                action: 'add',
                session_id: statusData.session.id,
                entries: entries,
                csrf_token: this.csrfToken
            };

            const response = await fetch('api/initiative.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                this.closeModals();
                this.showAlert('Entries added to initiative!', 'success');
                this.loadInitiativeStatus(this.currentCampaign.campaign.id);
            } else {
                this.showAlert('Error adding entries: ' + result.message, 'error');
            }
        } catch (error) {
            console.error('Error adding to initiative:', error);
            this.showAlert('Error adding to initiative', 'error');
        }
    },

    rollInitiative(bonus = 0) {
        const roll = Math.floor(Math.random() * 20) + 1;
        return roll + bonus;
    }
});

// Utility function to roll dice
function rollD20() {
    return Math.floor(Math.random() * 20) + 1;
}

// Auto-roll initiative when the page loads initiative entries
document.addEventListener('click', function(e) {
    if (e.target.closest('#add-initiative-modal input[name="initiative_roll"]')) {
        const input = e.target;
        if (!input.value) {
            input.value = rollD20();
        }
    }
});