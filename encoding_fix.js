/**
 * 編碼問題修正腳本
 * 這個腳本用於修正可能的中文顯示亂碼問題
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('編碼修正腳本已載入');
    
    // 主要標籤和文字映射
    const chineseLabels = {
        // 頁面標題
        '新增商品': 'new-product-title',
        
        // 按鈕文字
        '儲存草稿': 'save-draft-btn',
        '預覽': 'preview-btn',
        '發佈商品': 'publish-btn',
        'AI 生成 200 字以內產品描述': 'ai-desc-btn',
        'AI 生成產品圖片': 'ai-image-btn',
        '開始生成': 'start-generate-btn',
        '使用此敘述': 'use-desc-btn',
        '使用此圖片': 'use-image-btn',
        '儲存為新圖片': 'save-image-btn',
        '儲存': 'save-btn',
        
        // 欄位標籤
        '商品資訊': 'product-info-title',
        '商品名稱': 'product-name-label',
        '商品描述': 'product-desc-label',
        '價格': 'price-label',
        '庫存': 'stock-label',
        '商品圖片': 'product-image-title',
        '上傳圖片 (可多選)': 'upload-image-label',
        '分類與標籤': 'category-tags-title',
        '商品分類': 'product-category-label',
        '商品標籤 (逗號分隔)': 'product-tags-label',
        
        // 彈窗內容
        'AI 產品敘述生成器 (200字以內)': 'ai-desc-modal-title',
        '請描述你的產品，提供越多細節越好 (例如：特色、材質、功能、目標客群)': 'ai-desc-prompt',
        '語氣風格': 'tone-style-label',
        '專業': 'professional-option',
        '活潑': 'playful-option',
        '簡潔': 'concise-option',
        'AI 生成的結果將顯示於此': 'ai-result-placeholder',
        
        // 圖片生成彈窗
        'AI 產品圖片生成器': 'ai-image-modal-title',
        '請描述您想要生成的產品圖片，提供越多細節越好': 'image-prompt-desc',
        '長寬比': 'aspect-ratio-label',
        '正方形': 'square-ratio',
        '標準': 'standard-ratio',
        '直式': 'portrait-ratio',
        '寬屏': 'widescreen-ratio',
        '手機屏幕': 'mobile-ratio',
        '生成的圖片將顯示於此': 'image-result-placeholder',
        
        // 圖片編輯彈窗
        'AI 商品照編輯': 'ai-image-edit-title',
        '預覽': 'preview-label',
        '自動去背 (已模擬完成)': 'auto-bg-removal',
        '選擇背景': 'choose-bg-label',
        '純白': 'white-bg',
        '淺灰': 'light-gray-bg',
        '淺藍': 'light-blue-bg',
        '場景1': 'scene1-bg',
        '場景2': 'scene2-bg',
        '透明': 'transparent-bg',
        
        // API KEY 彈窗
        '設定 Google Gemini API Key': 'api-key-modal-title',
        '請輸入您的 Google Gemini API Key 以使用 AI 功能': 'api-key-prompt',
        '您可以從 Google AI Studio 獲取免費的 API Key': 'api-key-help',
        'API Key': 'api-key-label',
        
        // 錯誤訊息
        '請先輸入產品描述提示！': 'empty-desc-prompt-error',
        '錯誤：尚未設定 Gemini API Key！請點擊「設定 API Key」按鈕': 'missing-api-key-error',
        'AI 正在生成200字以內的產品敘述，請稍候...': 'generating-desc-message',
        '生成描述時發生錯誤': 'desc-generation-error',
        '您的 API Key 可能無效或已過期': 'invalid-api-key-message',
        '更新 API Key': 'update-api-key-btn',
        '請先輸入產品圖片描述！': 'empty-image-prompt-error',
        'AI 正在生成產品圖片，請稍候...': 'generating-image-message',
        '未能生成圖片，請嘗試不同的描述或稍後再試': 'image-generation-failed',
        '生成圖片時發生錯誤': 'image-generation-error'
    };
    
    // 找出包含特定文字的元素
    function findElementsWithText(text) {
        const elements = [];
        
        // 遍歷所有文字節點
        const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
        let node;
        
        while(node = walk.nextNode()) {
            if (node.nodeValue.includes(text)) {
                elements.push(node.parentNode);
            }
        }
        
        // 針對特定元素類型檢查
        // 按鈕文字
        document.querySelectorAll('button').forEach(btn => {
            if (btn.innerText.includes(text)) {
                elements.push(btn);
            }
        });
        
        // 標籤文字
        document.querySelectorAll('label').forEach(label => {
            if (label.innerText.includes(text)) {
                elements.push(label);
            }
        });
        
        // 選項文字
        document.querySelectorAll('option').forEach(option => {
            if (option.innerText.includes(text)) {
                elements.push(option);
            }
        });
        
        return elements;
    }
    
    // 修復已知標籤
    function fixKnownLabels() {
        // 特殊處理一些固定ID的元素
        const idMappings = {
            'product-name-label': '商品名稱',
            'product-description-label': '商品描述',
            'product-price-label': '價格',
            'product-stock-label': '庫存',
            'product-images-label': '上傳圖片 (可多選)',
            'product-category-label': '商品分類',
            'product-tags-label': '商品標籤 (逗號分隔)',
            'ai-tone-label': '語氣風格',
            'aspect-ratio-label': '長寬比'
        };
        
        // 直接設置有ID的元素
        for (const [id, text] of Object.entries(idMappings)) {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = text;
            }
        }
        
        // 修復按鈕文字
        document.getElementById('ai-desc-button').innerHTML = 
            '<span class="icon">✨</span> AI 生成 200 字以內產品描述';
        
        document.getElementById('ai-image-generate-button').innerHTML = 
            '<span class="icon">✨</span> AI 生成產品圖片';
            
        document.getElementById('generate-desc-button').textContent = '開始生成';
        document.getElementById('use-desc-button').textContent = '使用此敘述';
        document.getElementById('generate-images-button').textContent = '開始生成';
        document.getElementById('use-image-button').textContent = '使用此圖片';
        document.getElementById('save-image-button').textContent = '儲存為新圖片';
        
        // 修復下拉選單選項
        const fixSelectOptions = (selectId, optionsMap) => {
            const select = document.getElementById(selectId);
            if (select) {
                Array.from(select.options).forEach((option, index) => {
                    if (optionsMap[index]) {
                        option.textContent = optionsMap[index];
                    }
                });
            }
        };
        
        // 修復語氣風格選項
        fixSelectOptions('ai-tone', {
            0: '專業',
            1: '活潑',
            2: '簡潔'
        });
        
        // 修復長寬比選項
        fixSelectOptions('aspect-ratio', {
            0: '1:1 (正方形)',
            1: '4:3 (標準)',
            2: '3:4 (直式)',
            3: '16:9 (寬屏)',
            4: '9:16 (手機屏幕)'
        });
        
        // 修復標題和段落
        document.querySelector('h1').innerHTML = '<span class="icon">📦</span> 新增商品';
        
        // 修復模態視窗標題和內容
        const modalTitles = {
            'ai-desc-modal': 'AI 產品敘述生成器 (200字以內)',
            'ai-image-modal': 'AI 商品照編輯',
            'image-generate-modal': 'AI 產品圖片生成器',
            'api-key-modal': '設定 Google Gemini API Key'
        };
        
        for (const [modalId, title] of Object.entries(modalTitles)) {
            const modal = document.getElementById(modalId);
            if (modal) {
                const titleElement = modal.querySelector('h2');
                if (titleElement) {
                    if (title.includes('✨')) {
                        titleElement.innerHTML = `<span class="icon">✨</span> ${title.replace('✨', '')}`;
                    } else if (title.includes('🪄')) {
                        titleElement.innerHTML = `<span class="icon">🪄</span> ${title.replace('🪄', '')}`;
                    } else if (title.includes('🔑')) {
                        titleElement.innerHTML = `<span class="icon">🔑</span> ${title.replace('🔑', '')}`;
                    } else {
                        titleElement.textContent = title;
                    }
                }
            }
        }
        
        // 修復佔位文字
        document.querySelectorAll('.placeholder').forEach(placeholder => {
            if (placeholder.parentNode.id === 'ai-result-area') {
                placeholder.textContent = 'AI 生成的結果將顯示於此...';
            } else if (placeholder.parentNode.id === 'image-results-area') {
                placeholder.textContent = '生成的圖片將顯示於此...';
            }
        });
    }
    
    // 修復錯誤訊息生成函數
    window.generateErrorMessage = function(errorType) {
        const errorMessages = {
            'empty-desc-prompt': '請先輸入產品描述提示！',
            'missing-api-key': '錯誤：尚未設定 Gemini API Key！請點擊「設定 API Key」按鈕。',
            'generating-desc': 'AI 正在生成200字以內的產品敘述，請稍候...',
            'desc-generation-error': '生成描述時發生錯誤：',
            'invalid-api-key': '您的 API Key 可能無效或已過期。',
            'update-api-key': '更新 API Key',
            'empty-image-prompt': '請先輸入產品圖片描述！',
            'generating-image': 'AI 正在生成產品圖片，請稍候...',
            'image-generation-failed': '未能生成圖片，請嘗試不同的描述或稍後再試。',
            'image-generation-error': '生成圖片時發生錯誤：'
        };
        
        return errorMessages[errorType] || '發生錯誤';
    };
    
    // 覆蓋原始錯誤訊息生成函數
    const originalGeminiService = window.GeminiService;
    if (originalGeminiService) {
        const originalGenerateProductDescription = originalGeminiService.prototype.generateProductDescription;
        
        if (originalGenerateProductDescription) {
            originalGeminiService.prototype.generateProductDescription = async function(productName, userPrompt, tone) {
                try {
                    return await originalGenerateProductDescription.call(this, productName, userPrompt, tone);
                } catch (error) {
                    console.error('原始錯誤:', error);
                    // 轉換錯誤訊息
                    if (error.message.includes('API Key')) {
                        throw new Error(window.generateErrorMessage('invalid-api-key'));
                    } else {
                        throw new Error(window.generateErrorMessage('desc-generation-error') + error.message);
                    }
                }
            };
        }
    }
    
    // 監聽 DOM 變化，修復動態生成的元素
    const observer = new MutationObserver(mutations => {
        for (const mutation of mutations) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                // 處理新增的節點
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // 檢查是否有錯誤訊息
                        if (node.textContent && (
                            node.textContent.includes('錯誤') || 
                            node.textContent.includes('生成') ||
                            node.textContent.includes('請先輸入')
                        )) {
                            for (const [chinese, identifier] of Object.entries(chineseLabels)) {
                                if (node.textContent.includes(chinese)) {
                                    node.setAttribute('data-fixed-text', 'true');
                                    break;
                                }
                            }
                        }
                    }
                }
            }
        }
    });
    
    // 啟動觀察器
    observer.observe(document.body, { childList: true, subtree: true });
    
    // 立即修復已知標籤
    fixKnownLabels();
    
    // 提供全局方法以手動觸發修復
    window.fixChineseLabels = fixKnownLabels;
    
    console.log('編碼修正腳本完成初始化');
});
