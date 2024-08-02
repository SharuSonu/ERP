const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {dbConfig} = require('../dbConfig.js');

const router = express.Router();

const app = express();
app.use(bodyParser.json());

// Enable CORS for all requests
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});


router.post('/taxes-insert', async (req, res) => {
    const { taxName, taxRate, taxtype, companyName } = req.body;
    const dbNamePrefix = "ERP_";
    const dbName = dbNamePrefix + companyName.toLowerCase().replace(/\s+/g, '_'); // Construct database name
  
    let connection;
  
    try {
      // Create a connection to the database
      connection = await mysql.createConnection({ ...dbConfig, database: dbName });
  
      // Step 1: Fetch org_id from the organization table based on companyName
      const [rows] = await connection.query('SELECT id FROM organization WHERE name = ?', [companyName]);
      if (rows.length === 0) {
        throw new Error('Organization not found');
      }
      const orgId = rows[0].id;
  
      // Step 2: Create taxinfo table if not exists
      await connection.query(`
        CREATE TABLE IF NOT EXISTS taxinfo (
          id INT AUTO_INCREMENT PRIMARY KEY,
          org_id INT,
          taxname VARCHAR(50) NOT NULL,
          taxrate VARCHAR(255) NOT NULL,
          taxtype ENUM('SGST', 'CGST', 'IGST') DEFAULT 'SGST'
        )
      `);

      const insertResult = await connection.query(
        'INSERT INTO taxinfo (org_id, taxname, taxrate, taxtype) VALUES (?, ?, ?, ?)',
        [orgId, taxName, taxRate, taxtype]
      );
  
      // Respond with success message or inserted user details
      res.status(200).json({ message: 'TaxType added successfully', user: { id: insertResult.insertId, orgId, taxName } });
    } catch (error) {
      console.error('Error inserting TaxType:', error);
      res.status(500).json({ error: 'Failed to add TaxType. Please try again.' });
    } finally {
      if (connection) {
        try {
          // Close the connection
          await connection.end();
        } catch (err) {
          console.error('Error closing connection:', err);
        }
      }
    }
  });

router.get('/taxes', async (req, res) => {
    const { companyName } = req.query;
    const dbNamePrefix = "ERP_";
    const dbName = dbNamePrefix + companyName.toLowerCase().replace(/\s+/g, '_'); // Construct database name
  
    let connection;
  
    try {
      // Create a connection to the database
      connection = await mysql.createConnection({ ...dbConfig, database: dbName });
  
      // Fetch all taxes from taxinfo table
      const [rows] = await connection.query('SELECT * FROM taxinfo');
  
      // Respond with the fetched taxes
      res.status(200).json(rows);
    } catch (error) {
      console.error('Error fetching taxes:', error);
      res.status(500).json({ error: 'Failed to fetch taxes. Please try again.' });
    } finally {
      if (connection) {
        try {
          // Close the connection
          await connection.end();
        } catch (err) {
          console.error('Error closing connection:', err);
        }
      }
    }
  });
  
module.exports = router;