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

// Upload
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

const fileDestUrl = fi.fileDestUlr;  // the full URL returned by upload
const iconValue = fileDestUrl.replace('https://developerfile-dra.op.hicloud.com/FileServer/getFile/', '');
console.log('Icon value (path only, length:', iconValue.length, '):', iconValue.slice(0, 60) + '...');

// Set icon via language-info
const langBody = {
  lang: 'ru-RU',
  icon: iconValue,
};

const langRes = await fetch('https://' + DOMAIN + '/api/publish/v2/app-language-info?appId=' + APP_ID, {
  method: 'PUT',
  headers: {'Authorization': 'Bearer ' + token, 'client_id': CLIENT_ID, 'Content-Type': 'application/json'},
  body: JSON.stringify(langBody),
});
const langJson = await langRes.json();
console.log('Set icon result:', JSON.stringify(langJson.ret));

if (langJson.ret.code !== 0) {
  process.exit(1);
}

// Verify icon was saved
const checkRes = await fetch('https://' + DOMAIN + '/api/publish/v2/app-info?appId=' + APP_ID + '&releaseType=1', {
  headers: {'Authorization': 'Bearer ' + token, 'client_id': CLIENT_ID}
});
const checkJson = await checkRes.json();
const savedIcon = checkJson.languages?.[0]?.icon;
console.log('Saved icon length:', savedIcon?.length);
console.log('Saved icon (first 60):', savedIcon?.slice(0, 60));

if (savedIcon && savedIcon.length > 0) {
  console.log('\nIcon saved! Submitting...');
  const submitRes = await fetch('https://' + DOMAIN + '/api/publish/v2/app-submit?appId=' + APP_ID, {
    method: 'POST', headers: {'Authorization': 'Bearer ' + token, 'client_id': CLIENT_ID}
  });
  const submitJson = await submitRes.json();
  console.log('Submit result:', JSON.stringify(submitJson));
  if (submitJson.ret.code === 0) {
    console.log('\nSUCCESS! App submitted for review!');
  } else {
    console.log('\nSubmit failed:', submitJson.ret.msg);
  }
} else {
  console.log('\nIcon was NOT saved - still empty');
}
