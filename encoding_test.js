// 編碼測試文件
// 此文件包含中文字符測試

/**
 * 顯示中文測試消息
 */
function showChineseMessage() {
    console.log("測試中文顯示");
    console.log("這是一個編碼測試");
    
    // 測試一些常用中文詞語
    const labels = {
        product: "商品",
        category: "分類",
        price: "價格",
        stock: "庫存",
        description: "描述",
        upload: "上傳",
        generate: "生成",
        save: "儲存",
        preview: "預覽",
        aspectRatio: "長寬比"
    };
    
    console.log("測試標籤物件:", labels);
    
    // 在頁面上添加測試元素
    document.addEventListener('DOMContentLoaded', () => {
        const testDiv = document.createElement('div');
        testDiv.style.padding = '10px';
        testDiv.style.margin = '10px';
        testDiv.style.border = '1px solid #ccc';
        testDiv.style.borderRadius = '4px';
        testDiv.style.backgroundColor = '#f8f9fa';
        
        testDiv.innerHTML = `
            <h3>編碼測試</h3>
            <p>這是一個測試中文字符編碼的元素</p>
            <ul>
                ${Object.entries(labels).map(([key, value]) => `<li>${key}: ${value}</li>`).join('')}
            </ul>
        `;
        
        // 添加到頁面底部
        document.body.appendChild(testDiv);
    });
}

// 執行測試
showChineseMessage();
