import crypto from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// --- Config ---
const CLIENT_ID = '1971299567085305024';     // из консоли: Users and permissions → Connect API → Client ID
const CLIENT_SECRET = 'F3728720303FF0E4A6B58C5AC1E3078F9BCEBC5ECE849D5EC5B3D73369B91173'; // из консоли: Users and permissions → Connect API → Key
const APP_ID = '118008397';        // из консоли: My apps → App information → App ID

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const apkPath = path.resolve(__dirname, '..', 'app/build/outputs/apk/release/app-release.apk');

const DOMAIN = 'connect-api.cloud.huawei.com'; // China (global) region

// --- Helpers ---

async function getToken(clientId, clientSecret) {
  const res = await fetch(`https://${DOMAIN}/api/oauth2/v1/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  const json = await res.json();
  if (json.access_token) {
    console.log('✓ Токен получен');
    return json.access_token;
  }
  throw new Error(`Auth failed: ${JSON.stringify(json)}`);
}

async function getUploadUrl(token, appId) {
  const url = `https://${DOMAIN}/api/publish/v2/upload-url?appId=${appId}&suffix=apk&releaseType=1`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'client_id': CLIENT_ID,
    },
  });

  const text = await res.text();
  const json = JSON.parse(text);
  if (json.ret?.code !== 0) {
    throw new Error(`Get upload URL failed: ${JSON.stringify(json)}`);
  }

  console.log('✓ URL для загрузки получен');
  return json;
}

async function uploadApk(uploadUrl, authCode, apkPath) {
  const apkBuffer = readFileSync(apkPath);

  const boundary = '----FormBoundary' + Math.random().toString(36).slice(2);

  const parts = [
    `--${boundary}\r\nContent-Disposition: form-data; name="authCode"\r\n\r\n${authCode}`,
    `--${boundary}\r\nContent-Disposition: form-data; name="fileCount"\r\n\r\n1`,
    `--${boundary}\r\nContent-Disposition: form-data; name="parseType"\r\n\r\n1`,
    `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="app-release.apk"\r\nContent-Type: application/vnd.android.package-archive\r\n\r\n`,
  ];

  // Build body manually
  const preamble = parts.slice(0, 3).map(p => Buffer.from(p + '\r\n', 'utf-8'));
  const fileHeader = Buffer.from(parts[3], 'utf-8');
  const fileFooter = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf-8');

  const body = Buffer.concat([...preamble, fileHeader, apkBuffer, fileFooter]);

  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    },
    body,
  });

  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }

  if (res.status === 200) {
    console.log('✓ APK загружен');
    return json;
  }

  throw new Error(`Upload failed: ${res.status} ${JSON.stringify(json).slice(0, 300)}`);
}

async function updateAppFileInfo(token, appId, uploadResponse, apkPath) {
  const apkBuffer = readFileSync(apkPath);
  const size = apkBuffer.length;
  const fileName = path.basename(apkPath);
  const fileDestUrl = uploadResponse.result.UploadFileRsp.fileInfoList[0].fileDestUlr;

  const body = JSON.stringify({
    fileType: '5',
    files: [{
      fileName,
      fileDestUrl,
      size: size.toString(),
    }],
  });

  const res = await fetch(
    `https://${DOMAIN}/api/publish/v2/app-file-info?appId=${appId}&releaseType=1`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'client_id': CLIENT_ID,
        'Content-Type': 'application/json',
      },
      body,
    },
  );

  const json = await res.json();
  if (json.ret?.code !== 0) {
    throw new Error(`Update file info failed: ${JSON.stringify(json)}`);
  }

  console.log('✓ Информация о файле обновлена');
  return json;
}

async function getAppInfo(token, appId) {
  const res = await fetch(
    `https://${DOMAIN}/api/publish/v2/app-info?appId=${appId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'client_id': CLIENT_ID,
      },
    },
  );
  const json = await res.json();
  if (json.ret?.code !== 0) {
    throw new Error(`Get app info failed: ${JSON.stringify(json)}`);
  }
  console.log('✓ Информация о приложении получена');
  return json;
}

async function updateAppInfo(token, appId) {
  const body = JSON.stringify({
    publishCountry: 'RU',
    privacyPolicy: 'https://pokalo.github.io/aerophone/privacy-policy.html',
  });

  const res = await fetch(
    `https://${DOMAIN}/api/publish/v2/app-info?appId=${appId}&releaseType=1`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'client_id': CLIENT_ID,
        'Content-Type': 'application/json',
      },
      body,
    },
  );

  const json = await res.json();
  if (json.ret?.code !== 0) {
    throw new Error(`Update app info failed: ${JSON.stringify(json)}`);
  }

  console.log('✓ Информация о приложении обновлена');
  return json;
}

async function updateAppCategory(token, appId) {
  const body = JSON.stringify({
    kindSubTags: [1],
    parentType: 13,
  });

  const res = await fetch(
    `https://${DOMAIN}/api/publish/v2/app-info?appId=${appId}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'client_id': CLIENT_ID,
        'Content-Type': 'application/json',
      },
      body,
    },
  );

  const json = await res.json();
  if (json.ret?.code !== 0) {
    throw new Error(`Update app category failed: ${JSON.stringify(json)}`);
  }

  console.log('✓ Категория приложения обновлена');
  return json;
}

async function updateLanguageInfo(token, appId) {
  const body = JSON.stringify({
    lang: 'ru-RU',
    appName: 'AeroPhone',
    appDesc: 'Aerophone — усилитель звука и слуховой аппарат с шумоподавлением, 5-полосным эквалайзером и лимитером. Преврати свой смартфон в профессиональный слуховой ассистент.\n\nВозможности:\n• Усиление звука до 200%\n• 5-полосный эквалайзер (60 Гц – 16 кГц)\n• Шумоподавление\n• Лимитер для защиты слуха\n• Регулировка баланса L/R\n• Таймер сна\n• Яркие оповещения о шуме\n• Моно-режим\n\nПодходит для людей с нарушениями слуха. Не является медицинским прибором.',
    briefInfo: 'Слуховой аппарат и усилитель звука',
    newFeatures: '- Добавлена контактная информация службы поддержки\n- Улучшена обработка ошибок при оплате\n- Обновлён интерфейс',
  });

  const res = await fetch(
    `https://${DOMAIN}/api/publish/v2/app-language-info?appId=${appId}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'client_id': CLIENT_ID,
        'Content-Type': 'application/json',
      },
      body,
    },
  );

  const json = await res.json();
  if (json.ret?.code !== 0) {
    throw new Error(`Update language info failed: ${JSON.stringify(json)}`);
  }

  console.log('✓ Локализация обновлена');
  return json;
}

async function submitForReview(token, appId) {
  const maxRetries = 12;
  for (let i = 0; i < maxRetries; i++) {
    const res = await fetch(
      `https://${DOMAIN}/api/publish/v2/app-submit?appId=${appId}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'client_id': CLIENT_ID,
        },
      },
    );

  const json = await res.json();
    const code = json.ret?.code;

    if (code === 0) {
      console.log('✓ Отправлено на модерацию');
      return json;
    }

    if (code === 204144727) {
      console.log(`  Компиляция... попытка ${i + 1}/${maxRetries}`);
      await new Promise(r => setTimeout(r, 20000));
      continue;
    }

    throw new Error(`Submit failed: ${JSON.stringify(json)}`);
  }
  throw new Error('Submit failed: время компиляции истекло');
}

// --- Main ---

async function main() {
  if (!CLIENT_ID || !CLIENT_SECRET || !APP_ID) {
    console.log('✗ Заполните CLIENT_ID, CLIENT_SECRET и APP_ID в начале скрипта.');
    console.log('');
    console.log('Как получить:');
    console.log('  1. Зайдите в https://developer.huawei.com/consumer/en/service/josp/agc/index.html');
    console.log('  2. Users and permissions → Connect API → Create');
    console.log('  3. Выберите роль "App Publishing"');
    console.log('  4. Скопируйте Client ID и Key в скрипт');
    console.log('  5. My apps → выберите приложение → App information → скопируйте App ID');
    return;
  }

  console.log('Начинаю публикацию в Huawei AppGallery...\n');

  const token = await getToken(CLIENT_ID, CLIENT_SECRET);

  // Обновляем инфо (приложение не на ревью, если перезаливаем)
  await updateAppInfo(token, APP_ID);
  await updateAppCategory(token, APP_ID);
  await updateLanguageInfo(token, APP_ID);

  const uploadInfo = await getUploadUrl(token, APP_ID);
  const { uploadUrl, authCode } = uploadInfo;

  const uploadRes = await uploadApk(uploadUrl, authCode, apkPath);

  await updateAppFileInfo(token, APP_ID, uploadRes, apkPath);

  await submitForReview(token, APP_ID);

  console.log('\n✓ Приложение отправлено на модерацию в Huawei AppGallery!');
}

main().catch((err) => {
  console.error('✗ Ошибка:', err.message);
  process.exit(1);
});
