const CLIENT_ID = '1971299567085305024';
const CLIENT_SECRET = 'F3728720303FF0E4A6B58C5AC1E3078F9BCEBC5ECE849D5EC5B3D73369B91173';
const APP_ID = '118008397';
const DOMAIN = 'connect-api.cloud.huawei.com';

const tokenRes = await fetch('https://' + DOMAIN + '/api/oauth2/v1/token', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({client_id: CLIENT_ID, client_secret: CLIENT_SECRET, grant_type: 'client_credentials'})
});
const tokenData = await tokenRes.json();
const token = tokenData.access_token;

// Try 3-4 digit codes that might correspond to categories
// Format: 10XX where XX is category number
// Format: 13XXXX with parentType prefix
const tests = [];

// Try 4-digit codes: 10XX
for (let i = 1; i <= 20; i++) {
  tests.push('10' + String(i).padStart(2, '0')); // 1001, 1002, ... 1020
}
// Try 3-digit codes: 1XX
for (let i = 1; i <= 20; i++) {
  tests.push('1' + String(i).padStart(2, '0')); // 101, 102, ... 120
}
// Try 2-digit codes with 1 prefix
for (let i = 1; i <= 20; i++) {
  tests.push(String(100 + i)); // 101, 102, ... 120 as strings
}
// Try directly 1-20 as strings
for (let i = 1; i <= 20; i++) {
  tests.push(String(i));
}

for (const val of [...new Set(tests)]) {
  try {
    const body = JSON.stringify({childType: val});
    const res = await fetch('https://' + DOMAIN + '/api/publish/v2/app-info?appId=' + APP_ID, {
      method: 'PUT',
      headers: {'Authorization': 'Bearer ' + token, 'client_id': CLIENT_ID, 'Content-Type': 'application/json'},
      body: body,
    });
    const json = await res.json();
    if (json.ret?.code === 0) {
      console.log('ACCEPTED! childType="' + val + '"');
      const check = await fetch('https://' + DOMAIN + '/api/publish/v2/app-info?appId=' + APP_ID, {
        headers: {'Authorization': 'Bearer ' + token, 'client_id': CLIENT_ID}
      });
      const checkJson = await check.json();
      console.log('  Saved:', JSON.stringify(checkJson.appInfo?.childType));
    }
  } catch (e) {}
}

console.log('Done');
