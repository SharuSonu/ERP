const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');

const router = express.Router();
router.use(bodyParser.json());

// Database configuration
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'Admin@12345',
    // No database specified here
};

// Function to create a group
async function createStockGroup(reqBody) {
    const { name, alias, Group, databaseName } = reqBody;

    const dbNamePrefix = "ERP_";
    const dbName = dbNamePrefix + databaseName.toLowerCase().replace(/\s+/g, '_');
    let connection;
    try {
        // Create a connection to the database
        connection = await mysql.createConnection({ ...dbConfig, database: dbName });

        // Create the groups table if it does not exist
        await connection.query(`
            CREATE TABLE IF NOT EXISTS stockgroup_tbl (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                group_alias VARCHAR(255),
                parentGroup VARCHAR(255)
            )
        `);

        // Insert group data
        const [insertResult] = await connection.query(`
            INSERT INTO stockgroup_tbl (name, group_alias, parentGroup)
            VALUES (?, ?, ?)
        `, [name, alias || '', Group || 'Primary']);

        return insertResult.insertId;
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

// POST endpoint to create a group
router.post('/create-stockgroup', async (req, res) => {
    try {
        const groupId = await createStockGroup(req.body);
        res.status(201).json({ success: true, groupId });
    } catch (error) {
        console.error('Error creating stockgroup:', error);
        res.status(500).json({ success: false, message: 'Error creating stockgroup' });
    }
});

// Function to update a group
async function updateStockGroup(reqBody) {
    const { id, name, group_alias, parentGroup, databaseName } = reqBody;

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
            UPDATE stockgroup_tbl 
            SET name = ?, group_alias = ?, parentGroup = ?
            WHERE id = ?
        `, [name, group_alias || '', parentGroup || 'Primary', id]);

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

// PUT endpoint to update a group
router.put('/update-stockgroup', async (req, res) => {
    try {
        
        const affectedRows = await updateStockGroup(req.body);
        if (affectedRows === 0) {
            res.status(404).json({ success: false, message: 'StockGroup not found' });
        } else {
            res.status(200).json({ success: true, message: 'StockGroup updated successfully' });
        }
    } catch (error) {
        console.error('Error updating stockgroup:', error);
        res.status(500).json({ success: false, message: 'Error updating group', error: error.message });
    }
});

// Function to Delete a group
async function DeleteStockGroup(reqBody) {
    const { id, databaseName } = reqBody;

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
            DELETE FROM stockgroup_tbl 
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

// PUT endpoint to update a group
router.put('/delete-stockgroup', async (req, res) => {
    try {
        
        const affectedRows = await DeleteStockGroup(req.body);
        if (affectedRows === 0) {
            res.status(404).json({ success: false, message: 'StockGroup not found' });
        } else {
            res.status(200).json({ success: true, message: 'StockGroup updated successfully' });
        }
    } catch (error) {
        console.error('Error updating stockgroup:', error);
        res.status(500).json({ success: false, message: 'Error updating group', error: error.message });
    }
});



module.exports = router;
