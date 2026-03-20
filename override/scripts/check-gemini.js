/**
 * Google Gemini 访问检测
 * 检测是否能访问 Gemini Web 及 API 服务
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
    const threeToTwo = { 'USA': 'US', 'CAN': 'CA', 'GBR': 'GB', 'FRA': 'FR', 'DEU': 'DE', 'KOR': 'KR' };
    code = code.toUpperCase();
    if (code.length === 3) code = threeToTwo[code] || code.slice(0, 2);
    return String.fromCodePoint(...[...code].map(c => 127397 + c.charCodeAt(0)));
}

// 与参考脚本完全一致的解析逻辑
async function parseGemini() {
    const res = await get('https://gemini.google.com').catch(() => null);

    if (!res || typeof res.data !== 'string') return '连接失败';

    const isOk = res.data.includes('45631641,null,true');
    const result = isOk ? '已解锁' : '不可用';

    const regex = /,2,1,200,"([A-Z]{3})"/;
    const match = res.data.match(regex);

    if (match) {
        const countrycode = match[1];
        const emoji = countryCodeToEmoji(countrycode);
        // 转为两位代码用于显示
        const threeToTwo = { 'USA': 'US', 'CAN': 'CA', 'GBR': 'GB', 'FRA': 'FR', 'DEU': 'DE', 'KOR': 'KR' };
        const twoCode = threeToTwo[countrycode] || countrycode.slice(0, 2);
        return `${result}，${emoji}${twoCode}`;
    }

    return result;
}

(async () => {
    try {
        const content = await parseGemini();
        $done({ content });
    } catch (e) {
        console.log(`[Error] ${e?.message || JSON.stringify(e)}`);
        $done({ content: '连接失败' });
    }
})();