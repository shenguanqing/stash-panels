/**
 * TikTok 解锁检测
 * 检测当前节点能否访问 TikTok，并识别可用区域
 */

var $httpClient, $done;

const REQUEST_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36',
    'Accept-Language': 'en',
};

function countryCodeToEmoji(code) {
    if (!code) return '';
    code = code.toUpperCase().slice(0, 2);
    return String.fromCodePoint(...[...code].map(c => 127397 + c.charCodeAt(0)));
}

async function parseTikTok() {
    return new Promise((resolve) => {
        $httpClient.get(
            { url: 'https://www.tiktok.com/', headers: REQUEST_HEADERS },
            (error, response, data) => {
                if (error || !data) { resolve('连接失败'); return; }

                const status = response.status;

                // TikTok 在不支持地区会重定向到 403 或显示不可用
                if (status === 403) { resolve('不可用'); return; }

                // 提取地区
                const regionMatch = data.match(/"region"\s*:\s*"([A-Z]{2})"/)
                    || data.match(/"countryCode"\s*:\s*"([A-Z]{2})"/);
                const region = regionMatch ? regionMatch[1] : null;
                const regionLabel = region ? `，${countryCodeToEmoji(region)}${region}` : '';

                // 检测是否被封锁
                if (data.includes('not available') || data.includes('unavailable')) {
                    resolve('不可用');
                    return;
                }

                if (status === 200) {
                    resolve(`已解锁${regionLabel}`);
                    return;
                }

                resolve('连接失败');
            }
        );
    });
}

(async () => {
    try {
        const content = await parseTikTok();
        $done({ content });
    } catch (e) {
        console.log(`[Error] ${e?.message || JSON.stringify(e)}`);
        $done({ content: '连接失败' });
    }
})();
