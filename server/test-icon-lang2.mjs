const CLIENT_ID = '1971299567085305024';
const CLIENT_SECRET = 'F3728720303FF0E4A6B58C5AC1E3078F9BCEBC5ECE849D5EC5B3D73369B91173';
const APP_ID = '118008397';
const DOMAIN = 'connect-api.cloud.huawei.com';
const { readFileSync } = await import('node:fs');

const tokenRes = await fetch('https://' + DOMAIN + '/api/oauth2/v1/token', {
  method: 'POST', headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({client_id: CLIENT_ID, client_secret: CLIENT_SECRET, grant_type: 'client_credentials'})
});
const tokenData = await tokenRes.json();
const token = tokenData.access_token;

const iconPath = 'app/src/main/ic_launcher-playstore.png';
const iconBuffer = readFileSync(iconPath);

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

const fullUrl = fi.fileDestUlr;
console.log('Full URL length:', fullUrl.length);
console.log('Full URL:', fullUrl);

// Try different URL formats for the icon field
const tests = [
  { label: 'full URL', value: fullUrl },
  { label: 'path only', value: fullUrl.replace('https://developerfile-dra.op.hicloud.com/FileServer/getFile/', '') },
  { label: 'filename only', value: fullUrl.split('/').pop() },
  { label: 'disposableURL', value: fi.disposableURL },
  { label: 'short disposable', value: fi.disposableURL.replace('https://developerfile-dra.op.hicloud.com/FileServer/getFile/', '') },
];

for (const t of tests) {
  console.log('\nTrying:', t.label, '(length:', t.value.length, ')');
  const body = { lang: 'ru-RU', icon: t.value };
  try {
    const res = await fetch('https://' + DOMAIN + '/api/publish/v2/app-language-info?appId=' + APP_ID, {
      method: 'PUT',
      headers: {'Authorization': 'Bearer ' + token, 'client_id': CLIENT_ID, 'Content-Type': 'application/json'},
      body: JSON.stringify(body),
    });
    const json = await res.json();
    console.log('Result:', JSON.stringify(json.ret));
  } catch(e) {
    console.log('Error:', e.message);
  }
}
