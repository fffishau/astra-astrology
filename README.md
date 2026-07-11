# ASTRA 精準星盤解讀

ASTRA 是繁體中文西洋占星工具。使用者輸入出生日期、精確至分鐘的出生時間、全球出生地與自己的 DeepSeek API Key，即可生成熱帶黃道／Placidus 本命盤，並取得中立、白話的 AI 統整解讀。

## 功能

- 全球出生地搜尋、經緯度與 IANA 時區判定
- 依出生日期套用歷史時區與夏令時間
- Swiss Ephemeris WebAssembly 行星位置與 Placidus 宮位
- 太陽、月亮、上升、行星、宮位與主要相位
- 財運、副業、工作、事業、感情與姻緣提問
- 性別選填；不以男性視角或傳統婚姻角色判定吉凶
- 使用者自帶 DeepSeek API Key，不寫入 Local Storage 或資料庫

## 安全提醒

- `.env` 已被 Git 忽略，不得提交任何真實 API Key。
- 使用者輸入的 Key 會經由本站後端轉送到 DeepSeek，只存在於該次請求記憶體中。
- 正式部署務必使用 HTTPS，並關閉會記錄 request body 的代理／應用程式日誌。
- 公開服務建議加入速率限制、請求大小限制與隱私權政策。
- 所有占星文字均為 AI 統整生成，只供自我探索與娛樂參考。

## 本機啟動

需求：Node.js 22.13 或更新版本。

```bash
npm install
npm run dev
```

Windows PowerShell 若無法執行 `npm.ps1`，可使用 `npm.cmd install`；目前專案腳本使用 POSIX 環境變數語法，建議從 Git Bash 執行。

## 上傳 GitHub

建立空白 GitHub repository 後：

```bash
git add .
git commit -m "Initial ASTRA astrology app"
git branch -M main
git remote add origin https://github.com/YOUR_ACCOUNT/YOUR_REPOSITORY.git
git push -u origin main
```

上傳前請用 `git status` 確認 `.env` 沒有出現在待提交清單。

## 部署說明

GitHub Pages 只支援靜態檔案，無法執行 `/api/geocode` 與 `/api/interpret`，因此不能直接部署完整功能。請選擇支援 Node.js、Serverless 或 Cloudflare Workers 的平台，例如 OpenAI Sites、Vercel、Netlify，或阿里雲／騰訊雲的 Node.js 容器。

若部署至一般 Node.js 平台，建議建立平台專用分支，將目前 vinext 建置流程調整成該平台支援的標準 Next.js 啟動方式。

## 資料來源

- 地點搜尋：OpenStreetMap Nominatim
- 天文計算：Swiss Ephemeris WebAssembly
- 時區座標：tz-lookup／IANA Time Zone
- AI 解讀：DeepSeek API（由使用者提供 Key）

