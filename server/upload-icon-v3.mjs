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

// Get upload URL
const urlRes = await fetch('https://' + DOMAIN + '/api/publish/v2/upload-url?appId=' + APP_ID + '&suffix=png&releaseType=1', {
  method: 'GET', headers: {'Authorization': 'Bearer ' + token, 'client_id': CLIENT_ID}
});
const { uploadUrl, authCode } = await urlRes.json();

// Upload with parseType=1 to get imageResolution and imageResolutionSingature
const boundary = '----Boundary' + Date.now().toString(36);
const preamble = Buffer.from(
  '--' + boundary + '\r\nContent-Disposition: form-data; name="authCode"\r\n\r\n' + authCode + '\r\n'
  + '--' + boundary + '\r\nContent-Disposition: form-data; name="fileCount"\r\n\r\n1\r\n'
  + '--' + boundary + '\r\nContent-Disposition: form-data; name="parseType"\r\n\r\n1\r\n'
  + '--' + boundary + '\r\nContent-Disposition: form-data; name="file"; filename="icon.png"\r\nContent-Type: image/png\r\n\r\n', 'utf-8');
const footer = Buffer.from('\r\n--' + boundary + '--\r\n', 'utf-8');
const uploadRes = await fetch(uploadUrl, {method: 'POST', headers: {'Content-Type': 'multipart/form-data; boundary=' + boundary}, body: Buffer.concat([preamble, iconBuffer, footer])});
const uploadJson = await uploadRes.json();
console.log('Upload full response:', JSON.stringify(uploadJson, null, 2));

const fileInfo = uploadJson.result?.UploadFileRsp?.fileInfoList?.[0];
if (!fileInfo) {
  console.log('Upload failed');
  process.exit(1);
}

const { fileDestUlr, imageResolution, imageResolutionSingature, size } = fileInfo;
console.log('\nfileDestUlr:', fileDestUlr?.slice(0, 60));
console.log('imageResolution:', imageResolution);
console.log('imageResolutionSingature:', imageResolutionSingature);

// Now try with these fields
const fiBody = {
  lang: 'ru-RU',
  fileType: 0,
  files: [{
    fileName: 'icon.png',
    fileDestUrl: fileDestUlr,
    size,
    imageResolution,
    imageResolutionSingature
  }]
};

const fiRes = await fetch('https://' + DOMAIN + '/api/publish/v2/app-file-info?appId=' + APP_ID, {
  method: 'PUT',
  headers: {'Authorization': 'Bearer ' + token, 'client_id': CLIENT_ID, 'Content-Type': 'application/json'},
  body: JSON.stringify(fiBody),
});
const fiJson = await fiRes.json();
console.log('\nFile info result:', JSON.stringify(fiJson, null, 2));

// Submit
if (fiJson.ret?.code === 0) {
  console.log('\nIcon set! Submitting...');
  const submitRes = await fetch('https://' + DOMAIN + '/api/publish/v2/app-submit?appId=' + APP_ID, {
    method: 'POST', headers: {'Authorization': 'Bearer ' + token, 'client_id': CLIENT_ID}
  });
  const submitJson = await submitRes.json();
  console.log('Submit result:', JSON.stringify(submitJson));
}
