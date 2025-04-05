// Google Gemini 2.0 Flash Experimental Image Generation Service
class GeminiImageService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${apiKey}`;
    }

    /**
     * Generates an image using Google Gemini 2.0 Flash Experimental
     * @param {string} prompt - The text prompt for image generation
     * @returns {Promise<{text: string, imageData: string}>} - The generated text and image data
     */
    async generateImage(prompt) {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 4096,
                        topP: 0.95,
                        topK: 40
                    },
                    responseModalities: ["Text", "Image"],
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
                throw new Error(`API request failed with status: ${response.status}. ${errorData.error?.message || ''}`);
            }

            const data = await response.json();
            
            if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts) {
                throw new Error('Invalid API response structure');
            }

            let result = {
                text: '',
                imageData: null
            };

            for (const part of data.candidates[0].content.parts) {
                if (part.text) {
                    result.text = part.text;
                } else if (part.inlineData) {
                    result.imageData = part.inlineData.data;
                }
            }

            return result;
        } catch (error) {
            console.error('Error calling Gemini API:', error);
            throw error;
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
window.GeminiImageService = GeminiImageService; 