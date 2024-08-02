const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const {dbConfig, pool} = require('../dbConfig');
const router = express.Router();
router.use(bodyParser.json());



// Function to create a Stockcategory
async function createStockcategory(reqBody) {
    const { Name, Namealias, Namegroup, companyName } = reqBody;

    const dbNamePrefix = "ERP_";
    const dbName = dbNamePrefix + companyName.toLowerCase().replace(/\s+/g, '_');
    let connection;
    try {
        // Create a connection to the database
        connection = await mysql.createConnection({ ...dbConfig, database: dbName });

        // Create the groups table if it does not exist
        await connection.query(`CREATE TABLE IF NOT EXISTS stockCategory_tbl (
           id INT AUTO_INCREMENT PRIMARY KEY,
            Name varchar(255) NOT NULL,
            Namealias varchar(255) DEFAULT NULL,
            Namegroup varchar(255) DEFAULT NULL
          )`);

        // Insert group data
        const [insertResult] = await connection.query(`
            INSERT INTO stockCategory_tbl (Name, Namealias, Namegroup)
            VALUES (?, ?, ?)
        `, [Name, Namealias || '', Namegroup || 'Primary']);

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
router.post('/create-Stockcategory', async (req, res) => {
    try {
        const StockcategoryId = await createStockcategory(req.body);
        res.status(201).json({ success: true, StockcategoryId });
    } catch (error) {
        console.error('Error creating stockcategory:', error);
        res.status(500).json({ success: false, message: 'Error creating stockcategory' });
    }
});







// Function to update a group
async function updateStockcategory(reqBody) {
    const { id, Name, Namealias, Namegroup, databaseName } = reqBody;

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
            UPDATE stockCategory_tbl 
            SET Name = ?, Namealias = ?, Namegroup = ?
            WHERE id = ?
        `, [Name, Namealias || '', Namegroup || 'Primary', id]);

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
router.put('/update-Stockcategory', async (req, res) => {
    try {
        
        const affectedRows = await updateStockcategory(req.body);
        if (affectedRows === 0) {
            res.status(404).json({ success: false, message: 'Stockcategory not found' });
        } else {
            res.status(200).json({ success: true, message: 'Stockcategory updated successfully' });
        }
    } catch (error) {
        console.error('Error updating stockgroup:', error);
        res.status(500).json({ success: false, message: 'Error updating stockcategory', error: error.message });
    }
});


// Function to update a group
async function DeleteStockcategory(reqBody) {
    const { id,databaseName } = reqBody;

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
            DELETE FROM stockCategory_tbl 
            WHERE id = ?
        `, [ id]);

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
router.put('/delete-Stockcategory', async (req, res) => {
    try {
        
        const affectedRows = await DeleteStockcategory(req.body);
        if (affectedRows === 0) {
            res.status(404).json({ success: false, message: 'Stockcategory not found' });
        } else {
            res.status(200).json({ success: true, message: 'Stockcategory updated successfully' });
        }
    } catch (error) {
        console.error('Error updating stockgroup:', error);
        res.status(500).json({ success: false, message: 'Error updating stockcategory', error: error.message });
    }
});



module.exports = router;
