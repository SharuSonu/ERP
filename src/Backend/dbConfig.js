const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');

const router = express.Router();
router.use(bodyParser.json());

// Enable CORS for all requests
router.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

// Database configuration
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'Admin@12345',
    database: 'mysql' // Use a default existing database
};

// Create the connection pool
const pool = mysql.createPool(dbConfig);

module.exports = {
    pool: pool,
    dbConfig: dbConfig
};
