const pool = require('../utils/pool');
const mysql = require('mysql2');
const { get_user_specify_condition, timestamp_to_date } = require('../utils/common');
const { main_coin } = require('../utils/const');

class History {
  async get_last_timestamp({ transfer_type = 'all' }) {
    const conn = await pool.getConnection();

    const transfer_type_condition = {
      deposit: "입출금타입 = 'DEPOSIT'",
      withdrawal: "입출금타입 = 'WITHDRAWAL'",
      all: '1 = 1',
    }[transfer_type];

    const [rows] = await conn.query(`
        SELECT 입출금 내역 조회
        WHERE ${transfer_type_condition};
    `);
    conn.release();
    return rows[0]['LAST_TIMESTAMP'] || 0;
  }

  async add_history({
    block_number,
    transaction_id,
    transaction_hash,
    wallet_address,
    amount,
    private_key,
    flush,
    transfer_type,
    coin_code = main_coin,
    execution,
    cola_amt = '0',
    cola_amt_before_rate = '0',
  }) {
    const conn = await pool.getConnection();
    await conn.beginTransaction();

    try {
      await conn.query(`INSERT INTO 입출금 내역 SET ?`, {
           DATA: '입출금 상세 정보'
      });
      await conn.commit();
    } catch (e) {
      console.log(e);
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  }

  async add_histories(transfer_arr) {
    const conn = await pool.getConnection();
    await conn.beginTransaction();
    const rows = transfer_arr.map((el) => [
      el.block_number, //
      el.transaction_id,
      el.transaction_hash,
      el.wallet_address,
      el.amount,
      el.private_key,
      el.flush,
      el.transfer_type,
      el.coin_code || main_coin,
      el.execution,
    ]);

    try {
      await conn.query(
        `INSERT INTO 임출금 내역
        VALUES ?`,
        [rows]
      );
      await conn.commit();
    } catch (e) {
      console.log(e);
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  }

  async get_not_flushed_rows() {
    const conn = await pool.getConnection();
    const [rows] = await conn.query(`
       SELECT 입출금 내역 조회
     `);
    conn.release();
    return rows;
  }

  async get_not_flushed() {
    const conn = await pool.getConnection();
    const [rows] = await conn.query(`
      SELECT 집금 내역 조회
    `);
    conn.release();
    return rows;
  }

  async update_flush_by_seq({ seq, state = 'Y', cola_amt = '0' }) {
    const conn = await pool.getConnection();
    await conn.beginTransaction();

    const update_query = `
      UPDATE 임출금 내역
    `;

    try {
      const [res] = await conn.query(update_query);
      await conn.commit();
      return res.affectedRows;
    } catch (e) {
      console.log(e);
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  }

  async update_flush({ private_key, coin_code = main_coin, state = 'Y', cola_amt = '0' }) {
    const conn = await pool.getConnection();
    await conn.beginTransaction();

    const flush_target = state === 'Y' ? 'N' : 'Y';

    const update_query = `
      UPDATE  임출금 내역
    `;

    try {
      const [res] = await conn.query(update_query);
      await conn.commit();
      return res.affectedRows;
    } catch (e) {
      console.log(e);
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  }

  async get_user_history({
    user_id, //
    partners_code,
    begin = 0,
    end = new Date().getTime(),
    coin_code = main_coin,
    row_offset = 0,
    row_count = 20,
    transfer_type = 'all',
  }) {
    const conn = await pool.getConnection();

    const transfer_type_condition = (function () {
      const typeMap = {
        withdrawal: "입출금타입 = 'WITHDRAWAL'",
        deposit: "입출금타입 = 'DEPOSIT'",
        all: '1 = 1',
      };
      return typeMap[transfer_type];
    })();

    const user_condition = get_user_specify_condition({ user_id, partners_code });

    const select_query = `
      SELECT 임출금 내역
    `;

    const [res] = await conn.query(select_query);
    const [total_res] = await conn.query(`SELECT FOUND_ROWS()`);
    const total = total_res[0]['FOUND_ROWS()'];
    conn.release();
    return [res, total];
  }

  async get_not_confirmed_withdraws() {
    const conn = await pool.getConnection();
    const [res] = await conn.query(`
      SELECT *
        임출금 내역
    `);
    conn.release();
    return res;
  }

  async update_exeuction({ seq, state = 'CONFIRMED' }) {
    const conn = await pool.getConnection();
    await conn.beginTransaction();

    try {
      await conn.query(`
        UPDATE 임출금 내역
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
}

module.exports = new History();
