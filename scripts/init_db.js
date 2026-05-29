const mysql = require('mysql2/promise');

const dbConfig = {
    host: "localhost",
    user: "root",
    password: "",
    database: "food_lab_system",
};

async function init() {
    try {
        const connection = await mysql.createConnection(dbConfig);
        console.log("Connected to database.");

        // Add spice_name column if it doesn't exist
        const [columns] = await connection.execute("SHOW COLUMNS FROM food_registering LIKE 'spice_name'");
        if (columns.length === 0) {
            console.log("Adding spice_name column to food_registering table...");
            await connection.execute("ALTER TABLE food_registering ADD COLUMN spice_name VARCHAR(255) AFTER sample_type");
            console.log("Column added.");
        } else {
            console.log("spice_name column already exists.");
        }

        await connection.end();
    } catch (error) {
        console.error("Error updating database:", error.message);
    }
}

init();
