/**
 * Disney+ 解锁检测
 * 通过 BAMTech 媒体服务 API 检测区域
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

function countryCodeToEmoji(code) {
    if (!code) return '';
    code = code.toUpperCase().slice(0, 2);
    return String.fromCodePoint(...[...code].map(c => 127397 + c.charCodeAt(0)));
}

async function parseDisney() {
    // 通过 Disney+ 媒体令牌接口检测区域
    const tokenRes = await get({
        url: 'https://disney.api.edge.bamgrid.com/devices',
        headers: {
            'authorization': 'ZGlzbmV5JmJyb3dzZXImMS4wLjA.Cu56AgSfBTDag5NiRA81oLHkDZfu5L3CKadnefEAY84',
            'content-type': 'application/json; charset=UTF-8',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
    }).catch(() => null);

    const status = tokenRes?.response?.status;

    if (!tokenRes || status === undefined) return '连接失败';

    // 403 通常意味着地区不支持
    if (status === 403) return '不可用';

    // 再检测主站获取地区
    const mainRes = await get({
        url: 'https://www.disneyplus.com/',
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
    }).catch(() => null);

    const body = mainRes?.data || '';

    if (body.includes('unavailable') || body.includes('not available')) return '不可用';

    const regionMatch = body.match(/"countryCode"\s*:\s*"([A-Z]{2})"/)
        || body.match(/"country"\s*:\s*"([A-Z]{2})"/);
    const region = regionMatch ? regionMatch[1] : null;
    const regionLabel = region ? `，${countryCodeToEmoji(region)}${region}` : '';

    if (mainRes?.response?.status === 200) return `已解锁${regionLabel}`;
    return '连接失败';
}

(async () => {
    try {
        const content = await parseDisney();
        $done({ content });
    } catch (e) {
        console.log(`[Error] ${e?.message || JSON.stringify(e)}`);
        $done({ content: '连接失败' });
    }
})();