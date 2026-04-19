/**
 * Spotify 解锁检测
 * 检测当前节点能否访问 Spotify，并识别可用区域
 */

var $httpClient, $done;

function countryCodeToEmoji(code) {
    if (!code) return '';
    code = code.toUpperCase().slice(0, 2);
    return String.fromCodePoint(...[...code].map(c => 127397 + c.charCodeAt(0)));
}

function extractRegionFromUrl(url) {
    try {
        const pathname = new URL(url).pathname;
        const first = pathname.split('/').find(s => s.length > 0);
        if (!first || first === 'api') return null;
        const code = first.split('-')[0].toUpperCase();
        return code ? `${countryCodeToEmoji(code)}${code}` : null;
    } catch {
        return null;
    }
}

function extractRegionFromBody(body) {
    const match = body.match(/"countryCode"\s*:\s*"([A-Z]{2})"/i);
    if (match) {
        const code = match[1].toUpperCase();
        return `${countryCodeToEmoji(code)}${code}`;
    }
    return null;
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
                {
                    url,
                    headers: { 'User-Agent': 'Mozilla/5.0' },
                },
                (error, response, data) => {
                    if (error) { reject(new Error(error)); return; }
                    resolve({
                        status: response.status,
                        body: data || '',
                        finalUrl: response.url || url,  // Stash 会跟随重定向，url 为最终地址
                    });
                }
            );
        });

        const statusStr = determineStatus(status, body);
        const region = extractRegionFromUrl(finalUrl) ?? extractRegionFromBody(body);
        const regionLabel = region ? `，${region}` : '';
        const content = statusStr === '已解锁' ? `${statusStr}${regionLabel}` : statusStr;

        $done({ content });
    } catch (e) {
        console.log(`[Spotify Error] ${e.message}`);
        $done({ content: '连接失败' });
    }
})();