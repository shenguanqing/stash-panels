/**
 * Google Gemini 访问检测
 * 检测是否能访问 Gemini Web 及 API 服务
 */

const urlWeb = 'https://gemini.google.com/';
const urlApi = 'https://generativelanguage.googleapis.com/v1beta/models';

const headers = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};

let done = 0;
let webOk = false;
let apiOk = false;
let blocked = false;
let region = '';

function finish() {
  done++;
  if (done < 2) return;

  if (blocked) {
    $done({ title: 'Gemini', content: '🚫 所在地区不支持', icon: 'xmark.circle', 'icon-color': '#c0392b' });
  } else if (webOk || apiOk) {
    const access = [];
    if (webOk) access.push('Web');
    if (apiOk) access.push('API');
    const regionLabel = region ? ` [${region}]` : '';
    $done({
      title: 'Gemini',
      content: `✅ ${access.join(' + ')} 可用${regionLabel}`,
      icon: 'sparkles',
      'icon-color': '#1a73e8',
    });
  } else {
    $done({ title: 'Gemini', content: '❌ 连接失败', icon: 'xmark.circle', 'icon-color': '#c0392b' });
  }
}

// 检测网页端
$httpClient.get({ url: urlWeb, headers, timeout: 10 }, (error, response) => {
  if (!error && response) {
    const body = response.body || '';
    const status = response.status;

    // 提取地区
    const regionMatch = body.match(/"countryCode"\s*:\s*"([A-Z]{2})"/);
    if (regionMatch) region = regionMatch[1];

    if (status === 200 && !body.includes('not available') && !body.includes('unavailable')) {
      webOk = true;
    } else if (status === 403 || body.includes('not available in your country')) {
      blocked = true;
    }
  }
  finish();
});

// 检测 API 端（401 = 无 key 但可达）
$httpClient.get({ url: urlApi, headers, timeout: 10 }, (error, response) => {
  if (!error && response) {
    const status = response.status;
    if (status === 200 || status === 400 || status === 401) {
      apiOk = true;
    } else if (status === 403) {
      // 403 可能是地区块，但也可能是 key 问题，不直接标记为 blocked
    }
  }
  finish();
});
