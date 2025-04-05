document.addEventListener('DOMContentLoaded', () => {
    // Initialize the API Key Manager
    const apiKeyManager = new ApiKeyManager();
    
    // Initialize the Image Generator with the API Key Manager
    const productImageGenerator = new ProductImageGenerator(apiKeyManager);
    
    // Initialize the Image-to-Text UI with the API Key Manager
    const imageToTextUI = new ImageToTextUI(apiKeyManager);
    
    // Initialize the Text-to-Image UI with the API Key Manager
    const textToImageUI = new TextToImageUI(apiKeyManager);
    
    // Initialize Gemini service with saved API key if available
    let geminiService = null;
    const savedApiKey = apiKeyManager.getApiKey();
    if (savedApiKey) {
        geminiService = new GeminiService(savedApiKey);
    }

    // Initialize Gemini Image Service
    let geminiImageService = null;

    // Function to initialize Gemini Image Service
    async function initializeGeminiImageService() {
        const apiKey = await apiKeyManager.getApiKey();
        if (apiKey) {
            geminiImageService = new GeminiImageService(apiKey);
            return true;
        }
        return false;
    }

    // --- Get DOM Elements ---
    const productNameInput = document.getElementById('product-name');
    const productDescriptionTextarea = document.getElementById('product-description');
    const productImageInput = document.getElementById('product-images');
    const imagePreviewArea = document.getElementById('image-preview-area');

    // AI Description Elements
    const aiDescButton = document.getElementById('ai-desc-button');
    const aiDescModal = document.getElementById('ai-desc-modal');
    const closeDescModalButton = document.getElementById('close-desc-modal');
    const aiPromptTextarea = document.getElementById('ai-prompt');
    const aiToneSelect = document.getElementById('ai-tone');
    const generateDescButton = document.getElementById('generate-desc-button');
    const aiResultArea = document.getElementById('ai-result-area');
    const useDescButton = document.getElementById('use-desc-button');

    // AI Image Elements
    const aiImageModal = document.getElementById('ai-image-modal');
    const closeImageModalButton = document.getElementById('close-image-modal');
    const modalImagePreview = document.getElementById('modal-image-preview');
    const modalImageBackground = document.getElementById('modal-image-background');
    const backgroundOptionsContainer = document.querySelector('.background-options');
    const saveImageButton = document.getElementById('save-image-button');

    let currentEditingImageContainer = null; // To track which image thumbnail is being edited
    let lastGeneratedDescription = ''; // Store the last successful generation

    // Add API key banner if no key is present
    if (!apiKeyManager.hasApiKey()) {
        const banner = apiKeyManager.createApiKeyBanner();
        document.querySelector('.container').insertBefore(banner, document.querySelector('.actions-top'));
    }

    // Listen for API key updates
    document.addEventListener('apiKeyUpdated', (e) => {
        geminiService = new GeminiService(e.detail.apiKey);
        
        // Remove the banner if it exists
        const banner = document.querySelector('.api-key-banner');
        if (banner) {
            banner.remove();
        }
    });

    // Listen for AI generated image selection
    document.addEventListener('aiImageSelected', (e) => {
        const { file, dataURL } = e.detail;
        createImageThumbnail(dataURL, file.name, true); // true indicates this is an AI-generated image
    });

    // --- Modal Handling ---
    function openModal(modal) {
        modal.style.display = 'block';
    }

    function closeModal(modal) {
        modal.style.display = 'none';
    }

    // Close modal if clicking outside the content area
    window.onclick = function(event) {
        if (event.target == aiDescModal) {
            closeModal(aiDescModal);
        }
        if (event.target == aiImageModal) {
            closeModal(aiImageModal);
        }
        if (event.target == document.getElementById('api-key-modal')) {
            apiKeyManager.closeModal();
        }
        if (event.target == document.getElementById('image-generate-modal')) {
            if (textToImageUI) {
                textToImageUI.closeModal();
            }
        }
    }

    // --- AI Description Feature ---
    aiDescButton.addEventListener('click', () => {
        // Check if API key is set up
        if (!apiKeyManager.hasApiKey()) {
            apiKeyManager.openModal();
            return;
        }
        
        openModal(aiDescModal);
        const productName = productNameInput.value.trim();
        
        // Pre-fill prompt with product name and tone
        let initialPrompt = '';
        if (productName) {
            initialPrompt += `產品名稱：${productName}\n`;
        }
        initialPrompt += `請幫我生成一段精簡的產品描述，限制在200字以內。\n`;
        initialPrompt += `額外需求：\n- `; // Start bullet point for user input
        aiPromptTextarea.value = initialPrompt;

        aiResultArea.innerHTML = '<p class="placeholder">AI 生成的結果將顯示於此...</p>';
        useDescButton.style.display = 'none';
        lastGeneratedDescription = ''; // Clear previous result
    });

    closeDescModalButton.addEventListener('click', () => closeModal(aiDescModal));

    generateDescButton.addEventListener('click', async () => {
        const userPrompt = aiPromptTextarea.value.trim();
        const tone = aiToneSelect.value;
        const productName = productNameInput.value.trim() || '該產品'; // Use placeholder if no name

        if (!userPrompt) {
            aiResultArea.innerHTML = '<p style="color: red;">請先輸入產品描述提示！</p>';
            return;
        }
        
        if (!apiKeyManager.hasApiKey()) {
            aiResultArea.innerHTML = '<p style="color: red;">錯誤：尚未設定 Gemini API Key！請點擊「設定 API Key」按鈕。</p>';
            return;
        }

        generateDescButton.disabled = true;
        generateDescButton.innerHTML = '<span class="loading-indicator"></span> 生成中...';
        aiResultArea.innerHTML = '<p><i><span class="icon">⏳</span> AI 正在生成200字以內的產品敘述，請稍候...</i></p>';
        useDescButton.style.display = 'none';
        lastGeneratedDescription = ''; // Clear previous result

        try {
            // Use the Gemini service to generate the description
            const generatedText = await geminiService.generateProductDescription(
                productName,
                userPrompt,
                tone
            );
            
            // Format the text for display (replace newlines with <br>)
            const formattedText = generatedText.replace(/\n/g, '<br>');
            aiResultArea.innerHTML = `<p>${formattedText}</p>`;
            
            // Add character count
            const charCount = generatedText.length;
            const wordCount = generatedText.split(/\s+/).length;
            aiResultArea.innerHTML += `
                <div class="character-counter">
                    字數: ${charCount} 個字元 / 約 ${wordCount} 個詞彙
                </div>
            `;
            
            lastGeneratedDescription = generatedText; // Store the raw text
            useDescButton.style.display = 'inline-block';
            
        } catch (error) {
            console.error('產生產品描述時發生錯誤:', error);
            aiResultArea.innerHTML = `<p style="color: red;">生成描述時發生錯誤：${error.message}</p>`;
            
            // If the error is related to invalid API key, prompt to update it
            if (error.message.includes('API') || error.message.includes('key') || error.message.includes('請求失敗')) {
                aiResultArea.innerHTML += `
                    <p style="color: red;">
                        您的 API Key 可能無效或已過期。
                        <button id="update-api-key" class="btn btn-secondary">更新 API Key</button>
                    </p>
                `;
                
                document.getElementById('update-api-key').addEventListener('click', () => {
                    apiKeyManager.openModal();
                });
            }
            
            lastGeneratedDescription = ''; // No valid result
        } finally {
            generateDescButton.disabled = false;
            generateDescButton.innerHTML = '開始生成';
        }
    });

    useDescButton.addEventListener('click', () => {
        if (lastGeneratedDescription) {
            // Use the stored raw text (without <br>) for the textarea
            productDescriptionTextarea.value = lastGeneratedDescription;
        }
        closeModal(aiDescModal);
    });


    // --- Image Upload and Preview ---
    productImageInput.addEventListener('change', handleImageUpload);

    function handleImageUpload(event) {
        const files = event.target.files;
        for (const file of files) {
            if (!file.type.startsWith('image/')) continue;
            const reader = new FileReader();
            reader.onload = function(e) {
                createImageThumbnail(e.target.result, file.name);
            }
            reader.readAsDataURL(file);
        }
        event.target.value = null;
    }

    function createImageThumbnail(imageDataUrl, fileName, isAiGenerated = false) {
        const container = document.createElement('div');
        container.classList.add('img-thumbnail-container');
        container.dataset.filename = fileName;

        const img = document.createElement('img');
        img.src = imageDataUrl;
        img.alt = fileName;
        img.classList.add('img-thumbnail');

        const aiButton = document.createElement('button');
        aiButton.innerHTML = '🪄';
        aiButton.classList.add('ai-image-button');
        aiButton.title = 'AI 商品照工具';
        aiButton.addEventListener('click', () => {
            currentEditingImageContainer = container;
            modalImagePreview.src = img.src;
            modalImageBackground.style.backgroundImage = 'none';
            modalImageBackground.style.backgroundColor = '#eee';
            openModal(aiImageModal);
        });

        container.appendChild(img);
        container.appendChild(aiButton);
        
        // Add an indicator if this is an AI-generated image
        if (isAiGenerated) {
            const indicator = document.createElement('span');
            indicator.textContent = '✨';
            indicator.title = 'AI 生成圖片';
            indicator.style.position = 'absolute';
            indicator.style.bottom = '5px';
            indicator.style.left = '5px';
            indicator.style.backgroundColor = '#9b59b6';
            indicator.style.color = 'white';
            indicator.style.borderRadius = '50%';
            indicator.style.width = '18px';
            indicator.style.height = '18px';
            indicator.style.display = 'flex';
            indicator.style.alignItems = 'center';
            indicator.style.justifyContent = 'center';
            indicator.style.fontSize = '12px';
            indicator.classList.add('ai-generated-indicator');
            container.appendChild(indicator);
        }
        
        imagePreviewArea.appendChild(container);
    }


    // --- AI Image Editing Feature ---
    closeImageModalButton.addEventListener('click', () => closeModal(aiImageModal));

    backgroundOptionsContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('bg-option')) {
            const bgValue = event.target.dataset.bg;
            if (bgValue.startsWith('url')) {
                modalImageBackground.style.backgroundImage = bgValue;
                modalImageBackground.style.backgroundColor = 'transparent';
            } else {
                modalImageBackground.style.backgroundColor = bgValue;
                modalImageBackground.style.backgroundImage = 'none';
            }
        }
    });

    saveImageButton.addEventListener('click', () => {
        if (currentEditingImageContainer) {
            let indicator = currentEditingImageContainer.querySelector('.processed-indicator');
            if (!indicator) {
                indicator = document.createElement('span');
                indicator.textContent = '✓';
                indicator.title = 'AI 已處理';
                indicator.style.position = 'absolute';
                indicator.style.bottom = '5px';
                indicator.style.right = '5px';
                indicator.style.backgroundColor = '#2ecc71';
                indicator.style.color = 'white';
                indicator.style.borderRadius = '50%';
                indicator.style.width = '18px';
                indicator.style.height = '18px';
                indicator.style.display = 'flex';
                indicator.style.alignItems = 'center';
                indicator.style.justifyContent = 'center';
                indicator.style.fontSize = '12px';
                indicator.classList.add('processed-indicator');
                currentEditingImageContainer.appendChild(indicator);
            }
        }
        console.log('Simulating save for image:', modalImagePreview.src);
        console.log('Selected background:', modalImageBackground.style.backgroundColor || modalImageBackground.style.backgroundImage);
        closeModal(aiImageModal);
    });

    // Initialize Gemini Image Service when API key is saved
    document.getElementById('save-api-key-button').addEventListener('click', async () => {
        const apiKey = document.getElementById('api-key-input').value;
        if (apiKey) {
            await apiKeyManager.saveApiKey(apiKey);
            await initializeGeminiImageService();
            document.getElementById('api-key-modal').style.display = 'none';
        }
    });

    // Handle image generation
    document.getElementById('generate-images-button').addEventListener('click', generateImageWithGemini);

    // Handle using generated image
    document.getElementById('use-image-button').addEventListener('click', useGeneratedImage);

    // Show API key modal if needed
    document.getElementById('ai-image-generate-button').addEventListener('click', async () => {
        const initialized = await initializeGeminiImageService();
        if (!initialized) {
            document.getElementById('api-key-modal').style.display = 'block';
        } else {
            document.getElementById('image-generate-modal').style.display = 'block';
        }
    });

}); // End DOMContentLoaded

// Function to handle image generation
async function generateImageWithGemini() {
    const prompt = document.getElementById('image-prompt').value;
    const style = document.getElementById('image-style').value;
    const background = document.getElementById('background-style').value;
    const aspectRatio = document.getElementById('aspect-ratio').value;

    if (!prompt) {
        alert('請輸入圖片描述');
        return;
    }

    if (!geminiImageService) {
        const initialized = await initializeGeminiImageService();
        if (!initialized) {
            alert('請先設定 API Key');
            document.getElementById('api-key-modal').style.display = 'block';
            return;
        }
    }

    const generateButton = document.getElementById('generate-images-button');
    const resultsArea = document.getElementById('image-results-area');
    const useImageButton = document.getElementById('use-image-button');

    generateButton.disabled = true;
    generateButton.textContent = '生成中...';
    resultsArea.innerHTML = '<p class="loading">正在生成圖片，請稍候...</p>';
    useImageButton.style.display = 'none';

    try {
        // Construct the full prompt with style and background preferences
        const fullPrompt = `${prompt}。風格：${style}，背景：${background}，長寬比：${aspectRatio}`;
        
        const result = await geminiImageService.generateImage(fullPrompt);
        
        if (result.text) {
            resultsArea.innerHTML = `<p class="generated-text">${result.text}</p>`;
        }
        
        if (result.imageData) {
            const img = document.createElement('img');
            img.src = `data:image/png;base64,${result.imageData}`;
            img.alt = 'Generated Image';
            img.className = 'generated-image';
            resultsArea.appendChild(img);
            useImageButton.style.display = 'block';
        }
    } catch (error) {
        resultsArea.innerHTML = `<p class="error">生成圖片時發生錯誤：${error.message}</p>`;
    } finally {
        generateButton.disabled = false;
        generateButton.textContent = '開始生成';
    }
}

// Function to use the generated image
function useGeneratedImage() {
    const generatedImage = document.querySelector('#image-results-area .generated-image');
    if (generatedImage) {
        // Create a new image preview in the main form
        const imagePreviewArea = document.getElementById('image-preview-area');
        const newImagePreview = document.createElement('div');
        newImagePreview.className = 'image-preview';
        newImagePreview.innerHTML = `
            <img src="${generatedImage.src}" alt="Generated Product Image">
            <button class="remove-image">×</button>
        `;
        imagePreviewArea.appendChild(newImagePreview);
        
        // Close the modal
        document.getElementById('image-generate-modal').style.display = 'none';
    }
}
