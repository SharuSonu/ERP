const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const { dbConfig, pool } = require('../dbConfig'); // Ensure this import is correct
const router = express.Router();

router.use(bodyParser.json());

// Helper function to create and insert unit data
async function createUnits(reqBody) {
    const { Symbolname, Formalname, QUCname, Decimalnum, companyName } = reqBody;

    if (!Symbolname || !Formalname || !QUCname || Decimalnum === undefined || !companyName) {
        throw new Error('Missing required fields');
    }

    const dbNamePrefix = "ERP_";
    const dbName = dbNamePrefix + companyName.toLowerCase().replace(/\s+/g, '_');
    let connection;

    try {
        // Use pool instead of creating a new connection directly
        connection = await pool.getConnection();
        await connection.query(`USE ${dbName}`);

        // Ensure the Simple_details table exists
        await connection.query(`
            CREATE TABLE IF NOT EXISTS Simple_details (
                id INT AUTO_INCREMENT PRIMARY KEY,
                Symbolname VARCHAR(255),
                Formalname VARCHAR(255),
                QUCname VARCHAR(255),
                Decimalnum DECIMAL(10, 2)
            )
        `);

        // Insert the data
        const [insertResult] = await connection.query(`
            INSERT INTO Simple_details (Symbolname, Formalname, QUCname, Decimalnum)
            VALUES (?, ?, ?, ?)
        `, [Symbolname, Formalname, QUCname, Decimalnum]);

        console.log('Unit and details inserted successfully.');
        return insertResult.insertId; // Return the inserted ID
    } catch (err) {
        console.error('Error in createUnits:', err.message);
        throw err; // Throw the error to handle it in the calling function
    } finally {
        if (connection) {
            // Release the connection back to the pool
            connection.release();
        }
    }
}


// POST endpoint to create a unit item
router.post('/create-units', async (req, res) => {
    try {
        const unitId = await createUnits(req.body);
        res.status(201).json({ success: true, unitId });
    } catch (error) {
        console.error('Error creating unit:', error.message);
        res.status(500).json({ success: false, message: 'Error creating unit' });
    }
});



// Function to  update simple Units 
async function UpdateUnits(reqBody) {
    const {  id,Symbolname, Formalname, QUCname, Decimalnum, companyName } = reqBody;

    if (!id || !companyName) {
        
        throw new Error("Invalid input: 'id' and 'databaseName' are required fields");
    }

    const dbNamePrefix = "ERP_";
    const dbName = dbNamePrefix + companyName.toLowerCase().replace(/\s+/g, '_');

    let connection;
    try {
        connection = await mysql.createConnection({ ...dbConfig, database: dbName });
        await connection.beginTransaction();

        const [updateResult] = await connection.query(`
            UPDATE Simple_details 
            SET Symbolname = ?, Formalname = ?, QUCname = ?,Decimalnum=?
            WHERE id = ?
        `, [Symbolname, Formalname, QUCname, Decimalnum, id]);

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
router.put('/update-Units', async (req, res) => {
    try {
        //console.log("api req:", req.body);
        const affectedRows = await UpdateUnits(req.body);
        if (affectedRows === 0) {
            res.status(404).json({ success: false, message: 'Simple Units not found' });
        } else {
            res.status(200).json({ success: true, message: 'Simple Units updated successfully' });
        }
    } catch (error) {
        console.error('Error updating Simple Units:', error);
        res.status(500).json({ success: false, message: 'Error updating Simple Units', error: error.message });
    }
});




// Function to  Delete simple Units 
async function DeleteUnits(reqBody) {
    const {  id, companyName } = reqBody;

    if (!id || !companyName) {
        
        throw new Error("Invalid input: 'id' and 'databaseName' are required fields");
    }

    const dbNamePrefix = "ERP_";
    const dbName = dbNamePrefix + companyName.toLowerCase().replace(/\s+/g, '_');

    let connection;
    try {
        connection = await mysql.createConnection({ ...dbConfig, database: dbName });
        await connection.beginTransaction();

        const [updateResult] = await connection.query(`
            DELETE FROM  Simple_details 
            
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
router.put('/Delete-Units', async (req, res) => {
    try {
        //console.log("api req:", req.body);
        const affectedRows = await DeleteUnits(req.body);
        if (affectedRows === 0) {
            res.status(404).json({ success: false, message: 'Simple Units not found' });
        } else {
            res.status(200).json({ success: true, message: 'Simple Units updated successfully' });
        }
    } catch (error) {
        console.error('Error updating Simple Units:', error);
        res.status(500).json({ success: false, message: 'Error updating Simple Units', error: error.message });
    }
});



module.exports = router;
