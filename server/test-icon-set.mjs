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

const iconUrl = fi.fileDestUlr;
const iconPathOnly = iconUrl.replace('https://developerfile-dra.op.hicloud.com/FileServer/getFile/', '');
console.log('Icon path (length:', iconPathOnly.length, ')');

// Try setting icon with ALL language fields present
const fullBody = {
  lang: 'ru-RU',
  appName: 'AeroPhone',
  appDesc: 'Aerophone — усилитель звука с эквалайзером и шумоподавлением',
  briefInfo: 'Слуховой аппарат и усилитель звука',
  newFeatures: 'Новая иконка и исправления',
  icon: iconPathOnly,
};

const res = await fetch('https://' + DOMAIN + '/api/publish/v2/app-language-info?appId=' + APP_ID, {
  method: 'PUT',
  headers: {'Authorization': 'Bearer ' + token, 'client_id': CLIENT_ID, 'Content-Type': 'application/json'},
  body: JSON.stringify(fullBody),
});
const json = await res.json();
console.log('Full update result:', JSON.stringify(json.ret));

// Check if icon was saved
const checkRes = await fetch('https://' + DOMAIN + '/api/publish/v2/app-info?appId=' + APP_ID + '&releaseType=1', {
  headers: {'Authorization': 'Bearer ' + token, 'client_id': CLIENT_ID}
});
const checkJson = await checkRes.json();
console.log('Icon value after update:', JSON.stringify(checkJson.languages?.[0]?.icon));
console.log('AppIcon value:', JSON.stringify(checkJson.languages?.[0]?.deviceMaterials?.[0]?.appIcon));

// Try setting via app-info with releaseType=1
const appInfoBody = {
  icon: iconPathOnly,
};
const appInfoRes = await fetch('https://' + DOMAIN + '/api/publish/v2/app-info?appId=' + APP_ID + '&releaseType=1', {
  method: 'PUT',
  headers: {'Authorization': 'Bearer ' + token, 'client_id': CLIENT_ID, 'Content-Type': 'application/json'},
  body: JSON.stringify(appInfoBody),
});
const appInfoJson = await appInfoRes.json();
console.log('\napp-info update result:', JSON.stringify(appInfoJson.ret));

// Re-check
const checkRes2 = await fetch('https://' + DOMAIN + '/api/publish/v2/app-info?appId=' + APP_ID + '&releaseType=1', {
  headers: {'Authorization': 'Bearer ' + token, 'client_id': CLIENT_ID}
});
const checkJson2 = await checkRes2.json();
console.log('Icon after app-info update:', JSON.stringify(checkJson2.languages?.[0]?.icon));
