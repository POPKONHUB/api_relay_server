const mysql = require('mysql2');

const pool = mysql
  .createPool({
    host: 'DB 주소' || 'localhost',
    user: 'DB 접근자',
    password: 'DB 패스워드',
    database: 'DB 이름',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  })
  .promise();

module.exports = pool;
