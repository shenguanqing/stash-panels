/**
 * Claude 访问检测
 * 检测 claude.ai/cdn-cgi/trace 落地区域及可用性
 */

var $httpClient, $done;

// 支持国家列表
const CLAUDE_SUPPORT_COUNTRY = [
    "AL", "DZ", "AD", "AO", "AG", "AR", "AM", "AU", "AT", "AZ", "BS", "BH", "BD", "BB", "BE", "BZ",
    "BJ", "BT", "BO", "BA", "BW", "BR", "BN", "BG", "BF", "BI", "CV", "KH", "CM", "CA", "TD", "CL",
    "CO", "KM", "CG", "CR", "CI", "HR", "CY", "CZ", "DK", "DJ", "DM", "DO", "EC", "EG", "SV", "GQ",
    "EE", "SZ", "FJ", "FI", "FR", "GA", "GM", "GE", "DE", "GH", "GR", "GD", "GT", "GN", "GW", "GY",
    "HT", "HN", "HU", "IS", "IN", "ID", "IQ", "IE", "IL", "IT", "JM", "JP", "JO", "KZ", "KE", "KI",
    "KW", "KG", "LA", "LV", "LB", "LS", "LR", "LI", "LT", "LU", "MG", "MW", "MY", "MV", "MT", "MH",
    "MR", "MU", "MX", "FM", "MD", "MC", "MN", "ME", "MA", "MZ", "NA", "NR", "NP", "NL", "NZ", "NE",
    "NG", "MK", "NO", "OM", "PK", "PW", "PS", "PA", "PG", "PY", "PE", "PH", "PL", "PT", "QA", "RO",
    "RW", "KN", "LC", "VC", "WS", "SM", "ST", "SA", "SN", "RS", "SC", "SL", "SG", "SK", "SI", "SB",
    "ZA", "KR", "ES", "LK", "SR", "SE", "CH", "TW", "TJ", "TZ", "TH", "TL", "TG", "TO", "TT", "TN",
    "TR", "TM", "TV", "UG", "UA", "AE", "GB", "US", "UY", "UZ", "VU", "VA", "VN", "ZM", "ZW",
];

function countryCodeToEmoji(code) {
    if (!code) return '';
    code = code.toUpperCase().slice(0, 2);
    return String.fromCodePoint(...[...code].map(c => 127397 + c.charCodeAt(0)));
}

// cdn-cgi/trace 提取 loc，对照支持列表判断
async function parseClaude() {
    return new Promise((resolve) => {
        $httpClient.get(
            {
                url: 'https://claude.ai/cdn-cgi/trace',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36',
                },
            },
            (error, response, data) => {
                if (error || !data) { resolve('连接失败'); return; }

                // 提取 loc= 字段
                const lines = data.split('\n');
                let loc = '';
                for (const line of lines) {
                    if (line.startsWith('loc=')) {
                        loc = line.slice(4).trim();
                        break;
                    }
                }

                if (!loc) { resolve('连接失败'); return; }

                const code = loc.toUpperCase().replace(/[^A-Z]/g, '');
                const emoji = countryCodeToEmoji(code);
                const regionLabel = `，${emoji}${code}`;

                // Tor 出口节点
                if (loc === 'T1') {
                    resolve(`已解锁（Tor）`);
                    return;
                }

                if (CLAUDE_SUPPORT_COUNTRY.includes(code)) {
                    resolve(`已解锁${regionLabel}`);
                } else {
                    resolve(`不可用${regionLabel}`);
                }
            }
        );
    });
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
