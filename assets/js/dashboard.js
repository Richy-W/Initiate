// Dashboard functionality

/**
 * User Dashboard Management
 * 
 * Handles user dashboard functionality including campaign creation,
 * joining campaigns, and user account management.
 * 
 * Features:
 * - Campaign creation and management
 * - Campaign join functionality
 * - User profile management
 * - Dashboard navigation
 * - Real-time updates
 * 
 * @author Initiative Tracker Team
 * @version 1.0.0
 */

class Dashboard {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupCreateCampaignModal();
        this.setupJoinCampaignModal();
    }

    bindEvents() {
        // Create campaign button
        const createBtn = document.getElementById('create-campaign-btn');
        if (createBtn) {
            createBtn.addEventListener('click', () => this.showCreateCampaignModal());
        }

        // Join campaign button
        const joinBtn = document.getElementById('join-campaign-btn');
        if (joinBtn) {
            joinBtn.addEventListener('click', () => this.showJoinCampaignModal());
        }
    }

    setupCreateCampaignModal() {
        // Create modal using ModalFactory for consistency
        if (!document.getElementById('create-campaign-modal')) {
            ModalFactory.create({
                id: 'create-campaign-modal',
                title: 'Create New Campaign',
                size: 'medium',
                content: `
                    <form id="create-campaign-form">
                        <div class="form-group">
                            <label for="campaign-name">Campaign Name *</label>
                            <input type="text" id="campaign-name" name="name" required maxlength="100">
                        </div>
                        
                        <div class="form-group">
                            <label for="campaign-description">Description</label>
                            <textarea id="campaign-description" name="description" rows="3" maxlength="500"></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label for="max-players">Maximum Players</label>
                            <select id="max-players" name="max_players">
                                <option value="2">2 Players</option>
                                <option value="3">3 Players</option>
                                <option value="4">4 Players</option>
                                <option value="5">5 Players</option>
                                <option value="6" selected>6 Players</option>
                                <option value="7">7 Players</option>
                                <option value="8">8 Players</option>
                            </select>
                        </div>
                    </form>
                `,
                buttons: [
                    {
                        text: 'Create Campaign',
                        class: 'btn btn-primary',
                        type: 'submit',
                        action: 'submit',
                        handler: (e) => {
                            e.preventDefault();
                            const form = document.getElementById('create-campaign-form');
                            this.createCampaign(new FormData(form));
                        }
                    },
                    {
                        text: 'Cancel',
                        class: 'btn btn-secondary',
                        action: 'cancel',
                        handler: () => ModalFactory.close('create-campaign-modal')
                    }
                ]
            });
        }
    }

    setupJoinCampaignModal() {
        // Create modal using ModalFactory for consistency
        if (!document.getElementById('join-campaign-modal')) {
            ModalFactory.create({
                id: 'join-campaign-modal',
                title: 'Join Campaign',
                size: 'medium',
                content: `
                    <form id="join-campaign-form">
                        <div class="form-group">
                            <label for="join-code">Campaign Join Code *</label>
                            <input type="text" id="join-code" name="join_code" required maxlength="8" class="join-code-input">
                            <small class="text-secondary">Enter the 8-character code provided by your Game Master</small>
                        </div>
                    </form>
                `,
                buttons: [
                    {
                        text: 'Join Campaign',
                        class: 'btn btn-primary',
                        type: 'submit',
                        action: 'submit',
                        handler: (e) => {
                            e.preventDefault();
                            const form = document.getElementById('join-campaign-form');
                            this.joinCampaign(new FormData(form));
                        }
                    },
                    {
                        text: 'Cancel',
                        class: 'btn btn-secondary',
                        action: 'cancel',
                        handler: () => ModalFactory.close('join-campaign-modal')
                    }
                ]
            });

            // Setup auto-uppercase for join code
            setTimeout(() => {
                const joinCodeInput = document.getElementById('join-code');
                if (joinCodeInput) {
                    joinCodeInput.addEventListener('input', (e) => {
                        e.target.value = e.target.value.toUpperCase();
                    });
                }
            }, 100);
        }
    }

    showCreateCampaignModal() {
        ModalFactory.show('create-campaign-modal');
    }

    showJoinCampaignModal() {
        ModalFactory.show('join-campaign-modal');
    }

    async createCampaign(formData) {
        try {
            const data = {
                action: 'create',
                name: formData.get('name'),
                description: formData.get('description'),
                max_players: parseInt(formData.get('max_players')),
                csrf_token: initiate.csrfToken
            };

            const result = await APIService.request('api/campaigns.php', {
                method: 'POST',
                data: data,
                showLoading: true,
                loadingTarget: 'create-campaign-modal'
            });

            if (result.success) {
                ModalFactory.close('create-campaign-modal');
                initiate.showAlert(`Campaign created successfully! Join code: ${result.join_code}`, 'success');
                initiate.loadCampaigns();
            } else {
                initiate.showAlert('Error creating campaign: ' + result.message, 'error');
            }
        } catch (error) {
            console.error('Error creating campaign:', error);
            initiate.showAlert('Error creating campaign', 'error');
        }
    }

    async joinCampaign(formData) {
        try {
            const data = {
                action: 'join',
                join_code: formData.get('join_code'),
                csrf_token: initiate.csrfToken
            };

            const response = await fetch('api/campaigns.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                initiate.closeModals();
                initiate.showAlert(result.message, 'success');
                initiate.loadCampaigns();
            } else {
                // Determine alert type based on the message
                let alertType = 'error';
                if (result.message.includes('already a member')) {
                    alertType = 'warning';
                } else if (result.message.includes('campaign is full')) {
                    alertType = 'warning';
                } else if (result.message.includes('Invalid join code')) {
                    alertType = 'error';
                }
                
                initiate.showAlert(result.message, alertType);
            }
        } catch (error) {
            console.error('Error joining campaign:', error);
            initiate.showAlert('Error joining campaign', 'error');
        }
    }
}

// Add methods to the main Initiate class
Object.assign(Initiate.prototype, {
    async leaveCampaign() {
        if (!this.currentCampaign) return;
        
        if (confirm('Are you sure you want to leave this campaign? Your characters will be deactivated.')) {
            try {
                const data = {
                    action: 'leave',
                    campaign_id: this.currentCampaign.campaign.id,
                    csrf_token: this.csrfToken
                };

                const response = await fetch('api/campaigns.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (result.success) {
                    this.showAlert(result.message, 'success');
                    this.loadCampaigns();
                    this.currentCampaign = null;
                    
                    // Reset main content
                    const mainContent = document.querySelector('.dashboard-main');
                    mainContent.innerHTML = `
                        <div class="welcome-message">
                            <h2>Welcome to Initiate</h2>
                            <p>Select a campaign from the sidebar or create a new one to get started!</p>
                        </div>
                    `;
                } else {
                    this.showAlert('Error leaving campaign: ' + result.message, 'error');
                }
            } catch (error) {
                console.error('Error leaving campaign:', error);
                this.showAlert('Error leaving campaign', 'error');
            }
        }
    },

    async endCampaign() {
        if (!this.currentCampaign) return;
        
        if (confirm('Are you sure you want to END this campaign? This will archive the campaign and all characters. This action cannot be easily undone.')) {
            try {
                const data = {
                    action: 'end',
                    campaign_id: this.currentCampaign.campaign.id,
                    csrf_token: this.csrfToken
                };

                const response = await fetch('api/campaigns.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (result.success) {
                    this.showAlert(result.message, 'success');
                    this.loadCampaigns();
                    this.currentCampaign = null;
                    
                    // Reset main content
                    const mainContent = document.querySelector('.dashboard-main');
                    mainContent.innerHTML = `
                        <div class="welcome-message">
                            <h2>Welcome to Initiate</h2>
                            <p>Select a campaign from the sidebar or create a new one to get started!</p>
                        </div>
                    `;
                } else {
                    this.showAlert('Error ending campaign: ' + result.message, 'error');
                }
            } catch (error) {
                console.error('Error ending campaign:', error);
                this.showAlert('Error ending campaign', 'error');
            }
        }
    }
});

// Initialize dashboard functionality
const dashboard = new Dashboard();