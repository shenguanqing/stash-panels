function countryCodeToEmoji(code) {
    if (!code) return '';
    code = code.toUpperCase().slice(0, 2);
    return String.fromCodePoint(...[...code].map(c => 127397 + c.charCodeAt(0)));
}

$httpClient.get({ url: 'https://gspe1-ssl.ls.apple.com/pep/gcc' }, function(err, res, data) {
    if (!err && data && data.trim().length === 2) {
        const region = data.trim().toUpperCase();
        const emoji = countryCodeToEmoji(region);
        $done({ content: `${emoji}${region}` });
    } else {
        $done({ content: '检测失败，请刷新' });
    }
});