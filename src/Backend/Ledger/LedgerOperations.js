const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser'); // Add body-parser
const {dbConfig, pool} = require('../dbConfig');
const cors = require('cors');
const router = express.Router();
router.use(cors());
router.use(bodyParser.json()); // Use body-parser middleware


const getDatabaseName = (organizationName) => {
    const dbNamePrefix = "ERP_";
    return dbNamePrefix + organizationName.toLowerCase().replace(/\s+/g, '_');
  };

// Function to create a ledger
async function createLedger(reqBody) {
    const {
        companyName, customerDisplayName, Group, salutation, firstName, lastName,
        customerEmail, customerPhone, customerMobile, pan, GSTIN, currency, openingBalance,
        paymentTerms, billbybill, maintainBillByBill, creditLimitDaysOrDate, creditLimitValue, provideBankDetails,
        showBillBreakup, billwiseData, billBreakupData, bankDetails, transactionType, ifscCode, companyBank, accountNumber, bankName, billingAddress, shippingAddress, databaseName
    } = reqBody;

    const dbNamePrefix = "ERP_";
    const dbName = dbNamePrefix + databaseName.toLowerCase().replace(/\s+/g, '_');
    let connection;
    try {
        // Create a connection to the database
        connection = await mysql.createConnection({ ...dbConfig, database: dbName });

        // Create tables if they do not exist
        await connection.query(`
            CREATE TABLE IF NOT EXISTS ledger (
                id INT AUTO_INCREMENT PRIMARY KEY,
                ledgername VARCHAR(255) NOT NULL,
                customerDisplayName VARCHAR(255),
                GroupName VARCHAR(255),
                salutation VARCHAR(50),
                firstName VARCHAR(255),
                lastName VARCHAR(255),
                customerEmail VARCHAR(255),
                customerPhone VARCHAR(50),
                customerMobile VARCHAR(50),
                pan VARCHAR(50),
                GSTIN VARCHAR(50),
                currency VARCHAR(50),
                openingBalance DECIMAL(10,2),
                paymentTerms VARCHAR(255),
                maintainBillByBill BOOLEAN,
                creditLimitDaysOrDate VARCHAR(50),
                creditLimitValue DECIMAL(10,2),
                provideBankDetails BOOLEAN
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS ledger_address (
                id INT AUTO_INCREMENT PRIMARY KEY,
                ledgerId INT NOT NULL,
                type ENUM('billing', 'shipping'),
                addressLine1 VARCHAR(255),
                addressLine2 VARCHAR(255),
                city VARCHAR(100),
                state VARCHAR(100),
                postalCode VARCHAR(20),
                country VARCHAR(100),
                FOREIGN KEY (ledgerId) REFERENCES ledger(id)
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS ledger_bank_details (
                id INT AUTO_INCREMENT PRIMARY KEY,
                ledgerId INT NOT NULL,
                transactionType VARCHAR(50),
                accountNumber VARCHAR(50),
                bankName VARCHAR(255),
                companyBank VARCHAR(255),
                ifscCode VARCHAR(50),
                FOREIGN KEY (ledgerId) REFERENCES ledger(id)
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS ledger_billwise (
                id INT AUTO_INCREMENT PRIMARY KEY,
                ledgerId INT NOT NULL,
                date DATE,
                name VARCHAR(255),
                dueDate DATE,
                amount DECIMAL(10,2),
                FOREIGN KEY (ledgerId) REFERENCES ledger(id)
            )
        `);

        // Insert ledger data
        const [insertResult] = await connection.query(`
            INSERT INTO ledger (
                ledgername, customerDisplayName, GroupName, salutation, firstName, lastName,
                customerEmail, customerPhone, customerMobile, pan, GSTIN, currency, openingBalance,
                paymentTerms, maintainBillByBill, creditLimitDaysOrDate, creditLimitValue, provideBankDetails
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            companyName || '', customerDisplayName || '', Group || '', salutation || '', firstName || '', lastName || '',
            customerEmail || '', customerPhone || '', customerMobile || '', pan || '', GSTIN || '', currency || '', openingBalance !== undefined && openingBalance !== '' ? parseFloat(openingBalance) : null,
            paymentTerms || '', showBillBreakup !== undefined ? showBillBreakup : false, creditLimitDaysOrDate || '', creditLimitValue !== undefined ? creditLimitValue : null, provideBankDetails!== undefined ? provideBankDetails : false
        ]);

        const ledgerId = insertResult.insertId;

        // Insert billing address
        if (billingAddress) {
            const { street1, street2, city, state, pincode, countryRegion } = billingAddress;
            await connection.query(`
                INSERT INTO ledger_address (ledgerId, type, addressLine1, addressLine2, city, state, postalCode, country)
                VALUES (?, 'billing', ?, ?, ?, ?, ?, ?)
            `, [ledgerId, street1, street2, city, state, pincode, countryRegion]);
        }

        // Insert shipping address
        if (shippingAddress) {
            const { street1, street2, city, state, pincode, countryRegion } = shippingAddress;
            await connection.query(`
                INSERT INTO ledger_address (ledgerId, type, addressLine1, addressLine2, city, state, postalCode, country)
                VALUES (?, 'shipping', ?, ?, ?, ?, ?, ?)
            `, [ledgerId, street1, street2, city, state, pincode, countryRegion]);
        }

        // Handle billwise data
        if (showBillBreakup && Array.isArray(billBreakupData)) {
            for (const bill of billBreakupData) {
                await connection.query(`
                    INSERT INTO ledger_billwise (ledgerId, date, name, dueDate, amount)
                    VALUES (?, ?, ?, ?, ?)
                `, [ledgerId, bill.date, bill.name, bill.dueDate, bill.amount]);
            }
        }

        // Handle bank details transactionType, ifscCode, accountNumber, bankName
        if (provideBankDetails) {
            
            await connection.query(`
                INSERT INTO ledger_bank_details (ledgerId, transactionType, accountNumber, bankName, companyBank, ifscCode)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [ledgerId, transactionType, accountNumber, bankName, companyBank, ifscCode]);
        }

        return ledgerId;
    } catch (err) {
        console.error('Error:', err);
        throw err; // Throw the error to handle it in the calling function
    } finally {
        if (connection) {
            // Close the connection
            await connection.end();
        }
    }
}

// POST endpoint to create a ledger
router.post('/create-ledger', async (req, res) => {
    try {
        const ledgerId = await createLedger(req.body);
        res.status(201).json({ success: true, ledgerId });
    } catch (error) {
        console.error('Error creating ledger:', error);
        res.status(500).json({ success: false, message: 'Error creating ledger' });
    }
});

router.get('/ledgers_edit/:ledgerId', async (req, res) => {
    const { companyName } = req.query;

    if (!companyName) {
        return res.status(400).json({ error: 'Company name is required' });
    }

    const { ledgerId } = req.params;

    try {
        // Generate database name based on organization name
        const dbName = getDatabaseName(companyName);

        // Get a connection from the pool
        const connection = await pool.getConnection();

        // Switch to the selected database
        await connection.changeUser({ database: dbName });

        const sql = 'SELECT * FROM ledger WHERE id = ?'; // Adjust query as per your schema

        const [results] = await connection.query(sql, [ledgerId]);

        // Release the connection back to the pool
        connection.release();

        // Check if a voucher was found
        if (results.length === 0) {
            return res.status(404).json({ error: 'ledger not found' });
        }

        // Send fetched data as JSON response
        res.json(results[0]); // Assuming only one result is expected

    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Error fetching data' });
    }
});

router.put('/ledgers_update/:ledgerId', async (req, res) => {
    try {
        const { ledgerId } = req.params;
        const { companyName } = req.query;
        const { name, GroupName, customerEmail, customerPhone, customerMobile, pan, GSTIN } = req.body;

        if (!companyName) {
            return res.status(400).json({ error: 'Company name is required' });
        }

        // Generate database name based on organization name
        const dbName = getDatabaseName(companyName);

        // Get a connection from the pool
        const connection = await pool.getConnection();

        // Switch to the selected database
        await connection.changeUser({ database: dbName });

        const sql = `
            UPDATE ledger 
            SET 
                GroupName = ?, 
                customerEmail = ?, 
                customerPhone = ?, 
                customerMobile = ?, 
                pan = ?, 
                GSTIN = ? 
            WHERE id = ?`;

        const [results] = await connection.query(sql, [
            GroupName || 'Primary', // Setting 'Primary' as default if GroupName is not provided
            customerEmail || '', 
            customerPhone || '', 
            customerMobile || '', 
            pan || '', 
            GSTIN || '', 
            ledgerId
        ]);

        // Release the connection back to the pool
        connection.release();

        // Check if a ledger was updated
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Ledger not found' });
        }

        // Send a success response
        res.json({ message: 'Ledger updated successfully' });

    } catch (error) {
        console.error('Error updating ledger:', error);
        res.status(500).json({ error: 'Error updating ledger' });
    }
});


//function to delete ledger prashanth code 
async function Deleteledger(reqBody) {
    const {  id,databaseName } = reqBody;

    if (!id || !databaseName) {   
        throw new Error("Invalid input: 'id' and 'databaseName' are required fields");
    }

    const dbNamePrefix = "ERP_";
    const dbName = dbNamePrefix + databaseName.toLowerCase().replace(/\s+/g, '_');

    let connection;
    try {
        connection = await mysql.createConnection({ ...dbConfig, database: dbName });
        await connection.beginTransaction();

        const [updateResult] = await connection.query(`
            DELETE FROM ledger 
            WHERE id = ?
         `, [id]);

        await connection.commit();

        return updateResult.affectedRows;
    } catch (err) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error:', err);
        throw err;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}


router.put('/delete-ledger', async (req, res) => {
    try {
        //console.log("api req:", req.body);
        const affectedRows = await Deleteledger(req.body);
        if (affectedRows === 0) {
            res.status(404).json({ success: false, message: 'SalesMan not found' });
        } else {
            res.status(200).json({ success: true, message: 'SalesMan delete successfully' });
        }
    } catch (error) {
        console.error('Error delete group:', error);
        res.status(500).json({ success: false, message: 'Error delete Salesman', error: error.message });
    }
});
// end code




module.exports = router;
