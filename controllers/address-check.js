const user = require('../models/user');

exports.address_check = async function ({ wallet_address }) {
  if (!wallet_address.trim().length) return { message: '지갑 주소를 입력해주세요.' };

  const finded_user = await user.find_user_by_wallet_address({ wallet_address });

  const validity = !Boolean(finded_user)
  return { validity };
};
