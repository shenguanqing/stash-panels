/**
 * Netflix 解锁检测
 * 检测当前节点能否访问 Netflix，并识别可用区域
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

async function parseNetflix() {
    const [res1, res2] = await Promise.allSettled([
        get('https://www.netflix.com/title/81215567'),
        get('https://www.netflix.com/title/70143836'),
    ]);

    const r1 = res1.status === 'fulfilled' ? res1.value : null;
    const r2 = res2.status === 'fulfilled' ? res2.value : null;

    if (!r1 && !r2) return '连接失败';

    const status1 = r1?.response?.status;
    const status2 = r2?.response?.status;
    const body = r1?.data || r2?.data || '';

    const regionMatch = body.match(/"requestCountry"\s*:\s*"([A-Z]{2})"/);
    const region = regionMatch ? regionMatch[1] : null;
    const regionLabel = region ? `，${countryCodeToEmoji(region)}${region}` : '';

    if (status1 === 200) return `已完整解锁${regionLabel}`;
    if (status2 === 200) return `仅自制剧${regionLabel}`;
    if (status1 === 403 || status1 === 451) return '不可用';
    return '连接失败';
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