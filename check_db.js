const mysql = require("mysql2/promise");
require("dotenv").config();

const dbConfig = {
  host: process.env.DB_HOST || "127.0.0.1",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "food_lab_system",
  port: Number(process.env.DB_PORT || 3306),
};

const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function checkDatabaseConnection() {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.ping();
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  } finally {
    if (connection) connection.release();
  }
}

module.exports = {
  pool,
  dbConfig,
  checkDatabaseConnection,
};
