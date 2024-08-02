const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const {dbConfig, pool} = require('../dbConfig');
const router = express.Router();
router.use(bodyParser.json());


// Function to salesman 
async function createSalesman(reqBody) {
    const {SalesManName,SalesManNumber,SalesManEmailId,  companyName } = reqBody;

    const dbNamePrefix = "ERP_";
    const dbName = dbNamePrefix + companyName.toLowerCase().replace(/\s+/g, '_');
    let connection;
    try {
        // Create a connection to the database
        connection = await mysql.createConnection({ ...dbConfig, database: dbName });

        // Create the salesman table if it does not exist
        await connection.query(`
        CREATE TABLE IF NOT EXISTS Salesman (
        id INT AUTO_INCREMENT PRIMARY KEY,
        SalesManName VARCHAR(225) NOT NULL ,
        SalesManNumber INT,
        SalesManEmailId varchar(225) NOT NULL
    )
`);


        // Insert group data
        const [insertResult] = await connection.query(
          'INSERT INTO Salesman (SalesManName, SalesManNumber, SalesManEmailId) VALUES (?, ?, ?)',
        [SalesManName, SalesManNumber, SalesManEmailId]
      );

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

// POST endpoint to salesman a group
router.post('/create-Salesman', async (req, res) => {
    try {
        const SalesmanId = await createSalesman(req.body);
        res.status(201).json({ success: true, SalesmanId });
    } catch (error) {
        console.error('Error creating Salesman:', error);
        res.status(500).json({ success: false, message: 'Error creating salesman' });
    }
});



//Code End for creation of table 




// Function to  update Salesman 
async function UpdateSalesman(reqBody) {
    const {  id,SalesManName, SalesManNumber, SalesManEmailId, databaseName } = reqBody;

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
            UPDATE Salesman 
            SET SalesManName = ?, SalesManNumber = ?, SalesManEmailId = ?
            WHERE id = ?
        `, [SalesManName, SalesManNumber || '', SalesManEmailId || 'Primary', id]);

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
router.put('/update-Salesman', async (req, res) => {
    try {
        //console.log("api req:", req.body);
        const affectedRows = await UpdateSalesman(req.body);
        if (affectedRows === 0) {
            res.status(404).json({ success: false, message: 'SalesMan not found' });
        } else {
            res.status(200).json({ success: true, message: 'SalesMan updated successfully' });
        }
    } catch (error) {
        console.error('Error updating group:', error);
        res.status(500).json({ success: false, message: 'Error updating Salesman', error: error.message });
    }
});

// Function to  Delete Salesman 
async function DeleteSalesman(reqBody) {
    const {  id, databaseName } = reqBody;

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
            DELETE FROM Salesman 
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

// PUT endpoint to delete a group
router.put('/delete-Salesman', async (req, res) => {
    try {
        //console.log("api req:", req.body);
        const affectedRows = await DeleteSalesman(req.body);
        if (affectedRows === 0) {
            res.status(404).json({ success: false, message: 'SalesMan not found' });
        } else {
            res.status(200).json({ success: true, message: 'SalesMan Deleted successfully' });
        }
    } catch (error) {
        console.error('Error Deleting group:', error);
        res.status(500).json({ success: false, message: 'Error Deleting Salesman', error: error.message });
    }
});





module.exports = router;
