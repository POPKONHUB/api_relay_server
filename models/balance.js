const pool = require('../utils/pool');
const mysql = require('mysql2');
const { main_coin } = require('../utils/const');

class Balance {
  async update_balance({ user_id, partners_code, private_key, coin_code = main_coin, amount, state = 'PLUS' }) {
    const conn = await pool.getConnection();
    await conn.beginTransaction();

    const private_key_condition = (function () {
      if (private_key) return `PRIVATE_KEY = ${mysql.escape(private_key)}`;
      return `PRIVATE_KEY = (
        SELECT PRIVATE_KEY 조회`;
    })();

    try {
      await conn.query(`
        UPDATE 유저 BALANCE 
      `);
      await conn.commit();
    } catch (e) {
      console.log(e);
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  }

  async get_balance({ user_id, partners_code, coin_code = main_coin }) {
    const conn = await pool.getConnection();

    const [rows] = await conn.query(`
      SELECT 잔고 조회`);
    conn.release();
    return rows[0]['잔고'];
  }
}

module.exports = new Balance();
