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

// 1. Get upload URL for PNG
const urlRes = await fetch('https://' + DOMAIN + '/api/publish/v2/upload-url?appId=' + APP_ID + '&suffix=png&releaseType=1', {
  method: 'GET', headers: {'Authorization': 'Bearer ' + token, 'client_id': CLIENT_ID}
});
const urlJson = await urlRes.json();
const { uploadUrl, authCode } = urlJson;
console.log('Got upload URL');

// 2. Upload PNG
const iconPath = 'app/src/main/ic_launcher-playstore.png';
const iconBuffer = readFileSync(iconPath);
console.log('Icon size:', iconBuffer.length, 'bytes');

const boundary = '----FormBoundary' + Math.random().toString(36).slice(2);
const buildPart = (s) => Buffer.from(s + '\r\n', 'utf-8');
const preamble = [
  buildPart('--' + boundary + '\r\nContent-Disposition: form-data; name="authCode"\r\n\r\n' + authCode),
  buildPart('--' + boundary + '\r\nContent-Disposition: form-data; name="fileCount"\r\n\r\n1'),
];
const fileHeader = Buffer.from('--' + boundary + '\r\nContent-Disposition: form-data; name="file"; filename="icon.png"\r\nContent-Type: image/png\r\n\r\n', 'utf-8');
const fileFooter = Buffer.from('\r\n--' + boundary + '--\r\n', 'utf-8');
const body = Buffer.concat([...preamble, fileHeader, iconBuffer, fileFooter]);

const uploadRes = await fetch(uploadUrl, {
  method: 'POST',
  headers: {'Content-Type': 'multipart/form-data; boundary=' + boundary},
  body,
});
const uploadText = await uploadRes.text();
console.log('Upload response:', uploadText.slice(0, 300));

const uploadJson = JSON.parse(uploadText);
const fileDestUrl = uploadJson.result?.UploadFileRsp?.fileInfoList?.[0]?.fileDestUlr;
console.log('fileDestUrl:', fileDestUrl);

// 3. Update language-info with appPng
if (fileDestUrl) {
  const body2 = JSON.stringify({
    lang: 'ru-RU',
    appPng: fileDestUrl,
  });
  const langRes = await fetch('https://' + DOMAIN + '/api/publish/v2/app-language-info?appId=' + APP_ID, {
    method: 'PUT',
    headers: {'Authorization': 'Bearer ' + token, 'client_id': CLIENT_ID, 'Content-Type': 'application/json'},
    body: body2,
  });
  const langJson = await langRes.json();
  console.log('Language info result:', JSON.stringify(langJson));
  
  if (langJson.ret?.code === 0) {
    console.log('Icon set! Submitting...');
    const submitRes = await fetch('https://' + DOMAIN + '/api/publish/v2/app-submit?appId=' + APP_ID, {
      method: 'POST', headers: {'Authorization': 'Bearer ' + token, 'client_id': CLIENT_ID}
    });
    const submitJson = await submitRes.json();
    console.log('Submit result:', JSON.stringify(submitJson));
  }
}
