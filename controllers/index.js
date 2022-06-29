'use strict';

const { issue_wallet } = require('./account');
const { transfer_token } = require('./transfer');
const { get_transfer_history } = require('./transfer-history');
const { exchange_token } = require('./exchange');
const { get_exchange_history } = require('./exchange-history');
const { fetch_balance } = require('./user-balance');
const { address_check } = require('./address-check');

module.exports = (method, req) => {
  const method_map = {
    account: () => issue_wallet(req),
    transfer: () => transfer_token(req),
    transferHistory: () => get_transfer_history(req),
    exchange: () => exchange_token(req),
    exchangeHistory: () => get_exchange_history(req),
    userBalance: () => fetch_balance(req),
    addressCheck: () => address_check(req),
  };

  return method_map[method]();
};
