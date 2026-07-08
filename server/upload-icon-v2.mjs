const CLIENT_ID = '1971299567085305024';
const CLIENT_SECRET = 'F3728720303FF0E4A6B58C5AC1E3078F9BCEBC5ECE849D5EC5B3D73369B91173';
const APP_ID = '118008397';
const DOMAIN = 'connect-api.cloud.huawei.com';
const { readFileSync, createHash } = await import('node:fs');
const crypto = await import('node:crypto');

// 1. Get token
const tokenRes = await fetch('https://' + DOMAIN + '/api/oauth2/v1/token', {
  method: 'POST', headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({client_id: CLIENT_ID, client_secret: CLIENT_SECRET, grant_type: 'client_credentials'})
});
const tokenData = await tokenRes.json();
const token = tokenData.access_token;
console.log('Token OK');

// 2. Compute SHA256 of icon
const iconPath = 'app/src/main/ic_launcher-playstore.png';
const iconBuffer = readFileSync(iconPath);
const sha256 = crypto.createHash('sha256').update(iconBuffer).digest('hex');
console.log('SHA256:', sha256);

// 3. Get upload URL for PNG
const urlRes = await fetch('https://' + DOMAIN + '/api/publish/v2/upload-url?appId=' + APP_ID + '&suffix=png&releaseType=1', {
  method: 'GET', headers: {'Authorization': 'Bearer ' + token, 'client_id': CLIENT_ID}
});
const urlJson = await urlRes.json();
const { uploadUrl, authCode } = urlJson;
console.log('Upload URL OK');

// 4. Upload PNG
const boundary = '----Boundary' + Date.now().toString(36);
const preamble = Buffer.from(
  '--' + boundary + '\r\nContent-Disposition: form-data; name="authCode"\r\n\r\n' + authCode + '\r\n'
  + '--' + boundary + '\r\nContent-Disposition: form-data; name="fileCount"\r\n\r\n1\r\n'
  + '--' + boundary + '\r\nContent-Disposition: form-data; name="file"; filename="icon.png"\r\nContent-Type: image/png\r\n\r\n',
  'utf-8'
);
const footer = Buffer.from('\r\n--' + boundary + '--\r\n', 'utf-8');
const body = Buffer.concat([preamble, iconBuffer, footer]);

const uploadRes = await fetch(uploadUrl, {
  method: 'POST',
  headers: {'Content-Type': 'multipart/form-data; boundary=' + boundary},
  body,
});
const uploadJson = await uploadRes.json();
const fileDestUrl = uploadJson.result?.UploadFileRsp?.fileInfoList?.[0]?.fileDestUlr;
console.log('Uploaded, fileDestUrl:', fileDestUrl ? fileDestUrl.slice(0, 60) + '...' : 'NONE');

if (!fileDestUrl) {
  console.log('Upload failed:', JSON.stringify(uploadJson));
  process.exit(1);
}

// 5. Register icon via app-file-info with fileType=0 + sha256
const fiBody = JSON.stringify({
  lang: 'ru-RU',
  fileType: 0,
  files: [{fileName: 'icon.png', fileDestUrl: fileDestUrl, sign: sha256}]
});
console.log('File info body:', fiBody);
const fiRes = await fetch('https://' + DOMAIN + '/api/publish/v2/app-file-info?appId=' + APP_ID, {
  method: 'PUT',
  headers: {'Authorization': 'Bearer ' + token, 'client_id': CLIENT_ID, 'Content-Type': 'application/json'},
  body: fiBody,
});
const fiJson = await fiRes.json();
console.log('File info result:', JSON.stringify(fiJson, null, 2));

// 6. Submit if ok
if (fiJson.ret?.code === 0) {
  console.log('\nIcon set! Submitting...');
  const submitRes = await fetch('https://' + DOMAIN + '/api/publish/v2/app-submit?appId=' + APP_ID, {
    method: 'POST', headers: {'Authorization': 'Bearer ' + token, 'client_id': CLIENT_ID}
  });
  const submitJson = await submitRes.json();
  console.log('Submit result:', JSON.stringify(submitJson));
}
