/**
 * YouTube Premium 区域检测
 * 检测节点是否可访问 YouTube 并识别 Premium 可用区域
 */

const url = 'https://www.youtube.com/premium';

const headers = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};

$httpClient.get({ url, headers, timeout: 10 }, (error, response) => {
  if (error || !response) {
    $done({ title: 'YouTube', content: '❌ 连接失败', icon: 'xmark.circle', 'icon-color': '#c0392b' });
    return;
  }

  const status = response.status;
  const body = response.body || '';

  if (status !== 200) {
    $done({ title: 'YouTube', content: `❌ 不可用 (${status})`, icon: 'xmark.circle', 'icon-color': '#c0392b' });
    return;
  }

  // 提取区域信息
  const regionMatch = body.match(/"countryCode"\s*:\s*"([A-Z]{2})"/);
  const region = regionMatch ? regionMatch[1] : '';

  // 判断 Premium 是否可用
  const hasPremium = body.includes('Premium') && !body.includes('not available in your country');

  if (hasPremium && region) {
    $done({ title: 'YouTube', content: `✅ Premium 可用 [${region}]`, icon: 'play.rectangle.fill', 'icon-color': '#ff0000' });
  } else if (hasPremium) {
    $done({ title: 'YouTube', content: '✅ Premium 可用', icon: 'play.rectangle.fill', 'icon-color': '#ff0000' });
  } else {
    const label = region ? `⚠️ 仅基础访问 [${region}]` : '⚠️ 仅基础访问';
    $done({ title: 'YouTube', content: label, icon: 'play.rectangle', 'icon-color': '#e67e22' });
  }
});
