// Google Gemini 2.0 API Integration
class GeminiService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`;
    }

    /**
     * Generates a product description using Google Gemini 2.0 API
     * @param {string} productName - The name of the product
     * @param {string} userPrompt - User input with product details
     * @param {string} tone - The tone of the description (professional, playful, concise)
     * @returns {Promise<string>} - The generated product description
     */
    async generateProductDescription(productName, userPrompt, tone) {
        // Construct the prompt for Gemini
        const fullPrompt = `
        你是一位專業的電商文案寫手。請根據以下資訊，為產品「${productName}」生成一段 ${tone} 風格的產品描述。

        使用者提供的資訊：
        ${userPrompt}

        要求:
        1. 請生成一段200字以內的吸引人、重點突出、適合放在電商網站的產品描述文字
        2. 避免過於重複的詞語
        3. 描述須包含產品特色、優勢、適用場景、材質/規格、使用感受等多方面內容
        4. 針對${tone}風格調整語氣和表達方式
        5. 文字須有良好的結構和段落分明，易於閱讀
        6. 直接給我描述文字就好，不要包含標題或前言
        `;

        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: fullPrompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 4096, // Increased for longer descriptions
                        topP: 0.95,
                        topK: 40
                    },
                    safetySettings: [
                        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
                    ]
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Gemini API Error Response:', errorData);
                throw new Error(`API 請求失敗，狀態碼：${response.status}. ${errorData.error?.message || ''}`);
            }

            const data = await response.json();
            
            // Extract the generated text
            if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
                return data.candidates[0].content.parts[0].text;
            } else if (data.promptFeedback && data.promptFeedback.blockReason) {
                // Handle content filtering
                console.error('Gemini Content Filtered:', data.promptFeedback);
                throw new Error(`內容因安全疑慮被阻擋 (${data.promptFeedback.blockReason})。請調整提示文字後再試。`);
            } else {
                console.error('Unexpected API Response Structure:', data);
                throw new Error('無法從 API 回應中解析生成的文字。');
            }
        } catch (error) {
            console.error('呼叫 Gemini API 時發生錯誤:', error);
            throw error;
        }
    }

    /**
     * Checks if the API key is valid by making a simple test request
     * @returns {Promise<boolean>} - Whether the API key is valid
     */
    async validateApiKey() {
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${this.apiKey}`);
            if (response.ok) {
                return true;
            }
            return false;
        } catch (error) {
            console.error('API Key validation error:', error);
            return false;
        }
    }
}

// Export the service
window.GeminiService = GeminiService;
