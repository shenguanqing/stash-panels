/**
 * Bilibili 港澳台解锁检测
 * 检测是否可访问港澳台限定内容
 */

// 使用一个港澳台限定番剧 ep 作为测试
// EP 332215 为「进击的巨人」港澳台版本
const urlHK = 'https://api.bilibili.com/pgc/player/web/playurl?avid=18281381&cid=29892777&qn=0&type=&otype=json&ep_id=183799&fourk=1&fnver=0&fnval=16&session=&module=bangumi';

const urlTW = 'https://api.bilibili.com/pgc/player/web/playurl?avid=50762638&cid=88970773&qn=0&type=&otype=json&ep_id=268176&fourk=1&fnver=0&fnval=16&session=&module=bangumi';

const headers = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  'Referer': 'https://www.bilibili.com',
};

let results = {};
let done = 0;

function finish() {
  done++;
  if (done < 2) return;

  const hkOk = results.hk;
  const twOk = results.tw;

  if (hkOk && twOk) {
    $done({ title: 'Bilibili', content: '✅ 港澳台全解锁', icon: 'tv.fill', 'icon-color': '#00a1d6' });
  } else if (hkOk) {
    $done({ title: 'Bilibili', content: '✅ 港澳门解锁', icon: 'tv', 'icon-color': '#00a1d6' });
  } else if (twOk) {
    $done({ title: 'Bilibili', content: '✅ 台湾解锁', icon: 'tv', 'icon-color': '#00a1d6' });
  } else {
    $done({ title: 'Bilibili', content: '❌ 港澳台均不可用', icon: 'xmark.circle', 'icon-color': '#c0392b' });
  }
}

$httpClient.get({ url: urlHK, headers, timeout: 10 }, (error, response) => {
  try {
    const data = JSON.parse(response.body);
    // code 0 = 成功, -10403 = 地区限制
    results.hk = !error && response && data.code === 0;
  } catch (e) {
    results.hk = false;
  }
  finish();
});

$httpClient.get({ url: urlTW, headers, timeout: 10 }, (error, response) => {
  try {
    const data = JSON.parse(response.body);
    results.tw = !error && response && data.code === 0;
  } catch (e) {
    results.tw = false;
  }
  finish();
});
