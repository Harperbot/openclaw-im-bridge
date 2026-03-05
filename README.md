# OpenClaw IM Bridge 🌉

English | [繁體中文](README.zh-TW.md)

A lightweight, host-agnostic bridge that connects your local [OpenClaw](https://github.com/openclaw/openclaw) Gateway to Instant Messaging platforms (like Telegram). 

This tool brings **Interactive Approvals** and **System Monitoring** directly to your phone. Whenever your AI agent (Gemini/Claude) needs to execute a dangerous shell command, instead of checking the web dashboard, you get an instant push notification with `[✅ Approve]` and `[❌ Reject]` buttons.

---

## ✨ Features

- **Interactive Execution Approvals**: Get inline buttons in Telegram to allow or deny shell commands requested by your Agent.
- **Real-time Status Dashboard**: Send `/sysinfo` to get a beautifully formatted Markdown report of your host machine's CPU, Memory, and Uptime.
- **Bridge Health Check**: Send `/status` to verify the WebSocket connection to your OpenClaw Gateway.
- **Zero-Config Integration**: Runs alongside OpenClaw. No modifications to your existing agents or plugins required.
- **Self-Healing**: Automatically reconnects to the Gateway if the connection is dropped.

---

## 💡 Why this project?

Most LLM bots require you to switch to their specific framework. **OpenClaw IM Bridge** is different:
- **Non-Intrusive**: It runs *alongside* your existing OpenClaw setup. No need to change your Agent prompts or modify core config files.
- **Mobile-First Security**: Why open a web dashboard on your desktop when you can approve a dangerous command with a single tap on your phone?
- **Lightweight Microservice**: It communicates purely via WebSocket RPC, making it extremely stable and decoupled from the main Agent logic.

---

## 🚀 Installation

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/openclaw-im-bridge.git
cd openclaw-im-bridge
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configuration
Copy the example environment file:
```bash
cp .env.example .env
```

Edit the `.env` file with your details:
```ini
# OpenClaw Gateway URL (usually ws://127.0.0.1:18789)
GATEWAY_URL=ws://127.0.0.1:18789

# Your OpenClaw Gateway Auth Token
# (Found in ~/.openclaw/openclaw.json under gateway.auth.token)
GATEWAY_TOKEN=your_openclaw_gateway_token

# Telegram Bot Token (from @BotFather)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token

# Your personal Telegram Chat ID (to ensure only YOU can approve commands)
TELEGRAM_CHAT_ID=your_chat_id
```

### 4. Run the Bridge
Start the bridge manually:
```bash
node index.js
```

Or run it in the background using [PM2](https://pm2.keymetrics.io/):
```bash
npm install -g pm2
pm2 start index.js --name "openclaw-bridge"
pm2 save
```

## 🎮 Usage

Once running, open your Telegram bot and try the following commands:
- `/sysinfo` - View host hardware status (Memory, Uptime, CPU Architecture).
- `/status` - View OpenClaw Gateway connection status and pending approvals.

When OpenClaw intercepts a dangerous command execution, the bot will automatically send a message:

> 🛠️ **OpenClaw Approval Request**
> **Agent**: `main`
> **Command**:
> ```bash
> rm -rf /tmp/cache
> ```
> [ ✅ Approve Once ]  [ ❌ Reject ]

## 🏗️ Architecture

This bridge uses a **Host-Agnostic** design. It connects to the OpenClaw WebSocket RPC interface (`ws://127.0.0.1:18789`) just like the official Control UI does. 
1. It authenticates using your token.
2. It polls/listens for `exec.approvals.get` and `exec.approval.requested` events.
3. It relays decisions back via the `exec.approval.resolve` RPC method.

## 🤝 Contributing
Pull requests are welcome! If you want to add adapters for Discord, Slack, or Feishu, please open an issue first to discuss the architecture.

## 📜 License
MIT
