const mysql = require("mysql2/promise");
require("dotenv").config();

const dbConfig = {
  host: process.env.DB_HOST || "127.0.0.1",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "food_lab_system",
  port: Number(process.env.DB_PORT || 3306),
};

async function addColumnIfNotExists(
  pool,
  tableName,
  columnName,
  columnDefinition,
) {
  try {
    await pool.query(
      `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`,
    );
    console.log(`Added ${columnName} to ${tableName}`);
  } catch (e) {
    if (
      e.code === "ER_DUP_FIELDNAME" ||
      e.message.includes("Duplicate column")
    ) {
      console.log(`${columnName} already exists in ${tableName}`);
    } else {
      console.error(`Error in ${tableName}.${columnName}:`, e.message);
    }
  }
}

async function run() {
  let pool;
  try {
    console.log("Starting automatic database setup...");

    // Connect without database first to ensure it exists
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      port: dbConfig.port,
    });

    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``,
    );
    console.log(`Database '${dbConfig.database}' verified/created.`);
    await connection.end();

    // Create pool with the database selected
    pool = mysql.createPool({
      ...dbConfig,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    console.log("Checking database updates...");

    await addColumnIfNotExists(
      pool,
      "lab_analysis",
      "revision_no",
      "VARCHAR(50) DEFAULT '03'",
    );
    await addColumnIfNotExists(
      pool,
      "lab_analysis",
      "issue_no",
      "VARCHAR(50) DEFAULT '01'",
    );
    await addColumnIfNotExists(
      pool,
      "lab_analysis",
      "date_of_revision",
      "VARCHAR(50) DEFAULT '01/01/2024'",
    );
    await addColumnIfNotExists(
      pool,
      "lab_analysis",
      "date_of_issue",
      "VARCHAR(50) DEFAULT '23/01/2019'",
    );

    await addColumnIfNotExists(
      pool,
      "food_registering",
      "revision_no",
      "VARCHAR(50) DEFAULT '03'",
    );
    await addColumnIfNotExists(
      pool,
      "food_registering",
      "issue_no",
      "VARCHAR(50) DEFAULT '01'",
    );
    await addColumnIfNotExists(
      pool,
      "food_registering",
      "date_of_revision",
      "VARCHAR(50) DEFAULT '01/01/2024'",
    );
    await addColumnIfNotExists(
      pool,
      "food_registering",
      "date_of_issue",
      "VARCHAR(50) DEFAULT '23/01/2019'",
    );
    await addColumnIfNotExists(
      pool,
      "food_registering",
      "spice_name",
      "VARCHAR(255)",
    );

    console.log("Database update completed successfully!");
    if (pool) await pool.end();
    process.exit(0);
  } catch (err) {
    console.error("Database setup ERROR:", err.message);
    if (pool) await pool.end();
    process.exit(1);
  }
}

run();
