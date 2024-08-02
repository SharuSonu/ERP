const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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

const SECRET_KEY = 'your_secret_key'; // Store this securely

// Database configuration
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'Admin@12345',
    // No database specified here
};

// Login endpoint
router.post('/user-login', async (req, res) => {
    const { username, password, databaseName, loginType } = req.body;

     // Check if logintype is 'admin'
     if (loginType !== 'user') {
        return res.status(400).json({ error: 'Invalid login type. Only user login is allowed.' });
    }

    if (!databaseName.startsWith('erp_')) {
        return res.status(400).json({ error: 'Invalid database name' });
    }

    let connection;
    try {
        // Connect to the specified database
        connection = await mysql.createConnection({ ...dbConfig, database: databaseName });

        // Query to find the admin user
        const [admin] = await connection.query(`SELECT * FROM user WHERE username = ?`, [username]);
        const [cmpname] = await connection.query(`SELECT * FROM organization`);

        if (admin.length === 0) {
            return res.status(401).json({ error: 'User not found' });
        }
        const user = admin[0];
        console.log("Status : ",user.status);
        if (user.status === 0) {
          return res.status(403).json({ message: 'Account is deactivated, please contact admin' });
        }

        const validPassword = await bcrypt.compare(password, admin[0].password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Generate a JWT token
        const token = jwt.sign({ userId: admin[0].id, database: databaseName }, SECRET_KEY, { expiresIn: '1h' });
        const comp  = cmpname[0].name;

        res.json({ success: true, token, comp });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});


router.post('/users-insert', async (req, res) => {
    const { username, password, companyName, enabled } = req.body;
    const dbNamePrefix = "ERP_";
    const dbName = dbNamePrefix + companyName.toLowerCase().replace(/\s+/g, '_'); // Construct database name
    //console.log("Status : ",enabled);
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
  
      // Step 2: Create user table if not exists
      await connection.query(`
        CREATE TABLE IF NOT EXISTS user (
          id INT AUTO_INCREMENT PRIMARY KEY,
          org_id INT,
          username VARCHAR(50) NOT NULL,
          password VARCHAR(255) NOT NULL,
          status TINYINT(1) DEFAULT 1
        )
      `);

        // Hash the default admin password using bcryptjs
        const hashedPassword = await bcrypt.hash(password, 10);

      const insertResult = await connection.query(
        'INSERT INTO user (org_id, username, password, status) VALUES (?, ?, ?, ?)',
        [orgId, username, hashedPassword, enabled]
      );
  
      // Respond with success message or inserted user details
      res.status(200).json({ message: 'User added successfully', user: { id: insertResult.insertId, orgId, username, enabled } });
    } catch (error) {
      console.error('Error inserting user:', error);
      res.status(500).json({ error: 'Failed to add user. Please try again.' });
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


router.get('/users', async (req, res) => {
    const { companyName } = req.query;
    const dbNamePrefix = "ERP_";
    const dbName = dbNamePrefix + companyName.toLowerCase().replace(/\s+/g, '_'); // Construct database name
  
    let connection;
  
    try {
      // Create a connection to the database
      connection = await mysql.createConnection({ ...dbConfig, database: dbName });
  
      // Fetch all user from taxinfo table
      const [rows] = await connection.query('SELECT * FROM user');
  
      // Respond with the fetched user
      res.status(200).json(rows);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ error: 'Failed to fetch user. Please try again.' });
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