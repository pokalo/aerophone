import crypto from 'node:crypto';

const CLIENT_ID = '1971299567085305024';
const CLIENT_SECRET = 'F3728720303FF0E4A6B58C5AC1E3078F9BCEBC5ECE849D5EC5B3D73369B91173';
const APP_ID = '118008397';
const DOMAIN = 'connect-api.cloud.huawei.com';

async function check() {
  const tres = await fetch(`https://${DOMAIN}/api/oauth2/v1/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ grant_type: 'client_credentials', client_id: CLIENT_ID, client_secret: CLIENT_SECRET }),
  });
  const tjson = await tres.json();
  const token = tjson.access_token;

  // Get app info
  const res = await fetch(`https://${DOMAIN}/api/publish/v2/app-info?appId=${APP_ID}`, {
    headers: { 'Authorization': `Bearer ${token}`, 'client_id': CLIENT_ID },
  });
  const info = await res.json();

  console.log('releaseState:', info?.appInfo?.releaseState);
  console.log('version:', info?.appInfo?.versionNumber + ' (code ' + info?.appInfo?.versionCode + ')');
  console.log('auditStatus:', info?.auditInfo?.auditStatus || '—');
  console.log('auditTime:', info?.auditInfo?.auditTime || '—');
  console.log('auditOpinion (first 200):', (info?.auditInfo?.auditOpinion || '').slice(0, 200));
}
check();
