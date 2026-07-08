const CLIENT_ID = '1971299567085305024';
const CLIENT_SECRET = 'F3728720303FF0E4A6B58C5AC1E3078F9BCEBC5ECE849D5EC5B3D73369B91173';
const APP_ID = '118008397';
const DOMAIN = 'connect-api.cloud.huawei.com';
const { readFileSync } = await import('node:fs');
const crypto = await import('node:crypto');

const tokenRes = await fetch('https://' + DOMAIN + '/api/oauth2/v1/token', {
  method: 'POST', headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({client_id: CLIENT_ID, client_secret: CLIENT_SECRET, grant_type: 'client_credentials'})
});
const tokenData = await tokenRes.json();
const token = tokenData.access_token;

// Upload icon with parseType=1
const iconBuffer = readFileSync('app/src/main/ic_launcher-playstore.png');
const urlRes = await fetch('https://' + DOMAIN + '/api/publish/v2/upload-url?appId=' + APP_ID + '&suffix=png&releaseType=1', {
  method: 'GET', headers: {'Authorization': 'Bearer ' + token, 'client_id': CLIENT_ID}
});
const { uploadUrl, authCode } = await urlRes.json();
const boundary = '----Boundary' + Date.now().toString(36);
const preamble = Buffer.from(
  '--' + boundary + '\r\nContent-Disposition: form-data; name="authCode"\r\n\r\n' + authCode + '\r\n'
  + '--' + boundary + '\r\nContent-Disposition: form-data; name="fileCount"\r\n\r\n1\r\n'
  + '--' + boundary + '\r\nContent-Disposition: form-data; name="parseType"\r\n\r\n1\r\n'
  + '--' + boundary + '\r\nContent-Disposition: form-data; name="file"; filename="icon.png"\r\nContent-Type: image/png\r\n\r\n', 'utf-8');
const footer = Buffer.from('\r\n--' + boundary + '--\r\n', 'utf-8');
const uploadRes = await fetch(uploadUrl, {method: 'POST', headers: {'Content-Type': 'multipart/form-data; boundary=' + boundary}, body: Buffer.concat([preamble, iconBuffer, footer])});
const uploadJson = await uploadRes.json();
const fi = uploadJson.result?.UploadFileRsp?.fileInfoList?.[0];
const fileDestUrl = fi.fileDestUlr;
const sig = fi.imageResolutionSingature;
const resolution = fi.imageResolution;

console.log('URL:', fileDestUrl.slice(0, 80));

// Try different sign computation approaches
const sha256hex = crypto.createHash('sha256').update(iconBuffer).digest('hex');
const sha256base64 = crypto.createHash('sha256').update(iconBuffer).digest('base64');

// Try HMAC with different keys
const hmacSecret = crypto.createHmac('sha256', CLIENT_SECRET).update(fileDestUrl).digest('hex');
const hmacToken = crypto.createHmac('sha256', token).update(fileDestUrl).digest('hex');
const hmacAuthCode = crypto.createHmac('sha256', authCode).update(fileDestUrl).digest('hex');
const hmacSig = crypto.createHmac('sha256', sig).update(fileDestUrl).digest('hex');

// Try different sign values
const signTests = [
  {sign: sha256hex, desc: 'sha256 hex'},
  {sign: sha256base64, desc: 'sha256 base64'},
  {sign: sig, desc: 'upload signature as-is'},
  {sign: hmacSecret, desc: 'hmac with client_secret'},
  {sign: hmacToken, desc: 'hmac with token'},
  {sign: hmacAuthCode, desc: 'hmac with authCode'},
  {sign: hmacSig, desc: 'hmac with sig'},
  {sign: crypto.createHash('md5').update(iconBuffer).digest('hex'), desc: 'md5 hex'},
];

for (const t of signTests) {
  const body = {
    lang: 'ru-RU',
    fileType: 0,
    files: [{
      fileName: 'icon.png',
      fileDestUrl,
      size: iconBuffer.length,
      imageResolution: resolution,
      imageResolutionSingature: t.sign
    }]
  };
  const res = await fetch('https://' + DOMAIN + '/api/publish/v2/app-file-info?appId=' + APP_ID, {
    method: 'PUT',
    headers: {'Authorization': 'Bearer ' + token, 'client_id': CLIENT_ID, 'Content-Type': 'application/json'},
    body: JSON.stringify(body),
  });
  const json = await res.json();
  console.log(t.desc + ':', json.ret?.code, json.ret?.msg?.slice(0, 60));
  if (json.ret?.code === 0) {
    console.log('  SUCCESS!');
  }
}
