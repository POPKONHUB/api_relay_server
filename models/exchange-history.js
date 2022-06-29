const pool = require('../utils/pool');
const mysql = require('mysql2');
const { get_user_specify_condition } = require('../utils/common');

class History {
  async add_history({ block_number, private_key, cola_amt, popk_amt, exchange_type }) {
    const conn = await pool.getConnection();
    await conn.beginTransaction();

    try {
      await conn.query(`INSERT INTO 교환내역 SET ?`, {
          DATA:"교환내역 정보"
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

  async get_user_history({
    user_id,
    partners_code,
    begin = 0,
    end = new Date().getTime(),
    row_offset = 0,
    row_count = 20,
    exchange_type = 'all',
  }) {
    const conn = await pool.getConnection();

    const exchange_type_condition = (function () {
      const typeMap = {
        p2c: "교환타입 = 'p2c'",
        c2p: "교환타입 = 'c2p'",
        all: '1 = 1',
      };
      return typeMap[exchange_type];
    })();

    const user_condition = get_user_specify_condition({ user_id, partners_code });

    const select_query = `
      SELECT SQL_CALC_FOUND_ROWS *
      FROM 교환내역
    `;

    const [res] = await conn.query(select_query);
    const [total_res] = await conn.query(`SELECT FOUND_ROWS()`);
    const total = total_res[0]['FOUND_ROWS()'];
    conn.release();
    return [res, total];
  }
}

module.exports = new History();
