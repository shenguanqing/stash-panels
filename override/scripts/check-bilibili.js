/**
 * Bilibili 港澳台解锁检测
 * 检测是否可访问港澳台限定内容
 */

var $httpClient, $done;

async function request(method, params) {
    return new Promise((resolve, reject) => {
        $httpClient[method.toLowerCase()](params, (error, response, data) => {
            if (error) reject({ error, response, data });
            else resolve({ error, response, data });
        });
    });
}

async function get(params) {
    return request('GET', typeof params === 'string' ? { url: params } : params);
}

function parseJsonBody(str) {
    try { return JSON.parse(str); } catch (e) { return null; }
}

// 与参考脚本保持一致，检测港澳台解锁
async function parseBilibiliHKMCTW() {
    const res = await get(
        'https://api.bilibili.com/pgc/player/web/playurl?avid=18281381&cid=29892777&qn=0&type=&otype=json&ep_id=183799&fourk=1&fnver=0&fnval=16&module=bangumi'
    ).catch(() => null);

    if (!res || res.error || res.response?.status >= 400) return null;

    const body = parseJsonBody(res.data);
    if (body?.code === 0) return 'HK'; // 港澳台可用，用 HK 代表
    if (body?.code === -10403) return null;
    return null;
}

// 检测台湾专属内容
async function parseBilibiliTW() {
    const res = await get(
        'https://api.bilibili.com/pgc/player/web/playurl?avid=50762638&cid=88970773&qn=0&type=&otype=json&ep_id=268176&fourk=1&fnver=0&fnval=16&module=bangumi'
    ).catch(() => null);

    if (!res || res.error || res.response?.status >= 400) return null;

    const body = parseJsonBody(res.data);
    if (body?.code === 0) return 'TW';
    return null;
}

async function parseBilibili() {
    const [hkRes, twRes] = await Promise.allSettled([
        parseBilibiliHKMCTW(),
        parseBilibiliTW(),
    ]);

    const hk = hkRes.status === 'fulfilled' ? hkRes.value : null;
    const tw = twRes.status === 'fulfilled' ? twRes.value : null;

    if (tw) return '已解锁，🇹🇼TW';
    if (hk) return '已解锁，🇭🇰HK';
    if (hk === null && tw === null) return '不可用';
    return '连接失败';
}

(async () => {
    try {
        const content = await parseBilibili();
        $done({ content });
    } catch (e) {
        console.log(`[Error] ${e?.message || JSON.stringify(e)}`);
        $done({ content: '连接失败' });
    }
})();