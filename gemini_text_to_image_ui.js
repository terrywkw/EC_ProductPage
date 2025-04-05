/**
 * UI controller for the Gemini-powered Text-to-Image Generator
 * This component handles the user interface for generating product images from text descriptions
 */
class GeminiTextToImageUI {
    constructor(apiKeyManager) {
        this.apiKeyManager = apiKeyManager;
        this.textToImageService = null;
        this.generatedImages = [];
        this.selectedImage = null;
        
        // Initialize the service if API key exists
        const savedApiKey = this.apiKeyManager.getApiKey();
        if (savedApiKey) {
            this.textToImageService = new GeminiTextToImageService(savedApiKey);
        }
        
        // Listen for API key updates
        document.addEventListener('apiKeyUpdated', (e) => {
            this.textToImageService = new GeminiTextToImageService(e.detail.apiKey);
        });
        
        this.initializeUI();
    }
    
    /**
     * Initialize the UI elements and event listeners
     */
    initializeUI() {
        // Replace the existing ImageGenerator UI elements with our new implementation
        this.aiImageGenerateButton = document.getElementById('ai-image-generate-button');
        this.imageGenerateModal = document.getElementById('image-generate-modal');
        
        // Check if the modal exists; if not, create it
        if (!this.imageGenerateModal) {
            this.createImageGenerationModal();
        }
        
        // Get DOM elements
        this.closeImageGenerateModalButton = document.getElementById('close-image-generate-modal');
        this.imagePromptTextarea = document.getElementById('image-prompt');
        this.aspectRatioSelect = document.getElementById('aspect-ratio');
        this.styleSelect = document.getElementById('image-style');
        this.generateImagesButton = document.getElementById('generate-images-button');
        this.imageResultsArea = document.getElementById('image-results-area');
        this.useImageButton = document.getElementById('use-image-button');
        
        // Add event listeners
        if (this.aiImageGenerateButton) {
            this.aiImageGenerateButton.addEventListener('click', () => this.openModal());
        }
        
        if (this.closeImageGenerateModalButton) {
            this.closeImageGenerateModalButton.addEventListener('click', () => this.closeModal());
        }
        
        if (this.generateImagesButton) {
            this.generateImagesButton.addEventListener('click', () => this.generateImages());
        }
        
        if (this.useImageButton) {
            this.useImageButton.addEventListener('click', () => this.useSelectedImage());
        }
        
        // Window click event for closing modal
        window.addEventListener('click', (event) => {
            if (event.target === this.imageGenerateModal) {
                this.closeModal();
            }
        });
    }
    
    /**
     * Create the image generation modal if it doesn't exist
     */
    createImageGenerationModal() {
        const modalHtml = `
        <div id="image-generate-modal" class="modal">
            <div class="modal-content">
                <span class="close-button" id="close-image-generate-modal">&times;</span>
                <h2><span class="icon">✨</span> AI 產品圖片生成器</h2>
                <p>請描述您想要生成的產品圖片，提供越多細節越好。</p>
                <textarea id="image-prompt" rows="4" placeholder="例：一款紫色的真無線藍牙耳機，適合運動時使用，防水設計..."></textarea>
                <div class="ai-options">
                    <div class="option-group">
                        <label for="aspect-ratio">長寬比:</label>
                        <select id="aspect-ratio">
                            <option value="square">1:1 (正方形)</option>
                            <option value="landscape">4:3 (標準)</option>
                            <option value="portrait">3:4 (直式)</option>
                            <option value="widescreen">16:9 (寬屏)</option>
                        </select>
                    </div>
                    <div class="option-group">
                        <label for="image-style">圖片風格:</label>
                        <select id="image-style">
                            <option value="realistic">真實產品照</option>
                            <option value="lifestyle">情境使用照</option>
                            <option value="minimalist">簡約風格</option>
                            <option value="creative">創意概念</option>
                        </select>
                    </div>
                </div>
                <button id="generate-images-button" class="btn btn-primary">開始生成</button>
                <div id="image-results-area" class="image-results-area">
                    <!-- AI generated images will appear here -->
                    <p class="placeholder">生成的圖片將顯示於此...</p>
                </div>
                <button id="use-image-button" class="btn btn-secondary" style="display: none;">使用此圖片</button>
            </div>
        </div>`;
        
        // Add the modal to the body
        const div = document.createElement('div');
        div.innerHTML = modalHtml.trim();
        document.body.appendChild(div.firstChild);
        
        // Add CSS styles for new options
        const style = document.createElement('style');
        style.textContent = `
            .option-group {
                display: inline-block;
                margin-right: 20px;
                margin-bottom: 15px;
            }
            .ai-options {
                margin-bottom: 15px;
                padding: 10px;
                background-color: #f9f9f9;
                border-radius: 4px;
            }
        `;
        document.head.appendChild(style);
    }
    
    /**
     * Open the image generation modal
     */
    openModal() {
        // Check if API key is set up
        if (!this.apiKeyManager.hasApiKey()) {
            this.apiKeyManager.openModal();
            return;
        }
        
        const productName = document.getElementById('product-name').value.trim();
        
        // Pre-fill prompt with product name
        let initialPrompt = '';
        if (productName) {
            initialPrompt = productName;
        }
        this.imagePromptTextarea.value = initialPrompt;
        
        // Clear previous results
        this.imageResultsArea.innerHTML = '<p class="placeholder">生成的圖片將顯示於此...</p>';
        this.useImageButton.style.display = 'none';
        this.generatedImages = [];
        this.selectedImage = null;
        
        this.imageGenerateModal.style.display = 'block';
    }
    
    /**
     * Close the image generation modal
     */
    closeModal() {
        this.imageGenerateModal.style.display = 'none';
    }
    
    /**
     * Generate product images based on the prompt and selected options
     */
    async generateImages() {
        const prompt = this.imagePromptTextarea.value.trim();
        const aspectRatio = this.aspectRatioSelect.value;
        const style = this.styleSelect.value;
        
        if (!prompt) {
            this.imageResultsArea.innerHTML = '<p style="color: red;">請先輸入產品圖片描述！</p>';
            return;
        }
        
        if (!this.apiKeyManager.hasApiKey()) {
            this.imageResultsArea.innerHTML = '<p style="color: red;">錯誤：尚未設定 Gemini API Key！請點擊「設定 API Key」按鈕。</p>';
            return;
        }
        
        // Disable generate button and show loading state
        this.generateImagesButton.disabled = true;
        this.generateImagesButton.innerHTML = '<span class="loading-indicator"></span> 生成中...';
        this.imageResultsArea.innerHTML = '<p><i><span class="icon">⏳</span> AI 正在生成產品圖片，請稍候...</i></p>';
        this.useImageButton.style.display = 'none';
        
        try {
            // Generate stylized prompt based on selected style
            let enhancedPrompt = prompt;
            if (this.textToImageService.processStylePrompt) {
                enhancedPrompt = this.textToImageService.processStylePrompt(style, prompt);
            }
            
            // Generate images using the GeminiTextToImageService
            const images = await this.textToImageService.generateProductImages(enhancedPrompt, {
                numberOfImages: 4, // Aim to generate multiple options
                aspectRatio: aspectRatio,
                style: style
            });
            
            this.generatedImages = images;
            
            // Display the generated images
            if (images && images.length > 0) {
                this.displayGeneratedImages(images);
                
                // If these are mock images (often smaller base64 strings), show a notice
                if (images[0].imageBytes.length < 5000) {
                    this.imageResultsArea.insertAdjacentHTML('afterbegin', 
                        '<div style="background-color: #fff3cd; color: #856404; padding: 10px; margin-bottom: 15px; border-radius: 4px; text-align: center;">' +
                        '注意：由於 API 請求使用的是模擬圖片。<br>請確保您的 API 金鑰已啟用 Gemini 2.0 圖像生成功能。' +
                        '</div>');
                }
            } else {
                this.imageResultsArea.innerHTML = '<p style="color: red;">未能生成圖片，請嘗試不同的描述或稍後再試。</p>';
            }
        } catch (error) {
            console.error('生成圖片時發生錯誤:', error);
            this.imageResultsArea.innerHTML = `<p style="color: red;">生成圖片時發生錯誤：${error.message}</p>`;
            
            // Check if error is related to API key
            if (error.message.includes('API') || error.message.includes('key') || error.message.includes('請求失敗')) {
                this.imageResultsArea.innerHTML += `
                    <p style="color: red;">
                        您的 API Key 可能無效、已過期或未啟用圖像生成功能。
                        <button id="update-api-key-img" class="btn btn-secondary">更新 API Key</button>
                    </p>
                `;
                
                document.getElementById('update-api-key-img').addEventListener('click', () => {
                    this.apiKeyManager.openModal();
                });
            }
        } finally {
            // Reset button state
            this.generateImagesButton.disabled = false;
            this.generateImagesButton.innerHTML = '開始生成';
        }
    }
    
    /**
     * Display the generated images in the results area
     * @param {Array} images - Array of generated image data
     */
    displayGeneratedImages(images) {
        this.imageResultsArea.innerHTML = '';
        
        const imagesContainer = document.createElement('div');
        imagesContainer.className = 'generated-images-grid';
        
        images.forEach((image, index) => {
            const imageContainer = document.createElement('div');
            imageContainer.className = 'generated-image-container';
            
            // Create the image element
            const img = document.createElement('img');
            img.src = `data:${image.mimeType || 'image/png'};base64,${image.imageBytes}`;
            img.alt = `Generated product image ${index + 1}`;
            img.className = 'generated-image';
            
            // Add click handler for selecting images
            imageContainer.addEventListener('click', () => {
                // Remove selection from all images
                document.querySelectorAll('.generated-image-container').forEach(container => {
                    container.classList.remove('selected');
                });
                
                // Add selection to clicked image
                imageContainer.classList.add('selected');
                this.selectedImage = image;
                this.useImageButton.style.display = 'inline-block';
            });
            
            imageContainer.appendChild(img);
            imagesContainer.appendChild(imageContainer);
        });
        
        this.imageResultsArea.appendChild(imagesContainer);
    }
    
    /**
     * Use the selected image as product image
     */
    useSelectedImage() {
        if (!this.selectedImage) {
            return;
        }
        
        // Create a new file input event with the selected image
        const dataURL = `data:${this.selectedImage.mimeType || 'image/png'};base64,${this.selectedImage.imageBytes}`;
        
        // Create a temporary link to download the image
        fetch(dataURL)
            .then(res => res.blob())
            .then(blob => {
                // Create a File object
                const file = new File([blob], "ai-generated-product.png", { type: this.selectedImage.mimeType || "image/png" });
                
                // Create a custom event to simulate file upload
                const event = new CustomEvent('aiImageSelected', {
                    detail: { file, dataURL }
                });
                document.dispatchEvent(event);
                
                // Close the modal
                this.closeModal();
            });
    }
    
    /**
     * Generate prompt suggestions based on product name and description
     * @param {string} productName - The product name
     * @param {string} productDescription - The product description
     * @returns {string} - A suggested prompt for image generation
     */
    generatePromptSuggestion(productName, productDescription) {
        let suggestion = '';
        
        if (productName) {
            suggestion = productName;
        }
        
        // If there's a product description, extract key details
        if (productDescription) {
            // Extract key product features (look for adjectives, colors, materials)
            const colorMatch = productDescription.match(/(?:紅|藍|綠|黃|黑|白|紫|粉|橙|棕|灰|金|銀|彩色)(色)?/g);
            const materialMatch = productDescription.match(/(?:皮革|金屬|塑料|木|布|玻璃|陶瓷|不銹鋼|鋁|棉|麻|絲|毛)/g);
            
            if (colorMatch) {
                suggestion += suggestion ? '，' + colorMatch[0] : colorMatch[0];
            }
            
            if (materialMatch) {
                suggestion += suggestion ? '，' + materialMatch[0] + '材質' : materialMatch[0] + '材質';
            }
        }
        
        // Add generic product photography suggestion if we have something to work with
        if (suggestion) {
            suggestion += '，專業產品照片，白色背景，高清細節';
        }
        
        return suggestion;
    }
}

// Export the class
window.GeminiTextToImageUI = GeminiTextToImageUI;
