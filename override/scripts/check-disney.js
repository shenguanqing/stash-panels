/**
 * Disney+ 解锁检测
 * 通过 BAMTech 媒体服务 API 检测区域
 */

var $httpClient, $done;

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36';

const STATUS_COMING = 2;
const STATUS_AVAILABLE = 1;
const STATUS_NOT_AVAILABLE = 0;
const STATUS_TIMEOUT = -1;
const STATUS_ERROR = -2;

function countryCodeToEmoji(code) {
  if (!code) return '';
  code = code.toUpperCase().slice(0, 2);
  return String.fromCodePoint(...[...code].map(c => 127397 + c.charCodeAt(0)));
}

function timeout(delay = 7000) {
  return new Promise((_, reject) => setTimeout(() => reject('Timeout'), delay));
}

// 与参考脚本完全一致：检测主页获取 region 和 cnbl
function testHomePage() {
  return new Promise((resolve, reject) => {
    $httpClient.get(
      { url: 'https://www.disneyplus.com/', headers: { 'Accept-Language': 'en', 'User-Agent': UA } },
      (error, response, data) => {
        if (error) { reject('Error'); return; }
        if (response.status !== 200 || data.indexOf('Sorry, Disney+ is not available in your region.') !== -1) {
          reject('Not Available');
          return;
        }
        const match = data.match(/Region: ([A-Za-z]{2})[\s\S]*?CNBL: ([12])/);
        if (!match) { resolve({ region: '', cnbl: '' }); return; }
        resolve({ region: match[1], cnbl: match[2] });
      }
    );
  });
}

// 与参考脚本完全一致：通过 BAMTech GraphQL 获取 countryCode 和 inSupportedLocation
function getLocationInfo() {
  return new Promise((resolve, reject) => {
    $httpClient.post(
      {
        url: 'https://disney.api.edge.bamgrid.com/graph/v1/device/graphql',
        headers: {
          'Accept-Language': 'en',
          'Authorization': 'ZGlzbmV5JmJyb3dzZXImMS4wLjA.Cu56AgSfBTDag5NiRA81oLHkDZfu5L3CKadnefEAY84',
          'Content-Type': 'application/json',
          'User-Agent': UA,
        },
        body: JSON.stringify({
          query: 'mutation registerDevice($input: RegisterDeviceInput!) { registerDevice(registerDevice: $input) { grant { grantType assertion } } }',
          variables: {
            input: {
              applicationRuntime: 'chrome',
              attributes: {
                browserName: 'chrome',
                browserVersion: '94.0.4606',
                manufacturer: 'apple',
                model: null,
                operatingSystem: 'macintosh',
                operatingSystemVersion: '10.15.7',
                osDeviceIds: [],
              },
              deviceFamily: 'browser',
              deviceLanguage: 'en',
              deviceProfile: 'macosx',
            },
          },
        }),
      },
      (error, response, data) => {
        if (error) { reject('Error'); return; }
        if (response.status !== 200) { reject('Not Available'); return; }
        const parsed = JSON.parse(data);
        if (parsed?.errors) { reject('Not Available'); return; }
        const { token: { accessToken }, session: { inSupportedLocation, location: { countryCode } } } = parsed?.extensions?.sdk;
        resolve({ inSupportedLocation, countryCode, accessToken });
      }
    );
  });
}

async function testDisneyPlus() {
  try {
    const { region } = await Promise.race([testHomePage(), timeout(7000)]);
    const { countryCode, inSupportedLocation } = await Promise.race([getLocationInfo(), timeout(7000)]);
    const finalRegion = countryCode ?? region;
    if (inSupportedLocation === false || inSupportedLocation === 'false') {
      return { region: finalRegion, status: STATUS_COMING };
    }
    return { region: finalRegion, status: STATUS_AVAILABLE };
  } catch (error) {
    if (error === 'Not Available') return { region: '', status: STATUS_NOT_AVAILABLE };
    if (error === 'Timeout') return { region: '', status: STATUS_TIMEOUT };
    return { region: '', status: STATUS_ERROR };
  }
}

async function parseDisney() {
  const { region, status } = await testDisneyPlus();
  const emoji = region ? countryCodeToEmoji(region) : '';
  const regionLabel = region ? `，${emoji}${region.toUpperCase()}` : '';

  if (status === STATUS_AVAILABLE) return `已解锁${regionLabel}`;
  if (status === STATUS_COMING) return `即将登陆${regionLabel}`;
  if (status === STATUS_NOT_AVAILABLE) return '不可用';
  if (status === STATUS_TIMEOUT) return '检测超时';
  return '连接失败';
}

(async () => {
  try {
    const content = await parseDisney();
    $done({ content });
  } catch (e) {
    console.log(`[Error] ${e?.message || JSON.stringify(e)}`);
    $done({ content: '连接失败' });
  }
})();