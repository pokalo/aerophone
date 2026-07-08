const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const https = require('https');
const http = require('http');

const OBD_CONFIRM_URL = 'https://obd-scanner-api.7206322.workers.dev/api/v1/payment/stars/confirm-webhook';

const app = express();
app.use(cors());

app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const PORT = process.env.PORT || 3000;

if (!BOT_TOKEN) {
  console.error('BOT_TOKEN не задан. Укажите BOT_TOKEN=<token> npm start');
  process.exit(1);
}

const TG_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// Хранилище платежей: purchaseId -> { status, premiumType, timestamp }
const payments = new Map();

function tgPost(method, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const url = new URL(`${TG_API}/${method}`);
    const req = https.request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
      family: 4
    }, (res) => {
      let chunks = '';
      res.on('data', (c) => chunks += c);
      res.on('end', () => {
        try { resolve(JSON.parse(chunks)); }
        catch { reject(new Error(chunks)); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Создать счёт в Telegram Stars
app.post('/create-invoice', async (req, res) => {
  try {
    console.log('[REQUEST]', JSON.stringify(req.body));
    const { purchaseId, title, description, starsAmount } = req.body;
    if (!purchaseId || !title || !starsAmount) {
      console.log('[ERROR] Missing required fields');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const tgBody = {
      title,
      description,
      payload: purchaseId,
      currency: 'XTR',
      prices: [{ label: title, amount: starsAmount }]
    };
    console.log('[TG_SEND]', JSON.stringify(tgBody));

    const result = await tgPost('createInvoiceLink', tgBody);
    console.log('[TG_RESULT]', JSON.stringify(result));

    if (!result.ok) {
      console.log('[TG_ERROR]', result.description);
      return res.status(400).json({ error: result.description });
    }

    payments.set(purchaseId, { status: 'pending', createdAt: Date.now() });
    console.log('[SUCCESS] link:', result.result);
    res.json({ link: result.result });
  } catch (err) {
    console.log('[CATCH]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Баланс звёзд бота
app.get('/balance', async (req, res) => {
  try {
    const result = await tgPost('getMyStarBalance', {});
    if (result.ok) {
      res.json({ balance: result.result.amount });
    } else {
      res.status(500).json({ error: result.description });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Проверить статус платежа
app.get('/check-payment/:purchaseId', (req, res) => {
  const payment = payments.get(req.params.purchaseId);
  if (!payment) return res.json({ status: 'not_found' });
  res.json({ status: payment.status, premiumType: payment.premiumType });
});

const OWNER_ID = 518789001;

const REPLY_KEYBOARD = {
  reply_markup: {
    keyboard: [
      [{ text: '👤 Аккаунт ID' }],
      [{ text: '⭐ Баланс' }, { text: '↩️ Возврат звезд' }],
    ],
    resize_keyboard: true,
    is_persistent: true,
  }
};

function isCommand(text, cmd) {
  // Support both /command and button text matches
  if (text.startsWith('/' + cmd)) return true;
  return false;
}

// Возврат звезд
async function handleRefund(msg) {
  const chatId = msg.chat.id;
  const send = (text) => tgPost('sendMessage', { chat_id: chatId, text });

  if (chatId !== OWNER_ID) {
    return send('Команда только для владельца бота');
  }

  const parts = msg.text.split(/\s+/);
  const targetUserId = parseInt(parts[1]);
  if (!targetUserId) {
    return send('Укажите user_id: /refund 123456789');
  }

  const tx = await tgPost('getStarTransactions', { limit: 50 });
  if (!tx.ok) return send('Ошибка получения транзакций: ' + tx.description);

  let count = 0;
  let total = 0;
  for (const t of tx.result.transactions) {
    if (!t.source || t.source.type !== 'user') continue;
    if (t.source.user.id !== targetUserId) continue;
    const r = await tgPost('refundStarPayment', {
      user_id: targetUserId,
      telegram_payment_charge_id: t.id,
    });
    if (r.ok) { count++; total += t.amount; }
  }

  const bal = await tgPost('getMyStarBalance', {});
  const stars = bal.result?.amount || 0;
  send(`Возвращено ${count} платежей (${total} ⭐) пользователю ${targetUserId}\nБаланс бота: ${stars} ⭐`);
}

// Webhook от Telegram
app.post('/webhook', (req, res) => {
  const update = req.body;

  // Log all incoming messages for debugging
  if (update.message?.text) {
    console.log('[MSG]', update.message.text, 'from', update.message.from?.id);
  }

  // Pre-checkout query — сразу подтверждаем
  if (update.pre_checkout_query) {
    tgPost('answerPreCheckoutQuery', {
      pre_checkout_query_id: update.pre_checkout_query.id,
      ok: true
    }).catch(() => {});
    return res.sendStatus(200);
  }

  // /start — приветствие
  if (update.message?.text === '/start') {
    const msg = update.message.chat.id === OWNER_ID
      ? { text: 'Aerophone — бот для оплаты премиум-доступа', ...REPLY_KEYBOARD }
      : { text: 'Aerophone — бот для оплаты премиум-доступа' };
    tgPost('sendMessage', { chat_id: update.message.chat.id, ...msg });
    return res.sendStatus(200);
  }

  // Кнопки — только для владельца
  const isOwner = update.message?.from?.id === OWNER_ID;
  if (isOwner) {
    const text = update.message?.text || '';
    if (text.includes('Баланс')) {
      update.message.text = '/balance';
    } else if (text.includes('Возврат')) {
      update.message.text = '/refund 518789001';
    } else if (text.includes('Аккаунт') || text.includes('ID')) {
      tgPost('sendMessage', {
        chat_id: update.message.chat.id,
        text: 'Ваш ID: ' + update.message.from.id,
      });
      return res.sendStatus(200);
    }
  }

  // Команда /balance — только для владельца
  if (update.message?.text?.startsWith('/balance')) {
    if (update.message.from?.id !== OWNER_ID) return res.sendStatus(200);
    tgPost('getMyStarBalance', {}).then(bal => {
      const text = bal.ok
        ? `Баланс бота: ${bal.result.amount} ⭐`
        : 'Ошибка получения баланса';
      tgPost('sendMessage', { chat_id: update.message.chat.id, text });
    });
    return res.sendStatus(200);
  }

  // Команда /refund — возврат звёзд
  if (update.message?.text?.startsWith('/refund')) {
    handleRefund(update.message).catch(() => {});
    return res.sendStatus(200);
  }

  // Успешный платёж
  if (update.message?.successful_payment) {
    const purchaseId = update.message.successful_payment.invoice_payload;
    const existing = payments.get(purchaseId);
    payments.set(purchaseId, {
      ...existing,
      status: 'completed',
      completedAt: Date.now(),
      telegramUserId: update.message.from?.id
    });
    console.log(`Платёж подтверждён: ${purchaseId}`);

    // Forward OBD payments to Worker
    if (purchaseId.startsWith('obd_')) {
      const orderId = purchaseId.replace('obd_', '');
      const body = JSON.stringify({ order_id: orderId });
      const url = new URL(OBD_CONFIRM_URL);
      const client = url.protocol === 'https:' ? https : http;
      const req = client.request(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
      }, (res) => {
        let chunks = '';
        res.on('data', (c) => chunks += c);
        res.on('end', () => console.log(`OBD confirm: ${chunks}`));
      });
      req.on('error', (e) => console.error('OBD confirm error:', e.message));
      req.write(body);
      req.end();
    }
  }

  res.sendStatus(200);
});

// Установить/проверить webhook
async function setupWebhook() {
  const publicUrl = process.env.PUBLIC_URL;
  if (publicUrl) {
    const result = await tgPost('setWebhook', { url: `${publicUrl}/webhook` });
    console.log('Webhook:', result.ok ? 'установлен' : 'ошибка', result.description || '');
  } else {
    console.log('PUBLIC_URL не задан, получаю обновления через getUpdates');
    pollUpdates();
  }
}

// Polling fallback
let lastUpdateId = 0;
async function pollUpdates() {
  try {
    const result = await tgPost('getUpdates', {
      offset: lastUpdateId + 1,
      timeout: 30,
      allowed_updates: ['pre_checkout_query', 'message']
    });
    if (result.ok && result.result) {
      for (const update of result.result) {
        lastUpdateId = update.update_id;
        if (update.pre_checkout_query) {
          await tgPost('answerPreCheckoutQuery', {
            pre_checkout_query_id: update.pre_checkout_query.id,
            ok: true
          });
        }
        // /start — приветствие
          if (update.message?.text === '/start') {
            const msg = update.message.chat.id === OWNER_ID
              ? { text: 'Aerophone — бот для оплаты премиум-доступа', ...REPLY_KEYBOARD }
              : { text: 'Aerophone — бот для оплаты премиум-доступа' };
            await tgPost('sendMessage', { chat_id: update.message.chat.id, ...msg });
            continue;
          }

          // Кнопки — только для владельца
          if (update.message?.from?.id === OWNER_ID) {
            const btnText = update.message?.text || '';
            if (btnText.includes('Баланс')) { update.message.text = '/balance'; }
            else if (btnText.includes('Возврат')) { update.message.text = '/refund 518789001'; }
            else if (btnText.includes('Аккаунт') || btnText.includes('ID')) {
              await tgPost('sendMessage', {
                chat_id: update.message.chat.id,
                text: 'Ваш ID: ' + update.message.from.id,
              });
              continue;
            }
          }

          // Команда /balance — только для владельца
          if (update.message?.text?.startsWith('/balance')) {
            if (update.message.from?.id !== OWNER_ID) continue;
            const chatId = update.message.chat.id;
            const bal = await tgPost('getMyStarBalance', {});
            const text = bal.ok
              ? `Баланс бота: ${bal.result.amount} ⭐`
              : 'Ошибка получения баланса';
            await tgPost('sendMessage', { chat_id: chatId, text });
          }

          // Команда /refund
          if (update.message?.text?.startsWith('/refund')) {
            await handleRefund(update.message);
          }

          if (update.message?.successful_payment) {
          const pid = update.message.successful_payment.invoice_payload;
          const existing = payments.get(pid);
          payments.set(pid, {
            ...existing,
            status: 'completed',
            completedAt: Date.now(),
            telegramUserId: update.message.from?.id
          });
          console.log(`Платёж подтверждён (polling): ${pid}`);

          // Forward OBD payments to Worker
          if (pid.startsWith('obd_')) {
            const orderId = pid.replace('obd_', '');
            const body = JSON.stringify({ order_id: orderId });
            const url = new URL(OBD_CONFIRM_URL);
            const client = url.protocol === 'https:' ? https : http;
            const req = client.request(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
            }, (res) => {
              let chunks = '';
              res.on('data', (c) => chunks += c);
              res.on('end', () => console.log(`OBD confirm: ${chunks}`));
            });
            req.on('error', (e) => console.error('OBD confirm error:', e.message));
            req.write(body);
            req.end();
          }
        }
      }
    }
  } catch (e) {
    console.error('Polling error:', e.message);
  }
  setTimeout(pollUpdates, 1000);
}

app.listen(PORT, () => {
  console.log(`Aerophone payment server on :${PORT}`);
  setupWebhook().catch(console.error);
});
