# OpenClaw IM Bridge 🌉

[English](README.md) | 繁體中文

一個輕量級、與宿主無關（Host-Agnostic）的橋接器，專門用來將您本地的 [OpenClaw](https://github.com/openclaw/openclaw) Gateway 連接至即時通訊平台（例如 Telegram）。

這項工具將 **互動式授權（Interactive Approvals）** 與 **系統監控** 直接帶到您的手機上。每當您的 AI 代理（Gemini / Claude）需要執行危險的終端機指令時，您不再需要打開網頁版儀表板，而是會立即在通訊軟體收到推播，並附帶 `[✅ 允許執行]` 與 `[❌ 拒絕]` 的按鈕。

---

## ✨ 核心功能

- **互動式執行審批**：在 Telegram 中透過內聯按鈕（Inline Buttons）直接允許或拒絕 AI 代理發起的 shell 指令。
- **即時狀態儀表板**：發送 `/sysinfo`，獲取排版精美的 Markdown 報告，包含宿主機的 CPU、記憶體與開機時間。
- **橋接器健康檢查**：發送 `/status`，隨時確認與 OpenClaw Gateway 的 WebSocket 連線狀態及待處理任務。
- **零配置無痛整合**：與 OpenClaw 平行運行。不需要修改您現有的 Agent 提示詞或任何外掛設定。
- **自我修復機制**：如果與 Gateway 的連線中斷，橋接器會自動嘗試重新連線。

---

## 💡 為什麼選擇此專案？

市面上多數的 LLM 機器人會要求您換用他們的框架，而 **OpenClaw IM Bridge** 走的是不同的路線：
- **無痛整合（Non-Intrusive）**：它在您現有的 OpenClaw 旁平行運作，不需要修改任何 Agent 提示詞或核心設定檔。
- **手機優先的安全管理**：當 Agent 要求執行危險指令時，直接在手機點擊按鈕，比回電腦打開網頁儀表板更直覺、更安全。
- **輕量化微服務架構**：純粹透過 WebSocket RPC 通訊，架構乾淨、連線穩定，完全不干擾 Agent 的思考邏輯。

---

## 🚀 安裝指南

### 1. 複製專案 (Clone)
```bash
git clone https://github.com/您的帳號/openclaw-im-bridge.git
cd openclaw-im-bridge
```

### 2. 安裝依賴套件
```bash
npm install
```

### 3. 環境變數設定
複製範例設定檔：
```bash
cp .env.example .env
```

編輯 `.env` 檔案並填入您的資訊：
```ini
# OpenClaw Gateway 的網址 (通常為 ws://127.0.0.1:18789)
GATEWAY_URL=ws://127.0.0.1:18789

# 您的 OpenClaw Gateway 授權 Token
# (可以在 ~/.openclaw/openclaw.json 的 gateway.auth.token 找到)
GATEWAY_TOKEN=your_openclaw_gateway_token

# Telegram Bot Token (請向 @BotFather 申請)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token

# 您的個人 Telegram Chat ID (確保只有「您」能按下核准按鈕)
TELEGRAM_CHAT_ID=your_chat_id
```

### 4. 啟動橋接器
手動啟動：
```bash
node index.js
```

或者使用 [PM2](https://pm2.keymetrics.io/) 在背景常駐運行：
```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
```

## 🎮 使用方式

橋接器啟動後，打開您的 Telegram Bot 並嘗試以下指令：
- `/sysinfo` - 查看宿主機硬體狀態（記憶體、開機時間、CPU 架構）。
- `/status` - 查看 OpenClaw Gateway 連線狀態與目前待處理的審批請求數量。

當 OpenClaw 攔截到危險指令時，Bot 會自動發送類似下方的訊息給您：

> 🛠️ **OpenClaw 審批請求**
> **代理程式**: `main`
> **執行指令**:
> ```bash
> rm -rf /tmp/cache
> ```
> [ ✅ 核准一次 ]  [ ❌ 拒絕 ]

## 🏗️ 系統架構

此橋接器採用 **與宿主無關（Host-Agnostic）** 的設計。它連接到 OpenClaw WebSocket RPC 介面 (`ws://127.0.0.1:18789`)，運作原理與官方的 Control UI 完全相同：
1. 使用您的 token 進行身分驗證。
2. 輪詢/監聽 `exec.approvals.get` 與 `exec.approval.requested` 事件。
3. 透過 `exec.approval.resolve` RPC 方法將您的決定（允許/拒絕）傳回系統。

## 🤝 貢獻指南
非常歡迎發起 Pull Requests！如果您想為此專案新增 Discord、Slack 或 Feishu (飛書) 的轉接器（Adapters），請先開一個 Issue 來討論架構實作。

## 📜 授權條款
MIT
