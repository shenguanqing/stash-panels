/**
 * ChatGPT 访问检测
 * 检测当前节点能否访问 ChatGPT Web 及 iOS 端，并识别落地区域。
 *
 * 检测逻辑：
 *   1. 通过 chat.openai.com/cdn-cgi/trace 获取落地国家码
 *   2. Web 端：请求 api.openai.com/compliance/cookie_requirements
 *      - 含 "unsupported_country" → 不可用
 *   3. iOS 端：请求 ios.chat.openai.com
 *      - 含 "request is not allowed" → 可用
 *      - 含 "disallowed isp"         → ISP 不支持
 *      - 含 "have been blocked"      → 已封锁
 *   4. 合并输出：Web + iOS 已解锁 / Web 已解锁 / iOS 已解锁 / 不可用
 */

var $httpClient, $done;

function countryCodeToEmoji(code) {
    if (!code) return '';
    code = code.toUpperCase().slice(0, 2);
    return String.fromCodePoint(...[...code].map(c => 127397 + c.charCodeAt(0)));
}

function get(url) {
    return new Promise((resolve, reject) => {
        $httpClient.get({ url }, (error, response, data) => {
            if (error) reject(error);
            else resolve({ response, data: data || '' });
        });
    });
}

async function getRegion() {
    try {
        const { data } = await get('https://chat.openai.com/cdn-cgi/trace');
        const map = {};
        data.split('\n').forEach(line => {
            const idx = line.indexOf('=');
            if (idx !== -1) map[line.slice(0, idx)] = line.slice(idx + 1).trim();
        });
        return map.loc ? map.loc.toUpperCase() : null;
    } catch { return null; }
}

async function checkWeb() {
    try {
        const { data } = await get('https://api.openai.com/compliance/cookie_requirements');
        return data.toLowerCase().includes('unsupported_country') ? 'No' : 'Yes';
    } catch { return 'Failed'; }
}

async function checkiOS() {
    try {
        const { data } = await get('https://ios.chat.openai.com/');
        const body = data.toLowerCase();
        if (body.includes('you may be connected to a disallowed isp')) return 'Disallowed ISP';
        if (body.includes('request is not allowed')) return 'Yes';
        if (body.includes('sorry, you have been blocked')) return 'Blocked';
        return 'Failed';
    } catch { return 'Failed'; }
}

async function parseChatGPT() {
    const [locCode, webStatus, iosStatus] = await Promise.all([
        getRegion(), checkWeb(), checkiOS(),
    ]);

    const regionLabel = locCode ? `，${countryCodeToEmoji(locCode)}${locCode}` : '';
    const webOk = webStatus === 'Yes';
    const iosOk = iosStatus === 'Yes';

    if (webOk && iosOk) return `Web + iOS 已解锁${regionLabel}`;
    if (webOk) return `Web 已解锁${regionLabel}`;
    if (iosOk) return `iOS 已解锁${regionLabel}`;

    if (webStatus === 'No') return `不可用${regionLabel}`;
    if (iosStatus === 'Disallowed ISP') return `ISP 不支持${regionLabel}`;
    if (iosStatus === 'Blocked') return `已封锁${regionLabel}`;
    return '连接失败';
}

(async () => {
    try {
        const content = await parseChatGPT();
        $done({ content });
    } catch (e) {
        console.log(`[ChatGPT Error] ${e?.message || JSON.stringify(e)}`);
        $done({ content: '连接失败' });
    }
})();
