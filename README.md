# AI-Powered Product Description Generator

This project provides advanced AI-powered tools to help e-commerce sellers create professional product descriptions and images.

## Features

### 1. Text-Based Product Description Generation

Generate high-quality product descriptions by providing details about your product. The AI will create a concise, engaging description optimized for e-commerce.

### 2. Image-to-Text Product Description Generation

Upload a product image and let the AI analyze it to automatically generate a detailed product description that highlights key features and benefits.

### 3. AI Image Generation

Create professional product images from text prompts using Google's state-of-the-art Gemini 2.0 Flash Experimental model. This feature allows you to:

- Generate high-quality product images based on detailed text descriptions
- Choose from different image styles (product photography, lifestyle, minimalist, etc.)
- Select background styles and aspect ratios
- Get both an image and descriptive text in a single generation

Perfect for concept visualization, creating placeholder images, or generating professional product photos when physical products are not yet available.

## Installation

1. Clone this repository
2. Open `code.html` in a web browser
3. Set up your Google Gemini API key (obtainable from [Google AI Studio](https://aistudio.google.com/app/apikey))

## API Key Setup

You'll need a Google Gemini API key to use the AI features. The application will prompt you to enter this key when you first attempt to use an AI feature. You can also set it up in advance:

1. Click the "Set API Key" button when prompted
2. Enter your API key from Google AI Studio
3. Click "Save"

Your API key will be stored securely in your browser's local storage.

## Using Image-to-Text Feature

This feature leverages the power of Google's Gemini Pro Vision and Gemini 2.0 to analyze product images and generate detailed descriptions.

### How to use:

1. Upload a product image (or multiple images)
2. Click the "📝" button that appears on the image thumbnail
3. Optionally enter a product name for better context
4. Select the tone (Professional, Playful, or Concise)
5. Click "Generate Description"
6. Review the generated description and click "Use This Description" if satisfied

### Tips for best results:

- Use clear, well-lit images of your product
- Images with white or simple backgrounds work best
- Include multiple angles if possible
- Provide a product name for more specific descriptions
- Choose a tone that matches your brand personality

## Using Text-to-Image Feature

This feature leverages Google's Gemini 2.0 Flash Experimental model to generate high-quality product images from text descriptions.

### How to use:

1. Click the "AI 生成產品圖片" button (✨ AI Generate Product Image)
2. Enter a detailed description of the product you want to visualize
3. Choose image style (product photography, lifestyle, minimalist, artistic, or technical)
4. Select a background style (white, gradient, contextual, or studio)
5. Choose an aspect ratio for your image
6. Click "開始生成" (Start Generation)
7. Review the generated image and accompanying description
8. Click "使用此圖片" (Use This Image) to add it to your product gallery

### Tips for best results:

- Be specific and detailed in your product descriptions
- Include colors, materials, shapes, and features
- Specify the viewing angle or product positioning if needed
- Choose an image style that best fits your marketing approach
- Experiment with different aspect ratios for different platforms (social media, marketplace listings, etc.)
- Use the generated text as inspiration for your product description

## Technical Details

This project uses:

- **Google Gemini Pro** for text generation 
- **Google Gemini Pro Vision** for image analysis
- **Google Gemini 2.0 Flash Experimental** for image generation
- Pure JavaScript for frontend functionality
- Responsive design for all device sizes

### API Models Used:

- `gemini-1.5-pro`: For text-based product descriptions
- `gemini-pro-vision`: For image-to-text descriptions (fallback)
- `gemini-2.0-flash`: For enhanced image analysis
- `gemini-2.0-flash-exp-image-generation`: For text-to-image generation

## Configuration Options

### Description Generation Options:

- **Professional tone**: Clear, factual, emphasizing product features and quality
- **Playful tone**: Fun, engaging language with friendly appeal
- **Concise tone**: Direct, to-the-point descriptions focused on key benefits

### Image Generation Options:

- **Image styles**: Product photography, lifestyle, minimalist, artistic, technical
- **Background styles**: White, gradient, contextual, studio
- **Aspect ratios**: 1:1 (square), 4:3 (standard), 3:4 (portrait), 16:9 (widescreen), 9:16 (mobile)

### Character limits:

- Product descriptions are limited to 200 characters by default (configurable)

## Implementation Architecture

The application is built using a modular approach with dedicated service classes:

1. **GeminiService**: Handles text-based product description generation
2. **ImageToTextService**: Provides image analysis and description generation
3. **TextToImageService**: Manages the generation of images from text descriptions
4. **ApiKeyManager**: Handles API key storage and validation
5. **UI Components**: Separate UI handlers for each feature

## Troubleshooting

If you encounter issues:

1. **API errors**: Ensure your API key is valid and has sufficient quota
2. **Image analysis fails**: Try uploading a clearer image or one with better lighting
3. **Image generation issues**: Provide more detailed descriptions and try different styles
4. **Browser compatibility**: Use a modern browser like Chrome, Firefox, or Edge
5. **Local storage issues**: Enable cookies and local storage in your browser settings

## Future Enhancements

- Multi-language product description generation
- Product attribute extraction (size, color, material)
- Brand voice customization
- SEO optimization suggestions
- Batch processing of multiple products
- Integration with e-commerce platforms

## License

This project is available for personal and commercial use.
