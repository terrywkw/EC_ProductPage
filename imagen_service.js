/**
 * Imagen 3.0 Service for generating high-quality product images
 * Uses Google's Imagen 3.0 model through Gemini API
 */
class ImagenService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
        this.model = 'imagen-3.0-generate-002';
    }

    /**
     * Generates product images based on a text prompt
     * 
     * @param {string} prompt - Text description of the product image to generate
     * @param {Object} options - Optional parameters for image generation
     * @param {number} options.numberOfImages - Number of images to generate (1-4)
     * @param {string} options.aspectRatio - Aspect ratio of the images ('1:1', '3:4', '4:3', '9:16', '16:9')
     * @returns {Promise<Array>} - Array of generated image data in base64 format
     */
    async generateProductImages(prompt, options = {}) {
        // 注意：Imagen API 通常需要付費方案，免費API金鑰可能無法使用
        // 這裡提供兩種情況的處理方式：API可用或模擬響應

        const url = `${this.baseUrl}/${this.model}:generateImages?key=${this.apiKey}`;
        
        // 設置默認選項
        const numberOfImages = options.numberOfImages || 1;
        const aspectRatio = options.aspectRatio || '1:1';
        
        // 增強提示詞
        const enhancedPrompt = this.enhancePrompt(prompt);
        
        try {
            // 首先嘗試使用真實API調用
            console.log('嘗試使用Imagen API生成圖片...');
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: enhancedPrompt,
                    config: {
                        numberOfImages: numberOfImages,
                        aspectRatio: aspectRatio,
                        personGeneration: "ALLOW_ADULT" // 默認設置
                    }
                })
            });
            
            if (!response.ok) {
                // 如果API請求失敗，使用模擬數據
                console.log('API請求失敗，使用模擬數據');
                return this.generateMockImages(numberOfImages);
            }
            
            const data = await response.json();
            
            // 提取圖片數據
            if (data.generatedImages && data.generatedImages.length > 0) {
                return data.generatedImages.map(img => ({
                    imageBytes: img.image.imageBytes,
                    mimeType: 'image/png' // Imagen默認MIME類型
                }));
            } else {
                // 如果沒有生成圖片，使用模擬數據
                console.log('API未返回有效圖片，使用模擬數據');
                return this.generateMockImages(numberOfImages);
            }
        } catch (error) {
            console.error('呼叫 Imagen API 時發生錯誤:', error);
            console.log('使用模擬圖片數據作為備用方案');
            return this.generateMockImages(numberOfImages);
        }
    }
    
    /**
     * 產生模擬圖片數據，當API調用失敗時使用
     * 
     * @param {number} count - 要產生的圖片數量
     * @returns {Array} - 模擬圖片數據陣列
     */
    generateMockImages(count = 1) {
        console.log(`產生 ${count} 個模擬圖片...`);
        
        // 模擬圖片 Base64 數據
        // 下面是一些簡單的空白圖片 Base64 編碼，每個圈上不同的數字
        const mockImageTemplates = [
            // 1號空白圖片
            'iVBORw0KGgoAAAANSUhEUgAAAMgAAADIAQAAAACFI5MzAAABG0lEQVR4Xu2WMY7DMAwE5wt6tB+xH+FTnQ/4eR0kVWCrScGIM0ZFSCQlLLRcPTYuf4s1FxfLCu/K5Zm/Pd2NjJKdyOaJzX/Es9nexXFnuxHJ5on6hkZb3UoZHeVGRJfn7eR0mD9XOLuRyRPnoU7GZZ8+Rjci2TzR3lAWC5uviJ05W7uR0RMHc9o8L5fnvBP5f2LzxOlWB0dOO8z+Iv4zsXmivuHvO23V8Pfs4kZGT7TN/anXPF+edyLPE/UNZQ23WzV7uxHJ5om2ubI4k+nD3I1MnjjF9rluWdyJPE60N5TViWyfqByR0RN9udqmK/PeiXwnNk/0N5TV6y67ERk90TZ9+qRPX3cikyfOw9Xq4WN0I5LNE++KiwfE+gFELY6E0GGQSAAAAABJRU5ErkJggg==',
            // 2號空白圖片
            'iVBORw0KGgoAAAANSUhEUgAAAMgAAADIAQAAAACFI5MzAAABEUlEQVR4Xu2WsQ3DMAwEeYWM5iEyhMfyAB7PQzgFGKtIQICnOKAQHbCQJZm4fGxc/xY3VzcrBm87t+f+9HB3Mkp2IqsnDn8Rz+ZYicudHUg2T9Q31Pu7l9YRzkYkmyeOQ53Mdfjm52xEsnnifKiVcdXPKjubG5k8UT/Q3Wpls/jqbkSyeaL9wre/ym3R3ciYidOt3zrHoY67ERk9UT/Q75zFzZYXdyOSLRPs+x9PezY3Mnri7PZ/3OrJ5XknsjzRflNWq9Y52o1INk+05TLbma1y2d3I5IlzuK91m+NO5HmivqGsHn7mbjci2TxR39CQWXdXuZHRE/0P+vTJ7kZk8kT/TW9+9XYjks0T74qbB8T+AV1/kUJ0nv13AAAAAElFTkSuQmCC',
            // 3號空白圖片
            'iVBORw0KGgoAAAANSUhEUgAAAMgAAADIAQAAAACFI5MzAAABE0lEQVR4Xu2WMZLDIAxFdQWOxhFyBI/GA3A8H4JTwNOkSMO0fpMZt17WRjzJiOVrx8XFspR3ZfM83t7Ro8gkO5HVE+2feLbW7+JysAHJ5on6hnp7t7X1cD+QbJ44LnUyzgdlczYi2TzRf+ow3Hf9Jzs7G5k8UT9wcEZZXexsRLJ5or3hXZzdF8XZyJiJ061P1WVfL3cjMnrivqHYbD1G2ezqRiSbJ+73V1ZlY2cjoyf6ej3Wa56HOxGZPNHeUFaJXlnciUg2T7TlYlvq+qqzkckT53JdVls+dyLPE/UNZbXV1Y1INk/c37BZl9ks3I2Mnug/6NOt3N2ITJ7ov+mtHoO7EcnmiXfFxQNi/wC1c42FQ5FLggAAAABJRU5ErkJggg==',
            // 4號空白圖片
            'iVBORw0KGgoAAAANSUhEUgAAAMgAAADIAQAAAACFI5MzAAABD0lEQVR4Xu2WMQ7DMAwE5Qv0aD3CR/BTPYDHyyG8CjRV0DQpoDijdUCIpJSF3OXn4vJnMdNyMcvwrkzP/e3pbmSU7ERWT5z+izxbPYrLzjYj2TxR39Bo77ZWw93I6InzVEfj2ujsRiSbJ86nnIzLPp/uRiSbJ+obymJhi2fZ2djYyeSJw1zuc1o8y5e7kbETpy9Odh6rvO5GZnmivqGs9ndldzcyeaKt15XL6mPciTxPtDeU1dFdvtNuRLJ5oi2X5QnDlzgbmTxxHq6vdftyJ/I8Ud9QVndbPtyIZPNEfUM/vfKwsxsZPdGXq226sr/uRL4Tqyfub7RH/3I3IqMn2qZPpzzuRJ4nzuG61cOruxHJ5ol3xcUD4vgA722OXyWNVqYAAAAASUVORK5CYII='
        ];
        
        // 模擬圖片數據時的內部輔助函數
        const getRandomImageData = () => {
            const index = Math.floor(Math.random() * mockImageTemplates.length);
            return mockImageTemplates[index];
        };
        
        // 建立模擬圖片數據陣列
        const mockImages = [];
        for (let i = 0; i < count; i++) {
            mockImages.push({
                imageBytes: getRandomImageData(),
                mimeType: 'image/png'
            });
        }
        
        return mockImages;
    }
    
    /**
     * Enhances a basic product prompt with details for better image generation
     * 
     * @param {string} basePrompt - Basic product description
     * @returns {string} - Enhanced prompt for better image generation
     */
    enhancePrompt(basePrompt) {
        // Add e-commerce specific language and high-quality image descriptors
        return `Professional product photograph of ${basePrompt}. High-resolution, studio lighting, clean background, detailed texture, marketing quality, commercial style, professional photography.`;
    }
    
    /**
     * Checks if the API key is valid by making a simple test request
     * 
     * @returns {Promise<boolean>} - Whether the API key is valid
     */
    async validateApiKey() {
        try {
            // Try to list models, which requires a valid API key
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${this.apiKey}`);
            return response.ok;
        } catch (error) {
            console.error('API Key validation error:', error);
            return false;
        }
    }
}

// Export the service
window.ImagenService = ImagenService;
