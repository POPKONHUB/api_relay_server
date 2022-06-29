const axios = require('axios');
const qs = require('qs');

const popk_main_server = axios.create({
  baseURL: "서버에 저장된 POPK MAIN HOST",
});

const popk_api_server = axios.create({
  baseURL: "서버에 저장된 POPK API HOST",
});

exports.notify_cola_exchanged = async function ({ user_id, partners_code, cola_amount }) {
  const encrypt_data = qs.stringify({
    data: user_id,
    aesKey: "서버에 저장된 암호화 키",
  });

  const config = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  };

  const { data: secret_id } = await popk_api_server.post('/팝콘 api 주소', encrypt_data, config);
  console.log(`cola exchange - secret_id : ${secret_id}`);

  const exchange_data = qs.stringify({
    SC_SI: secret_id, 
    SC_PC: partners_code, 
    SC_AMT: cola_amount,
  });

  const { data: result } = await popk_main_server.post('/팝콘 api 주소', exchange_data, config);
  console.log('cola exchange - POPK api success');
  console.log(result);
};
