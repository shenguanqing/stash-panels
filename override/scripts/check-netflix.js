/**
 * Netflix 解锁检测
 * 检测当前节点能否访问 Netflix，并识别可用区域
 */

const url = 'https://www.netflix.com/title/81215567';

const headers = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};

$httpClient.get({ url, headers, timeout: 10 }, (error, response) => {
  if (error || !response) {
    $done({ title: 'Netflix', content: '❌ 连接失败', icon: 'xmark.circle', 'icon-color': '#c0392b' });
    return;
  }

  const status = response.status;
  const body = response.body || '';

  if (status === 200) {
    // 尝试从响应中提取地区信息
    const regionMatch = body.match(/"requestCountry"\s*:\s*"([A-Z]{2})"/);
    const region = regionMatch ? regionMatch[1] : '';
    const label = region ? `✅ 完整解锁 [${region}]` : '✅ 完整解锁';
    $done({ title: 'Netflix', content: label, icon: 'play.circle.fill', 'icon-color': '#e50914' });
  } else if (status === 403 || status === 451) {
    $done({ title: 'Netflix', content: '🚫 仅自制剧', icon: 'minus.circle', 'icon-color': '#e67e22' });
  } else if (status === 404) {
    // 404 通常意味着有访问权但内容不可用（自制剧可看）
    $done({ title: 'Netflix', content: '⚠️ 仅自制剧', icon: 'minus.circle', 'icon-color': '#e67e22' });
  } else {
    $done({ title: 'Netflix', content: `❌ 不可用 (${status})`, icon: 'xmark.circle', 'icon-color': '#c0392b' });
  }
});
