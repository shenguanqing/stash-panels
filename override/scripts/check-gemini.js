/**
 * Gemini 访问检测
 * 检测当前节点能否访问 Gemini，并识别落地区域。
 *
 * 检测逻辑：
 *   1. 请求 gemini.google.com 页面源码
 *   2. 定位标记 ',2,1,200,"' 后提取 3 位大写字母（alpha-3 国家码）
 *   3. 对照封锁列表（CHN RUS BLR CUB IRN PRK SYR HKG MAC）判断可用性
 *   4. alpha-3 → alpha-2 映射后生成 emoji
 */

var $httpClient, $done;

const BLOCKED_CODES = new Set(['CHN', 'RUS', 'BLR', 'CUB', 'IRN', 'PRK', 'SYR', 'HKG', 'MAC']);
const REGION_MARKER = ',2,1,200,"';

const ALPHA3_TO_2 = {
    CHN: 'CN', RUS: 'RU', BLR: 'BY', CUB: 'CU', IRN: 'IR',
    PRK: 'KP', SYR: 'SY', HKG: 'HK', MAC: 'MO',
    USA: 'US', GBR: 'GB', JPN: 'JP', KOR: 'KR', DEU: 'DE',
    FRA: 'FR', AUS: 'AU', CAN: 'CA', SGP: 'SG', TWN: 'TW',
    IND: 'IN', BRA: 'BR', MEX: 'MX', NLD: 'NL', ITA: 'IT',
    ESP: 'ES', SWE: 'SE', NOR: 'NO', DNK: 'DK', FIN: 'FI',
    POL: 'PL', THA: 'TH', PHL: 'PH', IDN: 'ID', MYS: 'MY',
    VNM: 'VN', TUR: 'TR', ISR: 'IL', ZAF: 'ZA', ARG: 'AR',
    CHL: 'CL', COL: 'CO', PER: 'PE', NZL: 'NZ', PRT: 'PT',
    BEL: 'BE', CHE: 'CH', AUT: 'AT', CZE: 'CZ', HUN: 'HU',
    ROU: 'RO', GRC: 'GR', UKR: 'UA', SAU: 'SA', ARE: 'AE',
};

function countryCodeToEmoji(code) {
    if (!code) return '';
    const alpha2 = ALPHA3_TO_2[code.toUpperCase()] ?? code.toUpperCase().slice(0, 2);
    return String.fromCodePoint(...[...alpha2].map(c => 127397 + c.charCodeAt(0)));
}

async function parseGemini() {
    return new Promise((resolve) => {
        $httpClient.get({ url: 'https://gemini.google.com' }, (error, response, data) => {
            if (error || !data) { resolve('连接失败'); return; }

            const markerIdx = data.indexOf(REGION_MARKER);
            if (markerIdx === -1) { resolve('连接失败'); return; }

            const candidate = data.slice(markerIdx + REGION_MARKER.length, markerIdx + REGION_MARKER.length + 3);
            if (!/^[A-Z]{3}$/.test(candidate)) { resolve('连接失败'); return; }

            const alpha2 = ALPHA3_TO_2[candidate] ?? candidate.slice(0, 2);
            const regionLabel = `，${countryCodeToEmoji(candidate)}${alpha2}`;
            resolve(BLOCKED_CODES.has(candidate) ? `不可用${regionLabel}` : `已解锁${regionLabel}`);
        });
    });
}

(async () => {
    try {
        const content = await parseGemini();
        $done({ content });
    } catch (e) {
        console.log(`[Gemini Error] ${e?.message || JSON.stringify(e)}`);
        $done({ content: '连接失败' });
    }
})();
