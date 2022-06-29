'use strict';
const { date_to_timestamp } = require('./common');
const { main_coin } = require('./const');

const override_response_status = (resp) => ({
  status: 0,
  ...resp,
});

const get_valid_timestamp = (date, type) => {
  const default_timestamp = type === 'start' ? 0 : new Date().getTime();
  if (typeof date === 'undefined') return default_timestamp;
  return date_to_timestamp(date, type) || default_timestamp;
};

const get_valid_page_option = (num, type) => {
  const default_option = type === 'offset' ? 0 : 20;
  if (typeof num !== 'string') return default_option;
  return Math.floor(num) || default_option;
};

const get_valid_amount = (amount) => {
  if (typeof amount !== 'string') return 0;
  amount = amount.replace(/,/g, '') 
  if (Number.isNaN(+amount)) return 0;
  return +amount;
};

module.exports = {
  account: {
    req: (state, req) => ({
      user_id: typeof req.user_id === 'string' ? req.user_id : '',
      partners_code: typeof req.partners_code === 'string' ? req.partners_code : '',
      create: req.create === 'true',
    }),
    resp: (state, resp) => override_response_status(resp),
  },

  transfer: {
    req: (state, req) => ({
      user_id: typeof req.user_id === 'string' ? req.user_id : '',
      partners_code: typeof req.partners_code === 'string' ? req.partners_code : '',
      amount: Math.floor(get_valid_amount(req.amount)), 
      amount_before_rate: typeof req.amount_before_rate === 'string' ? req.amount_before_rate : '', 
      to: typeof req.to === 'string' ? req.to : '',
      coin_code: typeof req.coin_code === 'string' ? req.coin_code : main_coin,
    }),
    resp: (state, resp) => override_response_status(resp),
  },

  transferHistory: {
    req: (state, req) => ({
      user_id: typeof req.user_id === 'string' ? req.user_id : '',
      partners_code: typeof req.partners_code === 'string' ? req.partners_code : '',
      begin: get_valid_timestamp(req.begin, 'start'),
      end: get_valid_timestamp(req.end, 'end'),
      coin_code: typeof req.coin_code === 'string' ? req.coin_code : main_coin,
      row_offset: get_valid_page_option(req.row_offset, 'offset'),
      row_count: get_valid_page_option(req.row_count, 'count'),
      transfer_type: typeof req.transfer_type === 'string' ? req.transfer_type : 'all',
    }),
    resp: (state, resp) => override_response_status(resp),
  },

  exchange: {
    req: (state, req) => ({
      user_id: typeof req.user_id === 'string' ? req.user_id : '',
      partners_code: typeof req.partners_code === 'string' ? req.partners_code : '',
      amount: Math.floor(get_valid_amount(req.amount)), 
      exchange_type: typeof req.exchange_type === 'string' ? req.exchange_type : '',
    }),
    resp: (state, resp) => override_response_status(resp),
  },

  exchangeHistory: {
    req: (state, req) => ({
      user_id: typeof req.user_id === 'string' ? req.user_id : '',
      partners_code: typeof req.partners_code === 'string' ? req.partners_code : '',
      begin: get_valid_timestamp(req.begin, 'start'),
      end: get_valid_timestamp(req.end, 'end'),
      row_offset: get_valid_page_option(req.row_offset, 'offset'),
      row_count: get_valid_page_option(req.row_count, 'count'),
      exchange_type: typeof req.exchange_type === 'string' ? req.exchange_type : 'all',
    }),
    resp: (state, resp) => override_response_status(resp),
  },

  userBalance: {
    req: (state, req) => ({
      user_id: typeof req.user_id === 'string' ? req.user_id : '',
      partners_code: typeof req.partners_code === 'string' ? req.partners_code : '',
      coin_code: typeof req.coin_code === 'string' ? req.coin_code : main_coin,
    }),
    resp: (state, resp) => override_response_status(resp),
  },

  addressCheck: {
    req: (state, req) => ({
      wallet_address: typeof req.wallet_address === 'string' ? req.wallet_address : '',
    }),
    resp: (state, resp) => override_response_status(resp),
  },
};
