/**
 * Modal Factory - Reusable modal creation and management
 * 
 * Provides consistent modal creation patterns and eliminates duplicate code
 * for modal handling across the application.
 * 
 * @author Initiative Tracker Team
 * @version 1.0.0
 */
class ModalFactory {
    /**
     * Create a standardized modal structure
     * @param {Object} config - Modal configuration
     * @param {string} config.id - Unique modal ID
     * @param {string} config.title - Modal title
     * @param {string} config.content - Modal body content HTML
     * @param {Array<Object>} config.buttons - Array of button configs {text, class, handler}
     * @param {string} config.size - Modal size ('small', 'medium', 'large', 'xlarge')
     * @returns {HTMLElement} Created modal element
     */
    static create(config) {
        const {
            id,
            title,
            content = '',
            buttons = [],
            size = 'medium',
            customClasses = []
        } = config;

        // Remove existing modal with same ID
        const existing = document.getElementById(id);
        if (existing) {
            existing.remove();
        }

        const modal = document.createElement('div');
        modal.id = id;
        modal.className = `modal ${customClasses.join(' ')}`;

        const sizeClass = this.getSizeClass(size);
        
        const buttonHtml = buttons.length > 0 ? 
            `<div class="modal-footer">
                ${buttons.map(btn => 
                    `<button type="${btn.type || 'button'}" class="${btn.class || 'btn btn-secondary'}" 
                     data-action="${btn.action || ''}">${btn.text}</button>`
                ).join('')}
            </div>` : '';

        modal.innerHTML = `
            <div class="modal-content ${sizeClass}">
                <div class="modal-header">
                    <h3 class="modal-title">${title}</h3>
                    <button class="close" type="button" aria-label="Close">&times;</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                ${buttonHtml}
            </div>
        `;

        document.body.appendChild(modal);
        this.setupEventHandlers(modal, buttons);
        
        return modal;
    }

    /**
     * Get CSS class for modal size
     */
    static getSizeClass(size) {
        const sizeClasses = {
            small: 'modal-sm',
            medium: 'modal-md',
            large: 'modal-lg',
            xlarge: 'modal-xl',
            browse: 'modal-browse'
        };
        return sizeClasses[size] || sizeClasses.medium;
    }

    /**
     * Setup standard modal event handlers
     */
    static setupEventHandlers(modal, buttons) {
        // Close button handler
        const closeBtn = modal.querySelector('.close');
        closeBtn?.addEventListener('click', () => this.close(modal));

        // Backdrop click handler
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.close(modal);
            }
        });

        // Button handlers
        buttons.forEach(btnConfig => {
            if (btnConfig.handler) {
                const btn = modal.querySelector(`[data-action="${btnConfig.action}"]`);
                btn?.addEventListener('click', btnConfig.handler);
            }
        });
    }

    /**
     * Show a modal
     */
    static show(modalOrId) {
        const modal = typeof modalOrId === 'string' ? 
            document.getElementById(modalOrId) : modalOrId;
        
        if (modal) {
            modal.classList.add('show');
            // Focus management
            const firstInput = modal.querySelector('input, select, textarea');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    }

    /**
     * Close a modal
     */
    static close(modalOrId) {
        const modal = typeof modalOrId === 'string' ? 
            document.getElementById(modalOrId) : modalOrId;
        
        if (modal) {
            modal.classList.remove('show');
        }
    }

    /**
     * Close all modals
     */
    static closeAll() {
        document.querySelectorAll('.modal.show').forEach(modal => {
            modal.classList.remove('show');
        });
    }
}

/**
 * API Service - Centralized API call handling
 * 
 * Provides consistent API interaction patterns with proper error handling
 * and loading states.
 */
class APIService {
    static baseUrl = '';
    static defaultHeaders = {
        'Content-Type': 'application/json'
    };

    /**
     * Make a standardized API request
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Request options
     * @returns {Promise<Object>} API response
     */
    static async request(endpoint, options = {}) {
        const {
            method = 'GET',
            data = null,
            headers = {},
            showLoading = false,
            loadingTarget = null
        } = options;

        if (showLoading && loadingTarget) {
            this.showLoading(loadingTarget);
        }

        try {
            const config = {
                method,
                headers: { ...this.defaultHeaders, ...headers }
            };

            if (data) {
                if (method === 'GET') {
                    const params = new URLSearchParams(data);
                    endpoint += `?${params.toString()}`;
                } else {
                    config.body = JSON.stringify(data);
                }
            }

            const response = await fetch(endpoint, config);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || `HTTP ${response.status}`);
            }

            return result;

        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            throw error;
        } finally {
            if (showLoading && loadingTarget) {
                this.hideLoading(loadingTarget);
            }
        }
    }

    /**
     * Show loading state on target element
     */
    static showLoading(target) {
        const element = typeof target === 'string' ? 
            document.getElementById(target) : target;
        
        if (element) {
            element.classList.add('loading');
            element.setAttribute('disabled', 'true');
        }
    }

    /**
     * Hide loading state
     */
    static hideLoading(target) {
        const element = typeof target === 'string' ? 
            document.getElementById(target) : target;
        
        if (element) {
            element.classList.remove('loading');
            element.removeAttribute('disabled');
        }
    }
}

/**
 * Form Utilities - Reusable form handling patterns
 */
class FormUtils {
    /**
     * Create standardized form validation
     */
    static validate(form, rules = {}) {
        const errors = {};
        const formData = new FormData(form);

        for (const [field, rule] of Object.entries(rules)) {
            const value = formData.get(field);
            
            if (rule.required && (!value || value.trim() === '')) {
                errors[field] = `${rule.label || field} is required`;
            }
            
            if (value && rule.minLength && value.length < rule.minLength) {
                errors[field] = `${rule.label || field} must be at least ${rule.minLength} characters`;
            }
            
            if (value && rule.maxLength && value.length > rule.maxLength) {
                errors[field] = `${rule.label || field} must not exceed ${rule.maxLength} characters`;
            }
        }

        return { isValid: Object.keys(errors).length === 0, errors };
    }

    /**
     * Display validation errors on form
     */
    static showErrors(form, errors) {
        // Clear existing errors
        form.querySelectorAll('.error-message').forEach(el => el.remove());
        form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));

        // Show new errors
        for (const [field, message] of Object.entries(errors)) {
            const input = form.querySelector(`[name="${field}"]`);
            if (input) {
                input.classList.add('error');
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message';
                errorDiv.textContent = message;
                input.parentNode.appendChild(errorDiv);
            }
        }
    }
}

/**
 * DOM Utilities - Common DOM manipulation patterns
 */
class DOMUtils {
    /**
     * Create element with attributes and children
     */
    static createElement(tag, attributes = {}, children = []) {
        const element = document.createElement(tag);
        
        for (const [key, value] of Object.entries(attributes)) {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'innerHTML') {
                element.innerHTML = value;
            } else {
                element.setAttribute(key, value);
            }
        }

        children.forEach(child => {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else {
                element.appendChild(child);
            }
        });

        return element;
    }

    /**
     * Safe query selector with error handling
     */
    static safeQuery(selector, context = document) {
        try {
            return context.querySelector(selector);
        } catch (error) {
            console.error(`Invalid selector: ${selector}`, error);
            return null;
        }
    }

    /**
     * Safe query selector all with error handling
     */
    static safeQueryAll(selector, context = document) {
        try {
            return Array.from(context.querySelectorAll(selector));
        } catch (error) {
            console.error(`Invalid selector: ${selector}`, error);
            return [];
        }
    }
}

/**
 * Logging utilities for production-ready logging
 */
class LoggingService {
    static debug(message, context = {}) {
        if (process.env.NODE_ENV !== 'production') {
            console.log('[DEBUG]', message, context);
        }
    }

    static info(message, context = {}) {
        console.info('[INFO]', message, context);
    }

    static warn(message, context = {}) {
        console.warn('[WARN]', message, context);
    }

    static error(message, error = null, context = {}) {
        const errorInfo = {
            message,
            context,
            timestamp: new Date().toISOString(),
            ...(error && { 
                error: error.message, 
                stack: error.stack 
            })
        };
        console.error('[ERROR]', errorInfo);
    }
}