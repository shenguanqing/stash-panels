/**
 * Prime Video 解锁检测
 * 检测当前节点能否访问 Amazon Prime Video，并识别可用区域。
 *
 * 检测逻辑（与 Rust check_prime_video 完全对齐）：
 *   1. 检查 isServiceRestricted 标志 → 不可用
 *   2. 提取 "currentTerritory" 字段 → 已解锁
 *   3. 其余情况 → 连接失败
 */

var $httpClient, $done;

function countryCodeToEmoji(code) {
    if (!code) return '';
    code = code.toUpperCase().slice(0, 2);
    return String.fromCodePoint(...[...code].map(c => 127397 + c.charCodeAt(0)));
}

async function parsePrimeVideo() {
    return new Promise((resolve) => {
        $httpClient.get(
            {
                url: 'https://www.primevideo.com',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                    'Accept-Language': 'en-US,en;q=0.9',
                },
            },
            (error, response, data) => {
                if (error || !data) { resolve('连接失败'); return; }
                if (response.status === 403) { resolve('不可用'); return; }

                // 1. isServiceRestricted 优先
                if (data.includes('isServiceRestricted')) { resolve('不可用'); return; }

                // 2. 提取 "currentTerritory"（Rust 版唯一使用的地区字段）
                const marker = '"currentTerritory":"';
                const idx = data.indexOf(marker);
                if (idx !== -1) {
                    const rest = data.slice(idx + marker.length);
                    const end = rest.indexOf('"');
                    if (end !== -1) {
                        const region = rest.slice(0, end).toUpperCase();
                        if (region) {
                            resolve(`已解锁，${countryCodeToEmoji(region)}${region}`);
                            return;
                        }
                    }
                }

                // 3. 无法识别
                resolve('连接失败');
            }
        );
    });
}

(async () => {
    try {
        const content = await parsePrimeVideo();
        $done({ content });
    } catch (e) {
        console.log(`[Prime Video Error] ${e?.message || JSON.stringify(e)}`);
        $done({ content: '连接失败' });
    }
})();
