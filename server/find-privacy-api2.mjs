const CLIENT_ID = '1971299567085305024';
const CLIENT_SECRET = 'F3728720303FF0E4A6B58C5AC1E3078F9BCEBC5ECE849D5EC5B3D73369B91173';
const APP_ID = '118008397';
const DOMAIN = 'connect-api.cloud.huawei.com';

async function tryMore() {
  const tres = await fetch(`https://${DOMAIN}/api/oauth2/v1/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ grant_type: 'client_credentials', client_id: CLIENT_ID, client_secret: CLIENT_SECRET }),
  });
  const tjson = await tres.json();
  const token = tjson.access_token;
  const headers = { 'Authorization': `Bearer ${token}`, 'client_id': CLIENT_ID, 'Content-Type': 'application/json' };

  // Try v1 and v3 paths
  const eps = [
    `/api/publish/v1/app-privacy?appId=${APP_ID}`,
    `/api/publish/v2/privacy-tag-info?appId=${APP_ID}`,
    `/api/publish/v2/privacy-info?appId=${APP_ID}`,
  ];
  for (const ep of eps) {
    try {
      const res = await fetch(`https://${DOMAIN}${ep}`, { headers });
      const text = await res.text();
      console.log(`GET ${ep}: ${res.status} ${text.slice(0, 200)}`);
    } catch (e) { console.log(`GET ${ep}: ERROR ${e.message}`); }
  }

  // Also try to include privacy fields in app-info PUT
  const body = JSON.stringify({
    publishCountry: 'RU',
    privacyPolicy: 'https://pokalo.github.io/aerophone/privacy-policy.html',
    contentRate: '{"HW":"3+"}',
    dataProcessingDeclarations: JSON.stringify([{
      dataType: 'MICROPHONE',
      dataUsage: 'APP_FUNCTIONALITY',
      dataIsShared: false
    }])
  });
  try {
    const res = await fetch(`https://${DOMAIN}/api/publish/v2/app-info?appId=${APP_ID}&releaseType=1`, {
      method: 'PUT', headers, body
    });
    const text = await res.text();
    console.log(`\nPUT app-info with privacy: ${res.status} ${text.slice(0, 500)}`);
  } catch (e) { console.log(`PUT privacy: ERROR ${e.message}`); }
}
tryMore();
