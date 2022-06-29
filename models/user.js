const pool = require('../utils/pool');
const { coins } = require('../utils/const');

class User {
  async find_user({ user_id, partners_code }) {
    const conn = await pool.getConnection();
    const [rows] = await conn.query(`SELECT * FROM 유저 정보`, [user_id, partners_code]);
    conn.release();
    return rows;
  }

  async add_user({ user_id, partners_code, address, private_key }) {
    const conn = await pool.getConnection();
    await conn.beginTransaction();
    try {
      await conn.query('INSERT INTO 유저정보 SET ?', {
          DATA:"유저정보"
      });
      for (const coin of coins) {
        await conn.query('INSERT INTO 유저잔고 SET ?', {
                DATA:"유저잔고 정보"
        });
      }
      await conn.commit();
    } catch (e) {
      console.log(e);
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  }

  async get_private_key({ user_id, partners_code }) {
    const conn = await pool.getConnection();
    const [rows] = await conn.query(
      `
      SELECT PRIVATE_KEY
      FROM 유저 정보`,
      [user_id, partners_code]
    );
    conn.release();
    return rows[0]['PRIVATE_KEY'];
  }

  async find_user_by_private_key({ private_key }) {
    const conn = await pool.getConnection();
    const [rows] = await conn.query(`SELECT * FROM 유저정보 WHERE 프라이빗키 = ?`, [private_key]);
    conn.release();
    return rows[0];
  }

  async find_user_by_wallet_address({ wallet_address }) {
    const conn = await pool.getConnection();
    const [rows] = await conn.query(`SELECT * FROM 유저정보 WHERE 지갑주소 = ?`, [wallet_address]);
    conn.release();
    return rows[0];
  }
}

module.exports = new User();
