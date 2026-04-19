/**
 * Netflix 解锁检测
 * 检测当前节点能否访问 Netflix，并识别可用区域。
 *
 * 检测逻辑：
 *   1. CDN 快速路径：请求 api.fast.com 端点，有地区信息则直接返回
 *   2. 并发请求两个测试标题（81280792 / 70143836）
 *      - 均 404 → 仅自制剧
 *      - 任一 403 → 不可用
 *      - 200/301 → 完全解锁，通过标题 80018499 的重定向头提取地区
 */

var $httpClient, $done;

const REQUEST_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept-Language': 'en',
};

function countryCodeToEmoji(code) {
    if (!code) return '';
    code = code.toUpperCase().slice(0, 2);
    return String.fromCodePoint(...[...code].map(c => 127397 + c.charCodeAt(0)));
}

function get(url, options) {
    return new Promise((resolve, reject) => {
        $httpClient.get({ url, headers: REQUEST_HEADERS, ...options }, (error, response, data) => {
            if (error) reject(error);
            else resolve({ response, data: data || '' });
        });
    });
}

// CDN 快速路径
async function checkCDN() {
    try {
        const { response, data } = await get(
            'https://api.fast.com/netflix/speedtest/v2?https=true&token=YXNkZmFzZGxmbnNkYWZoYXNkZmhrYWxm&urlCount=5'
        );
        if (response.status === 403) return { status: 'banned' };

        let json;
        try { json = JSON.parse(data); } catch { return null; }

        const country = json?.targets?.[0]?.location?.country;
        if (country) return { status: 'ok', region: country.toUpperCase() };
        return null;
    } catch { return null; }
}

// 检测单个标题页状态码
function checkTitle(filmId) {
    return new Promise((resolve) => {
        $httpClient.get(
            { url: `https://www.netflix.com/title/${filmId}`, headers: REQUEST_HEADERS },
            (error, response) => {
                if (error) { resolve(-1); return; }
                resolve(response.status);
            }
        );
    });
}

// 通过重定向头提取地区
async function getRegionFromRedirect() {
    try {
        // Stash 会跟随重定向，通过 x-originating-url 或最终 URL 提取地区
        const { response } = await get('https://www.netflix.com/title/80018499');
        const originUrl = response.headers?.['x-originating-url'] || response.url || '';
        const parts = originUrl.split('/');
        if (parts.length >= 4) {
            const code = (parts[3].split('-')[0] || 'us').toLowerCase();
            return code;
        }
        return 'us';
    } catch { return 'us'; }
}

async function parseNetflix() {
    // 1. CDN 快速路径
    const cdn = await checkCDN();
    if (cdn?.status === 'banned') return '不可用';
    if (cdn?.status === 'ok') {
        const emoji = countryCodeToEmoji(cdn.region);
        return `已完整解锁，${emoji}${cdn.region}`;
    }

    // 2. 并发请求两个标题
    const [s1, s2] = await Promise.all([checkTitle(81280792), checkTitle(70143836)]);

    if (s1 === -1 || s2 === -1) return '连接失败';
    if (s1 === 403 || s2 === 403) return '不可用';
    if (s1 === 404 && s2 === 404) return '仅自制剧';

    if (s1 === 200 || s1 === 301 || s2 === 200 || s2 === 301) {
        const regionCode = await getRegionFromRedirect();
        const emoji = countryCodeToEmoji(regionCode);
        return `已完整解锁，${emoji}${regionCode.toUpperCase()}`;
    }

    return '连接失败';
}

(async () => {
    try {
        const content = await parseNetflix();
        $done({ content });
    } catch (e) {
        console.log(`[Netflix Error] ${e?.message || JSON.stringify(e)}`);
        $done({ content: '连接失败' });
    }
})();
