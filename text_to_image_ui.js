/**
 * UI Handler for the Text-to-Image functionality
 * Manages the UI interactions for generating product images from text descriptions
 */
class TextToImageUI {
    constructor(apiKeyManager) {
        this.apiKeyManager = apiKeyManager;
        this.textToImageService = null;
        
        // Initialize service if API key is available
        const savedApiKey = this.apiKeyManager.getApiKey();
        if (savedApiKey) {
            this.textToImageService = new TextToImageService(savedApiKey);
        }
        
        // Setup UI elements
        this.setupUI();
        
        // Listen for API key updates
        document.addEventListener('apiKeyUpdated', (e) => {
            this.textToImageService = new TextToImageService(e.detail.apiKey);
        });
    }
    
    /**
     * Set up UI elements and event listeners
     */
    setupUI() {
        // Get existing modal or create one if it doesn't exist
        this.modal = document.getElementById('image-generate-modal');
        
        if (this.modal) {
            // Find and setup existing UI elements
            this.setupExistingUI();
        }
        
        // Update the AI image generation button to use our new service
        const aiImageGenerateButton = document.getElementById('ai-image-generate-button');
        if (aiImageGenerateButton) {
            aiImageGenerateButton.removeEventListener('click', this.originalEventListener);
            aiImageGenerateButton.addEventListener('click', () => this.openModal());
        }
    }
    
    /**
     * Set up with existing UI elements
     */
    setupExistingUI() {
        // Get references to existing UI elements
        this.closeButton = document.getElementById('close-image-generate-modal');
        this.promptTextarea = document.getElementById('image-prompt');
        this.aspectRatioSelect = document.getElementById('aspect-ratio');
        this.generateButton = document.getElementById('generate-images-button');
        this.resultsArea = document.getElementById('image-results-area');
        this.useImageButton = document.getElementById('use-image-button');
        
        // Add event listeners
        this.closeButton.addEventListener('click', () => this.closeModal());
        this.generateButton.addEventListener('click', () => this.generateImage());
        this.useImageButton.addEventListener('click', () => this.useSelectedImage());
        
        // Add style selector if it doesn't exist
        if (!document.getElementById('image-style')) {
            this.addStyleSelector();
        }
        
        // Add background selector if it doesn't exist
        if (!document.getElementById('background-style')) {
            this.addBackgroundSelector();
        }
        
        // Close modal when clicking outside
        window.addEventListener('click', (event) => {
            if (event.target === this.modal) {
                this.closeModal();
            }
        });
    }
    
    /**
     * Add image style selector to the UI
     */
    addStyleSelector() {
        const aspectRatioLabel = document.querySelector('label[for="aspect-ratio"]');
        if (!aspectRatioLabel) return;
        
        const styleContainer = document.createElement('div');
        styleContainer.className = 'ai-options';
        styleContainer.innerHTML = `
            <label for="image-style">圖片風格:</label>
            <select id="image-style">
                <option value="product-photography">產品攝影</option>
                <option value="lifestyle">生活情境</option>
                <option value="minimalist">簡約風格</option>
                <option value="artistic">藝術風格</option>
                <option value="technical">技術展示</option>
            </select>
        `;
        
        aspectRatioLabel.parentNode.insertBefore(styleContainer, aspectRatioLabel.parentNode.firstChild);
    }
    
    /**
     * Add background style selector to the UI
     */
    addBackgroundSelector() {
        const aspectRatioContainer = document.querySelector('label[for="aspect-ratio"]').parentNode;
        if (!aspectRatioContainer) return;
        
        const backgroundContainer = document.createElement('div');
        backgroundContainer.className = 'ai-options';
        backgroundContainer.innerHTML = `
            <label for="background-style">背景風格:</label>
            <select id="background-style">
                <option value="white">純白背景</option>
                <option value="gradient">漸層背景</option>
                <option value="contextual">情境背景</option>
                <option value="studio">攝影棚</option>
            </select>
        `;
        
        aspectRatioContainer.parentNode.insertBefore(backgroundContainer, aspectRatioContainer.nextSibling);
    }
    
    /**
     * Open the modal dialog
     */
    openModal() {
        // Check if API key is set up
        if (!this.apiKeyManager.hasApiKey()) {
            this.apiKeyManager.openModal();
            return;
        }
        
        // Clear previous inputs and results
        if (this.promptTextarea) {
            this.promptTextarea.value = '';
        }
        
        if (this.resultsArea) {
            this.resultsArea.innerHTML = '<p class="placeholder">生成的圖片將顯示於此...</p>';
        }
        
        if (this.useImageButton) {
            this.useImageButton.style.display = 'none';
        }
        
        // Show the modal
        this.modal.style.display = 'block';
    }
    
    /**
     * Close the modal dialog
     */
    closeModal() {
        this.modal.style.display = 'none';
    }
    
    /**
     * Generate product image from text description
     */
    async generateImage() {
        // Get the prompt text
        const prompt = this.promptTextarea.value.trim();
        if (!prompt) {
            this.resultsArea.innerHTML = '<p style="color: red;">請先輸入產品描述!</p>';
            return;
        }
        
        // Check if API key is set up
        if (!this.apiKeyManager.hasApiKey()) {
            this.resultsArea.innerHTML = '<p style="color: red;">錯誤：尚未設定 API Key</p>';
            this.apiKeyManager.openModal();
            return;
        }
        
        // Get options
        const options = this.getImageOptions();
        
        // Show loading state
        this.generateButton.disabled = true;
        this.generateButton.innerHTML = '<span class="loading-indicator"></span> 生成中...';
        this.resultsArea.innerHTML = '<p><i><span class="icon">⏳</span> AI 正在生成產品圖片，請稍候...</i></p>';
        this.useImageButton.style.display = 'none';
        
        try {
            // Call the service to generate the image
            const result = await this.textToImageService.generateProductImage(prompt, options);
            
            if (result.success) {
                // Create image preview from base64 data
                const imgDataUrl = `data:${result.mimeType || 'image/png'};base64,${result.imageData}`;
                
                // Display the result
                this.resultsArea.innerHTML = `
                    <div class="generated-image-container selected" data-image-url="${imgDataUrl}">
                        <img class="generated-image" src="${imgDataUrl}" alt="AI Generated Product Image">
                    </div>
                    <div class="image-description">
                        <p>${result.text || '圖片已生成'}</p>
                    </div>
                `;
                
                // Show the use button
                this.useImageButton.style.display = 'inline-block';
                
                // Store the generated image data
                this.currentGeneratedImage = {
                    dataUrl: imgDataUrl,
                    text: result.text,
                    filename: `generated_product_${Date.now()}.png`
                };
                
            } else {
                // Show error message
                this.resultsArea.innerHTML = `
                    <p style="color: red;">生成圖片時發生錯誤：${result.error}</p>
                    ${result.text ? `<div class="text-only-result"><p>${result.text}</p></div>` : ''}
                `;
                
                // If the error is related to invalid API key, prompt to update it
                if (result.error && (result.error.includes('API') || result.error.includes('key') || result.error.includes('請求失敗'))) {
                    this.resultsArea.innerHTML += `
                        <p style="color: red;">
                            您的 API Key 可能無效或已過期。
                            <button id="update-api-key-img-gen" class="btn btn-secondary">更新 API Key</button>
                        </p>
                    `;
                    
                    document.getElementById('update-api-key-img-gen').addEventListener('click', () => {
                        this.apiKeyManager.openModal();
                    });
                }
            }
        } catch (error) {
            console.error('生成圖片時發生錯誤:', error);
            this.resultsArea.innerHTML = `<p style="color: red;">生成圖片時發生錯誤：${error.message}</p>`;
        } finally {
            // Reset the generate button
            this.generateButton.disabled = false;
            this.generateButton.innerHTML = '開始生成';
        }
    }
    
    /**
     * Get image generation options from UI inputs
     * @returns {Object} - Options for image generation
     */
    getImageOptions() {
        // Get aspect ratio
        const aspectRatio = this.aspectRatioSelect.value;
        
        // Get image style if available
        const imageStyleSelect = document.getElementById('image-style');
        const imageStyle = imageStyleSelect ? imageStyleSelect.value : 'product-photography';
        
        // Get background style if available
        const backgroundSelect = document.getElementById('background-style');
        const background = backgroundSelect ? backgroundSelect.value : 'white';
        
        return {
            aspectRatio: aspectRatio,
            imageStyle: imageStyle,
            background: background,
            detailLevel: 'high'
        };
    }
    
    /**
     * Use the selected generated image
     */
    useSelectedImage() {
        if (!this.currentGeneratedImage) return;
        
        // Create a synthetic file object
        const blob = this.dataURLtoBlob(this.currentGeneratedImage.dataUrl);
        const file = new File([blob], this.currentGeneratedImage.filename, { type: 'image/png' });
        
        // Dispatch an event with the file and image data
        const event = new CustomEvent('aiImageSelected', {
            detail: {
                file: file,
                dataURL: this.currentGeneratedImage.dataUrl
            }
        });
        
        document.dispatchEvent(event);
        
        // Close the modal
        this.closeModal();
    }
    
    /**
     * Convert a data URL to a Blob object
     * @param {string} dataURL - Data URL string
     * @returns {Blob} - Blob object
     */
    dataURLtoBlob(dataURL) {
        // Convert base64/URLEncoded data component to raw binary data held in a string
        let byteString;
        if (dataURL.split(',')[0].indexOf('base64') >= 0) {
            byteString = atob(dataURL.split(',')[1]);
        } else {
            byteString = unescape(dataURL.split(',')[1]);
        }
        
        // Separate out the mime component
        const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];
        
        // Write the bytes of the string to a typed array
        const ia = new Uint8Array(byteString.length);
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        
        return new Blob([ia], { type: mimeString });
    }
}

// Export the UI handler
window.TextToImageUI = TextToImageUI;
