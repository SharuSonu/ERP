const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const {dbConfig, pool} = require('../dbConfig');

const router = express.Router();
router.use(bodyParser.json());


// Function to create a group
async function createGodown(reqBody) {
    const { Godownname, Godownalias, Godowngroup, companyName } = reqBody;

    const dbNamePrefix = "ERP_";
    const dbName = dbNamePrefix + companyName.toLowerCase().replace(/\s+/g, '_');
    let connection;
    try {
        // Create a connection to the database
        connection = await mysql.createConnection({ ...dbConfig, database: dbName });

        // Create the groups table if it does not exist
        await connection.query(`
            CREATE TABLE IF NOT EXISTS Godown_tbl (
                id INT AUTO_INCREMENT PRIMARY KEY,
                Godownname VARCHAR(255) NOT NULL,
                Godownalias VARCHAR(255),
                Godowngroup VARCHAR(255)
            )
        `);

        // Insert group data
        const [insertResult] = await connection.query(`
            INSERT INTO Godown_tbl (Godownname, Godownalias, Godowngroup)
            VALUES (?, ?, ?)
        `, [Godownname, Godownalias|| '', Godowngroup || 'Primary']);

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
router.post('/create-Godown', async (req, res) => {
    try {
        const groupId = await createGodown(req.body);
        res.status(201).json({ success: true, groupId });
    } catch (error) {
        console.error('Error creating Godown:', error);
        res.status(500).json({ success: false, message: 'Error creating Godown' });
    }
});

// Function to update a group
async function updateGodown(reqBody) {
    const { id, Godownname, Godownalias, Godowngroup, databaseName } = reqBody;

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
            UPDATE Godown_tbl 
            SET Godownname = ?, Godownalias = ?, Godowngroup = ?
            WHERE id = ?
        `, [Godownname, Godownalias || '', Godowngroup || 'Primary', id]);

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
router.put('/update-Godown', async (req, res) => {
    try {
        //console.log("api req:", req.body);
        const affectedRows = await updateGodown(req.body);
        if (affectedRows === 0) {
            res.status(404).json({ success: false, message: 'Group not found' });
        } else {
            res.status(200).json({ success: true, message: 'Group updated successfully' });
        }
    } catch (error) {
        console.error('Error updating group:', error);
        res.status(500).json({ success: false, message: 'Error updating group', error: error.message });
    }
});




// Function to Delete a group
async function DeleteGodown(reqBody) {
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
            DELETE FROM Godown_tbl 
           
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
router.put('/delete-Godown', async (req, res) => {
    try {
        //console.log("api req:", req.body);
        const affectedRows = await DeleteGodown(req.body);
        if (affectedRows === 0) {
            res.status(404).json({ success: false, message: 'Group not found' });
        } else {
            res.status(200).json({ success: true, message: 'Group Delete successfully' });
        }
    } catch (error) {
        console.error('Error Deleting group:', error);
        res.status(500).json({ success: false, message: 'Error Deleteing group', error: error.message });
    }
});


module.exports = router;
