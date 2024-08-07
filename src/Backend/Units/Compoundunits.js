const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const { dbConfig, pool } = require('../dbConfig'); // Ensure this import is correct
const router = express.Router();

router.use(bodyParser.json());


async function createCompoundUnits(reqBody) {
    const { Firstunit, NumValue, Secondunit, companyName } = reqBody;

    if (!Firstunit || !NumValue || !Secondunit || !companyName) {
        // Provide more detailed error messages
        const missingFields = [];
        if (!Firstunit) missingFields.push('Firstunit');
        if (!NumValue) missingFields.push('NumValue');
        if (!Secondunit) missingFields.push('Secondunit');
        if (!companyName) missingFields.push('companyName');
        
        const errorMessage = `Missing required fields: ${missingFields.join(', ')}`;
        throw new Error(errorMessage);
    }

    const dbNamePrefix = "ERP_";
    const dbName = dbNamePrefix + companyName.toLowerCase().replace(/\s+/g, '_');
    let connection;

    try {
        // Use pool instead of creating a new connection directly
        connection = await pool.getConnection();
        await connection.query(`USE ${dbName}`);

        // Ensure the Compoundunits_details table exists
        await connection.query(`
            CREATE TABLE IF NOT EXISTS Compoundunits_details (
                id INT AUTO_INCREMENT PRIMARY KEY,
                Firstunit VARCHAR(225),
                NumValue VARCHAR(225),
                Secondunit VARCHAR(225)
            )
        `);

        // Insert the data
        const [insertResult] = await connection.query(`
            INSERT INTO Compoundunits_details (Firstunit, NumValue, Secondunit)
            VALUES (?, ?, ?)
        `, [Firstunit, NumValue, Secondunit]);

        console.log('Compound unit details inserted successfully.');
        return insertResult.insertId; // Return the inserted ID
    } catch (err) {
        console.error('Error in createCompoundUnits:', err.message);
        throw err; // Throw the error to handle it in the calling function
    } finally {
        if (connection) {
            // Release the connection back to the pool
            connection.release();
        }
    }
}
// POST endpoint to create a compound unit item
router.post('/create-compoundunits', async (req, res) => {
    try {
        const unitId = await createCompoundUnits(req.body);
        res.status(201).json({ success: true, unitId });
    } catch (error) {
        console.error('Error creating compound unit:', error.message);
        res.status(500).json({ success: false, message: 'Error creating compound unit' });
    }
});


// Function to  update compoundunits
async function UpdatecompUnits(reqBody) {
    const {  id,Firstunit, NumValue, Secondunit ,companyName } = reqBody;

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
            UPDATE Compoundunits_details
            SET Firstunit = ?, NumValue = ?, Secondunit = ?
            WHERE id = ?
        `, [Firstunit, NumValue, Secondunit, id]);

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
router.put('/update-compUnits', async (req, res) => {
    try {
        //console.log("api req:", req.body);
        const affectedRows = await UpdatecompUnits(req.body);
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


// Function to  Delete compoundunits
async function DeletecompUnits(reqBody) {
    const {  id,companyName } = reqBody;

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
            DELETE FROM Compoundunits_details
           
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
router.put('/Delete-compUnits', async (req, res) => {
    try {
        //console.log("api req:", req.body);
        const affectedRows = await DeletecompUnits(req.body);
        if (affectedRows === 0) {
            res.status(404).json({ success: false, message: 'Compound Units not found' });
        } else {
            res.status(200).json({ success: true, message: 'Compound Units updated successfully' });
        }
    } catch (error) {
        console.error('Error updating Compound Units:', error);
        res.status(500).json({ success: false, message: 'Error updating Compound Units', error: error.message });
    }
});



module.exports = router;