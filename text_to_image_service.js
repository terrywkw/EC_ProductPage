/**
 * TextToImageService - A service for generating product images from text descriptions
 * using Google Gemini 2.0 Flash Experimental model.
 * 
 * This service uses Gemini's multimodal capabilities to generate both descriptive text
 * and product images based on text prompts.
 */
class TextToImageService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.modelEndpoint = 'gemini-2.0-flash-exp-image-generation';
    }

    /**
     * Generates a product image and descriptive text based on a text prompt
     * @param {string} prompt - Text description of the product to generate
     * @param {Object} options - Additional options for image generation
     * @returns {Promise<Object>} - Object containing generated image data and descriptive text
     */
    async generateProductImage(prompt, options = {}) {
        // Default options
        const defaultOptions = {
            imageStyle: 'product-photography', // product-photography, lifestyle, minimalist
            aspectRatio: '1:1',               // 1:1, 4:3, 16:9, etc.
            detailLevel: 'high',              // low, medium, high
            background: 'white'               // white, transparent, gradient, contextual
        };
        
        const config = { ...defaultOptions, ...options };
        
        // Enhanced prompt with specific instructions for product image generation
        const enhancedPrompt = this.buildEnhancedPrompt(prompt, config);
        
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelEndpoint}:generateContent?key=${this.apiKey}`;
        
        try {
            console.log('Sending request to Gemini 2.0 Flash for image generation...');
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                { text: enhancedPrompt }
                            ]
                        }
                    ],
                    config: {
                        responseModalities: ["Text", "Image"],
                        generationConfig: {
                            temperature: 0.6,
                            maxOutputTokens: 2048,
                            topK: 40,
                            topP: 0.95
                        }
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Gemini API Error Response:', errorData);
                throw new Error(`API 請求失敗，狀態碼：${response.status}. ${errorData.error?.message || ''}`);
            }

            const data = await response.json();
            
            // Extract both text and image data from the response
            if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
                const parts = data.candidates[0].content.parts;
                let imageData = null;
                let textDescription = '';
                
                // Extract image and text from response parts
                for (const part of parts) {
                    if (part.text) {
                        textDescription = part.text;
                    } else if (part.inlineData) {
                        imageData = part.inlineData.data;
                    }
                }
                
                if (!imageData) {
                    console.warn('No image generated in the response');
                    return {
                        success: false,
                        error: '未能生成圖片，API 僅返回文字。請修改提示詞後再試。',
                        text: textDescription
                    };
                }
                
                return {
                    success: true,
                    imageData: imageData,  // Base64 encoded image
                    text: textDescription,
                    mimeType: 'image/png'  // Default mime type for generated images
                };
            } else if (data.promptFeedback && data.promptFeedback.blockReason) {
                // Handle content filtering
                console.error('Gemini Content Filtered:', data.promptFeedback);
                throw new Error(`內容因安全疑慮被阻擋 (${data.promptFeedback.blockReason})。請修改提示詞後再試。`);
            } else {
                console.error('Unexpected API Response Structure:', data);
                throw new Error('無法從 API 回應中解析生成的內容。');
            }
        } catch (error) {
            console.error('呼叫 Gemini API 生成圖片時發生錯誤:', error);
            return {
                success: false,
                error: error.message || '生成圖片時發生未知錯誤'
            };
        }
    }

    /**
     * Builds an enhanced prompt for better image generation
     * @param {string} basePrompt - The original user prompt
     * @param {Object} options - Configuration options
     * @returns {string} - Enhanced prompt
     */
    buildEnhancedPrompt(basePrompt, options) {
        // Start with a system context
        let enhancedPrompt = `作為一個專業產品圖片生成器，請根據以下描述創建一張高質量的商品圖片：\n\n`;
        
        // Add the base prompt
        enhancedPrompt += `產品描述：${basePrompt}\n\n`;
        
        // Add style instructions
        enhancedPrompt += `圖片風格：${this.getStyleDescription(options.imageStyle)}\n`;
        
        // Add aspect ratio instruction
        enhancedPrompt += `長寬比例：${options.aspectRatio}\n`;
        
        // Add detail level instruction
        enhancedPrompt += `細節級別：${this.getDetailLevelDescription(options.detailLevel)}\n`;
        
        // Add background instruction
        enhancedPrompt += `背景設置：${this.getBackgroundDescription(options.background)}\n\n`;
        
        // Add general quality instructions
        enhancedPrompt += `請遵循以下品質要求：
- 產品佔據畫面中心位置
- 細節清晰可見
- 色彩準確鮮明
- 光影效果專業
- 適合電商平台展示
- 無水印或文字
- 確保產品比例自然真實\n\n`;

        // Add response instructions
        enhancedPrompt += `請生成圖片，並附上簡短的圖片描述。`;
        
        return enhancedPrompt;
    }

    /**
     * Gets description for the requested image style
     * @param {string} style - The style name
     * @returns {string} - Description of the style
     */
    getStyleDescription(style) {
        switch (style.toLowerCase()) {
            case 'product-photography':
                return '專業產品攝影風格，乾淨清晰，突出產品特點，適合電商使用';
            case 'lifestyle':
                return '生活場景風格，展示產品在實際使用環境中的樣子，增加情境感';
            case 'minimalist':
                return '簡約風格，簡潔乾淨的背景，極簡設計，突出產品本身';
            case 'artistic':
                return '藝術風格，富有創意的展示方式，獨特視角，適合設計類產品';
            case 'technical':
                return '技術風格，展示產品功能和技術細節，適合電子、機械類產品';
            default:
                return '專業產品攝影風格，乾淨清晰，突出產品特點';
        }
    }

    /**
     * Gets description for the detail level
     * @param {string} level - Detail level (low, medium, high)
     * @returns {string} - Description of the detail level
     */
    getDetailLevelDescription(level) {
        switch (level.toLowerCase()) {
            case 'low':
                return '基本細節，展示產品整體外觀，不需過多細節';
            case 'medium':
                return '中等細節，清晰展示主要特點和功能';
            case 'high':
                return '高細節，精細呈現產品材質、紋理和細微特點';
            default:
                return '中等細節，清晰展示主要特點和功能';
        }
    }

    /**
     * Gets description for the background setting
     * @param {string} background - Background type
     * @returns {string} - Description of the background
     */
    getBackgroundDescription(background) {
        switch (background.toLowerCase()) {
            case 'white':
                return '純白色背景，專業商品展示';
            case 'transparent':
                return '透明背景，便於後期編輯';
            case 'gradient':
                return '漸層背景，柔和過渡，提升品質感';
            case 'contextual':
                return '情境化背景，與產品用途相關的簡單場景';
            case 'studio':
                return '專業攝影棚背景，帶有柔和光影';
            default:
                return '純白色背景，專業商品展示';
        }
    }

    /**
     * Validates the API key by making a simple request
     * @returns {Promise<boolean>} - Whether the API key is valid
     */
    async validateApiKey() {
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${this.apiKey}`);
            return response.ok;
        } catch (error) {
            console.error('API Key validation error:', error);
            return false;
        }
    }
}

// Export the service
window.TextToImageService = TextToImageService;
