/**
 * Authentication System
 * 
 * Handles user authentication, session management, and security features
 * for the Initiative Tracker application.
 * 
 * Features:
 * - User login and registration
 * - Session management
 * - CSRF token handling
 * - Password validation
 * - Secure form submission
 * 
 * @author Initiative Tracker Team
 * @version 1.0.0
 */

document.addEventListener('DOMContentLoaded', function() {
    const loginTab = document.querySelector('[data-tab="login"]');
    const registerTab = document.querySelector('[data-tab="register"]');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const registerPassword = document.getElementById('reg_password');

    // Tab switching
    loginTab.addEventListener('click', () => switchTab('login'));
    registerTab.addEventListener('click', () => switchTab('register'));

    function switchTab(tab) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

        // Update forms
        document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
        document.getElementById(`${tab}-form`).classList.add('active');
    }

    // Password strength checker
    if (registerPassword) {
        registerPassword.addEventListener('input', checkPasswordStrength);
    }

    function checkPasswordStrength() {
        const password = registerPassword.value;
        const strengthIndicator = document.getElementById('password-strength');
        
        if (!strengthIndicator) {
            // Create strength indicator if it doesn't exist
            const indicator = document.createElement('div');
            indicator.id = 'password-strength';
            indicator.className = 'password-strength';
            registerPassword.parentNode.appendChild(indicator);
        }

        if (password.length === 0) {
            document.getElementById('password-strength').textContent = '';
            return;
        }

        let strength = 0;
        let feedback = '';

        // Length check
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;

        // Character variety
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;

        if (strength <= 2) {
            feedback = 'Weak password';
            document.getElementById('password-strength').className = 'password-strength strength-weak';
        } else if (strength <= 4) {
            feedback = 'Medium password';
            document.getElementById('password-strength').className = 'password-strength strength-medium';
        } else {
            feedback = 'Strong password';
            document.getElementById('password-strength').className = 'password-strength strength-strong';
        }

        document.getElementById('password-strength').textContent = feedback;
    }

    // Form validation
    registerForm.addEventListener('submit', function(e) {
        const password = document.getElementById('reg_password').value;
        const confirmPassword = document.getElementById('reg_confirm_password').value;

        if (password !== confirmPassword) {
            e.preventDefault();
            showAuthAlert('Passwords do not match.', 'error');
            return false;
        }

        if (password.length < 8) {
            e.preventDefault();
            showAuthAlert('Password must be at least 8 characters long.', 'error');
            return false;
        }

        return true;
    });

    // Show alert function for auth page
    function showAuthAlert(message, type) {
        // Remove existing alerts
        const existingAlerts = document.querySelectorAll('.auth-card .alert');
        existingAlerts.forEach(alert => alert.remove());

        // Create new alert
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;

        // Insert at the top of the auth card
        const authCard = document.querySelector('.auth-card');
        const firstChild = authCard.firstElementChild;
        authCard.insertBefore(alert, firstChild.nextElementSibling);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 5000);
    }

    // Auto-focus first input
    const firstInput = document.querySelector('.auth-form.active input');
    if (firstInput) {
        firstInput.focus();
    }

    // Enter key navigation
    document.querySelectorAll('.auth-form input').forEach((input, index, inputs) => {
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                const nextInput = inputs[index + 1];
                if (nextInput) {
                    nextInput.focus();
                } else {
                    // Submit the form
                    this.closest('form').querySelector('button[type="submit"]').click();
                }
            }
        });
    });
});