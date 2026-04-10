/**
 * Spotify 解锁检测
 * 检测当前节点能否访问 Spotify，并识别可用区域
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

async function parseSpotify() {
    return new Promise((resolve) => {
        $httpClient.get(
            { url: 'https://spclient.wg.spotify.com/signup/public/v1/account?Product=open', headers: REQUEST_HEADERS },
            (error, response, data) => {
                if (error || !data) { resolve('连接失败'); return; }

                let body;
                try { body = JSON.parse(data); } catch (e) { resolve('连接失败'); return; }

                // status 1 = 可用, 320 = 地区不支持
                if (body?.status === 320 || response.status === 403) {
                    resolve('不可用');
                    return;
                }

                if (body?.status === 1 || response.status === 200) {
                    // 尝试从 country 字段提取区域
                    const region = body?.country || body?.region || null;
                    const regionLabel = region ? `，${countryCodeToEmoji(region)}${region.toUpperCase()}` : '';
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
        const content = await parseSpotify();
        $done({ content });
    } catch (e) {
        console.log(`[Error] ${e?.message || JSON.stringify(e)}`);
        $done({ content: '连接失败' });
    }
})();
