const BigNumber = require('bignumber.js');
const mysql = require('mysql2');
const user = require('../models/user');
const { wei_coefficient } = require('./const');

const timestamp_to_date = function (datetime) {
  const date = new Date(datetime);
  const y = date.getFullYear(),
    m = (date.getMonth() + 1).toString().padStart(2, '0'),
    d = date.getDate().toString().padStart(2, '0'),
    hour = date.getHours().toString().padStart(2, '0'),
    min = date.getMinutes().toString().padStart(2, '0'),
    sec = date.getSeconds().toString().padStart(2, '0');

  return `${y}-${m}-${d} ${hour}:${min}:${sec}`;
};

exports.timestamp_to_date = timestamp_to_date;

exports.date_to_timestamp = function (date, type = 'start') {
  const sliced = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6)}`;
  const parsed = `${sliced} ${type === 'start' ? '00:00:00' : '23:59:59'}`;
  return new Date(parsed).getTime();
};

exports.format_database_timestamp = function (date) {
  return new Date(date.getTime()).getTime();
};

const stringify_big_number = (big_num) =>
  big_num
    .toNumber() 
    .toLocaleString(undefined, { maximumFractionDigits: 20 })
    .replace(/,/g, '');

exports.stringify_big_number = stringify_big_number;

const convert_to_big_number = (num) => {
  if (num instanceof BigNumber) return num;
  num = typeof num === 'string' ? num.replace(/,/g, '') : num; 
  return new BigNumber(num);
};

exports.calculate_wei = function (num, operator = 'multiple') {
  const big_num = convert_to_big_number(num);
  const calculated_big_num = operator === 'multiple' ? big_num.multipliedBy(wei_coefficient) : big_num.dividedBy(wei_coefficient);

  return stringify_big_number(calculated_big_num);
};

exports.compare_big_number = function (num1, num2) {
  const big_num1 = convert_to_big_number(num1);
  const big_num2 = convert_to_big_number(num2);
  return big_num1.isGreaterThan(big_num2) ? 1 : -1;
};

exports.check_user_exist = async function ({ user_id, partners_code }) {
  
  if (!user_id.trim().length) return { status: false, message: 'user_id가 누락되었습니다.' };
  if (!partners_code.trim().length) return { status: false, message: 'partners_code가 누락되었습니다.' };
  const [user_info] = await user.find_user({ user_id, partners_code });
  return {
    status: true,
    user_info,
  };
};

exports.get_unique_id = function (user_id, partners_code) {
  return `UNIQUE ID`;
};

exports.get_user_specify_condition = function ({ user_id, partners_code }) {
  if (!user_id || !partners_code) return `1 = 1`;
  return `PRIVATE_KEY = (
    SELECT PRIVATE_KEY 조회 Query`;
};
