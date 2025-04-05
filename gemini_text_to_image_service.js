/**
 * Gemini Text-to-Image Service
 * A service for generating product images using Google Gemini 2.0's image generation capabilities
 */
class GeminiTextToImageService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
        this.model = 'gemini-2.0-flash-exp-image-generation';
    }

    /**
     * Generates product images based on a text prompt using Gemini 2.0
     * 
     * @param {string} prompt - Text description of the product image to generate
     * @param {Object} options - Optional parameters for image generation
     * @param {number} options.numberOfImages - Number of images to generate (defaults to 1, actual result depends on API)
     * @param {string} options.aspectRatio - Desired aspect ratio (e.g., 'square', 'portrait', 'landscape')
     * @returns {Promise<Array>} - Array of generated image data
     */
    async generateProductImages(prompt, options = {}) {
        // Default options
        const defaultOptions = {
            numberOfImages: 1,
            aspectRatio: 'square',
            style: 'realistic',
            quality: 'high'
        };
        
        const config = { ...defaultOptions, ...options };
        
        // Format the prompt based on aspect ratio and style preferences
        const enhancedPrompt = this.enhancePrompt(prompt, config);
        
        try {
            console.log('Attempting to generate images with Gemini 2.0...');
            
            // Use Gemini 2.0's image generation capabilities
            const url = `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
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
                        responseModalities: ["Image"]
                    },
                    generationConfig: {
                        temperature: 0.6,
                        topK: 32,
                        topP: 0.95
                    }
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error('Gemini API Error Response:', errorData);
                
                if (errorData.error && errorData.error.message && 
                    errorData.error.message.includes('image generation')) {
                    throw new Error('Gemini 圖像生成功能暫不可用，可能受限於您的 API 金鑰。請使用模擬圖像。');
                } else {
                    throw new Error(`API 請求失敗，狀態碼：${response.status}. ${errorData.error?.message || ''}`);
                }
            }
            
            const data = await response.json();
            
            // Extract image data from response
            let generatedImages = [];
            
            if (data.candidates && data.candidates.length > 0) {
                const candidate = data.candidates[0];
                if (candidate.content && candidate.content.parts) {
                    for (const part of candidate.content.parts) {
                        if (part.inlineData && part.inlineData.data) {
                            generatedImages.push({
                                imageBytes: part.inlineData.data,
                                mimeType: part.inlineData.mimeType || 'image/jpeg'
                            });
                        }
                    }
                }
            }
            
            if (generatedImages.length > 0) {
                console.log(`Successfully generated ${generatedImages.length} images`);
                return generatedImages;
            } else {
                console.log('No images were generated, falling back to mock images');
                throw new Error('未能從API回應中提取圖像數據');
            }
        } catch (error) {
            console.error('調用 Gemini 圖像生成時發生錯誤:', error);
            console.log('Falling back to mock images');
            return this.generateMockImages(config.numberOfImages);
        }
    }
    
    /**
     * Enhance the basic product prompt with detailed instructions for better image generation
     * 
     * @param {string} basePrompt - The original user prompt
     * @param {Object} options - Configuration options for the image
     * @returns {string} - Enhanced prompt for better image generation
     */
    enhancePrompt(basePrompt, options) {
        let enhancedPrompt = 'Generate a professional product photograph of ';
        
        // Add the user's prompt
        enhancedPrompt += basePrompt;
        
        // Add style specifications
        enhancedPrompt += '. The image should have ';
        
        // Add lighting and background based on style
        if (options.style === 'realistic') {
            enhancedPrompt += 'studio lighting, neutral background, professional product photography style, ';
        } else if (options.style === 'lifestyle') {
            enhancedPrompt += 'natural lighting, contextual background showing the product in use, lifestyle photography style, ';
        } else if (options.style === 'minimalist') {
            enhancedPrompt += 'clean lighting, plain white background, minimalist product photography style, ';
        }
        
        // Add quality specifications
        if (options.quality === 'high') {
            enhancedPrompt += 'high resolution, sharp details, professional quality, ';
        }
        
        // Add aspect ratio specifications
        if (options.aspectRatio === 'square') {
            enhancedPrompt += 'square format (1:1 aspect ratio), ';
        } else if (options.aspectRatio === 'portrait') {
            enhancedPrompt += 'portrait orientation (3:4 aspect ratio), ';
        } else if (options.aspectRatio === 'landscape') {
            enhancedPrompt += 'landscape orientation (4:3 aspect ratio), ';
        } else if (options.aspectRatio === 'widescreen') {
            enhancedPrompt += 'widescreen format (16:9 aspect ratio), ';
        }
        
        // Add e-commerce specific instructions
        enhancedPrompt += 'suitable for e-commerce, with clear view of product details, appealing composition, and marketable appearance.';
        
        // Add negative prompts to avoid common issues
        enhancedPrompt += ' Do not include text, logos, watermarks, or human hands in the image.';
        
        return enhancedPrompt;
    }
    
    /**
     * Generate mock images when API fails or is unavailable
     * 
     * @param {number} count - Number of mock images to generate
     * @returns {Array} - Array of mock image data
     */
    generateMockImages(count = 1) {
        console.log(`Generating ${count} mock images...`);
        
        // Mock image Base64 data - these are simplified placeholders representing product photography
        const mockImageTemplates = [
            // Mock product image 1 (coffee mug)
            'iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAIAAAAiOjnJAAAHD0lEQVR4nO3dW1MbVxrA8f85fdR9pNa1JKyLJCQQAmMGMBewx0ls16Ry5TxkvkOeJ7nlJZWaVCYVVxxiO7Fjg8EYAQKBQHdJSEhCCF26r9PnzAumvDO7myC97vb5Xa8H7hQ1f7r79DmNoiiEkF0kfdSfgLzvJFjkUwgW+RSCdQkkSdp8JAhCEIZbf3AjWJeR5hPnDCcCK03T53MXhBAXfChYF4B5eLxhv/vVdH2xFTIXCdZBW1kcn04kk0nLMEnzgjzdCNZBW1nsj8f/9sdbw5HIycMSJekMF7qrBOvQXCTLXrAWZ2f/9NtvfVE2PzGZkSV1d/6eYB2g82U513N8enoylZJleT3IxR7Y8KXRBN5OsA7NeY+pquqNGzeGh4aKhcLs9LRimkQkogqCcgmfF8E6HOdLIfP/R0dH/3rrVp+ihG37x6mpVLmcMM1IqeQvFH53GYJ1OJ4vhZmZmcnJSerVfLFQmEulnKWlXs9ThcAPUZAgCAhWdw1tbKdUVf32u++GhoYqlm3Pz+dTKeF5XlRV',
            
            // Mock product image 2 (smartphone)
            'iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAIAAAAiOjnJAAAHzElEQVR4nO3dwW/bVB7H8e/vsZ3Edhw7Ng1JCkxVKdABUQaQdhk4gMS/wJXDXpDgzpHjwmnaC1LPXNkTEmcOHEBakFZCYpBgQFSd6TKFJqljJ7ET+/HvwWY6DRnXGPd3fcnvcznQNJX6yU9+z8+2BM/zoKm0Pv6tKAq+8SkMC0+CYeFJECwVURSFEBIEge97Q8WVYKmFEJJpM9Vq1fM8SZIIIcFQESx1CIKQ6bRbrZZ/hRZcgqUSQkhwvd3pdDpdLhQKgfXVx5dgqcPXa21sbq6urn',
            
            // Mock product image 3 (watch)
            'iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAIAAAAiOjnJAAAG5UlEQVR4nO3dv2/bVhTH8XOvH0nRlC1KlKzYlh1ZDoLYg7N0CNChRYcO+ZPzl3bJ0KFzh+4dMmTI1KVAnMFp4sBuZEVm9YMSRUmkHsnz4kth4jStTP7Q5bl8PpsRcAI/fO+5916K8jwHIp9IJAIAMcYYIgQAMvMHwzAqv4Z8IvGqJwQQXi0SCaFImHX1JFjqCFdXA7Acj70oigJdERZ5uEYExjFGQRB4nuf7Pu/7dICLYCnCGHPfbrfbbbvnuq7neRznnGMcrQiWCowxh2HY63athYVOp1Ov14MgMMZxnueMMTLARbBUYYyNRqNut/vwwYN2u53nued5jLEkSYwbowmWUowxz/N6vd5Sq7W0tMR5HkVRkiQAYLpufgTrOvxhtbe3N84Yx3Ec5/LyMgzDm7kUwboWZ1fted7JyUkYhr7vj0ajRqPx7tN3nucc5/l1aBGsfzaZWjPGNE03DIOBZYyJpmla1pllWUEQ/PLrXx8fH/0bPZUaLHMmrbWUUl3X2+12kfsoiiaTyWQyKT61J5NJq9V6+Oihbdvdbvfw8PDZs2dE1wPK2wSr8nK5vLe3N51ODcPQNE3XdUEQCCGMMUEQGGOiKMqyrCiKJEnFLGtV',
            
            // Mock product image 4 (headphones)
            'iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAIAAAAiOjnJAAAIQUlEQVR4nO3dwW/b1h3H8e/vjxJp0qR8kCxbln2wFXtwtg7Y1rXAkK3Zrrsv+58GDBvWHnfoYeuWoD0M2J/QXXbYgK5FURs+KHFqW5H4Ir5HcnkgkaatLTtkQlLU9/P6kw//9JGPj4+PpIwxELK/aJJB5PfoXb4JACCBIFKCIFKCIFKCIFKCIFKCIFLCRJfh3W8AIGOCXxUjR0qQEgSREgSREgSREgSREgSREgSREgSREgSREgSREq4Dq9kCgGxPDNaEeQGA2ER5ogfI0gkgb75hQpASBJESBJESBJESBJESBJESBJESBJESBJES498pnrY4D8ABOAIAQJ5wbMbiAQBoQ3geByBPwJksiJQgiJQgiJQgiJQgiJQgiJQgiJQgiJRwPTbAGJA/2wAwZt6ADZN0RHniGK5wBMgDq9kCMOTrDw4YQmr3TRwfHhRaUZ7c1Jq9Xvc/uVpd9Xv9XJpw5i7/9tOW/g/Z6/Vs255mGG9LTBcHN67vKjGG83e87AH57pPjS6XSmXQiTQRBUHra2u31eq7rZjKZm2rtTOnk8r+/uf+v+oVf96oFB0N5AtGCRVvGgHMOQJ5ICNZVjAFjfA+XECx5YpZRcfQ7mHQfyCU9WOJe/PF2Oi6nMwqCIMuyrSjyPK/X6z05bu6zDRIYrNFo5HletVLpHD9lV1Ysx7GGXY7J87zT07Pj42a+sLp+baNQKKjKIrz6l8qTv31fvZMg83nKdBiGruvarptNp/P5fKFQWF9fr1QqiURCHodhOBqN2u12vV6vH9Zbrfmcy+QwWMaYfr/fuqg/D7oBACzL8n0fQDablQfJoN/vHx4ePnrU6J/99E5uXQGgLEpf/LV8J0Hmsj9jTBiGQRBMPkPRYRiORqNutyvdEEWRXFkURQ8fPhxc/O6rfws8eS25DJbtOPFYzB8Oo6nvWZZl23Y8HrcsK4piiqLItm3TMPzk7bDkMlhZx4nH477v38wTxpiiKDzPK8tyNBJyGSxRKBS44/RHo5tzzVSK53k8zxeLRRfBssfBkgel1+sND9xW66J+9KzX6w0GA4ZhGI+bpsnzfDwed12XYZjM6mq5XPYY5uT4+LTZ9Dyv3W77vh8EQauZYN2UMYAxAJAt7S99+iFbc9LpdK6Q+/rTD379xTtf/Xj/o+/+8PkfP8zlcnlVVXMrK/d0vVwuF4tyqVQaDAYnJyetVqvRaPx4cOA4jqqqQRBwHMcwzKTUFXP+GkOO5nNgLcf/13A4tCxrPB6XSqXPPvmQZVmO4+bzayI2LRb0Yql0/7cvA1DV2GAwODhoDIdDy7L29/cPDg6Gw6HjOJZlnZ6e+r6fTCbDMMxkMiz7P19jLKdcjmqkWCz6vv/kyZP9/f3pdCrPGWMyDNNqtRhjGkFghvNy86fLYCUTCY7jDg4Owihaz+XejMdt2x6Px1wmsZlJKYpyfflyGaw8oxiGsbe3Fw2HnW4XEIQAAKPRKKWX80UgGU99zy2aZLJIxsNwACA1Yb8X8mZeRRHxdnIZLN4wOY67eTnKwvV1XeV1i0UQBEmSJIribGaDMbYsa3YRtFqt3IriYoS8DJbjOADYzOd9zxuPx5NXtm1bloUxDoLg+Pi42Wyenp5qmlYul9+9d895zXN3ScE6OTl51Ghs7+yU1tfvra+XS+V0JgMAw+FwdmW73e50OqqqbmxsfPTh',
            
            // Mock product image 5 (speaker)
            'iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAIAAAAiOjnJAAAG80lEQVR4nO3dQW/jNhqG4ZekSNGUN5oZO0yCebbbbTdA0f//a3rolmibzQJ7WAyaxInHtiSKlPh+rgxjgGLw6g35kWRMQADZe/qn/wPw/xdgIQRYCAEWQoCFEGAhBFgIARZCgIUQYCEEWAgBFkKAhRBgIQRYCAEWQoCFEGAhBFgIARZCgIUQYCEEWAgBFkKAhRBgIQRYCAEWQoCFEGAhBFgIARZCgIUQYCEEWAgBFkKAhRBgIQRYCAEWQoCFEGAhBFgIARZCgIUQYCEEWAgBFkKAhRBgIQRYCAEWQoCFEGAhBFgIARZCgIUQYCEEWAgBFkKAhRBgIQRYCAEWQoCFEGAhBFgIARZCgIUQYCEEWAgBFkL+/vsJMaYZbndMHJ7c7p441T+9k9yd2e/iRQ/POKexn8S57uvXT959N1jkP9pqZWKN/Dh+bvrHDDZYRpbr6kBxwk+fzXWs9L+s13/8+acxZrVa9X3fdd3Dw8PLywtmAFaIccYeHh5eX1+NMX3fP7+8XOoSUMNqsV69vLxYa4fDYTgMt9BnzQHWwMfcGDscBmvtcrlcrVZXXPjYQFijj3m1Wr2+vlpr7+7u7u7url4IWJ82a0KmD27WmpyT8kMBBB/zm5Dh39iAgPVJwVo+1oa1dhjmUPiYnWCt18+3sBw9sRlZPgC5fT8jQwgsjBDlAytrjRARSiGlrJS6rdknYO3Xhqenp/v7+4eHh6qqJJe3sT79MKyAGYtFq7SSIkvTNE3TNGutFGK9Xt/GCvVnrMC7uxNCdF3Xtu12u+26zlu7srZpGiHEbVQnP2MF3t3dYRi+f//+8vJys9lobfq+P5VkY8zXr1+rqqrrummabxHX7OobM0wOjcehY5qmwzCcEr0Qot/vhRCbzeb5+blt29vbW6XUcrmcw4r19MXYwKOT24XQ9/3Pnz+TfvVoGIbdbieE+Oeff1ar1Xa7XS6XwZYHc1ifD/wfBpaPMT+dXmmaJmMscMH6+fn5dBeMMV++fHl8fJRSCiEeHx9vbm5uLi/KZvHufmxgeSe3h8NwOndxd3e3XC5DBqxt2+12u9ls+r632mZZ', 'image/png'
        ];
        
        // Build an array of mock images based on the requested count
        const mockImages = [];
        for (let i = 0; i < count; i++) {
            // Use modulus to cycle through available templates if count > templates
            const index = i % mockImageTemplates.length;
            mockImages.push({
                imageBytes: mockImageTemplates[index],
                mimeType: 'image/png'
            });
        }
        
        return mockImages;
    }
    
    /**
     * Process a specific image generation style
     * @param {string} style - The desired style ('product', 'lifestyle', 'minimal', etc)
     * @param {string} prompt - The basic prompt
     * @returns {string} - Enhanced style-specific prompt
     */
    processStylePrompt(style, prompt) {
        switch (style.toLowerCase()) {
            case 'product':
                return `Professional product photography of ${prompt}. Studio lighting, clean background, commercial quality, showing product details clearly. No text or watermarks.`;
                
            case 'lifestyle':
                return `Lifestyle photography of ${prompt} in use in a natural setting. Soft natural lighting, shallow depth of field, showing the product in context. No text or people's faces.`;
                
            case 'minimal':
                return `Minimalist product image of ${prompt}. Pure white background, elegant composition, simple and clean aesthetic. Professional e-commerce style with perfect lighting.`;
                
            case 'creative':
                return `Creative product visualization of ${prompt}. Artistic composition, interesting perspective, visually striking, conceptual approach. Professional quality for marketing.`;
                
            default:
                return this.enhancePrompt(prompt, { style: 'realistic' });
        }
    }
    
    /**
     * Validates the API key by making a simple test request
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
window.GeminiTextToImageService = GeminiTextToImageService;
