/**
 * ImageToTextServiceV2 - Enhanced service for generating product descriptions from images using Google Gemini Pro 2.0
 * This service leverages the latest Gemini 2.0 API to analyze product images
 * and generate high-quality product descriptions with improved accuracy and detail.
 */
class ImageToTextServiceV2 {
    constructor(apiKey) {
        this.apiKey = apiKey;
        // API endpoints for various Gemini models
        this.apiUrlGemini2Flash = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        this.apiUrlGemini2Pro = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-pro:generateContent?key=${apiKey}`;
        this.apiUrlImageGeneration = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${apiKey}`;
        this.apiUrlFallback = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${apiKey}`;
    }

    /**
     * Generates a product description based on an image
     * @param {string} base64Image - Base64 encoded image data (without the data:image/xxx;base64, prefix)
     * @param {string} productName - Optional product name to guide the description
     * @param {Object} options - Additional options for the description generation
     * @returns {Promise<string>} - The generated product description
     */
    async generateDescriptionFromImage(base64Image, productName = '', options = {}) {
        // Default options
        const defaultOptions = {
            tone: 'professional', // professional, playful, concise
            maxLength: 200,       // maximum character length
            includeFeatures: true, // include product features
            includeMaterials: true, // include material description
            includeUseCases: true,  // include use cases
            model: 'gemini-2.0-flash' // default model
        };
        
        const config = { ...defaultOptions, ...options };
        
        // Ensure the image is properly formatted for the API
        const imageData = this.formatImageData(base64Image);
        
        // Build the prompt
        const prompt = this.buildPrompt(productName, config);
        
        try {
            // Select the appropriate API URL based on the model choice
            let apiUrl = this.apiUrlGemini2Flash;
            if (config.model === 'gemini-2.0-pro') {
                apiUrl = this.apiUrlGemini2Pro;
            }
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                { text: prompt },
                                {
                                    inlineData: {
                                        mimeType: 'image/jpeg', // or appropriate MIME type
                                        data: imageData
                                    }
                                }
                            ]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.4,
                        maxOutputTokens: 1024,
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
                // If Gemini 2.0 fails, try with the original vision model as fallback
                console.log('Gemini 2.0 API failed, trying with Pro Vision model as fallback...');
                return this.generateWithFallbackModel(prompt, imageData);
            }

            const data = await response.json();
            
            // Extract the generated text
            if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
                return data.candidates[0].content.parts[0].text;
            } else if (data.promptFeedback && data.promptFeedback.blockReason) {
                // Handle content filtering
                console.error('Gemini Content Filtered:', data.promptFeedback);
                throw new Error(`內容因安全疑慮被阻擋 (${data.promptFeedback.blockReason})。請嘗試使用不同的圖片。`);
            } else {
                console.error('Unexpected API Response Structure:', data);
                throw new Error('無法從 API 回應中解析生成的文字。');
            }
        } catch (error) {
            console.error('呼叫 Gemini Vision API 時發生錯誤:', error);
            throw error;
        }
    }
    
    /**
     * Fallback to Gemini Pro Vision model if Gemini 2.0 fails
     * @param {string} prompt - The text prompt
     * @param {string} imageData - Base64 encoded image data
     * @returns {Promise<string>} - The generated text
     */
    async generateWithFallbackModel(prompt, imageData) {
        try {
            const response = await fetch(this.apiUrlFallback, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                { text: prompt },
                                {
                                    inlineData: {
                                        mimeType: 'image/jpeg',
                                        data: imageData
                                    }
                                }
                            ]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.4,
                        maxOutputTokens: 1024,
                        topP: 0.95,
                        topK: 40
                    }
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error('Fallback model API error:', errorData);
                throw new Error(`API 請求失敗，狀態碼：${response.status}. ${errorData.error?.message || ''}`);
            }
            
            const data = await response.json();
            
            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                return data.candidates[0].content.parts[0].text;
            } else {
                throw new Error('無法從 API 回應中解析生成的文字。');
            }
        } catch (error) {
            console.error('使用備用模型時發生錯誤:', error);
            throw error;
        }
    }

    /**
     * Extracts image data from a base64 string, removing the data URL prefix if present
     * @param {string} base64Image - The base64 encoded image
     * @returns {string} - Clean base64 data without prefix
     */
    formatImageData(base64Image) {
        // If the image already has a data URL prefix, remove it
        if (base64Image.startsWith('data:')) {
            return base64Image.split(',')[1];
        }
        return base64Image;
    }

    /**
     * Builds a prompt for the image-to-text generation
     * @param {string} productName - Optional product name
     * @param {Object} options - Configuration options
     * @returns {string} - The formatted prompt
     */
    buildPrompt(productName, options) {
        let prompt = '請根據圖片為這個商品撰寫一段吸引人的電商商品描述。';
        
        if (productName) {
            prompt += `\n產品名稱：${productName}`;
        }
        
        prompt += `\n風格要求：${this.getToneDescription(options.tone)}`;
        prompt += `\n字數限制：${options.maxLength}字以內`;
        prompt += '\n\n請包含：';
        
        if (options.includeFeatures) {
            prompt += '\n- 產品主要特色與賣點';
        }
        
        if (options.includeMaterials) {
            prompt += '\n- 材質與質感描述（基於圖片判斷）';
        }
        
        if (options.includeUseCases) {
            prompt += '\n- 適用場景或使用情境';
        }
        
        prompt += '\n\n請直接給出描述文案，不要包含前言、標題或額外說明。以吸引消費者的方式描述產品，突出其特點和價值。';
        prompt += '\n如果圖片中的產品資訊不足，可以合理推測，但避免過度虛構。';
        
        return prompt;
    }

    /**
     * Gets a description for the requested tone
     * @param {string} tone - The tone style (professional, playful, concise)
     * @returns {string} - Description of the tone
     */
    getToneDescription(tone) {
        switch (tone.toLowerCase()) {
            case 'professional':
                return '專業清晰，強調產品特性與品質';
            case 'playful':
                return '活潑有趣，具親和力，使用生動語言';
            case 'concise':
                return '簡潔有力，直接突出重點，避免冗詞';
            default:
                return '專業清晰，強調產品特性與品質';
        }
    }

    /**
     * Extracts product attributes from an image
     * This can be used to get structured data about the product
     * @param {string} base64Image - Base64 encoded image data
     * @returns {Promise<Object>} - Extracted product attributes
     */
    async extractProductAttributes(base64Image) {
        const imageData = this.formatImageData(base64Image);
        
        const prompt = `
        請分析這張產品圖片，並提取以下資訊（如果圖片中可見）：
        1. 產品類別
        2. 顏色/配色
        3. 可能的材質
        4. 風格特點
        5. 可能的用途
        6. 尺寸或大小（如果可判斷）
        7. 品牌（如果可見）
        
        請以JSON格式回覆，格式如下：
        {
          "category": "產品類別",
          "color": "主要顏色",
          "material": "可能的材質",
          "style": "風格特點",
          "useCases": ["可能用途1", "可能用途2"],
          "size": "估計尺寸（如果可判斷）",
          "brand": "品牌名稱（如果可見）",
          "otherFeatures": ["其他特點1", "其他特點2"]
        }
        
        如果某項資訊在圖片中看不出來，請填寫"無法確定"。僅回覆JSON格式，不要有其他說明文字。`;
        
        try {
            const response = await fetch(this.apiUrlGemini2Flash, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                { text: prompt },
                                {
                                    inlineData: {
                                        mimeType: 'image/jpeg',
                                        data: imageData
                                    }
                                }
                            ]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.2,
                        maxOutputTokens: 1024
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`API 請求失敗，狀態碼：${response.status}`);
            }

            const data = await response.json();
            
            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                const text = data.candidates[0].content.parts[0].text;
                try {
                    // Extract the JSON part from the response
                    const jsonMatch = text.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        return JSON.parse(jsonMatch[0]);
                    }
                    throw new Error('無法解析JSON回應');
                } catch (parseError) {
                    console.error('解析JSON回應時出錯:', parseError, text);
                    throw new Error('無法解析產品屬性');
                }
            } else {
                throw new Error('無法從API回應中提取資訊');
            }
        } catch (error) {
            console.error('提取產品屬性時出錯:', error);
            throw error;
        }
    }

    /**
     * Generate image description with image editing capabilities using Gemini 2.0
     * This method can be used with the enhanced Gemini 2.0 API to generate image-aware text
     * that includes image editing instructions
     * 
     * @param {string} base64Image - Base64 encoded image data
     * @param {string} instruction - Specific instruction for image editing
     * @returns {Promise<Object>} - The generated description and edited image
     */
    async generateWithImageEditing(base64Image, instruction) {
        const imageData = this.formatImageData(base64Image);
        
        const prompt = `
        分析這張產品圖片，並根據以下指示處理：
        ${instruction}
        
        請提供：
        1. 對產品的詳細描述
        2. 根據指示調整後的圖片
        
        針對描述部分，請專注於產品的特點、優勢和使用場景。
        `;
        
        try {
            const response = await fetch(this.apiUrlImageGeneration, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                { text: prompt },
                                {
                                    inlineData: {
                                        mimeType: 'image/jpeg',
                                        data: imageData
                                    }
                                }
                            ]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.5,
                        maxOutputTokens: 2048
                    },
                    config: {
                        responseModalities: ["Text", "Image"]
                    }
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error('Image editing API error:', errorData);
                throw new Error(`API 請求失敗: ${errorData.error?.message || 'Unknown error'}`);
            }
            
            const data = await response.json();
            
            // Process the response that contains both text and image
            if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
                const parts = data.candidates[0].content.parts;
                
                // Look for text and image parts
                let textDescription = '';
                let generatedImageData = null;
                
                for (const part of parts) {
                    if (part.text) {
                        textDescription = part.text;
                    } else if (part.inlineData) {
                        generatedImageData = part.inlineData.data;
                    }
                }
                
                return {
                    description: textDescription,
                    imageData: generatedImageData,
                    success: true
                };
            } else {
                console.error('Unexpected API Response Structure:', data);
                throw new Error('無法從API回應中解析結果。');
            }
        } catch (error) {
            console.error('圖片編輯處理失敗:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Generate a completely new image based on the original image and text instructions
     * @param {string} base64Image - Base64 encoded image data
     * @param {string} textPrompt - Text instructions for the new image
     * @returns {Promise<Object>} - The generated image data
     */
    async generateNewImageFromImageAndText(base64Image, textPrompt) {
        const imageData = this.formatImageData(base64Image);
        
        try {
            const response = await fetch(this.apiUrlImageGeneration, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                { 
                                    text: `參考這張產品圖片，根據以下要求生成新的圖片：\n${textPrompt}\n\n請直接生成圖片，不需要額外的解釋文字。` 
                                },
                                {
                                    inlineData: {
                                        mimeType: 'image/jpeg',
                                        data: imageData
                                    }
                                }
                            ]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.8,
                        maxOutputTokens: 2048
                    },
                    config: {
                        responseModalities: ["Text", "Image"]
                    }
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error('Image generation API error:', errorData);
                throw new Error(`API 請求失敗: ${errorData.error?.message || 'Unknown error'}`);
            }
            
            const data = await response.json();
            
            // Process the response to extract the image
            if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
                const parts = data.candidates[0].content.parts;
                
                // Look for image part
                for (const part of parts) {
                    if (part.inlineData) {
                        return {
                            imageData: part.inlineData.data,
                            success: true
                        };
                    }
                }
                
                // If no image was found
                return {
                    success: false,
                    error: "未能生成圖片。模型僅返回了文字回應。"
                };
            } else {
                console.error('Unexpected API Response Structure:', data);
                throw new Error('無法從API回應中解析結果。');
            }
        } catch (error) {
            console.error('圖片生成失敗:', error);
            return {
                success: false,
                error: error.message
            };
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
window.ImageToTextServiceV2 = ImageToTextServiceV2;
