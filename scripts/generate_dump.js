const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const dbConfig = {
  host: process.env.DB_HOST || "127.0.0.1",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "food_lab_system",
  port: Number(process.env.DB_PORT || 3306),
};

async function generateDump() {
  let connection;
  try {
    console.log("Connecting to database to generate SQL dump...");
    connection = await mysql.createConnection(dbConfig);
    console.log("Connected successfully.");

    let dumpContent = "";
    dumpContent += `-- Food Lab System SQL Dump\n`;
    dumpContent += `-- Generated on ${new Date().toISOString()}\n`;
    dumpContent += `-- Database: ${dbConfig.database}\n\n`;
    dumpContent += `SET FOREIGN_KEY_CHECKS=0;\n\n`;

    // 1. Get all tables (exclude views)
    const [tables] = await connection.query("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'");
    const tableNames = tables.map(row => Object.values(row)[0]);

    console.log(`Found ${tableNames.length} tables:`, tableNames);

    for (const tableName of tableNames) {
      console.log(`Dumping table structure and data for: ${tableName}...`);
      dumpContent += `-- ------------------------------------------------------\n`;
      dumpContent += `-- Table structure for table \`${tableName}\`\n`;
      dumpContent += `-- ------------------------------------------------------\n`;
      dumpContent += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;

      // Get Table Create Syntax
      const [createTableResult] = await connection.query(`SHOW CREATE TABLE \`${tableName}\``);
      const createTableSql = createTableResult[0]["Create Table"];
      dumpContent += `${createTableSql};\n\n`;

      // Get Table Data
      dumpContent += `-- Dumping data for table \`${tableName}\`\n`;
      const [rows] = await connection.query(`SELECT * FROM \`${tableName}\``);
      if (rows.length > 0) {
        dumpContent += `LOCK TABLES \`${tableName}\` WRITE;\n`;
        dumpContent += `INSERT INTO \`${tableName}\` VALUES \n`;
        
        const insertRows = [];
        for (const row of rows) {
          const values = Object.values(row).map(val => {
            if (val === null) return "NULL";
            if (val instanceof Date) {
              // Convert to YYYY-MM-DD HH:MM:SS format
              return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
            }
            if (typeof val === "string") {
              // Escape backslashes, newlines, and single quotes safely for SQL injection prevention
              const escaped = val
                .replace(/\\/g, "\\\\")
                .replace(/'/g, "\\'")
                .replace(/\n/g, "\\n")
                .replace(/\r/g, "\\r");
              return `'${escaped}'`;
            }
            if (typeof val === "boolean") return val ? 1 : 0;
            return val;
          });
          insertRows.push(`(${values.join(", ")})`);
        }
        dumpContent += insertRows.join(",\n") + ";\n";
        dumpContent += `UNLOCK TABLES;\n\n`;
      } else {
        dumpContent += `-- No records found in \`${tableName}\`\n\n`;
      }
    }

    dumpContent += `SET FOREIGN_KEY_CHECKS=1;\n`;

    const outputPath = path.join(__dirname, "..", "food_lab_system.sql");
    fs.writeFileSync(outputPath, dumpContent, "utf8");
    console.log(`\n🎉 Success! SQL dump file written to: ${outputPath}`);
  } catch (err) {
    console.error("Error creating SQL dump:", err.message);
  } finally {
    if (connection) await connection.end();
  }
}

generateDump();
