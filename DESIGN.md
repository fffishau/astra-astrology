# ASTRA Design System

## Direction

Apple／Linear 的操作秩序，融合高級天文館的沉浸氣氛。產品介面以清楚、可信與容易完成任務為先；神祕感來自近黑空間、精密星盤線條與克制的紫橙光點，而不是裝飾性星空。

## Color

- Background: `oklch(0.09 0 0)`
- Surface: `oklch(0.15 0.012 270)`
- Raised surface: `oklch(0.19 0.018 270)`
- Ink: `oklch(0.96 0.006 270)`
- Muted ink: `oklch(0.70 0.02 270)`
- Primary: `#3A0CA3`
- Accent: `#FB8500`
- Success: `oklch(0.72 0.14 155)`
- Error: `oklch(0.64 0.20 25)`

紫色負責主選取、星盤結構與焦點；橙色只用於主要行動、關鍵星體與強調提示。不可使用滿版紫橙漸層或霓虹光污染。

## Typography

介面與資料使用 Geist／系統無襯線字；ASTRA 品牌字與少量結果標題使用高對比襯線字。正文最小 16px，數值使用等寬數字。初學者用語優先，專業術語附白話說明。

## Layout

桌面為輸入、星盤、解讀三區；星盤為視覺核心。手機依工作流程排列：出生資料、星盤摘要、提問與解讀、專業資料。使用 4px 基礎間距系統，避免巢狀卡片與過度圓角。

## Components and states

所有按鈕、輸入、選項具 default、hover、focus-visible、active、disabled、loading、error、success 狀態。觸控目標至少 44px。結果載入不隱藏既有資訊；錯誤訊息說明原因與修正方式。

## Motion

動效只表達狀態：星盤完成時計算線條淡入、結果區交叉淡入、按鈕按壓回饋。持續 150–250ms，支援 `prefers-reduced-motion`。

