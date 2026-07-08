const CLIENT_ID = '1971299567085305024';
const CLIENT_SECRET = 'F3728720303FF0E4A6B58C5AC1E3078F9BCEBC5ECE849D5EC5B3D73369B91173';
const APP_ID = '118008397';
const DOMAIN = 'connect-api.cloud.huawei.com';
const { readFileSync } = await import('node:fs');

const tokenRes = await fetch('https://' + DOMAIN + '/api/oauth2/v1/token', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({client_id: CLIENT_ID, client_secret: CLIENT_SECRET, grant_type: 'client_credentials'})
});
const tokenData = await tokenRes.json();
const token = tokenData.access_token;

const iconPath = 'app/src/main/ic_launcher-playstore.png';
const iconBuffer = readFileSync(iconPath);

const urlRes = await fetch('https://' + DOMAIN + '/api/publish/v2/upload-url?appId=' + APP_ID + '&suffix=png&releaseType=1', {
  method: 'GET',
  headers: {'Authorization': 'Bearer ' + token, 'client_id': CLIENT_ID}
});
const { uploadUrl, authCode } = await urlRes.json();

const boundary = '----Boundary' + Date.now().toString(36);
const preamble = Buffer.from(
  '--' + boundary + '\r\nContent-Disposition: form-data; name="authCode"\r\n\r\n' + authCode + '\r\n'
  + '--' + boundary + '\r\nContent-Disposition: form-data; name="fileCount"\r\n\r\n1\r\n'
  + '--' + boundary + '\r\nContent-Disposition: form-data; name="parseType"\r\n\r\n1\r\n'
  + '--' + boundary + '\r\nContent-Disposition: form-data; name="file"; filename="icon.png"\r\nContent-Type: image/png\r\n\r\n',
  'utf-8'
);
const footer = Buffer.from('\r\n--' + boundary + '--\r\n', 'utf-8');
const uploadRes = await fetch(uploadUrl, {
  method: 'POST',
  headers: {'Content-Type': 'multipart/form-data; boundary=' + boundary},
  body: Buffer.concat([preamble, iconBuffer, footer])
});
const uploadJson = await uploadRes.json();
const fi = uploadJson.result?.UploadFileRsp?.fileInfoList?.[0];
console.log('Upload info:', JSON.stringify(fi, null, 2));

// Try both fileDestUrl and fileDestUlr field names
const bodies = [
  {
    lang: 'ru-RU',
    fileType: 0,
    files: [{fileName: 'icon.png', fileDestUrl: fi.fileDestUlr, size: fi.size, imageResolution: fi.imageResolution, imageResolutionSingature: fi.imageResolutionSingature}]
  },
  {
    lang: 'ru-RU',
    fileType: 0,
    files: [{fileName: 'icon.png', fileDestUlr: fi.fileDestUlr, size: fi.size, imageResolution: fi.imageResolution, imageResolutionSingature: fi.imageResolutionSingature}]
  },
  {
    lang: 'ru-RU',
    fileType: 0,
    fileDestUlr: fi.fileDestUlr,
    fileName: 'icon.png',
    imageResolution: fi.imageResolution,
    imageResolutionSingature: fi.imageResolutionSingature
  },
  {
    lang: 'ru-RU',
    fileType: 0,
    files: [{fileName: 'icon.png', fileDestUrl: fi.fileDestUlr, imageResolution: fi.imageResolution, imageResolutionSingature: fi.imageResolutionSingature}]
  },
  {
    lang: 'ru-RU',
    fileType: 0,
    files: [{fileDestUrl: fi.fileDestUlr, imageResolution: fi.imageResolution, imageResolutionSingature: fi.imageResolutionSingature}]
  },
];

for (let i = 0; i < bodies.length; i++) {
  const res = await fetch('https://' + DOMAIN + '/api/publish/v2/app-file-info?appId=' + APP_ID, {
    method: 'PUT',
    headers: {'Authorization': 'Bearer ' + token, 'client_id': CLIENT_ID, 'Content-Type': 'application/json'},
    body: JSON.stringify(bodies[i]),
  });
  const json = await res.json();
  console.log('Test ' + i + ':', json.ret?.code, json.ret?.msg?.slice(0, 100));
}
