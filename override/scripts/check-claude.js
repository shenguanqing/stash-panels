/**
 * Claude 访问检测
 * 检测当前节点能否访问 Claude.ai，并识别落地区域。
 *
 * 检测逻辑：
 *   1. 请求 claude.ai/cdn-cgi/trace，提取 loc 字段获取国家码
 *   2. 对照封锁列表（AF BY CN CU HK IR KP MO RU SY）判断可用性
 */

var $httpClient, $done;

const BLOCKED_CODES = new Set(['AF', 'BY', 'CN', 'CU', 'HK', 'IR', 'KP', 'MO', 'RU', 'SY']);

function countryCodeToEmoji(code) {
    if (!code) return '';
    code = code.toUpperCase().slice(0, 2);
    return String.fromCodePoint(...[...code].map(c => 127397 + c.charCodeAt(0)));
}

async function parseClaude() {
    return new Promise((resolve) => {
        $httpClient.get(
            {
                url: 'https://claude.ai/cdn-cgi/trace',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                },
            },
            (error, response, data) => {
                if (error || !data) { resolve('连接失败'); return; }

                let countryCode = null;
                for (const line of data.split('\n')) {
                    if (line.startsWith('loc=')) {
                        countryCode = line.slice(4).trim().toUpperCase();
                        break;
                    }
                }

                if (!countryCode) { resolve('连接失败'); return; }

                const regionLabel = `，${countryCodeToEmoji(countryCode)}${countryCode}`;
                resolve(BLOCKED_CODES.has(countryCode) ? `不可用${regionLabel}` : `已解锁${regionLabel}`);
            }
        );
    });
}

(async () => {
    try {
        const content = await parseClaude();
        $done({ content });
    } catch (e) {
        console.log(`[Claude Error] ${e?.message || JSON.stringify(e)}`);
        $done({ content: '连接失败' });
    }
})();
