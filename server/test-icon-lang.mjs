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

// Get upload URL & upload with parseType=1
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

// Try: set icon via app-language-info update with all possible icon-related fields
const langBody = {
  lang: 'ru-RU',
  appName: 'AeroPhone',
  appDesc: 'Aerophone — усилитель звука и слуховой аппарат с шумоподавлением, 5-полосным эквалайзером и лимитером. Преврати свой смартфон в профессиональный слуховой ассистент.\n\nВозможности:\n• Усиление звука до 200%\n• 5-полосный эквалайзер (60 Гц – 16 кГц)\n• Шумоподавление\n• Лимитер для защиты слуха\n• Регулировка баланса L/R\n• Таймер сна\n• Яркие оповещения о шуме\n• Моно-режим\n\nПодходит для людей с нарушениями слуха. Не является медицинским прибором.',
  briefInfo: 'Слуховой аппарат и усилитель звука',
  newFeatures: '- Обновлённый интерфейс премиум-функций\n- Яркая иконка приложения\n- Исправлены ограничения бесплатной версии',
  icon: fi.fileDestUlr,
  deviceMaterials: [{
    deviceType: 4,
    appIcon: fi.fileDestUlr
  }]
};

console.log('Sending language info with icon fields...');
const langRes = await fetch('https://' + DOMAIN + '/api/publish/v2/app-language-info?appId=' + APP_ID, {
  method: 'PUT',
  headers: {'Authorization': 'Bearer ' + token, 'client_id': CLIENT_ID, 'Content-Type': 'application/json'},
  body: JSON.stringify(langBody),
});
const langJson = await langRes.json();
console.log('Language info result:', JSON.stringify(langJson));

// Verify by checking app info again
const checkRes = await fetch('https://' + DOMAIN + '/api/publish/v2/app-info?appId=' + APP_ID + '&releaseType=1', {
  headers: {'Authorization': 'Bearer ' + token, 'client_id': CLIENT_ID}
});
const checkJson = await checkRes.json();
console.log('Icon field value:', checkJson.languages?.[0]?.icon?.slice(0, 60));
