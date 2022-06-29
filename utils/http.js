const axios = require('axios');

const config = require('../config');

const http = axios.create({
  baseURL: `${config.inst().frontend.protocol}://헤네시스 접근 api 주소/api/v3/ethereum`,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-Henesis-Secret': '헤네시스 시크릿 키',
    Authorization: '헤네시스 접근 키',
  },
});

(() => {
  http.interceptors.request.use((config) => {
    if (/^\/wallets\/\S+/.test(config.url)) {
      const { url } = config;
      let i = 0;
      while (++i < url.length) if (url[i] === '/') break;
      config.url = `/wallets/마스터지갑 id/${url.slice(i + 1)}`;
    }
    return config;
  });

  http.interceptors.response.use(
    (res) => Promise.resolve(res.data),
    (err) => Promise.reject(err.response.data)
  );
})();

module.exports = http;
