/**
 * 哔哩哔哩解锁检测
 * 检测当前节点能否访问哔哩哔哩港澳台及大陆限定内容。
 *
 * 检测逻辑：
 *   - 港澳台：请求港澳台限定番剧播放接口（avid=18281381），code=0 则可用
 *   - 大陆：请求大陆限定番剧播放接口（avid=82846771），code=0 则可用
 *   - code=0 → 已解锁；code=-10403 → 不可用；其余 → 连接失败
 */

var $httpClient, $done;

function fetchJson(url) {
    return new Promise((resolve) => {
        $httpClient.get({ url }, (error, response, data) => {
            if (error || !data) { resolve(null); return; }
            try { resolve(JSON.parse(data)); }
            catch { resolve(null); }
        });
    });
}

function codeToStatus(code) {
    if (code === 0) return '已解锁';
    if (code === -10403) return '不可用';
    return '连接失败';
}

async function parseBilibili() {
    const [hkData, mainlandData] = await Promise.all([
        fetchJson('https://api.bilibili.com/pgc/player/web/playurl?avid=18281381&cid=29892777&qn=0&type=&otype=json&ep_id=183799&fourk=1&fnver=0&fnval=16&module=bangumi'),
        fetchJson('https://api.bilibili.com/pgc/player/web/playurl?avid=82846771&qn=0&type=&otype=json&ep_id=307247&fourk=1&fnver=0&fnval=16&module=bangumi'),
    ]);

    const hkCode = typeof hkData?.code === 'number' ? hkData.code : null;
    const mainlandCode = typeof mainlandData?.code === 'number' ? mainlandData.code : null;

    const hkStatus = hkCode !== null ? codeToStatus(hkCode) : '连接失败';
    const mainlandStatus = mainlandCode !== null ? codeToStatus(mainlandCode) : '连接失败';

    if (hkStatus === mainlandStatus) return `港澳台 ${hkStatus} / 大陆 ${mainlandStatus}`;
    return `港澳台 ${hkStatus} / 大陆 ${mainlandStatus}`;
}

(async () => {
    try {
        const content = await parseBilibili();
        $done({ content });
    } catch (e) {
        console.log(`[Bilibili Error] ${e?.message || JSON.stringify(e)}`);
        $done({ content: '连接失败' });
    }
})();
