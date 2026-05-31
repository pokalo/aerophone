const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const https = require('https');

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
      headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }
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
    const { purchaseId, title, description, starsAmount } = req.body;
    if (!purchaseId || !title || !starsAmount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await tgPost('createInvoiceLink', {
      title,
      description,
      payload: purchaseId,
      currency: 'XTR',
      prices: [{ label: title, amount: starsAmount }]
    });

    if (!result.ok) {
      return res.status(400).json({ error: result.description });
    }

    payments.set(purchaseId, { status: 'pending', createdAt: Date.now() });
    res.json({ link: result.result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Проверить статус платежа
app.get('/check-payment/:purchaseId', (req, res) => {
  const payment = payments.get(req.params.purchaseId);
  if (!payment) return res.json({ status: 'not_found' });
  res.json({ status: payment.status, premiumType: payment.premiumType });
});

// Webhook от Telegram
app.post('/webhook', (req, res) => {
  const update = req.body;

  // Pre-checkout query — сразу подтверждаем
  if (update.pre_checkout_query) {
    tgPost('answerPreCheckoutQuery', {
      pre_checkout_query_id: update.pre_checkout_query.id,
      ok: true
    }).catch(() => {});
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
        }
      }
    }
  } catch (e) {
    console.error('Polling error:', e.message);
  }
  setTimeout(pollUpdates, 1000);
}

app.listen(PORT, () => {
  console.log(`HearAssist payment server on :${PORT}`);
  setupWebhook().catch(console.error);
});
