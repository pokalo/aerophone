const https = require('https');

function tgPost(method, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const TG_API = 'https://api.telegram.org/bot8738154234:AAGG_aezss1FhDAM6Uf2adrENBUmMCDl5mc';
    const url = new URL(`${TG_API}/${method}`);
    const req = https.request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': data.length },
      timeout: 10000
    }, (res) => {
      let chunks = '';
      res.on('data', (c) => chunks += c);
      res.on('end', () => {
        try { resolve(JSON.parse(chunks)); }
        catch { reject(new Error(chunks)); }
      });
    });
    req.on('error', (e) => reject(e));
    req.write(data);
    req.end();
  });
}

tgPost('createInvoiceLink', {
  title: 'Test',
  description: 'Test',
  payload: 'test123',
  currency: 'XTR',
  prices: [{ label: 'Test', amount: 1 }]
}).then(r => console.log('OK:', JSON.stringify(r)))
.catch(e => console.log('ERROR:', e.message, e.code));
