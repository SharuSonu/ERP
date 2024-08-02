const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');

const router = express.Router();
router.use(bodyParser.json());

// Function to establish connection to MySQL
async function connect(cmp) {
    try {
        const dbNamePrefix = 'ERP_'; // Prefix for database name
        
        const dbName = dbNamePrefix + cmp.toLowerCase().replace(/\s+/g, '_');

        const dbConfig = {
            host: 'localhost',
            user: 'root',
            password: 'Admin@12345',
            database: dbName,
        };

        const connection = await mysql.createConnection(dbConfig);
        return connection;
    } catch (error) {
        console.error('Error connecting to database:', error);
        throw error;
    }
}

// Function to create database tables if they don't exist
async function createTables(connection) {
    try {
        // Create sales_vouchers table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS sales_vouchers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                voucherTypeName VARCHAR(255) NOT NULL,
                parentVoucherType VARCHAR(255),
                voucherDate DATE,
                partyAccount VARCHAR(255),
                salesLedger VARCHAR(255),
                narration TEXT,
                totalAmount DECIMAL(10, 2) NOT NULL
            )
        `);

        // Create sales_inventory table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS sales_inventory (
                id INT AUTO_INCREMENT PRIMARY KEY,
                voucherId INT,
                itemName VARCHAR(255) NOT NULL,
                quantity INT NOT NULL,
                rate DECIMAL(10, 2) NOT NULL,
                discount DECIMAL(5, 2) DEFAULT 0,
                amount DECIMAL(10, 2) NOT NULL,
                FOREIGN KEY (voucherId) REFERENCES sales_vouchers(id) ON DELETE CASCADE
            )
        `);

        // Create sales_ledger_entries table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS sales_ledger_entries (
                id INT AUTO_INCREMENT PRIMARY KEY,
                voucherId INT,
                particulars VARCHAR(255) NOT NULL,
                rate DECIMAL(5, 2) NOT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                FOREIGN KEY (voucherId) REFERENCES sales_vouchers(id) ON DELETE CASCADE
            )
        `);

        // Create sales_bill_wise_details table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS sales_bill_wise_details (
                id INT AUTO_INCREMENT PRIMARY KEY,
                voucherId INT,
                typeOfRef VARCHAR(255) NOT NULL,
                name VARCHAR(255) NOT NULL,
                dueDate DATE,
                amount DECIMAL(10, 2) NOT NULL,
                FOREIGN KEY (voucherId) REFERENCES sales_vouchers(id) ON DELETE CASCADE
            )
        `);

        // Create sales_order_details table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS sales_order_details (
                id INT AUTO_INCREMENT PRIMARY KEY,
                voucherId INT,
                orderId VARCHAR(50) NOT NULL,
                orderDate DATE,
                itemName VARCHAR(255) NOT NULL,
                quantity INT NOT NULL,
                rate DECIMAL(10, 2) NOT NULL,
                discount DECIMAL(5, 2) DEFAULT 0,
                amount DECIMAL(10, 2) NOT NULL,
                FOREIGN KEY (voucherId) REFERENCES sales_vouchers(id) ON DELETE CASCADE
            )
        `);

        console.log('Tables created successfully');
    } catch (error) {
        console.error('Error creating tables:', error);
    }
}

router.post('/api/connect', async (req, res) => {
    const { cmp } = req.body;

    if (!cmp) {
        return res.status(400).send('Company name is required');
    }

    try {
        const connection = await connect(cmp);
        await createTables(connection);
        res.status(200).send('Connected to database and tables created successfully');
    } catch (error) {
        res.status(500).send('Error connecting to database: ' + error.message);
    }
});

module.exports = { router, connect, createTables };
