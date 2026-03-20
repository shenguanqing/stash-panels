/**
 * Netflix 解锁检测
 * 检测当前节点能否访问 Netflix，并识别可用区域
 */

var $httpClient, $done;

const REQUEST_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36',
  'Accept-Language': 'en',
};

function countryCodeToEmoji(code) {
  if (!code) return '';
  code = code.toUpperCase().slice(0, 2);
  return String.fromCodePoint(...[...code].map(c => 127397 + c.charCodeAt(0)));
}

// 与参考脚本完全一致：通过 x-originating-url 响应头提取地区
function innerCheck(filmId) {
  return new Promise((resolve, reject) => {
    $httpClient.get(
      { url: 'https://www.netflix.com/title/' + filmId, headers: REQUEST_HEADERS },
      (error, response, data) => {
        if (error != null) { reject('Error'); return; }
        if (response.status === 403) { reject('Not Available'); return; }
        if (response.status === 404) { resolve('Not Found'); return; }
        if (response.status === 200) {
          const url = response.headers['x-originating-url'] || '';
          let region = url.split('/')[3] || '';
          region = region.split('-')[0];
          if (region === 'title' || region === '') region = 'us';
          resolve(region);
          return;
        }
        reject('Error');
      }
    );
  });
}

async function parseNetflix() {
  return innerCheck(81280792)
    .then(code => {
      if (code === 'Not Found') return innerCheck(80018499);
      const emoji = countryCodeToEmoji(code);
      return Promise.reject({ signal: 'break', result: `已完整解锁，${emoji}${code.toUpperCase()}` });
    })
    .then(code => {
      if (code === 'Not Found') return Promise.reject({ signal: 'break', result: '不可用' });
      const emoji = countryCodeToEmoji(code);
      return Promise.reject({ signal: 'break', result: `仅自制剧，${emoji}${code.toUpperCase()}` });
    })
    .catch(err => {
      if (err?.signal === 'break') return err.result;
      if (err === 'Not Available') return '不可用';
      return '连接失败';
    });
}

(async () => {
  try {
    const content = await parseNetflix();
    $done({ content });
  } catch (e) {
    console.log(`[Error] ${e?.message || JSON.stringify(e)}`);
    $done({ content: '连接失败' });
  }
})();