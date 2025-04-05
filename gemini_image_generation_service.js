// Google Gemini 2.0 Flash Experimental Image Generation Service
class GeminiImageGenerationService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${apiKey}`;
    }

    /**
     * Generates an image using Gemini 2.0 Flash Experimental
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
                        topK: 40,
                        responseModalities: ["Text", "Image"]
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
                throw new Error(`API request failed with status: ${response.status}. ${errorData.error?.message || ''}`);
            }

            const data = await response.json();
            
            if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
                let generatedText = '';
                let imageData = null;

                for (const part of data.candidates[0].content.parts) {
                    if (part.text) {
                        generatedText = part.text;
                    } else if (part.inlineData) {
                        imageData = part.inlineData.data;
                    }
                }

                return {
                    text: generatedText,
                    imageData: imageData
                };
            } else if (data.promptFeedback && data.promptFeedback.blockReason) {
                console.error('Gemini Content Filtered:', data.promptFeedback);
                throw new Error(`Content was blocked due to safety concerns (${data.promptFeedback.blockReason}). Please adjust your prompt and try again.`);
            } else {
                console.error('Unexpected API Response Structure:', data);
                throw new Error('Could not parse the generated content from the API response.');
            }
        } catch (error) {
            console.error('Error calling Gemini API:', error);
            throw error;
        }
    }

    /**
     * Saves the generated image to a file
     * @param {string} imageData - Base64 encoded image data
     * @param {string} filename - The name of the file to save
     */
    saveImageToFile(imageData, filename) {
        try {
            const link = document.createElement('a');
            link.href = `data:image/png;base64,${imageData}`;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error saving image:', error);
            throw error;
        }
    }
}

// Export the service
window.GeminiImageGenerationService = GeminiImageGenerationService; 