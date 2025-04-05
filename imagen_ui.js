/**
 * UI controller for the AI Product Image Generator
 * Handles user interactions with the image generation modal
 */
class ProductImageGenerator {
    constructor(apiKeyManager) {
        this.apiKeyManager = apiKeyManager;
        this.imagenService = null;
        this.generatedImages = [];
        this.selectedImage = null;
        
        // Initialize the imagen service if API key exists
        const savedApiKey = this.apiKeyManager.getApiKey();
        if (savedApiKey) {
            this.imagenService = new ImagenService(savedApiKey);
        }
        
        // Listen for API key updates
        document.addEventListener('apiKeyUpdated', (e) => {
            this.imagenService = new ImagenService(e.detail.apiKey);
        });
        
        this.initializeUI();
    }
    
    /**
     * Initialize the UI elements and event listeners
     */
    initializeUI() {
        // Get DOM elements
        this.aiImageGenerateButton = document.getElementById('ai-image-generate-button');
        this.imageGenerateModal = document.getElementById('image-generate-modal');
        this.closeImageGenerateModalButton = document.getElementById('close-image-generate-modal');
        this.imagePromptTextarea = document.getElementById('image-prompt');
        this.aspectRatioSelect = document.getElementById('aspect-ratio');
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
     * Generate product images based on the prompt
     */
    async generateImages() {
        const prompt = this.imagePromptTextarea.value.trim();
        const aspectRatio = this.aspectRatioSelect.value;
        
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
            // Generate images using the Imagen service
            const images = await this.imagenService.generateProductImages(prompt, {
                numberOfImages: 4, // Generate multiple options
                aspectRatio: aspectRatio
            });
            
            this.generatedImages = images;
            
            // Display the generated images
            if (images && images.length > 0) {
                this.displayGeneratedImages(images);
                
                // 如果是模擬數據，顯示提示信息
                if (images[0].imageBytes.length < 5000) { // 假設真實图片的 base64 字符串长度会大于这个值
                    this.imageResultsArea.insertAdjacentHTML('afterbegin', 
                        '<div style="background-color: #fff3cd; color: #856404; padding: 10px; margin-bottom: 15px; border-radius: 4px; text-align: center;">' +
                        '注意：由於 API 請求受限，目前顯示的是模擬圖片。<br>真實 Imagen API 需要付費金鑰。' +
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
                        您的 API Key 可能無效或已過期。
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
            img.src = `data:image/png;base64,${image.imageBytes}`;
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
        const dataURL = `data:image/png;base64,${this.selectedImage.imageBytes}`;
        
        // Create a temporary link to download the image
        fetch(dataURL)
            .then(res => res.blob())
            .then(blob => {
                // Create a File object
                const file = new File([blob], "ai-generated-product.png", { type: "image/png" });
                
                // Create a custom event to simulate file upload
                const event = new CustomEvent('aiImageSelected', {
                    detail: { file, dataURL }
                });
                document.dispatchEvent(event);
                
                // Close the modal
                this.closeModal();
            });
    }
}

// Export the class
window.ProductImageGenerator = ProductImageGenerator;
