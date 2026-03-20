# stash-panels

适用于 [Stash](https://stash.ws) 的流媒体与 AI 服务连通性检测面板脚本集合。

---

## 面板预览

| 服务 | 检测内容 | 示例输出 |
|------|---------|---------|
| Apple | 落地区域 | `🇺🇸US` |
| Netflix | 完整解锁 / 自制剧 / 不可用 | `已完整解锁，🇺🇸US` |
| Disney+ | 已解锁 / 即将登陆 / 不可用 | `已解锁，🇭🇰HK` |
| YouTube | Premium 可用区域 | `已解锁，🇯🇵JP` |
| Bilibili | 港澳台解锁状态 | `已解锁，🇹🇼TW` |
| ChatGPT | Web / iOS 可用性 + 落地区域 | `Web + iOS 可用，🇺🇸US` |
| Gemini | 可用性 + 落地区域 | `已解锁，🇺🇸US` |

---

## 使用方法

在 Stash 中通过订阅链接一键导入：

```
https://raw.githubusercontent.com/shenguanqing/stash-panels/refs/heads/main/override/panel.stoverride
```

或在覆写配置中手动填写该订阅地址，Stash 会自动拉取面板配置及所有脚本。

---

## 脚本说明

| 文件 | 检测端点 |
|------|---------|
| `check-apple.js` | Apple CDN 落地区域检测 |
| `check-netflix.js` | `netflix.com/title/` 通过响应头 `x-originating-url` 提取区域 |
| `check-disney.js` | Disney+ 主站 + BAMTech GraphQL API |
| `check-youtube.js` | `youtube.com/premium` 页面解析 |
| `check-bilibili.js` | B站 pgc playurl API（港澳台双路检测） |
| `check-chatgpt.js` | OpenAI `cdn-cgi/trace` + `cookie_requirements` + iOS 端 |
| `check-gemini.js` | `gemini.google.com` 页面特征字符串匹配 |

---

## 免责声明

- 本项目为 **Vibe Coding** 产物，由 AI 辅助生成，代码质量与维护频率均不作任何保证。
- 本项目仅供学习与研究网络连通性检测技术，**严禁用于任何商业用途**。
- 脚本通过访问各平台公开端点进行检测，不涉及账号登录、内容下载或任何形式的破解行为。
- 使用本项目所产生的一切后果由使用者自行承担，作者不承担任何连带责任。
- 若各平台调整接口导致脚本失效，作者不保证及时更新与维护。
- 请在**合法合规**的前提下使用，并遵守所在地区的相关法律法规及各平台服务条款。

---

## License

[MIT](./LICENSE)
