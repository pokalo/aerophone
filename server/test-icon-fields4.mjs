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

// Get upload URL with suffix png
const urlRes = await fetch('https://' + DOMAIN + '/api/publish/v2/upload-url?appId=' + APP_ID + '&suffix=png&releaseType=1', {
  method: 'GET',
  headers: {'Authorization': 'Bearer ' + token, 'client_id': CLIENT_ID}
});
const { uploadUrl, authCode } = await urlRes.json();

// Upload
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

console.log('fileDestUlr:', fi.fileDestUlr);
console.log('imageResolution:', fi.imageResolution);
console.log('imageResolutionSingature:', fi.imageResolutionSingature?.slice(0, 40) + '...');

// Test: fileDestUlr (typo) as field name with image fields
const body1 = {
  lang: 'ru-RU',
  fileType: 0,
  files: [{
    fileName: 'icon.png',
    fileDestUlr: fi.fileDestUlr,
    imageResolution: fi.imageResolution,
    imageResolutionSingature: fi.imageResolutionSingature
  }]
};

const res1 = await fetch('https://' + DOMAIN + '/api/publish/v2/app-file-info?appId=' + APP_ID, {
  method: 'PUT',
  headers: {'Authorization': 'Bearer ' + token, 'client_id': CLIENT_ID, 'Content-Type': 'application/json'},
  body: JSON.stringify(body1),
});
console.log('Test fileDestUlr:', (await res1.json()).ret);

// Test: fileDestUlr + size
const body2 = {
  lang: 'ru-RU',
  fileType: 0,
  files: [{
    fileName: 'icon.png',
    fileDestUlr: fi.fileDestUlr,
    size: fi.size,
    imageResolution: fi.imageResolution,
    imageResolutionSingature: fi.imageResolutionSingature
  }]
};

const res2 = await fetch('https://' + DOMAIN + '/api/publish/v2/app-file-info?appId=' + APP_ID, {
  method: 'PUT',
  headers: {'Authorization': 'Bearer ' + token, 'client_id': CLIENT_ID, 'Content-Type': 'application/json'},
  body: JSON.stringify(body2),
});
console.log('Test fileDestUlr+size:', (await res2.json()).ret);

// Test: just the exact fields that upload returned, but with fileDestUrl
const body3 = {
  lang: 'ru-RU',
  fileType: 0,
  files: [{
    fileName: 'icon.png',
    fileDestUrl: fi.fileDestUlr,
    size: fi.size,
    imageResolution: fi.imageResolution,
    imageResolutionSingature: fi.imageResolutionSingature
  }]
};

const res3 = await fetch('https://' + DOMAIN + '/api/publish/v2/app-file-info?appId=' + APP_ID, {
  method: 'PUT',
  headers: {'Authorization': 'Bearer ' + token, 'client_id': CLIENT_ID, 'Content-Type': 'application/json'},
  body: JSON.stringify(body3),
});
console.log('Test fileDestUrl+size+sig:', (await res3.json()).ret);
