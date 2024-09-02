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
router.post('/admin-login', async (req, res) => {
    const { username, password, databaseName, loginType } = req.body;


     // Check if logintype is 'admin'
     if (loginType !== 'admin') {
        return res.status(400).json({ error: 'Invalid login type. Only admin login is allowed.' });
    }

    if (!databaseName.startsWith('erp_')) {
        return res.status(400).json({ error: 'Invalid database name' });
    }

    let connection;
    try {
        // Connect to the specified database
        connection = await mysql.createConnection({ ...dbConfig, database: databaseName });

        // Query to find the admin user
        const [admin] = await connection.query(`SELECT * FROM admin WHERE username = ?`, [username]);
        const [cmpname] = await connection.query(`SELECT * FROM organization`);

        if (admin.length === 0) {
            return res.status(401).json({ error: 'Invalid username or password' });
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

module.exports = router;