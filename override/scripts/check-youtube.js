/**
 * YouTube Premium 区域检测
 * 检测节点是否可访问 YouTube 并识别 Premium 可用区域
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

// 与参考脚本保持一致的解析逻辑
async function parseYoutubePremium() {
    const res = await get('https://www.youtube.com/premium').catch(() => null);

    if (!res || typeof res.data !== 'string') return '连接失败';

    if (res.data.toLowerCase().includes('YouTube Premium is not available in your country'.toLowerCase())) {
        return '不可用';
    }

    if (res.data.toLowerCase().includes('ad-free')) {
        const match = res.data.match(/"GL":\s?"(\w+)"/);
        const region = match ? match[1] : null;
        const regionLabel = region ? `，${countryCodeToEmoji(region)}${region}` : '';
        return `已解锁${regionLabel}`;
    }

    return '连接失败';
}

(async () => {
    try {
        const content = await parseYoutubePremium();
        $done({ content });
    } catch (e) {
        console.log(`[Error] ${e?.message || JSON.stringify(e)}`);
        $done({ content: '连接失败' });
    }
})();