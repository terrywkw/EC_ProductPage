/**
 * API Key Manager for Google Gemini API
 * Handles saving, loading, and validating API keys
 */
class ApiKeyManager {
    constructor() {
        this.apiKeyStorageKey = 'gemini_api_key';
        this.initModal();
    }

    /**
     * Initialize the API key modal and event listeners
     */
    initModal() {
        // Get DOM elements
        this.apiKeyModal = document.getElementById('api-key-modal');
        this.apiKeyInput = document.getElementById('api-key-input');
        this.saveApiKeyButton = document.getElementById('save-api-key-button');
        this.closeApiKeyModalButton = document.getElementById('close-api-key-modal');
        this.apiKeyStatus = document.getElementById('api-key-status');
        
        // Set up event listeners
        this.saveApiKeyButton.addEventListener('click', () => this.saveApiKey());
        this.closeApiKeyModalButton.addEventListener('click', () => this.closeModal());
        
        // Check for existing API key
        const savedApiKey = this.getApiKey();
        if (savedApiKey) {
            this.apiKeyInput.value = savedApiKey;
        }
    }

    /**
     * Open the API key modal
     */
    openModal() {
        this.apiKeyModal.style.display = 'block';
        this.apiKeyStatus.textContent = '';
        this.apiKeyStatus.className = 'text-sm mt-2';
    }

    /**
     * Close the API key modal
     */
    closeModal() {
        this.apiKeyModal.style.display = 'none';
    }

    /**
     * Save the API key to local storage
     */
    async saveApiKey() {
        const apiKey = this.apiKeyInput.value.trim();
        
        if (!apiKey) {
            this.showStatus('請輸入有效的 API Key', 'error');
            return;
        }
        
        // Test the API key before saving
        this.showStatus('驗證中...', '');
        
        try {
            // Create a minimal test service
            const testService = new GeminiService(apiKey);
            const isValid = await testService.validateApiKey();
            
            if (isValid) {
                // Save the API key
                localStorage.setItem(this.apiKeyStorageKey, apiKey);
                this.showStatus('API Key 有效並已儲存！', 'success');
                
                // Trigger an event to notify of successful API key setup
                const event = new CustomEvent('apiKeyUpdated', { detail: { apiKey } });
                document.dispatchEvent(event);
                
                // Close the modal after a short delay
                setTimeout(() => this.closeModal(), 1500);
            } else {
                this.showStatus('API Key 無效，請確認後重試', 'error');
            }
        } catch (error) {
            console.error('API Key 驗證錯誤:', error);
            this.showStatus(`驗證失敗: ${error.message}`, 'error');
        }
    }

    /**
     * Display a status message in the modal
     * @param {string} message - The message to display
     * @param {string} type - The message type (success, error, or empty string)
     */
    showStatus(message, type) {
        this.apiKeyStatus.textContent = message;
        this.apiKeyStatus.className = `text-sm mt-2 ${type}`;
    }

    /**
     * Get the saved API key from local storage
     * @returns {string|null} - The API key or null if not found
     */
    getApiKey() {
        return localStorage.getItem(this.apiKeyStorageKey);
    }

    /**
     * Check if an API key exists
     * @returns {boolean} - Whether an API key exists
     */
    hasApiKey() {
        return !!this.getApiKey();
    }

    /**
     * Remove the API key from local storage
     */
    clearApiKey() {
        localStorage.removeItem(this.apiKeyStorageKey);
    }

    /**
     * Create an API key banner to prompt the user to enter an API key
     * @returns {HTMLElement} - The banner element
     */
    createApiKeyBanner() {
        const banner = document.createElement('div');
        banner.className = 'api-key-banner';
        banner.innerHTML = `
            <span>請先設定 Google Gemini API Key 以啟用 AI 功能</span>
            <button id="set-api-key-button">設定 API Key</button>
        `;
        
        banner.querySelector('#set-api-key-button').addEventListener('click', () => {
            this.openModal();
        });
        
        return banner;
    }
}

// Make the manager available globally
window.ApiKeyManager = ApiKeyManager;
