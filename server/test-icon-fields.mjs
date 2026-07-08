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

const iconPath = 'app/src/main/ic_launcher-playstore.png';
const iconBuffer = readFileSync(iconPath);
const fileSize = iconBuffer.length;
const sha256 = crypto.createHash('sha256').update(iconBuffer).digest('hex');
console.log('File size:', fileSize, 'SHA256:', sha256);

// Get upload URL & upload
const urlRes = await fetch('https://' + DOMAIN + '/api/publish/v2/upload-url?appId=' + APP_ID + '&suffix=png&releaseType=1', {
  method: 'GET', headers: {'Authorization': 'Bearer ' + token, 'client_id': CLIENT_ID}
});
const { uploadUrl, authCode } = await urlRes.json();

const boundary = '----Boundary' + Date.now().toString(36);
const preamble = Buffer.from(
  '--' + boundary + '\r\nContent-Disposition: form-data; name="authCode"\r\n\r\n' + authCode + '\r\n'
  + '--' + boundary + '\r\nContent-Disposition: form-data; name="fileCount"\r\n\r\n1\r\n'
  + '--' + boundary + '\r\nContent-Disposition: form-data; name="file"; filename="icon.png"\r\nContent-Type: image/png\r\n\r\n', 'utf-8');
const footer = Buffer.from('\r\n--' + boundary + '--\r\n', 'utf-8');
const uploadRes = await fetch(uploadUrl, {method: 'POST', headers: {'Content-Type': 'multipart/form-data; boundary=' + boundary}, body: Buffer.concat([preamble, iconBuffer, footer])});
const uploadJson = await uploadRes.json();
const fileDestUrl = uploadJson.result?.UploadFileRsp?.fileInfoList?.[0]?.fileDestUlr;
console.log('fileDestUrl:', fileDestUrl?.slice(0, 60));

// Try different field names for "sign"
const tests = [
  {body: {lang: 'ru-RU', fileType: 0, files: [{fileName: 'icon.png', fileDestUrl, size: fileSize}]}, desc: 'size instead of sign'},
  {body: {lang: 'ru-RU', fileType: 0, files: [{fileName: 'icon.png', fileDestUrl, sign: sha256, size: fileSize}]}, desc: 'sign+size'},
  {body: {lang: 'ru-RU', fileType: 0, files: [{fileName: 'icon.png', fileDestUrl, sha256}]}, desc: 'sha256 field'},
  {body: {lang: 'ru-RU', fileType: 0, files: [{fileName: 'icon.png', fileDestUrl, imageResolution: '512x512', imageResolutionSingature: sha256}]}, desc: 'imageResolution'},
  {body: {lang: 'ru-RU', fileType: 0, files: [{fileDestUlr: fileDestUrl}]}, desc: 'fileDestUlr typo'},
  {body: {fileType: 0, files: [{fileName: 'icon.png', fileDestUrl}]}, desc: 'no lang'},
];

for (const t of tests) {
  const res = await fetch('https://' + DOMAIN + '/api/publish/v2/app-file-info?appId=' + APP_ID, {
    method: 'PUT',
    headers: {'Authorization': 'Bearer ' + token, 'client_id': CLIENT_ID, 'Content-Type': 'application/json'},
    body: JSON.stringify(t.body),
  });
  const json = await res.json();
  console.log(t.desc, ':', json.ret?.code, json.ret?.msg?.slice(0, 80));
}
