import crypto from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import forge from 'node-forge';

// --- Config ---
const KEY_ID = '2351029044';
const PRIVATE_KEY_B64 =
  'MIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQCyFp2PsOTl4nergeLAbtn+zBhsdFxM7lryUQPAxYzGcDUTomY1wGdJsALIcTMS0YxXUph9FrB7GeUIkRWvCa0tuF3J9xED3OMT4D/lEJPWG3LPBpol+WsSOPahrA2Z7enO5souj35Y+tT195qknoRciYg6Szk9T8vf+F1GMbQ8TGm/ToyJ3S/GMMl3uX40JQsqU1S9fzIjPAKfyQok1z/HZJFBBOxPVngqFPbuR728vbyxhn/riLueyiQTdFB1M9t4MRtSrycSAhOGEcac7kM6e118G1WsEaw59lUlps68u81QuWzm5shAgCcIDdRjErATQIJoUyJj8anMBj5JsnIZAgMBAAECggEABXbFq0qzXy1BXDD+Psa36AYlirBQQ6j9f9lF+vRksxLuwfU12xjV4nAkybcVaNKmkmhNlurrC7/Z49cluerbVh+FuyRaMIrmqa2z8Ch/zK4nadwrPxaFtzeps4Cmoy4mQguZMPAEoaDCh3BrHXlimL88f4Ne1Hd+Cxdg7z4nqEDn0HFfpWRRY2mNi5c8fWJODe5tDLIjgu+3jfcIEnNky3WAc83iYhiSSWFZjMn2dyGl0bg3F7+xZfs/wQWN72k+K/vpLTD8vClLEEyGcX2T/psedM11R991imNnqrOWU6oqjqDqJBaG7t1W/0PbP6X2/4jCb0MbxlEjcmyMoX4rrQKBgQDgS92VaxacqPu8E0Z2XGu45MA6xNERh/sSQ6tt3HWJFfon8OyApfw3izkt67TtITvjDNu6vU3s086Oh2C5UteeudrDoNoRsiWIbLjJkXdYuO2ZQh0IvDZNi+c/PALLb4DV1DfUjZKu75I5jMr/Fg1iIUnfJ+BuqK6NU/WlRee3BQKBgQDLQrgXdNh9kYSAsLUY4z2DxHqgn8IOxc/JyrXPyMCIVkiWqXXAO8V3mGFAs3H3hbClHE6+sStaHiIJDTsYdaJIPJeSR1gBVczKjdyqajdrU3uduTl1uzaSGmEye0HpnZFCLuEMLI4/ZbX1TEzbieoCKR85OhOn/wFRrdMImgSTBQKBgQDIJOplGlnjEScQfGKz22SEaBrgVh/49M4lThz6u25mFSZT3bgsU/Dr31/2ig24S5+UyzSHPcT7P0ViCYtV04Z0LIP5bN8qSz0Sr3F07EkC8oGR8FzYHpqWN/DxjCsyPR1JsUTgdjQdxclFcUzyskre9bVlW7/4/qxDkFfyUp6hwQKBgQCv/hf5r2FX8CyDZP2ZDAESW4g2Fb3oHpzYw10DCXazVcpKMXZUOSy0bcsfQ4CVajtV6xm/gRXhVJ/xqHQXrJsT4ur2bDGmDk1gwM5k+8z6b/Fj0qIO70fD33VzSUf76EOCw6Z2bQnJmN6hAyy1Fkf5EPQJD+E/H8xblZ9ZHkqBpQKBgQCWHQOm8ZPNBTORaMf6esmY7JoYI3NEzfK5mgwevRB3wtbUO+T5l7NYe5qDWoE3s7EbvOwUy/A23XSRGdsL2sAUXPYGcRbsX7gzK3rZJFeqzzMKU5WXQWeeZbREokQ9VQNKW28gKrkFpM+NzL9COyOrBYcQgJGmw5ZTlfUH+mVbg==';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const apkPath = path.resolve(__dirname, '..', 'app/build/outputs/apk/release/app-release.apk');

// --- Helpers ---

function importPrivateKey(b64) {
  const der = forge.util.createBuffer(forge.util.decode64(b64));
  const asn1 = forge.asn1.fromDer(der);
  const pkcs1Der = forge.util.createBuffer(asn1.value[2].value);
  const rsaKey = forge.pki.privateKeyFromAsn1(forge.asn1.fromDer(pkcs1Der));
  const pem = forge.pki.privateKeyToPem(rsaKey);
  return crypto.createPrivateKey(pem);
}

function formatTimestamp(date) {
  // Use UTC with +00:00 format
  return date.toISOString().replace(/\.\d{3}Z$/, '+00:00');
}

function createSignature(keyId, timestamp, privateKey) {
  const sign = crypto.createSign('RSA-SHA512');
  sign.update(keyId + timestamp);
  sign.end();
  return sign.sign(privateKey, 'base64');
}

async function getAuthToken(keyId, privateKey) {
  const timestamp = formatTimestamp(new Date());
  const signature = createSignature(keyId, timestamp, privateKey);

  const body = JSON.stringify({ keyId, timestamp, signature });

  const res = await fetch('https://public-api.rustore.ru/public/auth/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });

  const json = await res.json();
  if (json.code !== 'OK') {
    throw new Error(`Auth failed: ${json.code} ${json.message || ''}`);
  }

  console.log('✓ JWE token получен (ttl: ' + json.body.ttl + 's)');
  return json.body.jwe;
}

async function getCompanyApps(token) {
  const res = await fetch(
    'https://public-api.rustore.ru/public/v1/application',
    { headers: { 'Public-Token': token } },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Apps list failed: ${res.status} ${text.slice(0, 300)}`);
  }
  const json = await res.json();
  console.log('Apps raw response:', JSON.stringify(json, null, 2).slice(0, 500));
  if (json.code !== 'OK') throw new Error(`Apps list failed: ${json.message}`);
  // body might be an object with content array or direct array
  return json.body?.content || json.body || [];
}

async function uploadApk(token, packageName, versionId, apkPath) {
  const apkBuffer = readFileSync(apkPath);
  const fileName = apkPath.split(/[/\\]/).pop();

  const boundary = '----FormBoundary' + Math.random().toString(36).slice(2);

  const header = Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: application/vnd.android.package-archive\r\n\r\n`,
    'utf-8',
  );
  const footer = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf-8');
  const body = Buffer.concat([header, apkBuffer, footer]);

  const res = await fetch(
    `https://public-api.rustore.ru/public/v1/application/${packageName}/version/${versionId}/apk`,
    {
      method: 'POST',
      headers: {
        'Public-Token': token,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length.toString(),
      },
      body,
    },
  );

  const json = await res.json();
  if (json.code !== 'OK') {
    throw new Error(`Upload failed: ${json.code} ${json.message || JSON.stringify(json)}`);
  }

  console.log('✓ APK загружен');
  return json;
}

async function updateDraft(token, packageName, versionId) {
  const body = JSON.stringify({
    description: 'Aerophone — усилитель звука для людей с нарушениями слуха.',
    shortDescription: 'Усилитель звука для слабослышащих',
    whatIsNew: [
      '- Подписки: на месяц (49₽/49⭐), навсегда (149₽/149⭐), на год (399₽/399⭐)',
      '- Оплата через RuStore и Telegram Stars',
      '- Поддержка Android 7+',
      '- Исправлена совместимость с Android 7',
    ].join('\n'),
    appImages: [],
    categoryIds: [],
    systemRequirements: {
      androidVersion: '7.0',
      ram: 256,
    },
    ageRestriction: {
      age: 0,
      hasPurchase: false,
    },
  });

  const res = await fetch(
    `https://public-api.rustore.ru/public/v1/application/${packageName}/version/${versionId}`,
    {
      method: 'PUT',
      headers: {
        'Public-Token': token,
        'Content-Type': 'application/json',
      },
      body,
    },
  );

  const json = await res.json();
  console.log(`✓ Черновик обновлён: ${json.code}`);
  return json;
}

async function sendToModeration(token, packageName, versionId) {
  const res = await fetch(
    `https://public-api.rustore.ru/public/v1/application/${packageName}/version/${versionId}/commit`,
    {
      method: 'POST',
      headers: { 'Public-Token': token },
    },
  );

  const json = await res.json();
  console.log(`✓ Отправлено на модерацию: ${json.code}`);
  return json;
}

// --- Main ---

async function main() {
  const privateKey = importPrivateKey(PRIVATE_KEY_B64);
  console.log('✓ Приватный ключ загружен');

  const token = await getAuthToken(KEY_ID, privateKey);

  const apps = await getCompanyApps(token);
  if (!apps || apps.length === 0) {
    console.log('✗ Приложения не найдены. Создайте в консоли RuStore.');
    return;
  }

  console.log('Доступные приложения:');
  apps.forEach((a, i) =>
    console.log(`  [${i}] ${a.name} (package: ${a.packageName}, id: ${a.appId})`),
  );

  const app = apps[0];
  const packageName = app.packageName;
  console.log(`\nВыбрано: ${app.appName || app.name} (${packageName})`);

  // Check existing versions
  const verRes = await fetch(
    `https://public-api.rustore.ru/public/v1/application/${packageName}/version`,
    { headers: { 'Public-Token': token } },
  );
  const verJson = await verRes.json();
  const versions = verJson.body?.content || [];
  const hasActive = versions.some(v => v.versionStatus === 'ACTIVE');
  if (!hasActive) {
    console.log('Existing version:', JSON.stringify(versions[0]).slice(0, 500));
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║ Нет активной версии — создайте первый релиз через консоль ║');
    console.log('║ https://console.rustore.ru                                 ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    return;
  }

  console.log('✓ Есть активная версия — создаю черновик...');

  // Delete existing draft if any
  for (const v of versions) {
    if (v.versionStatus === 'DRAFT') {
      console.log(`Удаляю старый черновик ${v.versionId}...`);
      const delRes = await fetch(
        `https://public-api.rustore.ru/public/v1/application/${packageName}/version/${v.versionId}`,
        { method: 'DELETE', headers: { 'Public-Token': token } },
      );
      const delText = await delRes.text();
      console.log(`Delete response: ${delRes.status} ${delText.slice(0, 200)}`);
    }
  }

  const body = JSON.stringify({
    appName: 'AeroPhone',
    appType: 'MAIN',
    categories: ['health'],
    ageLegal: '0+',
    shortDescription: 'Слуховой аппарат и усилитель звука',
    whatsNew: 'Исправлены ограничения бесплатной версии',
  });

  const draftRes = await fetch(
    `https://public-api.rustore.ru/public/v1/application/${packageName}/version`,
    {
      method: 'POST',
      headers: { 'Public-Token': token, 'Content-Type': 'application/json' },
      body,
    },
  );
  const draftText = await draftRes.text();
  const draftJson = JSON.parse(draftText);
  if (draftJson.code !== 'OK') {
    throw new Error(`Draft creation failed: ${draftJson.code} ${JSON.stringify(draftJson)}`);
  }

  const versionId = draftJson.body;
  console.log(`✓ Черновик создан, versionId: ${versionId}`);

  // Upload APK
  await uploadApk(token, packageName, versionId, apkPath);

  // Send to moderation
  await sendToModeration(token, packageName, versionId);

  console.log('\n✓ Приложение отправлено на модерацию в RuStore!');
}

main().catch((err) => {
  console.error('✗ Ошибка:', err.message);
  process.exit(1);
});
