const CLIENT_ID = '1971299567085305024';
const CLIENT_SECRET = 'F3728720303FF0E4A6B58C5AC1E3078F9BCEBC5ECE849D5EC5B3D73369B91173';
const APP_ID = '118008397';
const DOMAIN = 'connect-api.cloud.huawei.com';

const tokenRes = await fetch('https://' + DOMAIN + '/api/oauth2/v1/token', {
  method: 'POST', headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({client_id: CLIENT_ID, client_secret: CLIENT_SECRET, grant_type: 'client_credentials'})
});
const tokenData = await tokenRes.json();
const token = tokenData.access_token;

// Try different field names for icon via app-info update
const tests = [
  {appPng: 'test'},
  {appIcon: 'test'},
  {icon: 'test'},
  {icons: [{deviceType: 4, appIcon: 'test'}]},
];

for (const t of tests) {
  const res = await fetch('https://' + DOMAIN + '/api/publish/v2/app-info?appId=' + APP_ID, {
    method: 'PUT',
    headers: {'Authorization': 'Bearer ' + token, 'client_id': CLIENT_ID, 'Content-Type': 'application/json'},
    body: JSON.stringify(t),
  });
  const json = await res.json();
  console.log(JSON.stringify(t) + ' ->', json.ret?.code === 0 ? 'OK' : json.ret?.msg?.slice(0, 100));
}

// Also try app-info with releaseType=1
const fileDestUrl = 'https://developerfile-dra.op.hicloud.com/FileServer/getFile/5/appAttachtemp/20260612/appAttach/022/922/081/0030375000022922081.20260612231119.95519897384083572923528814202966:20260612231120:2500:36A3824281930B25F0D6EF76504BD2BEEE479752ED3CDB8BCE350B2481A7A08D.png';

for (const field of ['appPng', 'appIcon', 'icon']) {
  const body = JSON.stringify({[field]: fileDestUrl});
  const res = await fetch('https://' + DOMAIN + '/api/publish/v2/app-info?appId=' + APP_ID + '&releaseType=1', {
    method: 'PUT',
    headers: {'Authorization': 'Bearer ' + token, 'client_id': CLIENT_ID, 'Content-Type': 'application/json'},
    body: body,
  });
  const json = await res.json();
  console.log('releaseType=1 ' + field + ':', json.ret?.code === 0 ? 'OK' : json.ret?.msg?.slice(0, 100));
}

// Check current state
const check = await fetch('https://' + DOMAIN + '/api/publish/v2/app-info?appId=' + APP_ID, {
  headers: {'Authorization': 'Bearer ' + token, 'client_id': CLIENT_ID}
});
const json = await check.json();
console.log('Languages:', JSON.stringify(json.languages?.map(l => ({icon: l.icon, appIcon: l.deviceMaterials?.[0]?.appIcon}))));
