/**
 * Spotify 解锁检测
 * 检测当前节点能否访问 Spotify，并识别可用区域。
 *
 * 检测逻辑（与 Rust check_spotify 完全对齐）：
 *   1. 请求 country-selector API 端点
 *   2. 从最终 URL 路径第一段取 '-' 前缀作为国家码
 *   3. 从响应 body 字面量定位 "countryCode":" 提取国家码
 */

var $httpClient, $done;

function countryCodeToEmoji(code) {
    if (!code) return '';
    code = code.toUpperCase().slice(0, 2);
    return String.fromCodePoint(...[...code].map(c => 127397 + c.charCodeAt(0)));
}

// 与 Rust extract_region 对齐：取路径第一段 '-' 之前的部分
function extractRegionFromUrl(url) {
    try {
        const pathname = new URL(url).pathname;
        const firstSegment = pathname.split('/').find(s => s.length > 0);
        if (!firstSegment || firstSegment === 'api') return null;
        const code = firstSegment.split('-')[0].toUpperCase();
        if (!code || !/^[A-Z]{2}$/.test(code)) return null;
        return `${countryCodeToEmoji(code)}${code}`;
    } catch { return null; }
}

// 与 Rust extract_region_from_body 对齐：字面量定位
function extractRegionFromBody(body) {
    const marker = '"countryCode":"';
    const idx = body.indexOf(marker);
    if (idx === -1) return null;
    const rest = body.slice(idx + marker.length);
    const end = rest.indexOf('"');
    if (end === -1) return null;
    const code = rest.slice(0, end).toUpperCase();
    if (!code) return null;
    return `${countryCodeToEmoji(code)}${code}`;
}

function determineStatus(status, body) {
    if (status === 403 || status === 451) return '不可用';
    if (status < 200 || status >= 300) return '连接失败';
    if (body.toLowerCase().includes('not available in your country')) return '不可用';
    return '已解锁';
}

(async () => {
    const url = 'https://www.spotify.com/api/content/v1/country-selector?platform=web&format=json';
    try {
        const { status, body, finalUrl } = await new Promise((resolve, reject) => {
            $httpClient.get(
                { url, headers: { 'User-Agent': 'Mozilla/5.0' } },
                (error, response, data) => {
                    if (error) { reject(new Error(error)); return; }
                    resolve({ status: response.status, body: data || '', finalUrl: response.url || url });
                }
            );
        });

        const statusStr = determineStatus(status, body);
        const region = extractRegionFromUrl(finalUrl) ?? extractRegionFromBody(body);
        const regionLabel = region ? `，${region}` : '';
        $done({ content: statusStr === '已解锁' ? `${statusStr}${regionLabel}` : statusStr });
    } catch (e) {
        console.log(`[Spotify Error] ${e?.message || JSON.stringify(e)}`);
        $done({ content: '连接失败' });
    }
})();
