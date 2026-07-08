const CLIENT_ID = '1971299567085305024';
const CLIENT_SECRET = 'F3728720303FF0E4A6B58C5AC1E3078F9BCEBC5ECE849D5EC5B3D73369B91173';
const APP_ID = '118008397';
const DOMAIN = 'connect-api.cloud.huawei.com';

async function cancelReview() {
  const tres = await fetch(`https://${DOMAIN}/api/oauth2/v1/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ grant_type: 'client_credentials', client_id: CLIENT_ID, client_secret: CLIENT_SECRET }),
  });
  const tjson = await tres.json();
  const token = tjson.access_token;
  const headers = { 'Authorization': `Bearer ${token}`, 'client_id': CLIENT_ID, 'Content-Type': 'application/json' };

  // Try cancel endpoint
  const eps = [
    { method: 'POST', path: `/api/publish/v2/app-cancel-submit?appId=${APP_ID}` },
    { method: 'PUT', path: `/api/publish/v2/app-cancel-submit?appId=${APP_ID}` },
    { method: 'POST', path: `/api/publish/v2/app-submit-cancel?appId=${APP_ID}` },
    { method: 'DELETE', path: `/api/publish/v2/app-version?appId=${APP_ID}` },
  ];
  for (const { method, path } of eps) {
    try {
      const opts = { method, headers };
      if (method !== 'DELETE') opts.body = JSON.stringify({});
      const res = await fetch(`https://${DOMAIN}${path}`, opts);
      const text = await res.text();
      console.log(`${method} ${path}: ${res.status} ${text.slice(0, 300)}`);
    } catch (e) { console.log(`${method} ${path}: ERROR ${e.message}`); }
  }
}
cancelReview();
