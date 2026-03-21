/**
 * ChatGPT / OpenAI 访问检测
 * 检测是否能访问 OpenAI 服务，以及是否支持 API 访问
 */

var $httpClient, $done;

async function request(method, params) {
    return new Promise((resolve, reject) => {
        $httpClient[method.toLowerCase()](params, (error, response, data) => {
            if (error) reject({ error, response, data });
            else resolve({ error, response, data });
        });
    });
}

async function get(params) {
    return request("GET", typeof params === "string" ? { url: params } : params);
}

function countryCodeToEmoji(code) {
    if (!code) return "";
    code = code.toUpperCase().slice(0, 2);
    return String.fromCodePoint(
        ...[...code].map((c) => 127397 + c.charCodeAt(0))
    );
}

// 获取节点落地区域（与参考脚本一致）
async function getChatGPTCountryCode() {
    const res = await get("https://chat.openai.com/cdn-cgi/trace").catch(
        () => null
    );
    if (!res || typeof res.data !== "string") return null;

    const map = {};
    res.data.split("\n").forEach((line) => {
        const idx = line.indexOf("=");
        if (idx !== -1) map[line.slice(0, idx)] = line.slice(idx + 1);
    });

    const loc = map["loc"];
    return loc ? loc.trim() : null;
}

// 检测 Web 是否可用（与参考脚本一致）
async function parseChatGPTWeb() {
    const res = await get(
        "https://api.openai.com/compliance/cookie_requirements"
    ).catch(() => null);
    if (!res || typeof res.data !== "string") return "failed";
    if (res.data.toLowerCase().includes("unsupported_country"))
        return "unsupported";
    return "ok";
}

// 检测 iOS 端是否可用（与参考脚本一致）
async function parseChatGPTiOS() {
    const res = await get("https://ios.chat.openai.com/").catch(() => null);
    if (!res || typeof res.data !== "string") return "failed";
    const body = res.data.toLowerCase();
    if (body.includes("you may be connected to a disallowed isp"))
        return "disallowed";
    if (body.includes("request is not allowed")) return "ok";
    if (body.includes("sorry, you have been blocked")) return "blocked";
    return "failed";
}

async function parseChatGPT() {
    const [locRes, webRes, iosRes] = await Promise.allSettled([
        getChatGPTCountryCode(),
        parseChatGPTWeb(),
        parseChatGPTiOS(),
    ]);

    const loc = locRes.status === "fulfilled" ? locRes.value : null;
    const web = webRes.status === "fulfilled" ? webRes.value : "failed";
    const ios = iosRes.status === "fulfilled" ? iosRes.value : "failed";

    const regionLabel = loc ? `，${countryCodeToEmoji(loc)}${loc}` : "";

    if (web === "unsupported") return `不可用${regionLabel}`;
    if (ios === "disallowed") return `ISP 不支持${regionLabel}`;
    if (ios === "blocked") return `已封锁${regionLabel}`;

    const parts = [];
    if (web === "ok") parts.push("Web");
    if (ios === "ok") parts.push("iOS");

    if (parts.length > 0) return `${parts.join(" + ")} 可用${regionLabel}`;
    return `连接失败${regionLabel}`;
}

(async () => {
    try {
        const content = await parseChatGPT();
        $done({ content });
    } catch (e) {
        console.log(`[Error] ${e?.message || JSON.stringify(e)}`);
        $done({ content: "连接失败" });
    }
})();
