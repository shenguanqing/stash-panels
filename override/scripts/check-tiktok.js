/**
 * TikTok 解锁检测
 * 检测当前节点能否访问 TikTok，并识别可用区域
 */

var $httpClient, $done;

function countryCodeToEmoji(code) {
    if (!code) return '';
    code = code.toUpperCase().slice(0, 2);
    return String.fromCodePoint(...[...code].map(c => 127397 + c.charCodeAt(0)));
}

// 访问 /explore，通过 hk/notfound 判断 HK 屏蔽，提取 "region":"XX"
async function parseTikTok() {
    return new Promise((resolve) => {
        $httpClient.get(
            {
                url: 'https://www.tiktok.com/explore',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36',
                    'Accept-Language': 'en',
                },
            },
            (error, response, data) => {
                if (error || !data) { resolve('连接失败'); return; }

                // HK 节点会重定向到 hk/notfound
                if (data.includes('https://www.tiktok.com/hk/notfound')) {
                    resolve('不可用，🇭🇰HK');
                    return;
                }

                // 提取 "region":"XX"
                const match = data.match(/"region"\s*:\s*"(\w+)"/);
                if (match) {
                    const region = match[1].toUpperCase();
                    resolve(`已解锁，${countryCodeToEmoji(region)}${region}`);
                    return;
                }

                resolve('不可用');
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
