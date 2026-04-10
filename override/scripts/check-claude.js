/**
 * Claude 访问检测
 * 检测是否能访问 claude.ai/cdn-cgi/trace + Web + API
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

// 通过 Cloudflare trace 获取落地区域（claude.ai 托管在 Cloudflare 上）
function getRegionFromTrace() {
    return new Promise((resolve) => {
        $httpClient.get(
            { url: 'https://claude.ai/cdn-cgi/trace', headers: REQUEST_HEADERS },
            (error, response, data) => {
                if (error || !data) { resolve(null); return; }
                const map = {};
                data.split('\n').forEach(line => {
                    const idx = line.indexOf('=');
                    if (idx !== -1) map[line.slice(0, idx)] = line.slice(idx + 1).trim();
                });
                resolve(map['loc'] || null);
            }
        );
    });
}

// 检测 claude.ai 是否可访问
function checkClaudeWeb() {
    return new Promise((resolve) => {
        $httpClient.get(
            { url: 'https://claude.ai/', headers: REQUEST_HEADERS },
            (error, response, data) => {
                if (error || !data) { resolve('failed'); return; }
                const status = response.status;
                const body = data.toLowerCase();

                if (status === 403 || body.includes('not available in your country') || body.includes('unavailable')) {
                    resolve('blocked');
                    return;
                }
                if (status === 200) { resolve('ok'); return; }
                resolve('failed');
            }
        );
    });
}

// 检测 API 端点（401 = 无 key 但服务可达）
function checkClaudeAPI() {
    return new Promise((resolve) => {
        $httpClient.get(
            {
                url: 'https://api.anthropic.com/v1/models',
                headers: { ...REQUEST_HEADERS, 'x-api-key': 'test' },
            },
            (error, response, data) => {
                if (error) { resolve('failed'); return; }
                const status = response.status;
                // 401 = 无效 key 但服务可达; 200 = 完全可用
                if (status === 200 || status === 401) { resolve('ok'); return; }
                if (status === 403) { resolve('blocked'); return; }
                resolve('failed');
            }
        );
    });
}

async function parseClaude() {
    const [loc, web, api] = await Promise.all([
        getRegionFromTrace(),
        checkClaudeWeb(),
        checkClaudeAPI(),
    ]);

    const regionLabel = loc ? `，${countryCodeToEmoji(loc)}${loc.toUpperCase()}` : '';

    if (web === 'blocked') return `不可用${regionLabel}`;

    const parts = [];
    if (web === 'ok') parts.push('Web');
    if (api === 'ok') parts.push('API');

    if (parts.length > 0) return `${parts.join(' + ')} 可用${regionLabel}`;
    return `连接失败${regionLabel}`;
}

(async () => {
    try {
        const content = await parseClaude();
        $done({ content });
    } catch (e) {
        console.log(`[Error] ${e?.message || JSON.stringify(e)}`);
        $done({ content: '连接失败' });
    }
})();
