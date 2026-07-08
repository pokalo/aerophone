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

// Upload icon
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
const fi = (await uploadRes.json()).result?.UploadFileRsp?.fileInfoList?.[0];
const iconPathOnly = fi.fileDestUlr.replace('https://developerfile-dra.op.hicloud.com/FileServer/getFile/', '');

console.log('Icon path length:', iconPathOnly.length);

// Try different field names in app-language-info
const fieldTests = [
  {fields: {lang: 'ru-RU', appIcon: iconPathOnly}, desc: 'appIcon'},
  {fields: {lang: 'ru-RU', iconFile: iconPathOnly}, desc: 'iconFile'},
  {fields: {lang: 'ru-RU', iconUrl: iconPathOnly}, desc: 'iconUrl'},
  {fields: {lang: 'ru-RU', iconPng: iconPathOnly}, desc: 'iconPng'},
  {fields: {lang: 'ru-RU', iconPath: iconPathOnly}, desc: 'iconPath'},
  {fields: {lang: 'ru-RU', appIcon: iconPathOnly, icon: iconPathOnly}, desc: 'icon + appIcon'},
  {fields: {lang: 'ru-RU', appPng: iconPathOnly}, desc: 'appPng (short)'},
];

for (const t of fieldTests) {
  const res = await fetch('https://' + DOMAIN + '/api/publish/v2/app-language-info?appId=' + APP_ID, {
    method: 'PUT',
    headers: {'Authorization': 'Bearer ' + token, 'client_id': CLIENT_ID, 'Content-Type': 'application/json'},
    body: JSON.stringify(t.fields),
  });
  const json = await res.json();
  console.log(t.desc + ':', json.ret?.code, json.ret?.msg?.slice(0, 60));
}

// Check final state
const checkRes = await fetch('https://' + DOMAIN + '/api/publish/v2/app-info?appId=' + APP_ID + '&releaseType=1', {
  headers: {'Authorization': 'Bearer ' + token, 'client_id': CLIENT_ID}
});
const check = await checkRes.json();
console.log('\nFinal icon:', JSON.stringify(check.languages?.[0]?.icon?.slice(0, 80)));
