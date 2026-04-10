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

// POST 注册接口，通过 status + is_country_launched 判断
async function parseSpotify() {
    return new Promise((resolve) => {
        $httpClient.post(
            {
                url: 'https://spclient.wg.spotify.com/signup/public/v1/account',
                headers: {
                    'Accept-Language': 'en',
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36',
                    'content-type': 'application/json',
                    'cache-control': 'no-cache',
                },
                body: 'birth_day=11&birth_month=11&birth_year=2000&collect_personal_info=undefined&creation_flow=&creation_point=https%3A%2F%2Fwww.spotify.com%2Fhk-en%2F&displayname=Gay%20Lord&gender=male&iagree=1&key=a1e486e2729f46d6bb368d6b2bcda326&platform=www&referrer=&send-email=0&thirdpartyemail=0&identifier_token=AgE6YTvEzkReHNfJpO114514',
            },
            (error, response, data) => {
                if (error || !data) { resolve('连接失败'); return; }

                if (response.status === 403) { resolve('不可用'); return; }

                let body;
                try { body = JSON.parse(data); } catch (e) { resolve('连接失败'); return; }

                // status 320 = 地区不支持
                if (body.status === 320) { resolve('不可用'); return; }

                // status 311 + is_country_launched = 已支持的地区
                if (body.status === 311 && body.is_country_launched) {
                    const region = (body.country || '').toUpperCase();
                    const regionLabel = region ? `，${countryCodeToEmoji(region)}${region}` : '';
                    resolve(`已解锁${regionLabel}`);
                    return;
                }

                resolve('不可用');
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
