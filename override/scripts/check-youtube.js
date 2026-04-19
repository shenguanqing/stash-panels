/**
 * YouTube Premium 解锁检测
 * 检测当前节点能否访问 YouTube Premium，并识别可用区域。
 *
 * 检测逻辑：
 *   1. 请求 /premium 页面
 *   2. 含"not available in your country" → 不可用
 *   3. 含"ad-free" / "youtube premium" 等关键词 → 已解锁，提取地区
 *      - 优先从 JSON 初始数据提取 "countryCode" / "gl" / "country"
 *      - 兜底匹配 legacy DOM 元素 id="country-code"
 */

var $httpClient, $done;

function countryCodeToEmoji(code) {
    if (!code) return '';
    code = code.toUpperCase().slice(0, 2);
    return String.fromCodePoint(...[...code].map(c => 127397 + c.charCodeAt(0)));
}

async function parseYouTubePremium() {
    return new Promise((resolve) => {
        $httpClient.get(
            {
                url: 'https://www.youtube.com/premium',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                    'Accept-Language': 'en',
                },
            },
            (error, response, data) => {
                if (error || typeof data !== 'string') { resolve('连接失败'); return; }

                const lower = data.toLowerCase();

                if (lower.includes('youtube premium is not available in your country')) {
                    resolve('不可用'); return;
                }

                if (
                    lower.includes('ad-free') ||
                    lower.includes('youtube premium') ||
                    lower.includes('youtubepremium')
                ) {
                    // 优先从 JSON 初始数据提取国家码
                    const jsonMatch =
                        data.match(/"countryCode"\s*:\s*"([A-Z]{2})"/) ||
                        data.match(/"gl"\s*:\s*"([A-Z]{2})"/) ||
                        data.match(/"country"\s*:\s*"([A-Z]{2})"/);
                    let countryCode = jsonMatch ? jsonMatch[1] : null;

                    // 兜底：legacy DOM 元素
                    if (!countryCode) {
                        const domMatch = data.match(/id="country-code"[^>]*>\s*([A-Z]{2})\s*</);
                        if (domMatch) countryCode = domMatch[1];
                    }

                    const regionLabel = countryCode
                        ? `，${countryCodeToEmoji(countryCode)}${countryCode}`
                        : '';
                    resolve(`已解锁${regionLabel}`); return;
                }

                resolve('连接失败');
            }
        );
    });
}

(async () => {
    try {
        const content = await parseYouTubePremium();
        $done({ content });
    } catch (e) {
        console.log(`[YouTube Error] ${e?.message || JSON.stringify(e)}`);
        $done({ content: '连接失败' });
    }
})();
