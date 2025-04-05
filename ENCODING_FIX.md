# 中文字元編碼問題修復說明

## 問題描述

在電商平台 AI 工具的界面中，某些中文標籤和文字可能會顯示為亂碼，如 `�𣑐 �啣����`。這是由於字元編碼不一致造成的問題，通常發生在以下情況：

1. 不同編碼格式的檔案互相交互時
2. 檔案保存時使用的編碼與瀏覽器預期的不符
3. JavaScript 在處理特殊字元時的編碼轉換問題

## 解決方案

我們提供了一個專門的 `encoding_fix.js` 腳本來解決這個問題。這個腳本採用以下策略：

1. **手動重寫關鍵標籤**：腳本直接使用 JavaScript 重寫頁面中的所有中文標籤文字
2. **監控動態生成的內容**：使用 MutationObserver 監控新生成的 DOM 元素，確保動態添加的中文內容也能正確顯示
3. **覆蓋錯誤訊息生成函數**：確保由 JavaScript 生成的錯誤訊息使用正確的中文字符

## 如何使用

1. 確保 `encoding_fix.js` 腳本在頁面的所有其他腳本之前載入：

```html
<script src="encoding_fix.js"></script>
<!-- 其他腳本 -->
```

2. 如果仍然有問題，可以在瀏覽器控制台中手動觸發修復：

```javascript
window.fixChineseLabels();
```

3. 如需測試中文字符顯示是否正常，可以使用 `encoding_test.html` 頁面

## 其他建議

1. **確保檔案使用 UTF-8 編碼儲存**：所有 HTML、CSS 和 JavaScript 檔案都應該使用 UTF-8 編碼
2. **檢查伺服器響應頭**：確保伺服器設置了正確的 `Content-Type` 頭，包含 `charset=UTF-8`
3. **檢查 HTML 文件頭**：確保 HTML 文件包含 `<meta charset="UTF-8">`
4. **避免混合使用編碼**：不要在同一個專案中混合使用不同的編碼方式

## 進一步的字元編碼問題排除

如果問題依然存在，可以嘗試以下方法：

1. 使用 `encodeURIComponent` 和 `decodeURIComponent` 處理中文字符
2. 將中文字符轉換為 Unicode 轉義序列（如 `\u4F60\u597D` 代表「你好」）
3. 使用 Base64 編碼傳輸包含中文的數據
4. 使用專業的字符編碼庫，如 iconv-lite

## 測試

修復後，您可以使用 `encoding_test.html` 頁面來測試不同情境下的中文字符顯示是否正常。這個測試頁面包含靜態 HTML、JavaScript 生成的文字、表單元素和動態載入內容的測試。

如果您發現仍有特定元素顯示亂碼，請收集以下信息並聯繫開發者：

1. 亂碼出現的確切位置和上下文
2. 使用的瀏覽器和版本
3. 操作系統和語言設置
4. 控制台中的任何錯誤訊息

## 参考文獻

- [MDN Web Docs: Unicode](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types#Unicode)
- [W3C: Character encodings](https://www.w3.org/International/questions/qa-what-is-encoding)
- [HTML5 character encodings](https://html.spec.whatwg.org/multipage/parsing.html#character-encodings)
