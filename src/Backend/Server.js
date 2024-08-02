const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const {dbConfig, pool} = require('./dbConfig');
const OrganizationRoutes  = require('./db/company'); 
const adminRoutes = require('./admin/admin'); // Adjusted import path for admin routes
const userRoutes = require('./users/users');
const ledgerRoutes = require('./Ledger/LedgerOperations');
const groupRoutes = require('./Group/GroupOperations');
const stockgroupRoutes = require('./StockGroup/StockGroupOperations');
const stockitemRoutes = require('./StockItem/StockItemOperations');
const salesVoucherRoutes = require('./Vouchers/Salesvchoperations');
const purcorderVoucherRoutes = require('./Vouchers/PurcOrdervchoperations');
const purchaseVoucherRoutes = require('./Vouchers/Purchasevchoperations');
const TaxTypeRoutes = require('./taxes/taxes');
const salesmanroutes = require('./SalesMan/SalesMan');
const Godown=require('./Godown/Godown');
const Stockcategory= require('./Stock Category/Stockcategory');
const Dashboard = require('./Dashboard/Dashboard');


const app = express();
app.use(bodyParser.json());

// Enable CORS for all requests
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});


app.use('/api', Dashboard);
//DB or Company or Organization Creation
app.use('/api', OrganizationRoutes);

// Function to generate database name based on organization name
const getDatabaseName = (organizationName) => {
    const dbNamePrefix = "ERP_";
    return dbNamePrefix + organizationName.toLowerCase().replace(/\s+/g, '_');
  };

// Route to list databases with prefix 'erp_'
app.get('/api/companies', async (req, res) => {
    try {
        // Connect to the MySQL server
        const connection = await mysql.createConnection(dbConfig);

        // Query to list all databases
        const [rows] = await connection.query('SHOW DATABASES');

        // Close connection
        await connection.end();

        // Extract database names and filter those with prefix 'erp_'
        const databases = rows
            .map(row => row.Database)
            .filter(database => database.startsWith('erp_'));
            

        // Send response with filtered database names
        res.json({ databases });
    } catch (error) {
        // Handle error
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/organization', async(req,res) => {
    const { databaseName } = req.query; // Extract databaseName from query params

    const dbNamePrefix = "erp_";
    const dbName = dbNamePrefix + databaseName.toLowerCase().replace(/\s+/g, '_');
    //console.log("database : "+dbName);
    if (!dbName || !dbName.startsWith('erp_')) {
        return res.status(400).json({ success: false, message: 'Valid database name starting with "erp_" is required' });
    }

    try {
        const connection = await pool.getConnection();
        await connection.changeUser({ database: dbName }); // Switch to the specified database
        const [rows] = await connection.query('SELECT * FROM organization');
        await connection.release();

        const cmpname = rows.map(row => row.name);
        res.json({ success: true, cmpname });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch groups', error });
    }
})

// Use admin routes
app.use('/api', adminRoutes);

//use user routes
app.use('/api', userRoutes);

//Taxes Routes
app.use('/api', TaxTypeRoutes);

app.use('/api',ledgerRoutes);

app.use('/api',groupRoutes);

app.use('/api',stockgroupRoutes);

app.use('/api', salesmanroutes);

app.use('/api', Godown);

app.use('/api',Stockcategory);

//prashanth code

// Endpoint to fetch Godown names
app.get('/api/Godown', async (req, res) => {
    const { databaseName } = req.query; // Extract databaseName from query params
    //console.log("Company Name: ", companyName);
    const dbNamePrefix = "erp_";
    const dbName = dbNamePrefix + databaseName.toLowerCase().replace(/\s+/g, '_');
    //console.log("database : "+dbName);
    if (!dbName || !dbName.startsWith('erp_')) {
        return res.status(400).json({ success: false, message: 'Valid database name starting with "erp_" is required' });
    }

    try {
        const connection = await pool.getConnection();
        await connection.changeUser({ database: dbName }); // Switch to the specified database
        const [rows] = await connection.query('SELECT * FROM Godown_tbl');
        await connection.release();

        const Salesman = rows.map(row => row.name);
        res.json({ success: true, Salesman });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch Salesman', error });
    }
});

// Godown list
app.get('/api/GodownList', async (req, res) => {
    const { companyName } = req.query;

    if (!companyName) {
        return res.status(400).json({ error: 'Company name is required' });
    }

    try {
        // Generate database name based on organization name
        const dbName = getDatabaseName(companyName);

        // Get a connection from the pool
        const connection = await pool.getConnection();

        // Switch to the selected database
        await connection.changeUser({ database: dbName });

        const sql = 'SELECT * FROM Godown_tbl';

        // Execute query
        const [results] = await connection.query(sql);

        // Release the connection back to the pool
        connection.release();

        // Send fetched data as JSON response
        res.json(results);

    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Error fetching data' });
    }
});

app.get('/api/Godown_edit/:editGodownId', async (req, res) => {
    const { companyName } = req.query;

    if (!companyName) {
        return res.status(400).json({ error: 'Company name is required' });
    }

    const { editGodownId } = req.params; // Extract invoiceId from URL parameters

    try {
        // Generate database name based on organization name
        const dbName = getDatabaseName(companyName);

        // Get a connection from the pool
        const connection = await pool.getConnection();

        // Switch to the selected database
        await connection.changeUser({ database: dbName });

        const sql = 'SELECT * FROM Godown_tbl WHERE id = ?'; // Adjust query as per your schema

        // Execute query with invoiceId as parameter
        const [results] = await connection.query(sql, [editGodownId]);

        // Release the connection back to the pool
        connection.release();

        // Check if a voucher was found
        if (results.length === 0) {
            return res.status(404).json({ error: 'Godown not found' });
        }

        // Send fetched data as JSON response
        res.json(results[0]); // Assuming only one result is expected

    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Error fetching data' });
    }
});



app.get('/api/Godown_delete/:deleteGodownId', async (req, res) => {
    const { companyName } = req.query;

    if (!companyName) {
        return res.status(400).json({ error: 'Company name is required' });
    }

    const { deleteGodownId } = req.params; // Extract invoiceId from URL parameters

    try {
        // Generate database name based on organization name
        const dbName = getDatabaseName(companyName);

        // Get a connection from the pool
        const connection = await pool.getConnection();

        // Switch to the selected database
        await connection.changeUser({ database: dbName });

        const sql = 'SELECT * FROM Godown_tbl WHERE id = ?'; // Adjust query as per your schema

        // Execute query with invoiceId as parameter
        const [results] = await connection.query(sql, [deleteGodownId]);

        // Release the connection back to the pool
        connection.release();

        // Check if a voucher was found
        if (results.length === 0) {
            return res.status(404).json({ error: 'Godown not found' });
        }

        // Send fetched data as JSON response
        res.json(results[0]); // Assuming only one result is expected

    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Error fetching data' });
    }
});



// Endpoint to fetch Stockcategory names
app.get('/api/Stockcategory', async (req, res) => {
    const { databaseName } = req.query; // Extract databaseName from query params
    //console.log("Company Name: ", companyName);
    const dbNamePrefix = "erp_";
    const dbName = dbNamePrefix + databaseName.toLowerCase().replace(/\s+/g, '_');
    //console.log("database : "+dbName);
    if (!dbName || !dbName.startsWith('erp_')) {
        return res.status(400).json({ success: false, message: 'Valid database name starting with "erp_" is required' });
    }

    try {
        const connection = await pool.getConnection();
        await connection.changeUser({ database: dbName }); // Switch to the specified database
        const [rows] = await connection.query('SELECT * FROM stockCategory_tbl');
        await connection.release();

        const Salesman = rows.map(row => row.name);
        res.json({ success: true, Salesman });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch Stockcategoy', error });
    }
});

app.get('/api/stockcategorylist', async (req, res) => {
    const { companyName } = req.query;

    if (!companyName) {
        return res.status(400).json({ error: 'Company name is required' });
    }

    try {
        // Generate database name based on organization name
        const dbName = getDatabaseName(companyName);

        // Get a connection from the pool
        const connection = await pool.getConnection();

        // Switch to the selected database
        await connection.changeUser({ database: dbName });

        const sql = 'SELECT * FROM stockCategory_tbl';

        // Execute query
        const [results] = await connection.query(sql);

        // Release the connection back to the pool
        connection.release();

        // Send fetched data as JSON response
        res.json(results);

    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Error fetching data' });
    }
});


// Endpoint to fetch group names
app.get('/api/groups', async (req, res) => {
    const { databaseName } = req.query; // Extract databaseName from query params

    const dbNamePrefix = "erp_";
    const dbName = dbNamePrefix + databaseName.toLowerCase().replace(/\s+/g, '_');
    //console.log("database : "+dbName);
    if (!dbName || !dbName.startsWith('erp_')) {
        return res.status(400).json({ success: false, message: 'Valid database name starting with "erp_" is required' });
    }

    try {
        const connection = await pool.getConnection();
        await connection.changeUser({ database: dbName }); // Switch to the specified database
        const [rows] = await connection.query('SELECT * FROM group_tbl');
        await connection.release();

        const groups = rows.map(row => row.name);
        res.json({ success: true, groups });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch groups', error });
    }
});

// Endpoint to fetch stockgroup names
app.get('/api/stockgroups', async (req, res) => {
    const { databaseName } = req.query; // Extract databaseName from query params

    const dbNamePrefix = "erp_";
    const dbName = dbNamePrefix + databaseName.toLowerCase().replace(/\s+/g, '_');
    //console.log("database : "+dbName);
    if (!dbName || !dbName.startsWith('erp_')) {
        return res.status(400).json({ success: false, message: 'Valid database name starting with "erp_" is required' });
    }

    try {
        const connection = await pool.getConnection();
        await connection.changeUser({ database: dbName }); // Switch to the specified database
        const [rows] = await connection.query('SELECT name FROM stockgroup_tbl');
        await connection.release();

        const groups = rows.map(row => row.name);
        res.json({ success: true, groups });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch groups', error });
    }
});


app.use('/api',stockitemRoutes);

/**********voucher creations*********/

//sales
app.use('/api', salesVoucherRoutes);


app.use('/api',purcorderVoucherRoutes);

//Purchase
app.use('/api', purchaseVoucherRoutes);

app.get('/api/sales_voucher', async (req, res) => {
    const { companyName, page, limit, status } = req.query;

    if (!companyName) {
        return res.status(400).json({ error: 'Company name is required' });
    }

    try {
        // Generate database name based on organization name
        const dbName = getDatabaseName(companyName);

        // Get a connection from the pool
        const connection = await pool.getConnection();

        // Switch to the selected database
        await connection.changeUser({ database: dbName });

        // Calculate offset for pagination
        const offset = (page - 1) * limit;

        // SQL query to fetch records from sales_vouchers table with pagination and status filtering
        let sql = 'SELECT SQL_CALC_FOUND_ROWS * FROM sales_vouchers';
        const params = [];

        // Add WHERE clause for status filtering if provided
        if (status && status !== 'All') {
            sql += ' WHERE status = ?';
            params.push(status);
        }

        sql += ' LIMIT ?, ?';

        const [results] = await connection.query(sql, [...params, offset, parseInt(limit)]);

        // Fetch total count of rows (excluding LIMIT)
        const [rowCount] = await connection.query('SELECT FOUND_ROWS() AS total');
        const totalCount = rowCount[0].total;

        // Release the connection back to the pool
        connection.release();

        // Format the response with `invoices` and `totalCount` keys
        const response = {
            invoices: results, // Assuming `results` contains your fetched records
            totalCount: totalCount
        };

        // Send fetched data as JSON response
        res.json(response);

    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Error fetching data' });
    }
});

app.get('/api/sales_voucher/:invoiceId', async (req, res) => {
    const { companyName } = req.query;

    if (!companyName) {
        return res.status(400).json({ error: 'Company name is required' });
    }

    const { invoiceId } = req.params; // Extract invoiceId from URL parameters

    try {
        // Generate database name based on organization name
        const dbName = getDatabaseName(companyName);

        // Get a connection from the pool
        const connection = await pool.getConnection();

        // Switch to the selected database
        await connection.changeUser({ database: dbName });

        // SQL query to fetch a specific sales voucher based on invoiceId
        const sql = 'SELECT * FROM sales_vouchers WHERE vouchernumber = ?'; // Adjust query as per your schema

        // Execute query with invoiceId as parameter
        const [results] = await connection.query(sql, [invoiceId]);

        // Release the connection back to the pool
        connection.release();

        // Check if a voucher was found
        if (results.length === 0) {
            return res.status(404).json({ error: 'Sales voucher not found' });
        }

        // Send fetched data as JSON response
        res.json(results[0]); // Assuming only one result is expected

    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Error fetching data' });
    }
});

app.get('/api/sales_inventory', async (req, res) => {
    const { companyName, vouchernumber } = req.query;
  
    if (!companyName || !vouchernumber) {
      return res.status(400).json({ error: 'Company name and voucher number are required' });
    }
  
    try {
      // Generate database name based on organization name
      const dbName = getDatabaseName(companyName);
  
      // Get a connection from the pool
      const connection = await pool.getConnection();
  
      // Switch to the selected database
      await connection.changeUser({ database: dbName });
  
      // SQL query to fetch items from sales_inventory based on voucherNumber
      const sql = 'SELECT itemName, quantity, rate, discount, amount FROM sales_inventory WHERE voucherId = ?'; // Adjust query as per your schema
  
      // Execute query with vouchernumber as parameter
      const [results] = await connection.query(sql, [vouchernumber]);
  
      // Release the connection back to the pool
      connection.release();
  
      // Check if items were found
      if (results.length === 0) {
        return res.status(404).json({ error: 'Items not found for this invoice' });
      }
  
      // Send fetched data as JSON response
      res.json(results);
  
    } catch (error) {
      console.error('Error fetching data:', error);
      res.status(500).json({ error: 'Error fetching data' });
    }
  });

app.get('/api/sales_ledger_entries', async (req, res) => {
    const { companyName, vouchernumber } = req.query;
  
    if (!companyName || !vouchernumber) {
      return res.status(400).json({ error: 'Company name and voucher number are required' });
    }
  
    try {
      // Generate database name based on organization name
      const dbName = getDatabaseName(companyName);
  
      // Get a connection from the pool
      const connection = await pool.getConnection();
  
      // Switch to the selected database
      await connection.changeUser({ database: dbName });
  
      // SQL query to fetch items from sales_inventory based on voucherNumber
      const sql = 'SELECT particulars, rate, amount FROM sales_ledger_entries WHERE voucherId = ?'; // Adjust query as per your schema
  
      // Execute query with vouchernumber as parameter
      const [results] = await connection.query(sql, [vouchernumber]);
  
      // Release the connection back to the pool
      connection.release();
  
      // Check if items were found
      if (results.length === 0) {
        return res.status(404).json({ error: 'Items not found for this invoice' });
      }
  
      // Send fetched data as JSON response
      res.json(results);
  
    } catch (error) {
      console.error('Error fetching data:', error);
      res.status(500).json({ error: 'Error fetching data' });
    }
  });
  

app.get('/api/sales_vouchers/last', async (req, res) => {
    const { companyName } = req.query;
  
    if (!companyName) {
      return res.status(400).json({ error: 'Company name is required' });
    }
  
    try {
      // Generate database name based on organization name
      const dbName = getDatabaseName(companyName);
  
      // Get a connection from the pool
      const connection = await pool.getConnection();
  
      // Switch to the selected database
      await connection.changeUser({ database: dbName });
  
      // SQL query to fetch the last record from sales_vouchers table
      const sql = 'SELECT vouchernumber FROM sales_vouchers ORDER BY id DESC LIMIT 1';
  
      // Execute query
      const [results] = await connection.query(sql);
  
      // Release the connection back to the pool
      connection.release();
  
      // Send fetched data as JSON response
      res.json(results[0]); // Assuming voucherNumber is a field in your sales_vouchers table
  
    } catch (error) {
      console.error('Error fetching last voucher number:', error);
      res.status(500).json({ error: 'Error fetching last voucher number' });
    }
  });

//View Product list
app.get('/api/products', async (req, res) => {
    const { companyName, page, limit, status } = req.query;

    if (!companyName) {
        return res.status(400).json({ error: 'Company name is required' });
    }

    // Convert page and limit to integers and set defaults if they are not provided
    const pageInt = parseInt(page) || 1; // Default to page 1 if not provided
    const limitInt = parseInt(limit) || 10; // Default to 10 items per page if not provided

    // Ensure page and limit are valid numbers
    if (isNaN(pageInt) || isNaN(limitInt)) {
        return res.status(400).json({ error: 'Page and limit must be valid numbers' });
    }

    try {
        // Generate database name based on organization name
        const dbName = getDatabaseName(companyName);

        // Get a connection from the pool
        const connection = await pool.getConnection();

        // Switch to the selected database
        await connection.changeUser({ database: dbName });

        // Calculate offset for pagination
        const offset = (pageInt - 1) * limitInt;

        // SQL query to fetch records from stockitem table with pagination and status filtering
        let sql = 'SELECT * FROM stockitem';
        const params = [];

        // Add WHERE clause for status filtering if provided
        if (status && status !== 'All') {
            sql += ' WHERE status = ?';
            params.push(status);
        }

        sql += ' LIMIT ?, ?';
        params.push(offset, limitInt);

        // Execute query
        const [results] = await connection.query(sql, params);

        // Release the connection back to the pool
        connection.release();

        // Send fetched data as JSON response
        res.json(results);

    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Error fetching data' });
    }
});


//fetching ledgers
app.get('/api/ledgers', async (req, res) => {
    const { companyName } = req.query;

    if (!companyName) {
        return res.status(400).json({ error: 'Company name is required' });
    }

    try {
        // Generate database name based on organization name
        const dbName = getDatabaseName(companyName);

        // Get a connection from the pool
        const connection = await pool.getConnection();

        // Switch to the selected database
        await connection.changeUser({ database: dbName });

        // SQL query to fetch records from sales_voucher table
        const sql = 'SELECT * FROM ledger';

        // Execute query
        const [results] = await connection.query(sql);

        // Release the connection back to the pool
        connection.release();

        // Send fetched data as JSON response
        res.json(results);

    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Error fetching data' });
    }
});


app.get('/api/groupslist', async (req, res) => {
    const { companyName } = req.query;

    if (!companyName) {
        return res.status(400).json({ error: 'Company name is required' });
    }

    try {
        // Generate database name based on organization name
        const dbName = getDatabaseName(companyName);

        // Get a connection from the pool
        const connection = await pool.getConnection();

        // Switch to the selected database
        await connection.changeUser({ database: dbName });

        const sql = 'SELECT * FROM group_tbl';

        // Execute query
        const [results] = await connection.query(sql);

        // Release the connection back to the pool
        connection.release();

        // Send fetched data as JSON response
        res.json(results);

    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Error fetching data' });
    }
});


app.get('/api/groups_edit/:editGroupId', async (req, res) => {
    const { companyName } = req.query;

    if (!companyName) {
        return res.status(400).json({ error: 'Company name is required' });
    }

    const { editGroupId } = req.params; // Extract invoiceId from URL parameters

    try {
        // Generate database name based on organization name
        const dbName = getDatabaseName(companyName);

        // Get a connection from the pool
        const connection = await pool.getConnection();

        // Switch to the selected database
        await connection.changeUser({ database: dbName });

        const sql = 'SELECT * FROM group_tbl WHERE id = ?'; // Adjust query as per your schema

        // Execute query with invoiceId as parameter
        const [results] = await connection.query(sql, [editGroupId]);

        // Release the connection back to the pool
        connection.release();

        // Check if a voucher was found
        if (results.length === 0) {
            return res.status(404).json({ error: 'Group not found' });
        }

        // Send fetched data as JSON response
        res.json(results[0]); // Assuming only one result is expected

    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Error fetching data' });
    }
});

app.get('/api/stockgroupslist', async (req, res) => {
    const { companyName } = req.query;

    if (!companyName) {
        return res.status(400).json({ error: 'Company name is required' });
    }

    try {
        // Generate database name based on organization name
        const dbName = getDatabaseName(companyName);

        // Get a connection from the pool
        const connection = await pool.getConnection();

        // Switch to the selected database
        await connection.changeUser({ database: dbName });

        const sql = 'SELECT * FROM stockgroup_tbl';

        // Execute query
        const [results] = await connection.query(sql);

        // Release the connection back to the pool
        connection.release();

        // Send fetched data as JSON response
        res.json(results);

    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Error fetching data' });
    }
});

//Fetching All Purchase
app.get('/api/purchase_voucher', async (req, res) => {
    const { companyName, page, limit, status } = req.query;

    if (!companyName) {
        return res.status(400).json({ error: 'Company name is required' });
    }

    try {
        // Generate database name based on organization name
        const dbName = getDatabaseName(companyName);

        // Get a connection from the pool
        const connection = await pool.getConnection();

        // Switch to the selected database
        await connection.changeUser({ database: dbName });

        // Calculate offset for pagination
        const offset = (page - 1) * limit;

        // SQL query to fetch records from sales_vouchers table with pagination and status filtering
        let sql = 'SELECT SQL_CALC_FOUND_ROWS * FROM purchase_vouchers';
        const params = [];

        // Add WHERE clause for status filtering if provided
        if (status && status !== 'All') {
            sql += ' WHERE status = ?';
            params.push(status);
        }

        sql += ' LIMIT ?, ?';

        const [results] = await connection.query(sql, [...params, offset, parseInt(limit)]);

        // Fetch total count of rows (excluding LIMIT)
        const [rowCount] = await connection.query('SELECT FOUND_ROWS() AS total');
        const totalCount = rowCount[0].total;

        // Release the connection back to the pool
        connection.release();

        // Format the response with `invoices` and `totalCount` keys
        const response = {
            invoices: results, // Assuming `results` contains your fetched records
            totalCount: totalCount
        };

        // Send fetched data as JSON response
        res.json(response);

    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Error fetching data' });
    }
});

app.get('/api/purchase_vouchers/last', async (req, res) => {
    const { companyName } = req.query;
  
    if (!companyName) {
      return res.status(400).json({ error: 'Company name is required' });
    }
  
    try {
      // Generate database name based on organization name
      const dbName = getDatabaseName(companyName);
  
      // Get a connection from the pool
      const connection = await pool.getConnection();
  
      // Switch to the selected database
      await connection.changeUser({ database: dbName });
  
      // SQL query to fetch the last record from sales_vouchers table
      const sql = 'SELECT vouchernumber FROM purchase_vouchers ORDER BY id DESC LIMIT 1';
  
      // Execute query
      const [results] = await connection.query(sql);
  
      // Release the connection back to the pool
      connection.release();
  
      // Send fetched data as JSON response
      res.json(results[0]); // Assuming voucherNumber is a field in your sales_vouchers table
  
    } catch (error) {
      console.error('Error fetching last voucher number:', error);
      res.status(500).json({ error: 'Error fetching last voucher number' });
    }
  });



app.get('/api/purcorder_voucher', async (req, res) => {
    const { companyName, page, limit, status } = req.query;

    if (!companyName) {
        return res.status(400).json({ error: 'Company name is required' });
    }

    try {
        // Generate database name based on organization name
        const dbName = getDatabaseName(companyName);

        // Get a connection from the pool
        const connection = await pool.getConnection();

        // Switch to the selected database
        await connection.changeUser({ database: dbName });

        // Calculate offset for pagination
        const offset = (page - 1) * limit;

        // SQL query to fetch records from sales_vouchers table with pagination and status filtering
        let sql = 'SELECT SQL_CALC_FOUND_ROWS * FROM purcorder_vouchers';
        const params = [];

        // Add WHERE clause for status filtering if provided
        if (status && status !== 'All') {
            sql += ' WHERE status = ?';
            params.push(status);
        }

        sql += ' LIMIT ?, ?';

        const [results] = await connection.query(sql, [...params, offset, parseInt(limit)]);

        // Fetch total count of rows (excluding LIMIT)
        const [rowCount] = await connection.query('SELECT FOUND_ROWS() AS total');
        const totalCount = rowCount[0].total;

        // Release the connection back to the pool
        connection.release();

        // Format the response with `invoices` and `totalCount` keys
        const response = {
            invoices: results, // Assuming `results` contains your fetched records
            totalCount: totalCount
        };

        // Send fetched data as JSON response
        res.json(response);

    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Error fetching data' });
    }
});  
app.get('/api/purcorder_vouchers/last', async (req, res) => {
    const { companyName } = req.query;
  
    if (!companyName) {
      return res.status(400).json({ error: 'Company name is required' });
    }
  
    try {
      // Generate database name based on organization name
      const dbName = getDatabaseName(companyName);
  
      // Get a connection from the pool
      const connection = await pool.getConnection();
  
      // Switch to the selected database
      await connection.changeUser({ database: dbName });
  
    
      const sql = 'SELECT vouchernumber FROM purcorder_vouchers ORDER BY id DESC LIMIT 1';
  
      // Execute query
      const [results] = await connection.query(sql);
  
      // Release the connection back to the pool
      connection.release();
  
      // Send fetched data as JSON response
      res.json(results[0]); 
  
    } catch (error) {
      console.error('Error fetching last voucher number:', error);
      res.status(500).json({ error: 'Error fetching last voucher number' });
    }
  });


app.get('/api/stockgroups_edit/:editStockGroupId', async (req, res) => {
    const { companyName } = req.query;

    if (!companyName) {
        return res.status(400).json({ error: 'Company name is required' });
    }

    const { editStockGroupId } = req.params; // Extract invoiceId from URL parameters

    try {
        // Generate database name based on organization name
        const dbName = getDatabaseName(companyName);

        // Get a connection from the pool
        const connection = await pool.getConnection();

        // Switch to the selected database
        await connection.changeUser({ database: dbName });

        const sql = 'SELECT * FROM stockgroup_tbl WHERE id = ?'; // Adjust query as per your schema

        // Execute query with invoiceId as parameter
        const [results] = await connection.query(sql, [editStockGroupId]);

        // Release the connection back to the pool
        connection.release();

        // Check if a voucher was found
        if (results.length === 0) {
            return res.status(404).json({ error: 'StockGroup not found' });
        }

        // Send fetched data as JSON response
        res.json(results[0]); // Assuming only one result is expected

    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Error fetching data' });
    }
});


app.get('/api/admin-products', async (req, res) => {
    const { companyName, page, limit, status } = req.query;

    if (!companyName) {
        return res.status(400).json({ error: 'Company name is required' });
    }

    // Convert page and limit to integers and set defaults if they are not provided
    const pageInt = parseInt(page) || 1; // Default to page 1 if not provided
    const limitInt = parseInt(limit) || 10; // Default to 10 items per page if not provided

    // Ensure page and limit are valid numbers
    if (isNaN(pageInt) || isNaN(limitInt)) {
        return res.status(400).json({ error: 'Page and limit must be valid numbers' });
    }

    try {
        // Generate database name based on organization name
        const dbName = getDatabaseName(companyName);

        // Get a connection from the pool
        const connection = await pool.getConnection();

        // Switch to the selected database
        await connection.changeUser({ database: dbName });

        // Calculate offset for pagination
        const offset = (pageInt - 1) * limitInt;

        // SQL query to fetch records from stockitem table with pagination and status filtering
        let sql = 'SELECT * FROM stockitem';
        const params = [];

        // Add WHERE clause for status filtering if provided
        if (status && status !== 'All') {
            sql += ' WHERE status = ?';
            params.push(status);
        }

        sql += ' LIMIT ?, ?';
        params.push(offset, limitInt);

        // Execute query
        const [results] = await connection.query(sql, params);

        // Release the connection back to the pool
        connection.release();

        // Send fetched data as JSON response
        res.json(results);

    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Error fetching data' });
    }
});


//fetch product id
app.get('/api/stockitem', async (req, res) => {
    const { companyName, productName } = req.query;

    if (!companyName) {
        return res.status(400).json({ error: 'Company name is required' });
    }

    try {
        // Generate database name based on organization name
        const dbName = getDatabaseName(companyName);

        // Get a connection from the pool
        const connection = await pool.getConnection();

        // Switch to the selected database
        await connection.changeUser({ database: dbName });

        const sql = 'SELECT * FROM stockitem where name = ?';

        // Execute query
        const [results] = await connection.query(sql, [productName]);

        // Release the connection back to the pool
        connection.release();

        // Send fetched data as JSON response
        res.json(results);

    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Error fetching data' });
    }
});

//fetch gstrate
app.get('/api/gst-rate', async (req, res) => {
    const { companyName, productId } = req.query;

    if (!companyName) {
        return res.status(400).json({ error: 'Company name is required' });
    }

    try {
        // Generate database name based on organization name
        const dbName = getDatabaseName(companyName);

        // Get a connection from the pool
        const connection = await pool.getConnection();

        // Switch to the selected database
        await connection.changeUser({ database: dbName });

        const sql = 'SELECT * FROM sku_gst_details where stockitemId = ?';

        // Execute query
        const [results] = await connection.query(sql, [productId]);

        // Release the connection back to the pool
        connection.release();

        // Send fetched data as JSON response
        res.json(results);

    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Error fetching data' });
    }
});

app.get('/api/ledtaxrate', async (req, res) => {
    const { companyName, particulars } = req.query;

    if (!companyName) {
        return res.status(400).json({ error: 'Company name is required' });
    }

    try {
        // Generate database name based on organization name
        const dbName = getDatabaseName(companyName);

        // Get a connection from the pool
        const connection = await pool.getConnection();

        // Switch to the selected database
        await connection.changeUser({ database: dbName });

        const sql = 'SELECT * FROM taxinfo where taxname = ?';

        // Execute query
        const [results] = await connection.query(sql, [particulars]);

        // Release the connection back to the pool
        connection.release();

        // Send fetched data as JSON response
        res.json(results);

    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Error fetching data' });
    }
});


app.get('/api/stock_summary_details', async (req, res) => {
    const { companyName, productName } = req.query;

    if (!companyName) {
        return res.status(400).json({ error: 'Company name is required' });
    }

    try {
        // Generate database name based on organization name
        const dbName = getDatabaseName(companyName);

        // Get a connection from the pool
        const connection = await pool.getConnection();

        // Switch to the selected database
        await connection.changeUser({ database: dbName });

        const sql = `
            SELECT 
                id, 
                stockItemName, 
                DATE_FORMAT(periodFrom, '%Y-%m-%d') as periodFrom, 
                DATE_FORMAT(periodTo, '%Y-%m-%d') as periodTo, 
                openingBalanceQuantity, 
                openingBalanceRate, 
                openingBalanceValue, 
                inwardsQuantity, 
                inwardsRate, 
                inwardsValue, 
                outwardsQuantity, 
                outwardsRate, 
                outwardsValue, 
                closingBalanceQuantity, 
                closingBalanceRate, 
                closingBalanceValue, 
                FinBalQty 
            FROM stock_summary
        `;

        // Execute query
        const [results] = await connection.query(sql);

        console.log(results);
        // Release the connection back to the pool
        connection.release();

        // Send fetched data as JSON response
        res.json(results);

    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Error fetching data' });
    }
});


app.get('/api/stock-summary/latest', async (req, res) => {
    const { companyName } = req.query;
  
    if (!companyName) {
      return res.status(400).json({ error: 'Company name is required' });
    }
  
    try {
      const dbName = getDatabaseName(companyName);
      const connection = await pool.getConnection();
      await connection.changeUser({ database: dbName });
  
      const sql = `
      SELECT 
          DATE_FORMAT(periodFrom, '%Y-%m-%d') as periodFrom,
          DATE_FORMAT(periodTo, '%Y-%m-%d') as periodTo,
          stockItemName as name,
          openingBalanceQuantity as 'openingBalance.quantity',
          openingBalanceRate as 'openingBalance.rate',
          openingBalanceValue as 'openingBalance.amount',
          inwardsQuantity as 'inwards.quantity',
          inwardsRate as 'inwards.rate',
          inwardsValue as 'inwards.amount',
          outwardsQuantity as 'outwards.quantity',
          outwardsRate as 'outwards.rate',
          outwardsValue as 'outwards.amount',
          closingBalanceQuantity as 'closingBalance.quantity',
          closingBalanceRate as 'closingBalance.rate',
          closingBalanceValue as 'closingBalance.amount' 
      FROM (
          SELECT 
              DATE_FORMAT(periodFrom, '%Y-%m-%d') as periodFrom,
              DATE_FORMAT(periodTo, '%Y-%m-%d') as periodTo,
              stockItemName,
              openingBalanceQuantity,
              openingBalanceRate,
              openingBalanceValue,
              inwardsQuantity,
              inwardsRate,
              inwardsValue,
              outwardsQuantity,
              outwardsRate,
              outwardsValue,
              closingBalanceQuantity,
              closingBalanceRate,
              closingBalanceValue,
              ROW_NUMBER() OVER (PARTITION BY stockItemName ORDER BY periodFrom DESC) as rn
          FROM stock_summary
      ) AS ranked
      WHERE rn = 1
  `;
    
      const [results] = await connection.query(sql);
      connection.release();
      let resdata = null;   
        // Assuming results has only one row due to LIMIT 1
    if (results.length > 0) {
    // Copy closing balance values to opening balance fields
    results[0]['openingBalance.quantity'] = results[0]['closingBalance.quantity'];
    results[0]['openingBalance.rate'] = results[0]['closingBalance.rate'];
    results[0]['openingBalance.amount'] = results[0]['closingBalance.amount'];

    results[0]['inwards.quantity'] = 0;
    results[0]['inwards.rate'] = 0.00;
    results[0]['inwards.amount'] = 0.00;

    resdata = { data: results };
    //return resdata;
} else {
    // Handle case where no results are found
    resdata =  { data: [] };
}

      res.json(resdata);
    } catch (error) {
      console.error('Error fetching data:', error);
      res.status(500).json({ error: 'Error fetching data' });
    }
  });

app.get('/api/lastSellingPrice', async (req, res) => {
    const { companyName, productId, userName, vchDate } = req.query;
  
    if (!companyName) {
      return res.status(400).json({ error: 'Company name is required' });
    }

    if (!productId) {
        return res.status(400).json({ error: 'Product ID is required' });
      }
  
    try {
      const dbName = getDatabaseName(companyName);
      const connection = await pool.getConnection();
      await connection.changeUser({ database: dbName });
  
      const sql = `
      SELECT 
        DATE_FORMAT(applicableDate, '%Y-%m-%d') as applicableDate,
        userName,
        productId,
        sellingPrices,
        org_id
      FROM 
        product_selling_price
      WHERE 
        productId = ? AND userName = ? AND applicableDate <= ?
      ORDER BY 
        applicableDate DESC 
      LIMIT 1
  `;
    
  const [results] = await connection.query(sql, [productId, userName, vchDate]);
  connection.release();

  const resdata = results.length > 0 ? { data: results[0] } : { data: [] };
  res.json(resdata);
} catch (error) {
  console.error('Error fetching data:', error);
  res.status(500).json({ error: 'Error fetching data' });
}
});

app.get('/api/lastDiscount', async (req, res) => {
    const { companyName, productId, userName, vchDate } = req.query;
  
    if (!companyName) {
      return res.status(400).json({ error: 'Company name is required' });
    }

    if (!productId) {
        return res.status(400).json({ error: 'Product ID is required' });
      }
  
    try {
      const dbName = getDatabaseName(companyName);
      const connection = await pool.getConnection();
      await connection.changeUser({ database: dbName });
  
      const sql = `
      SELECT 
        DATE_FORMAT(applicableDate, '%Y-%m-%d') as applicableDate,
        userName,
        productId,
        discount,
        thresholdValue,
        org_id
      FROM 
        productdiscounts
      WHERE 
        productId = ? AND userName = ? AND applicableDate <= ?
      ORDER BY 
        applicableDate DESC 
      LIMIT 1
  `;
    
  const [results] = await connection.query(sql, [productId, userName, vchDate]);
  connection.release();

  const resdata = results.length > 0 ? { data: results[0] } : { data: [] };
  res.json(resdata);
} catch (error) {
  console.error('Error fetching data:', error);
  res.status(500).json({ error: 'Error fetching data' });
}
});

//prashanth Code 

// Endpoint to fetch salesman names
app.get('/api/Salesman', async (req, res) => {
    const { companyName } = req.query; // Extract databaseName from query params
    //console.log("Company Name: ", companyName);
    const dbNamePrefix = "erp_";
    const dbName = dbNamePrefix + companyName.toLowerCase().replace(/\s+/g, '_');
    //console.log("database : "+dbName);
    if (!dbName || !dbName.startsWith('erp_')) {
        return res.status(400).json({ success: false, message: 'Valid database name starting with "erp_" is required' });
    }

    try {
        const connection = await pool.getConnection();
        await connection.changeUser({ database: dbName }); // Switch to the specified database
        const [rows] = await connection.query('SELECT * FROM Salesman');
        await connection.release();

        const Salesman = rows.map(row => row.name);
        res.json({ success: true, Salesman });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch Salesman', error });
    }
});

app.get('/api/SalesmanList', async (req, res) => {
    const { companyName } = req.query;

    if (!companyName) {
        return res.status(400).json({ error: 'Company name is required' });
    }

    try {
        // Generate database name based on organization name
        const dbName = getDatabaseName(companyName);

        // Get a connection from the pool
        const connection = await pool.getConnection();

        // Switch to the selected database
        await connection.changeUser({ database: dbName });

        const sql = 'SELECT * FROM Salesman';

        // Execute query
        const [results] = await connection.query(sql);

        // Release the connection back to the pool
        connection.release();

        // Send fetched data as JSON response
        res.json(results);

    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Error fetching data' });
    }
});

app.get('/api/Salesman_edit/:editSalesmanId', async (req, res) => {
    const { companyName } = req.query;

    if (!companyName) {
        return res.status(400).json({ error: 'Company name is required' });
    }

    const { editSalesmanId } = req.params; // Extract invoiceId from URL parameters

    try {
        // Generate database name based on organization name
        const dbName = getDatabaseName(companyName);

        // Get a connection from the pool
        const connection = await pool.getConnection();

        // Switch to the selected database
        await connection.changeUser({ database: dbName });

        const sql = 'SELECT * FROM Salesman WHERE id = ?'; // Adjust query as per your schema

        // Execute query with invoiceId as parameter
        const [results] = await connection.query(sql, [editSalesmanId]);

        // Release the connection back to the pool
        connection.release();

        // Check if a voucher was found
        if (results.length === 0) {
            return res.status(404).json({ error: 'Salesman not found' });
        }

        // Send fetched data as JSON response
        res.json(results[0]); // Assuming only one result is expected

    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Error fetching data' });
    }
});



app.get('/api/groups_delete/:deleteGroupId', async (req, res) => {
    const { companyName } = req.query;

    if (!companyName) {
        return res.status(400).json({ error: 'Company name is required' });
    }

    const { deleteGroupId } = req.params; // Extract invoiceId from URL parameters

    try {
        // Generate database name based on organization name
        const dbName = getDatabaseName(companyName);

        // Get a connection from the pool
        const connection = await pool.getConnection();

        // Switch to the selected database
        await connection.changeUser({ database: dbName });

        const sql = 'SELECT * FROM group_tbl WHERE id = ?'; // Adjust query as per your schema

        // Execute query with invoiceId as parameter
        const [results] = await connection.query(sql, [deleteGroupId]);

        // Release the connection back to the pool
        connection.release();

        // Check if a voucher was found
        if (results.length === 0) {
            return res.status(404).json({ error: 'Salesman not found' });
        }

        // Send fetched data as JSON response
        res.json(results[0]); // Assuming only one result is expected

    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Error fetching data' });
    }
});



app.get('/api/ledger_delete/:deleteledgerId', async (req, res) => {
    const { companyName } = req.query;

    if (!companyName) {
        return res.status(400).json({ error: 'Company name is required' });
    }

    const { deleteledgerId } = req.params; // Extract invoiceId from URL parameters

    try {
        // Generate database name based on organization name
        const dbName = getDatabaseName(companyName);

        // Get a connection from the pool
        const connection = await pool.getConnection();

        // Switch to the selected database
        await connection.changeUser({ database: dbName });

        const sql = 'SELECT * FROM ledger WHERE id = ?'; // Adjust query as per your schema

        // Execute query with invoiceId as parameter
        const [results] = await connection.query(sql, [deleteledgerId]);

        // Release the connection back to the pool
        connection.release();

        // Check if a voucher was found
        if (results.length === 0) {
            return res.status(404).json({ error: 'Salesman not found' });
        }

        // Send fetched data as JSON response
        res.json(results[0]); // Assuming only one result is expected

    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Error fetching data' });
    }
});


app.get('/api/Stockgroups_delete/:deletestockgroupId', async (req, res) => {
    const { companyName } = req.query;

    if (!companyName) {
        return res.status(400).json({ error: 'Company name is required' });
    }

    const { deletestockgroupId } = req.params; // Extract invoiceId from URL parameters

    try {
        // Generate database name based on organization name
        const dbName = getDatabaseName(companyName);

        // Get a connection from the pool
        const connection = await pool.getConnection();

        // Switch to the selected database
        await connection.changeUser({ database: dbName });

        const sql = 'SELECT * FROM stockgroup_tbl WHERE id = ?'; // Adjust query as per your schema

        // Execute query with invoiceId as parameter
        const [results] = await connection.query(sql, [deletestockgroupId]);

        // Release the connection back to the pool
        connection.release();

        // Check if a voucher was found
        if (results.length === 0) {
            return res.status(404).json({ error: 'Stock Group not found' });
        }

        // Send fetched data as JSON response
        res.json(results[0]); // Assuming only one result is expected

    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Error fetching data' });
    }
});




app.get('/api/stockcategory_delete/:deleteStockcategoryId', async (req, res) => {
    const { companyName } = req.query;

    if (!companyName) {
        return res.status(400).json({ error: 'Company name is required' });
    }

    const { deleteStockcategoryId } = req.params; // Extract invoiceId from URL parameters

    try {
        // Generate database name based on organization name
        const dbName = getDatabaseName(companyName);

        // Get a connection from the pool
        const connection = await pool.getConnection();

        // Switch to the selected database
        await connection.changeUser({ database: dbName });

        const sql = 'SELECT * FROM stockgroup_tbl WHERE id = ?'; // Adjust query as per your schema

        // Execute query with invoiceId as parameter
        const [results] = await connection.query(sql, [deleteStockcategoryId]);

        // Release the connection back to the pool
        connection.release();

        // Check if a voucher was found
        if (results.length === 0) {
            return res.status(404).json({ error: 'Stock Group not found' });
        }

        // Send fetched data as JSON response
        res.json(results[0]); // Assuming only one result is expected

    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Error fetching data' });
    }
});



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});



