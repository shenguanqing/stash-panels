/**
 * Disney+ 解锁检测
 * 通过 BAMTech 媒体服务 API 检测区域
 */

const url = 'https://disney.api.edge.bamgrid.com/graph/v1/device/graphql';

const payload = JSON.stringify({
  operationName: 'DmcSeriesBundle',
  query: 'query DmcSeriesBundle($encodedSeriesId: ID!) { DmcSeriesBundle(encodedSeriesId: $encodedSeriesId) { series { encodedSeriesId } } }',
  variables: { encodedSeriesId: 'tat7acGahFcbNGFiQeKZSA==' },
});

const headers = {
  'authorization': 'Bearer ZGlzbmV5JmJyb3dzZXImMS4wLjA.Cu56AgSfBTDag5NiRA81oLHkDZfu5L3CKadnefEAY84',
  'content-type': 'application/json',
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
};

// 先检测是否能访问 Disney+ 主站
$httpClient.get(
  { url: 'https://www.disneyplus.com/', headers: { 'User-Agent': headers['User-Agent'] }, timeout: 10 },
  (error, response) => {
    if (error || !response) {
      $done({ title: 'Disney+', content: '❌ 连接失败', icon: 'xmark.circle', 'icon-color': '#c0392b' });
      return;
    }

    const body = response.body || '';
    const status = response.status;

    // 检测不支持区域的标志
    if (body.includes('unavailable') || body.includes('not available') || status === 403) {
      $done({ title: 'Disney+', content: '❌ 区域不支持', icon: 'xmark.circle', 'icon-color': '#c0392b' });
      return;
    }

    // 尝试提取区域
    const regionMatch = body.match(/"countryCode"\s*:\s*"([A-Z]{2})"/);
    const region = regionMatch ? regionMatch[1] : '';

    $httpClient.post({ url, headers, body: payload, timeout: 10 }, (err2, res2) => {
      if (err2 || !res2 || res2.status === 403) {
        const label = region ? `✅ 已解锁 [${region}]` : '✅ 已解锁';
        $done({ title: 'Disney+', content: label, icon: 'play.circle.fill', 'icon-color': '#0c1c4d' });
        return;
      }
      const label = region ? `✅ 完整解锁 [${region}]` : '✅ 完整解锁';
      $done({ title: 'Disney+', content: label, icon: 'play.circle.fill', 'icon-color': '#0c1c4d' });
    });
  }
);
