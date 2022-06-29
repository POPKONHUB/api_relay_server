const pool = require('../utils/pool');

class Fee {
  constructor() {
    this.fee = null; 
  }

  async get_fee() {
    if (this.fee) return this.fee;

    const conn = await pool.getConnection();
    const [rows] = await conn.query(`SELECT 교환 수수료`);
    conn.release();
    this.fee = rows[0]['FEE'];
    return this.fee;
  }
}

module.exports = new Fee();
