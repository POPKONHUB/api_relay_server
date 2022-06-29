const http = require('../utils/http');
const user = require('../models/user');
const { check_user_exist, get_unique_id } = require('../utils/common');
const { error_status } = require('../utils/const');

exports.issue_wallet = async function ({ user_id, partners_code, create }) {
  const { status, message, user_info } = await check_user_exist({ user_id, partners_code });
  if (!status) return { status: error_status.wrong_input, message };
  if (!create) return { address: user_info ? user_info['지갑주소'] : '' };
  if (user_info) return { address: user_info['지갑주소'] };

  const post_response = await http.post('/wallets/deposit-addresses', {
    name: get_unique_id(user_id, partners_code),
  });

  await user.add_user({
    user_id,
    partners_code,
    address: post_response.address,
    private_key: post_response.id,
  });

  return { address: post_response.address };
};
