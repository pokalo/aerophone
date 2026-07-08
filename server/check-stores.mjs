import crypto from 'node:crypto';
import forge from 'node-forge';

// --- RuStore ---
const KEY_ID = '2351029044';
const PRIVATE_KEY_B64 =
  'MIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQCyFp2PsOTl4nergeLAbtn+zBhsdFxM7lryUQPAxYzGcDUTomY1wGdJsALIcTMS0YxXUph9FrB7GeUIkRWvCa0tuF3J9xED3OMT4D/lEJPWG3LPBpol+WsSOPahrA2Z7enO5souj35Y+tT195qknoRciYg6Szk9T8vf+F1GMbQ8TGm/ToyJ3S/GMMl3uX40JQsqU1S9fzIjPAKfyQok1z/HZJFBBOxPVngqFPbuR728vbyxhn/riLueyiQTdFB1M9t4MRtSrycSAhOGEcac7kM6e118G1WsEaw59lUlps68u81QuWzm5shAgCcIDdRjErATQIJoUyJj8anMBj5JsnIZAgMBAAECggEABXbFq0qzXy1BXDD+Psa36AYlirBQQ6j9f9lF+vRksxLuwfU12xjV4nAkybcVaNKmkmhNlurrC7/Z49cluerbVh+FuyRaMIrmqa2z8Ch/zK4nadwrPxaFtzeps4Cmoy4mQguZMPAEoaDCh3BrHXlimL88f4Ne1Hd+Cxdg7z4nqEDn0HFfpWRRY2mNi5c8fWJODe5tDLIjgu+3jfcIEnNky3WAc83iYhiSSWFZjMn2dyGl0bg3F7+xZfs/wQWN72k+K/vpLTD8vClLEEyGcX2T/psedM11R991imNnqrOWU6oqjqDqJBaG7t1W/0PbP6X2/4jCb0MbxlEjcmyMoX4rrQKBgQDgS92VaxacqPu8E0Z2XGu45MA6xNERh/sSQ6tt3HWJFfon8OyApfw3izkt67TtITvjDNu6vU3s086Oh2C5UteeudrDoNoRsiWIbLjJkXdYuO2ZQh0IvDZNi+c/PALLb4DV1DfUjZKu75I5jMr/Fg1iIUnfJ+BuqK6NU/WlRee3BQKBgQDLQrgXdNh9kYSAsLUY4z2DxHqgn8IOxc/JyrXPyMCIVkiWqXXAO8V3mGFAs3H3hbClHE6+sStaHiIJDTsYdaJIPJeSR1gBVczKjdyqajdrU3uduTl1uzaSGmEye0HpnZFCLuEMLI4/ZbX1TEzbieoCKR85OhOn/wFRrdMImgSTBQKBgQDIJOplGlnjEScQfGKz22SEaBrgVh/49M4lThz6u25mFSZT3bgsU/Dr31/2ig24S5+UyzSHPcT7P0ViCYtV04Z0LIP5bN8qSz0Sr3F07EkC8oGR8FzYHpqWN/DxjCsyPR1JsUTgdjQdxclFcUzyskre9bVlW7/4/qxDkFfyUp6hwQKBgQCv/hf5r2FX8CyDZP2ZDAESW4g2Fb3oHpzYw10DCXazVcpKMXZUOSy0bcsfQ4CVajtV6xm/gRXhVJ/xqHQXrJsT4ur2bDGmDk1gwM5k+8z6b/Fj0qIO70fD33VzSUf76EOCw6Z2bQnJmN6hAyy1Fkf5EPQJD+E/H8xblZ9ZHkqBpQKBgQCWHQOm8ZPNBTORaMf6esmY7JoYI3NEzfK5mgwevRB3wtbUO+T5l7NYe5qDWoE3s7EbvOwUy/A23XSRGdsL2sAUXPYGcRbsX7gzK3rZJFeqzzMKU5WXQWeeZbREokQ9VQNKW28gKrkFpM+NzL9COyOrBYcQgJGmw5ZTlfUH+mVbg==';

function importPrivateKey(b64) {
  const der = forge.util.createBuffer(forge.util.decode64(b64));
  const asn1 = forge.asn1.fromDer(der);
  const pkcs1Der = forge.util.createBuffer(asn1.value[2].value);
  const rsaKey = forge.pki.privateKeyFromAsn1(forge.asn1.fromDer(pkcs1Der));
  const pem = forge.pki.privateKeyToPem(rsaKey);
  return crypto.createPrivateKey(pem);
}

function formatTimestamp(date) {
  return date.toISOString().replace(/\.\d{3}Z$/, '+00:00');
}

function createSignature(keyId, timestamp, privateKey) {
  const sign = crypto.createSign('RSA-SHA512');
  sign.update(keyId + timestamp);
  sign.end();
  return sign.sign(privateKey, 'base64');
}

async function checkRustore() {
  const privateKey = importPrivateKey(PRIVATE_KEY_B64);
  const timestamp = formatTimestamp(new Date());
  const signature = createSignature(KEY_ID, timestamp, privateKey);
  const res = await fetch('https://public-api.rustore.ru/public/auth/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keyId: KEY_ID, timestamp, signature }),
  });
  const json = await res.json();
  if (json.code !== 'OK') throw new Error('RuStore auth failed: ' + json.code);
  const token = json.body.jwe;

  const appsRes = await fetch('https://public-api.rustore.ru/public/v1/application', {
    headers: { 'Public-Token': token },
  });
  const appsJson = await appsRes.json();
  if (appsJson.code !== 'OK') throw new Error('Apps list failed: ' + appsJson.code);

  const appsList = appsJson.body?.content || appsJson.body || [];
  const app = appsList.find(a => a.packageName === 'com.hearassist.app');
  console.log('\n=== RuStore ===');
  if (!app) {
    console.log('Приложение не найдено в списке. Все приложения:');
    appsList.forEach(a => console.log(' -', a.packageName, a.versionName));
    return;
  }
  console.log('Full app data:', JSON.stringify(app, null, 2).slice(0, 3000));
}

// --- Huawei ---
const CLIENT_ID = '1971299567085305024';
const CLIENT_SECRET = 'F3728720303FF0E4A6B58C5AC1E3078F9BCEBC5ECE849D5EC5B3D73369B91173';
const APP_ID = '118008397';
const DOMAIN = 'connect-api.cloud.huawei.com';

async function checkHuawei() {
  const tokenRes = await fetch(`https://${DOMAIN}/api/oauth2/v1/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ grant_type: 'client_credentials', client_id: CLIENT_ID, client_secret: CLIENT_SECRET }),
  });
  const tokenJson = await tokenRes.json();
  if (!tokenJson.access_token) throw new Error('Huawei auth failed: ' + JSON.stringify(tokenJson));
  const token = tokenJson.access_token;

  const infoRes = await fetch(`https://${DOMAIN}/api/publish/v2/app-info?appId=${APP_ID}`, {
    headers: { 'Authorization': `Bearer ${token}`, 'client_id': CLIENT_ID },
  });
  const info = await infoRes.json();
  if (info.ret?.code !== 0) throw new Error('App info failed: ' + JSON.stringify(info));

  console.log('\n=== Huawei AppGallery ===');
  console.log('Full response:', JSON.stringify(info, null, 2).slice(0, 3000));

  // Also check version list
  const verRes = await fetch(`https://${DOMAIN}/api/publish/v2/app-version-list?appId=${APP_ID}`, {
    headers: { 'Authorization': `Bearer ${token}`, 'client_id': CLIENT_ID },
  });
  const verJson = await verRes.json();
  console.log('Versions response:', JSON.stringify(verJson, null, 2).slice(0, 2000));
}

async function main() {
  try { await checkRustore(); } catch (e) { console.error('\nRuStore error:', e.message); }
  try { await checkHuawei(); } catch (e) { console.error('\nHuawei error:', e.message); }
}
main();
