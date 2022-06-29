const ratio = require('../models/ratio');
const balance = require('../models/balance');
const history = require('../models/exchange-history');
const user = require('../models/user');
const { check_user_exist, calculate_wei, compare_big_number } = require('../utils/common');
const { error_status } = require('../utils/const');
const { notify_cola_exchanged } = require('../utils/http-popk');

exports.exchange_token = async function ({
  user_id, 
  partners_code,
  amount,
  exchange_type,
}) {
  const { status, message, user_info } = await check_user_exist({ user_id, partners_code });
  if (!status) return { status: error_status.wrong_input, message };
  if (!user_info) return { status: error_status.no_data, message: '존재하지 않는 유저입니다.' };

  if (amount < 1) return { status: error_status.wrong_input, message: '환전 금액은 1보다 커야합니다.' };

  if (!['p2c', 'c2p'].includes(exchange_type)) return { status: error_status.wrong_input, message: `유효하지 않은 exchange_type입니다 : ${exchange_type}` };

  const _ratio = await ratio.get_ratio();
  const exchange_ratio = exchange_type === 'p2c' ? _ratio : 1 / _ratio;
  const exchange_amount = amount * exchange_ratio;
  const cola_amt = exchange_type === 'p2c' ? exchange_amount : amount;
  const popk_amt = exchange_type === 'p2c' ? amount : exchange_amount;

  console.log({
    exchange_type,
    cola_amt,
    popk_amt,
    exchange_ratio,
  });

  if (exchange_type === 'p2c') {
    const user_balance = await balance.get_balance({
      user_id, 
      partners_code,
    });
    const wei_balance = calculate_wei(user_balance, 'divide');
    console.log(`popk_amt: ${popk_amt} | wei_balance: ${wei_balance}`);

    if (compare_big_number(popk_amt, wei_balance) > 0) return { status: error_status.wrong_input, message: '환전하고자 하는 금액이 잔고 내 금액보다 많습니다.' };
  }

  await balance.update_balance({
    user_id,
    partners_code,
    amount: calculate_wei(popk_amt, 'multiple'),
    state: exchange_type === 'p2c' ? 'MINUS' : 'PLUS',
  });

  const private_key = await user.get_private_key({ user_id, partners_code });

  await history.add_history({
    block_number: new Date().getTime(),
    private_key,
    cola_amt,
    popk_amt,
    exchange_type,
  });

  if (exchange_type === 'p2c') {
    await notify_cola_exchanged({
      user_id,
      partners_code,
      cola_amount: cola_amt.toString(),
    });
  }

  const res = {};
  if (exchange_type === 'p2c') res['CEG01'] = cola_amt.toString();
  if (exchange_type === 'c2p') res['POPK'] = popk_amt.toString();

  return res;
};
