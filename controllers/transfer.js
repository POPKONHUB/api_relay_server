const http = require('../utils/http');
const history = require('../models/dw-history');
const balance = require('../models/balance');
const ratio = require('../models/ratio');
const fee = require('../models/fee');
const { check_user_exist, compare_big_number, stringify_big_number } = require('../utils/common');
const { error_status, wei_coefficient } = require('../utils/const');
const BigNumber = require('bignumber.js');
const exchange_history = require('../models/exchange-history');

exports.transfer_token = async function ({ user_id, partners_code, amount, amount_before_rate, to, coin_code }) {
  const { status, message, user_info } = await check_user_exist({ user_id, partners_code });
  if (!status) return { status: error_status.wrong_input, message };
  if (!user_info) return { status: error_status.no_data, message: '존재하지 않는 유저입니다.' };

  const _ratio = await ratio.get_ratio();
  const _fee = await fee.get_fee();
  const cola_amt = new BigNumber(amount);
  const popk_amt_before_fee = cola_amt.dividedBy(_ratio);
  const popk_amt_before_wei = popk_amt_before_fee.minus(_fee);
  const popk_amt = popk_amt_before_wei.multipliedBy(wei_coefficient);

  if (compare_big_number(popk_amt_before_fee, _fee) < 0) return { status: error_status.wrong_input, message: `출금 COLA 수량은 ${_fee * _ratio}보다 커야합니다.` };
  const balance_amount = await (async () => {
    const _balance = await balance.get_balance({ user_id, partners_code, coin_code });
    return new BigNumber(_balance).dividedBy(wei_coefficient);
  })();
  if (compare_big_number(popk_amt_before_fee, balance_amount) > 0) return { status: error_status.wrong_input, message: '출금하고자 하는 금액이 잔고 내 금액보다 많습니다.' };

  if (!to.trim().length) return { status: error_status.no_data, message: '출금할 외부 지갑 주소를 입력해주세요.' };
  if (!amount_before_rate.trim().length) return { status: error_status.no_data, message: '환전율 적용 이전의 COLA 수량을 입력해주세요.' };

  const str_cola_amt = stringify_big_number(cola_amt);
  const str_popk_amt_before_fee = stringify_big_number(popk_amt_before_fee);
  const str_popk_amt = stringify_big_number(popk_amt); 

  

  const post_res = await http.post('/wallets/transfer', {
    to,
    amount: str_popk_amt,
    passphrase: '서버에 저장된 패스워드',
    ticker: coin_code,
  });

  await history.add_history({
    block_number: new Date().getTime(),
    transaction_id: post_res.id,
    transaction_hash: post_res.hash || '',
    wallet_address: to,
    amount: str_popk_amt,
    private_key: user_info['PRIVATE_KEY'],
    flush: 'Y',
    transfer_type: 'WITHDRAWAL',
    coin_code,
    execution: post_res.status,
    cola_amt: str_cola_amt, 
    cola_amt_before_rate: amount_before_rate, 
  });



  await balance.update_balance({
    private_key: user_info['PRIVATE_KEY'],
    coin_code,
    amount: stringify_big_number(popk_amt_before_fee.multipliedBy(wei_coefficient)),
    state: 'MINUS',
  });



  await exchange_history.add_history({
    block_number: new Date().getTime(),
    private_key: user_info['PRIVATE_KEY'],
    cola_amt: str_cola_amt,
    popk_amt: str_popk_amt_before_fee,
    exchange_type: 'c2p',
  });



  return {
    id: post_res.id,
  };
};

exports.update_executed_withdraws = async function () {
  const withdraws = await history.get_not_confirmed_withdraws();
  for (const withdraw of withdraws) {
    const res = await http.get(`/transactions/${withdraw['트랜잭션 id']}`);
    if (res.status === 'CONFIRMED') {
      await history.update_exeuction({ seq: withdraw['SEQ'], state: res.status });
      console.log('update_executed_withdraws - database updated');
    }
  }
  return true;
};
