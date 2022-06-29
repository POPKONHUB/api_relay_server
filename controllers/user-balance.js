const balance = require('../models/balance');
const { calculate_wei, check_user_exist } = require('../utils/common');
const { error_status } = require('../utils/const');

exports.fetch_balance = async function ({ user_id, partners_code, coin_code }) {
  const { status, message, user_info } = await check_user_exist({ user_id, partners_code });
  if (!status) return { status: error_status.wrong_input, message };
  if (!user_info) return { status: error_status.no_data, message: '존재하지 않는 유저입니다.' };

  const balance_res = await balance.get_balance({
    user_id,
    partners_code,
    coin_code,
  });

  return {
    balance: calculate_wei(balance_res, 'divide'),
  };
};
