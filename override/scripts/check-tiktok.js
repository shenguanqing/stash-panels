/**
 * TikTok 解锁检测
 * 检测当前节点能否访问 TikTok，并识别可用区域。
 *
 * 检测逻辑：
 *   1. 主检测：请求 cdn-cgi/trace，提取 "region" 字段
 *   2. 回退：若地区缺失或状态未知，回退到主页检测
 *   - 403 / 451 / 含封锁关键词 → 不可用
 *   - "region" 字段取 '-' 前的国家码部分
 */

var $httpClient, $done;

const REGION_RE = /"region"\s*:\s*"([a-zA-Z-]+)"/;

function countryCodeToEmoji(code) {
    if (!code) return '';
    code = code.toUpperCase().slice(0, 2);
    return String.fromCodePoint(...[...code].map(c => 127397 + c.charCodeAt(0)));
}

function determineStatus(httpStatus, body) {
    if (httpStatus === 403 || httpStatus === 451) return 'No';
    if (httpStatus < 200 || httpStatus >= 300) return 'Failed';
    const lower = body.toLowerCase();
    if (
        lower.includes('access denied') ||
        lower.includes('not available in your region') ||
        lower.includes('tiktok is not available')
    ) return 'No';
    return 'Yes';
}

function extractRegion(body) {
    const m = body.match(REGION_RE);
    if (!m) return null;
    // "region" 可能形如 "en-US"，取 '-' 前的国家码部分
    const code = m[1].split('-')[0].toUpperCase();
    if (!code) return null;
    return `${countryCodeToEmoji(code)}${code}`;
}

function fetchUrl(url) {
    return new Promise((resolve) => {
        $httpClient.get(
            {
                url,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                    'Accept-Language': 'en',
                },
            },
            (error, response, data) => {
                if (error) { resolve(null); return; }
                resolve({ httpStatus: response.status, body: data || '' });
            }
        );
    });
}

async function parseTikTok() {
    let rawStatus = 'Failed';
    let region = null;

    // 1. 主检测：cdn-cgi/trace
    const traceRes = await fetchUrl('https://www.tiktok.com/cdn-cgi/trace');
    if (traceRes) {
        rawStatus = determineStatus(traceRes.httpStatus, traceRes.body);
        region = extractRegion(traceRes.body);
    }

    // 2. 回退：主页（地区缺失或状态未知时）
    if (!region || rawStatus === 'Failed') {
        const homeRes = await fetchUrl('https://www.tiktok.com/');
        if (homeRes) {
            const fallbackStatus = determineStatus(homeRes.httpStatus, homeRes.body);
            const fallbackRegion = extractRegion(homeRes.body);
            // 不覆盖已确认的"不可用"
            if (rawStatus !== 'No') rawStatus = fallbackStatus;
            if (!region) region = fallbackRegion;
        }
    }

    const regionLabel = region ? `，${region}` : '';
    if (rawStatus === 'Yes') return `已解锁${regionLabel}`;
    if (rawStatus === 'No') return '不可用';
    return '连接失败';
}

(async () => {
    try {
        const content = await parseTikTok();
        $done({ content });
    } catch (e) {
        console.log(`[TikTok Error] ${e?.message || JSON.stringify(e)}`);
        $done({ content: '连接失败' });
    }
})();
