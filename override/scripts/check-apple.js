$httpClient.get({ url: 'https://gspe1-ssl.ls.apple.com/pep/gcc' }, function (err, res, data) {
  if (!err && data && data.trim().length === 2) {
    $done({ title: 'Apple 区域', content: '区域：' + data.trim().toUpperCase() })
  } else {
    $done({ title: 'Apple 区域', content: '检测失败，请刷新' })
  }
})