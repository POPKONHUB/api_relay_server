const history = require('../models/dw-history');
const balance = require('../models/balance');
const user = require('../models/user');
const ratio = require('../models/ratio');
const exchange_history = require('../models/exchange-history');

const { coins, main_coin, wei_coefficient } = require('../utils/const');
const http = require('../utils/http');
const { notify_cola_exchanged } = require('../utils/http-popk');
const { compare_big_number, stringify_big_number } = require('../utils/common');
const BigNumber = require('bignumber.js');

exports.get_transfers_list = async function () {
  const curr_timestamp = new Date().getTime();
  const last_timestamp = await history.get_last_timestamp({ transfer_type: 'deposit' }); 
  const list = [];
  let page_no = 0; 

  while (true) {
    const { pagination, results } = await http.get('/transfers', {
      params: {
        page: page_no,
        
        updatedAtLt: curr_timestamp,
        ...(last_timestamp > 0 && { updatedAtGte: last_timestamp + 1 }),
        status: 'CONFIRMED',
        transferType: 'DEPOSIT',
      },
    });
    list.push(...results);
    page_no++;
    if (!pagination?.nextUrl) break;
  }



  const transfers_list = [...list]
    .reverse()
    .filter(({ to }) => to !== '마스터 지급 주소' )
    .map(
      ({
        updatedAt, 
        transactionId,
        transactionHash,
        to,
        amount,
        depositAddressId,
        transferType,
        ticker,
      }) => {
        const isFlushed =
          !depositAddressId || depositAddressId === '마스터 지급 주소' //
            ? 'Y'
            : 'N';
        return {
          block_number: updatedAt,
          transaction_id: transactionId,
          transaction_hash: transactionHash,
          wallet_address: to,
          amount,
          private_key: depositAddressId || '',
          flush: isFlushed,
          transfer_type: transferType,
          coin_code: ticker,
          execution: 'CONFIRMED', 
        };
      }
    );

 

  if (transfers_list.length > 0) await history.add_histories(transfers_list);

  return true;
};

exports.flush_money = async function () {
  const not_flushed_rows = await history.get_not_flushed_rows();
  const not_flushed_unique_rows = [...new Set(not_flushed_rows.map((row) => `${row['PRIVATE_KEY']} ${row['COIN_CODE']}`))];
  if (not_flushed_unique_rows.length < 1) {
    console.log(`not enough not_flushed: ${not_flushed_unique_rows.length} keys`);
    return true;
  }

  const request_targets = not_flushed_unique_rows.map((el) => {
    const [private_key, coin_code] = el.split(' ');
    return {
      coinId: coins.find((x) => x.code === coin_code)['id'],
      depositAddressId: private_key,
    };
  });

  await http.post('/wallets/flush', { targets: request_targets }).catch((e) => {
    console.log(e);
  });



  const private_key_store = {};
  for (const el of not_flushed_rows) {
    const {
       private_key, 
       coin_code,
       seq,
       amount,
    } = el;

    console.log('flush for loop');
    console.log(el);

    if (coin_code !== main_coin) {
      await history.update_flush_by_seq({
        seq,
        state: 'Y',
      });
      console.log(`flush_money(not main coin) - 입금내역 updated`);

      await balance.update_balance({
        private_key,
        coin_code,
        amount: amount,
        state: 'PLUS',
      });

      continue;
    }

    const _ratio = await ratio.get_ratio();
    const exchanged_cola_amount = new BigNumber(amount)
      .dividedBy(wei_coefficient)      
	  .integerValue(BigNumber.ROUND_FLOOR)
      .multipliedBy(_ratio);
    const exchanged_popk_amount = exchanged_cola_amount.dividedBy(_ratio).multipliedBy(wei_coefficient); 
    const not_exchanged_popk_amount = new BigNumber(amount).minus(exchanged_popk_amount); 

    const str_exchanged_cola_amount = stringify_big_number(exchanged_cola_amount);
    const str_exchanged_popk_amount = stringify_big_number(exchanged_popk_amount);
    const str_not_exchanged_popk_amount = stringify_big_number(not_exchanged_popk_amount);

   

    await history.update_flush_by_seq({
      seq,
      state: 'Y',
      cola_amt: str_exchanged_cola_amount,
    });



    await exchange_history.add_history({
      block_number: new Date().getTime(),
      private_key,
      cola_amt: str_exchanged_cola_amount,
      popk_amt: stringify_big_number(exchanged_popk_amount.dividedBy(wei_coefficient)), 
      exchange_type: 'p2c',
    });



    if (compare_big_number(not_exchanged_popk_amount, 0) > 0) {
      await balance.update_balance({
        private_key,
        coin_code,
        amount: str_not_exchanged_popk_amount,
        state: 'PLUS',
      });

    }

    let target_user;
    if (!private_key_store[private_key]) {
      target_user = await user.find_user_by_private_key({ private_key });
      private_key_store[private_key] = target_user;
    } else {
      target_user = private_key_store[private_key];
    }

    await notify_cola_exchanged({
      user_id: target_user['USER_ID'],
      partners_code: target_user['PARTNERS_CODE'],
      cola_amount: str_exchanged_cola_amount,
    });
  }



  return true;
};
