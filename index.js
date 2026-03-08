require('dotenv').config();
const WebSocket = require('ws');
const TelegramBot = require('node-telegram-bot-api');
const os = require('os');

// 設定
const GATEWAY_URL = process.env.GATEWAY_URL || 'ws://127.0.0.1:18789';
const GATEWAY_TOKEN = process.env.GATEWAY_TOKEN;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!GATEWAY_TOKEN || !TELEGRAM_BOT_TOKEN) {
  console.error("請在 .env 中設定 GATEWAY_TOKEN 與 TELEGRAM_BOT_TOKEN");
  process.exit(1);
}

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });
let ws;
let requestIdCounter = 1;
const pendingRequests = new Map();
let gatewayConnected = false;

// 格式化位元組
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 生成進度條
function makeProgressBar(percent) {
  const length = 10;
  const filled = Math.round((length * percent) / 100);
  const empty = length - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

// 處理來自 Telegram 的新訊息 (階段 2：視覺與狀態強化)
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  
  // 只允許設定好的擁有者操作
  if (chatId.toString() !== TELEGRAM_CHAT_ID) return;
  if (!text) return;

  if (text === '/sysinfo') {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memPercent = (usedMem / totalMem) * 100;
    
    const uptime = os.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);

    const info = `🖥️ **宿主機狀態報告 (Host System)**\n\n` +
                 `**系統**: \`${os.type()} ${os.release()}\`\n` +
                 `**架構**: \`${os.arch()} (${os.cpus().length} vCPUs)\`\n` +
                 `**開機時間**: \`${hours}小時 ${minutes}分鐘\`\n\n` +
                 `📊 **記憶體使用率**: ${memPercent.toFixed(1)}%\n` +
                 `\`[${makeProgressBar(memPercent)}]\`\n` +
                 `已用: \`${formatBytes(usedMem)}\` / 總計: \`${formatBytes(totalMem)}\``;

    return bot.sendMessage(chatId, info, { parse_mode: 'Markdown' });
  }

  if (text === '/status') {
    const wsStatus = gatewayConnected ? '🟢 已連線' : '🔴 斷線中';
    const statusMsg = `🔗 **OpenClaw 橋接器狀態**\n\n` +
                      `**Gateway**: \`${GATEWAY_URL}\`\n` +
                      `**連線狀態**: ${wsStatus}\n` +
                      `**待處理審批**: \`${pendingRequests.size} 筆\`\n\n` +
                      `_提示: 當 OpenClaw 需要執行危險指令時，會自動在這裡彈出按鈕。_`;
    return bot.sendMessage(chatId, statusMsg, { parse_mode: 'Markdown' });
  }
});

// 初始化 WebSocket 連線
function connect() {
  console.log(`正在連線到 OpenClaw Gateway: ${GATEWAY_URL}`);
  ws = new WebSocket(GATEWAY_URL);

  ws.on('open', () => {
    console.log("✅ WebSocket 已連線");
    gatewayConnected = true;
    sendRPC("auth.token", { token: GATEWAY_TOKEN });
    
    setInterval(() => {
      if (gatewayConnected && ws && ws.readyState === WebSocket.OPEN) sendRPC("exec.approvals.get", {});
    }, 5000);
  });

  ws.on('message', (data) => {
    try {
      const response = JSON.parse(data);
      handleRPCResponse(response);
    } catch (e) {
      console.error("解析訊息失敗:", e);
    }
  });

  ws.on('close', () => {
    console.log("❌ 連線已中斷，5 秒後嘗試重連...");
    gatewayConnected = false;
    setTimeout(connect, 5000);
  });

  ws.on('error', (err) => {
    console.error("WebSocket 錯誤:", err.message);
    gatewayConnected = false;
    ws.terminate(); // 確保觸發 close 事件以執行重連
  });
}

// 發送 RPC 指令給 OpenClaw Gateway
function sendRPC(method, params) {
  const id = requestIdCounter++;
  const payload = {
    jsonrpc: "2.0",
    id: id,
    method: method,
    params: params
  };
  ws.send(JSON.stringify(payload));
  return id;
}

// 處理來自 Gateway 的回傳內容
async function handleRPCResponse(res) {
  if (res.result && res.result.file) {
    if (res.result.pendingRequests && res.result.pendingRequests.length > 0) {
      for (const req of res.result.pendingRequests) {
        if (!pendingRequests.has(req.id)) {
          sendApprovalToTelegram(req);
        }
      }
    }
  }
  
  if (res.method === "exec.approval.requested") {
     sendApprovalToTelegram(res.params);
  }
}

// 將審批請求發送到 Telegram
async function sendApprovalToTelegram(req) {
  const { id, command, agentId, reason } = req;
  pendingRequests.set(id, req);

  const message = `🛠️ **OpenClaw 審批請求**\n\n` +
                  `**代理程式**: \`${agentId || '未知'}\`\n` +
                  `**執行指令**: \n\`\`\`bash\n${command}\n\`\`\`\n` +
                  `**原因**: ${reason || '無'}\n\n` +
                  `請選擇操作：`;

  await bot.sendMessage(TELEGRAM_CHAT_ID, message, {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [
          { text: "✅ 核准一次", callback_data: JSON.stringify({ a: "allow", id: id }) },
          { text: "❌ 拒絕", callback_data: JSON.stringify({ a: "deny", id: id }) }
        ]
      ]
    }
  });
}

// 處理來自 Telegram 按鈕的回傳
bot.on('callback_query', async (query) => {
  if (query.from.id.toString() !== TELEGRAM_CHAT_ID) {
    await bot.answerCallbackQuery(query.id, { text: "未授權操作。" });
    return;
  }
  let data;
  try {
    data = JSON.parse(query.data);
  } catch (e) {
    console.error("callback_query 資料解析失敗:", e);
    await bot.answerCallbackQuery(query.id, { text: "資料格式錯誤。" });
    return;
  }
  const { a, id } = data;

  if (a === "allow") {
    sendRPC("exec.approval.resolve", { id: id, decision: "allow-once" });
    await bot.answerCallbackQuery(query.id, { text: "已核准執行！" });
    await bot.editMessageText(query.message.text + "\n\n✔️ **狀態：已手動核准**", {
      chat_id: query.message.chat.id,
      message_id: query.message.message_id
    });
  } else {
    sendRPC("exec.approval.resolve", { id: id, decision: "deny" });
    await bot.answerCallbackQuery(query.id, { text: "已拒絕執行。" });
    await bot.editMessageText(query.message.text + "\n\n❌ **狀態：已手動拒絕**", {
      chat_id: query.message.chat.id,
      message_id: query.message.message_id
    });
  }
  pendingRequests.delete(id);
});

connect();
