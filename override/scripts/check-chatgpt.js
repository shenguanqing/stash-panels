/**
 * ChatGPT / OpenAI 访问检测
 * 检测是否能访问 OpenAI 服务，以及是否支持 API 访问
 */

const urlWeb = 'https://chat.openai.com/';
const urlIos = 'https://ios.chat.openai.com/';
const urlApi = 'https://api.openai.com/v1/models';

const headers = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

let done = 0;
let webOk = false;
let apiOk = false;
let blocked = false;

function finish() {
  done++;
  if (done < 2) return;

  if (blocked) {
    $done({ title: 'ChatGPT', content: '🚫 所在地区不支持', icon: 'xmark.circle', 'icon-color': '#c0392b' });
  } else if (webOk && apiOk) {
    $done({ title: 'ChatGPT', content: '✅ Web + API 均可用', icon: 'bubble.left.fill', 'icon-color': '#10a37f' });
  } else if (webOk) {
    $done({ title: 'ChatGPT', content: '✅ Web 可访问', icon: 'bubble.left', 'icon-color': '#10a37f' });
  } else if (apiOk) {
    $done({ title: 'ChatGPT', content: '✅ API 可访问', icon: 'network', 'icon-color': '#10a37f' });
  } else {
    $done({ title: 'ChatGPT', content: '❌ 连接失败', icon: 'xmark.circle', 'icon-color': '#c0392b' });
  }
}

// 检测网页端
$httpClient.get({ url: urlWeb, headers, timeout: 10 }, (error, response) => {
  if (!error && response) {
    const body = response.body || '';
    const status = response.status;
    if (status === 403 || body.includes('not available') || body.includes('VPN')) {
      blocked = true;
    } else if (status === 200 || status === 302) {
      webOk = true;
    }
  }
  finish();
});

// 检测 API 端（未授权返回 401 说明可达，403/blocked 说明地区限制）
$httpClient.get({ url: urlApi, headers, timeout: 10 }, (error, response) => {
  if (!error && response) {
    const status = response.status;
    // 401 = 无 key 但服务可达; 200 = 完全可用
    if (status === 200 || status === 401) {
      apiOk = true;
    } else if (status === 403) {
      blocked = true;
    }
  }
  finish();
});
