// Gemini 2.0 Image Generation Service
class GeminiImageService {
    constructor() {
        this.apiKey = localStorage.getItem('gemini_api_key');
        this.model = 'gemini-2.0-flash-exp-image-generation';
    }

    async generateImage(prompt, style, background, aspectRatio) {
        if (!this.apiKey) {
            throw new Error('API key not found. Please set your Gemini API key first.');
        }

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: this._buildPrompt(prompt, style, background, aspectRatio)
                        }]
                    }],
                    generationConfig: {
                        responseModalities: ["Text", "Image"]
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API request failed with status ${response.status}: ${errorData.error?.message || 'Unknown error'}`);
            }

            const data = await response.json();
            return this._processResponse(data);
        } catch (error) {
            console.error('Error generating image:', error);
            throw error;
        }
    }

    _buildPrompt(prompt, style, background, aspectRatio) {
        return `Generate a product image with the following specifications:
        - Description: ${prompt}
        - Style: ${style}
        - Background: ${background}
        - Aspect Ratio: ${aspectRatio}
        
        Please create a high-quality, professional product image that matches these requirements.`;
    }

    _processResponse(data) {
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            throw new Error('Invalid response format from API');
        }

        const parts = data.candidates[0].content.parts;
        const result = {
            text: '',
            imageData: null
        };

        for (const part of parts) {
            if (part.text) {
                result.text = part.text;
            } else if (part.inlineData) {
                result.imageData = part.inlineData.data;
            }
        }

        return result;
    }
}

// Initialize the service
const geminiImageService = new GeminiImageService();

// Export the service
window.geminiImageService = geminiImageService; 