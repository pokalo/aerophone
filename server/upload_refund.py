import paramiko, sys, os

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('69.12.73.250', port=22, username='root', password='PgHp7CSV5zGie1r591', timeout=20)

sftp = client.open_sftp()

script = '''const https = require('https');

const BOT_TOKEN = process.env.BOT_TOKEN || '8738154234:AAGG_aezss1FhDAM6Uf2adrENBUmMCDl5mc';

function tgPost(method, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const url = new URL(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`);
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

async function main() {
  const args = process.argv.slice(2);
  let userId = null;
  if (args[0] === '--user' && args[1]) userId = parseInt(args[1]);

  console.log('Getting star transactions...');
  const tx = await tgPost('getStarTransactions', {});
  if (!tx.ok) { console.error('Failed:', tx.description); return; }

  const transactions = tx.result.transactions;
  console.log(`Found ${transactions.length} transactions`);

  const toRefund = transactions.filter(t => {
    if (!t.source || t.source.transaction_type !== 'invoice_payment') return false;
    if (userId && t.source.user?.id !== userId) return false;
    // Skip if already refunded (appears as receiver, not source)
    return true;
  });

  console.log(`Refundable (source): ${toRefund.length}`);

  for (const t of toRefund) {
    console.log(`Refunding ${t.amount} stars from user ${t.source.user?.id}...`);
    const result = await tgPost('refundStarPayment', {
      user_id: t.source.user.id,
      telegram_payment_charge_id: t.id,
    });
    if (result.ok) {
      console.log(`  ✓ ${t.amount} stars refunded`);
    } else {
      console.log(`  ✗ ${t.amount} stars: ${result.description}`);
    }
  }

  const bal = await tgPost('getMyStarBalance', {});
  console.log(`\\nBalance: ${bal.result?.amount || 0} ⭐`);
}

main().catch(e => console.error('Error:', e.message));
'''

sftp.putfo(
    __import__('io').BytesIO(script.encode()),
    '/home/pavkraft/aerophone-payments/refund.js'
)
sftp.close()
client.close()
print('Uploaded refund.js')
