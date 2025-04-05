/**
 * UI Handler for the Image-to-Text functionality
 * Manages the UI interactions for generating product descriptions from images
 */
class ImageToTextUI {
    constructor(apiKeyManager) {
        this.apiKeyManager = apiKeyManager;
        this.imageToTextService = null;
        
        // Initialize service if API key is available
        const savedApiKey = this.apiKeyManager.getApiKey();
        if (savedApiKey) {
            this.imageToTextService = new ImageToTextService(savedApiKey);
        }
        
        // DOM elements will be initialized in setup()
        this.modal = null;
        this.closeButton = null;
        this.imagePreview = null;
        this.generateButton = null;
        this.resultArea = null;
        this.useDescButton = null;
        this.toneSelect = null;
        this.selectedImageData = null;
        this.productNameInput = null;
        
        // Event listeners will be set up in setupEventListeners()
        this.setupComplete = false;
        
        // Last generated description
        this.lastGeneratedDescription = '';
        
        // Check if the DOM is ready, then set up
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
        
        // Listen for API key updates
        document.addEventListener('apiKeyUpdated', (e) => {
            this.imageToTextService = new ImageToTextService(e.detail.apiKey);
        });
    }
    
    /**
     * Set up the UI elements and event listeners
     */
    setup() {
        // Create the modal if it doesn't exist
        if (!document.getElementById('ai-image-to-text-modal')) {
            this.createModal();
        }
        
        // Get DOM elements
        this.modal = document.getElementById('ai-image-to-text-modal');
        this.closeButton = document.getElementById('close-image-to-text-modal');
        this.imagePreview = document.getElementById('image-to-text-preview');
        this.generateButton = document.getElementById('generate-from-image-button');
        this.resultArea = document.getElementById('image-to-text-result');
        this.useDescButton = document.getElementById('use-image-desc-button');
        this.toneSelect = document.getElementById('image-to-text-tone');
        this.productNameInput = document.getElementById('image-to-text-product-name');
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Add the Image-to-Text button to the file upload area
        this.addImageToTextButton();
        
        this.setupComplete = true;
    }
    
    /**
     * Create the modal dialog for the Image-to-Text functionality
     */
    createModal() {
        const modalHtml = `
        <div id="ai-image-to-text-modal" class="modal">
            <div class="modal-content">
                <span class="close-button" id="close-image-to-text-modal">&times;</span>
                <h2><span class="icon">✨</span> 商品圖生成描述</h2>
                
                <div class="image-text-layout">
                    <div class="image-preview-container">
                        <p><strong>上傳的商品圖:</strong></p>
                        <div class="modal-image-background">
                            <img id="image-to-text-preview" src="#" alt="商品圖預覽">
                        </div>
                    </div>
                    
                    <div class="options-container">
                        <div class="form-group">
                            <label for="image-to-text-product-name">商品名稱 (選填)</label>
                            <input type="text" id="image-to-text-product-name" placeholder="輸入商品名稱以提高準確度">
                        </div>
                        
                        <div class="form-group">
                            <label for="image-to-text-tone">語氣風格:</label>
                            <select id="image-to-text-tone">
                                <option value="professional">專業</option>
                                <option value="playful">活潑</option>
                                <option value="concise">簡潔</option>
                            </select>
                        </div>
                        
                        <button id="generate-from-image-button" class="btn btn-primary">
                            <span class="icon">✨</span> 從圖片生成描述
                        </button>
                    </div>
                </div>
                
                <div id="image-to-text-result" class="ai-result-area">
                    <p class="placeholder">AI 將分析圖片並生成商品描述...</p>
                </div>
                
                <button id="use-image-desc-button" class="btn btn-secondary" style="display: none;">使用此描述</button>
            </div>
        </div>`;
        
        // Add the modal to the body
        const div = document.createElement('div');
        div.innerHTML = modalHtml.trim();
        document.body.appendChild(div.firstChild);
        
        // Add CSS styles for new elements
        const style = document.createElement('style');
        style.textContent = `
            .image-text-layout {
                display: flex;
                gap: 20px;
                margin-bottom: 20px;
            }
            
            .image-preview-container {
                flex: 1;
                min-width: 200px;
            }
            
            .options-container {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 15px;
            }
            
            #image-to-text-preview {
                max-width: 100%;
                max-height: 250px;
                display: block;
                margin: 0 auto;
            }
            
            .modal-image-background {
                background-color: #f5f5f5;
                padding: 15px;
                border-radius: 4px;
                text-align: center;
                min-height: 200px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            @media (max-width: 768px) {
                .image-text-layout {
                    flex-direction: column;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    /**
     * Set up event listeners for the UI elements
     */
    setupEventListeners() {
        // Close button event
        this.closeButton.addEventListener('click', () => this.closeModal());
        
        // Generate button event
        this.generateButton.addEventListener('click', () => this.generateDescription());
        
        // Use description button event
        this.useDescButton.addEventListener('click', () => this.useGeneratedDescription());
        
        // Close modal when clicking outside
        window.addEventListener('click', (event) => {
            if (event.target === this.modal) {
                this.closeModal();
            }
        });
    }
    
    /**
     * Add the Image-to-Text button to each image thumbnail
     */
    addImageToTextButton() {
        // Add button to existing image preview area
        const imagePreviewArea = document.getElementById('image-preview-area');
        if (!imagePreviewArea) return;
        
        // Create a MutationObserver to monitor for new image thumbnails
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach((node) => {
                        if (node.classList && node.classList.contains('img-thumbnail-container')) {
                            this.addButtonToThumbnail(node);
                        }
                    });
                }
            });
        });
        
        // Start observing
        observer.observe(imagePreviewArea, { childList: true });
        
        // Also add the global "Image-to-Text" button near the AI Description button
        const aiDescButton = document.getElementById('ai-desc-button');
        if (aiDescButton) {
            const parentElement = aiDescButton.parentElement;
            const imageToTextGlobalButton = document.createElement('button');
            imageToTextGlobalButton.id = 'ai-image-text-button';
            imageToTextGlobalButton.classList.add('btn', 'btn-ai');
            imageToTextGlobalButton.innerHTML = '<span class="icon">✨</span> AI 根據圖片生成描述';
            imageToTextGlobalButton.addEventListener('click', () => this.openModalWithLatestImage());
            
            // Add after the existing button
            parentElement.appendChild(imageToTextGlobalButton);
        }
    }
    
    /**
     * Add the Image-to-Text button to a specific thumbnail
     * @param {HTMLElement} thumbnailContainer - The container element for the thumbnail
     */
    addButtonToThumbnail(thumbnailContainer) {
        // Check if the button already exists
        if (thumbnailContainer.querySelector('.ai-image-text-button')) return;
        
        // Create the button
        const button = document.createElement('button');
        button.classList.add('ai-image-text-button');
        button.innerHTML = '📝';
        button.title = 'AI 從圖片生成描述';
        button.style.position = 'absolute';
        button.style.top = '5px';
        button.style.left = '5px';
        button.style.backgroundColor = '#9b59b6';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.borderRadius = '50%';
        button.style.width = '24px';
        button.style.height = '24px';
        button.style.display = 'flex';
        button.style.alignItems = 'center';
        button.style.justifyContent = 'center';
        button.style.fontSize = '12px';
        button.style.cursor = 'pointer';
        button.style.zIndex = '10';
        
        // Add the event listener
        button.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent triggering the container's click event
            const img = thumbnailContainer.querySelector('img');
            if (img && img.src) {
                this.openModal(img.src);
            }
        });
        
        // Add the button to the thumbnail container
        thumbnailContainer.appendChild(button);
    }
    
    /**
     * Open the modal with the selected image
     * @param {string} imageUrl - URL of the image to analyze
     */
    openModal(imageUrl) {
        // Check if API key is set up
        if (!this.apiKeyManager.hasApiKey()) {
            this.apiKeyManager.openModal();
            return;
        }
        
        // Set the image source
        this.imagePreview.src = imageUrl;
        this.selectedImageData = imageUrl;
        
        // Clear previous results
        this.resultArea.innerHTML = '<p class="placeholder">AI 將分析圖片並生成商品描述...</p>';
        this.useDescButton.style.display = 'none';
        this.lastGeneratedDescription = '';
        
        // Open the modal
        this.modal.style.display = 'block';
    }
    
    /**
     * Open the modal with the most recently added image
     */
    openModalWithLatestImage() {
        const imagePreviewArea = document.getElementById('image-preview-area');
        if (!imagePreviewArea) return;
        
        // Get all image thumbnails
        const thumbnails = imagePreviewArea.querySelectorAll('.img-thumbnail-container');
        if (thumbnails.length === 0) {
            alert('請先上傳商品圖片');
            return;
        }
        
        // Get the most recent thumbnail (last child)
        const latestThumbnail = thumbnails[thumbnails.length - 1];
        const img = latestThumbnail.querySelector('img');
        if (img && img.src) {
            this.openModal(img.src);
        }
    }
    
    /**
     * Close the modal
     */
    closeModal() {
        this.modal.style.display = 'none';
    }
    
    /**
     * Generate a description from the image
     */
    async generateDescription() {
        // Check if an image is selected
        if (!this.selectedImageData) {
            this.resultArea.innerHTML = '<p style="color: red;">錯誤：未選擇圖片</p>';
            return;
        }
        
        // Check if API key is set up
        if (!this.apiKeyManager.hasApiKey()) {
            this.resultArea.innerHTML = '<p style="color: red;">錯誤：尚未設定 API Key</p>';
            this.apiKeyManager.openModal();
            return;
        }
        
        // Get the product name and tone
        const productName = this.productNameInput.value.trim();
        const tone = this.toneSelect.value;
        
        // Disable the generate button and show loading state
        this.generateButton.disabled = true;
        this.generateButton.innerHTML = '<span class="loading-indicator"></span> 分析圖片中...';
        this.resultArea.innerHTML = '<p><i><span class="icon">⏳</span> AI 正在分析圖片並生成描述，請稍候...</i></p>';
        this.useDescButton.style.display = 'none';
        
        try {
            // Convert the image URL to base64 if needed
            let base64Data = this.selectedImageData;
            
            // If the image is a data URL, extract the base64 part
            if (base64Data.startsWith('data:')) {
                base64Data = base64Data.split(',')[1];
            } else {
                // If it's a URL, fetch and convert to base64
                base64Data = await this.urlToBase64(base64Data);
            }
            
            // Generate the description
            const description = await this.imageToTextService.generateDescriptionFromImage(
                base64Data,
                productName,
                { tone }
            );
            
            // Format the text for display (replace newlines with <br>)
            const formattedText = description.replace(/\n/g, '<br>');
            this.resultArea.innerHTML = `<p>${formattedText}</p>`;
            
            // Add character count
            const charCount = description.length;
            const wordCount = description.split(/\s+/).length;
            this.resultArea.innerHTML += `
                <div class="character-counter">
                    字數: ${charCount} 個字元 / 約 ${wordCount} 個詞彙
                </div>
            `;
            
            this.lastGeneratedDescription = description; // Store the raw text
            this.useDescButton.style.display = 'inline-block';
            
        } catch (error) {
            console.error('從圖片生成描述時發生錯誤:', error);
            this.resultArea.innerHTML = `<p style="color: red;">生成描述時發生錯誤：${error.message}</p>`;
            
            // If the error is related to invalid API key, prompt to update it
            if (error.message.includes('API') || error.message.includes('key') || error.message.includes('請求失敗')) {
                this.resultArea.innerHTML += `
                    <p style="color: red;">
                        您的 API Key 可能無效或已過期。
                        <button id="update-api-key-img" class="btn btn-secondary">更新 API Key</button>
                    </p>
                `;
                
                document.getElementById('update-api-key-img').addEventListener('click', () => {
                    this.apiKeyManager.openModal();
                });
            }
        } finally {
            // Re-enable the generate button
            this.generateButton.disabled = false;
            this.generateButton.innerHTML = '<span class="icon">✨</span> 從圖片生成描述';
        }
    }
    
    /**
     * Use the generated description in the product description textarea
     */
    useGeneratedDescription() {
        if (this.lastGeneratedDescription) {
            // Find the product description textarea
            const productDescriptionTextarea = document.getElementById('product-description');
            if (productDescriptionTextarea) {
                productDescriptionTextarea.value = this.lastGeneratedDescription;
                this.closeModal();
            }
        }
    }
    
    /**
     * Convert a URL to a base64 string
     * @param {string} url - The URL of the image
     * @returns {Promise<string>} - Base64 encoded image data
     */
    async urlToBase64(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous'; // Handle CORS
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                // Get base64 data from canvas
                const dataURL = canvas.toDataURL('image/jpeg');
                resolve(dataURL.split(',')[1]); // Remove the data:image/jpeg;base64, prefix
            };
            img.onerror = (e) => {
                reject(new Error('圖片載入失敗'));
            };
            img.src = url;
        });
    }
}

// Export the UI handler
window.ImageToTextUI = ImageToTextUI;
