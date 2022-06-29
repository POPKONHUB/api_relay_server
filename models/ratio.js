const pool = require('../utils/pool');

class Ratio {
  constructor() {
    this.ratio = null; 
  }

  async get_ratio() {
    if (this.ratio) return this.ratio;

    const conn = await pool.getConnection();
    const [rows] = await conn.query(`SELECT 교환 비율`);
    conn.release();
    this.ratio = rows[0]['RATIO'];
    return this.ratio;
  }
}

module.exports = new Ratio();
