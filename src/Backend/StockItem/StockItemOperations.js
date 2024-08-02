const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const moment = require('moment');

const router = express.Router();
router.use(bodyParser.json());

const multer = require('multer');
const xlsx = require('xlsx');
const upload = multer({ dest: 'uploads/' });


// Database configuration
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'Admin@12345',
    // No database specified here
};


const getDatabaseName = (organizationName) => {
    const dbNamePrefix = "erp_";
    return dbNamePrefix + organizationName.toLowerCase().replace(/\s+/g, '_');
  };

// Function to create a stock item
async function createStockItem(reqBody) {
    const { 
        name, alias, Group, partNo, under, units, alternateUnits, 
        gstApplicable, gstDetails, openingBalance, openingBalanceRate, openingBalanceValue, 
        openingBalanceBreakupData, databaseName 
    } = reqBody;

    const dbNamePrefix = "ERP_";
    const dbName = dbNamePrefix + databaseName.toLowerCase().replace(/\s+/g, '_');
    let connection;

    try {
        // Create a connection to the database
        connection = await mysql.createConnection({ ...dbConfig, database: dbName });

        // Create the stockitem table if it does not exist
        await connection.query(`
            CREATE TABLE IF NOT EXISTS stockitem (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                group_alias VARCHAR(255),
                partNo VARCHAR(255),
                parentGroup VARCHAR(255),
                units VARCHAR(50),
                alternateUnits VARCHAR(50),
                gstApplicable BOOLEAN,
                openingBalance DECIMAL(15, 2),
                openingBalanceRate DECIMAL(15, 2),
                openingBalanceValue DECIMAL(15, 2)
            )
        `);

        // Insert stock item data
        const [insertResult] = await connection.query(`
            INSERT INTO stockitem (name, group_alias, partNo, parentGroup, units, alternateUnits, gstApplicable, openingBalance, openingBalanceRate, openingBalanceValue)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [name, alias || '', partNo, Group || 'Primary', under, units, alternateUnits, gstApplicable === 'yes', openingBalance || 0, openingBalanceRate || 0, openingBalanceValue || 0]);

        const stockItemId = insertResult.insertId;

        if (gstApplicable === 'yes' && gstDetails && gstDetails.length > 0) {
            await connection.query(`
                CREATE TABLE IF NOT EXISTS sku_gst_details (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    stockItemId INT,
                    applicableDate DATE,
                    hsnSacDetails VARCHAR(255),
                    hsn VARCHAR(255),
                    taxability VARCHAR(255),
                    gstRate DECIMAL(5, 2),
                    FOREIGN KEY (stockItemId) REFERENCES stockitem(id) ON DELETE CASCADE
                )
            `);

            for (const gstDetail of gstDetails) {
                const { applicableDate, hsnSacDetails, hsn, taxability, gstRate } = gstDetail;
                await connection.query(`
                    INSERT INTO sku_gst_details (stockItemId, applicableDate, hsnSacDetails, hsn, taxability, gstRate)
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [stockItemId, applicableDate, hsnSacDetails, hsn, taxability, gstRate]);
            }
        }
        
        if (openingBalanceBreakupData.length > 0 && openingBalanceBreakupData[0].amount > 0) {
            await connection.query(`
                CREATE TABLE IF NOT EXISTS sku_opening_balance(
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    stockItemId INT,
                    godown VARCHAR(255),
                    batch VARCHAR(255),
                    ratePer DECIMAL(15, 2),
                    amount DECIMAL(15, 2),
                    FOREIGN KEY (stockItemId) REFERENCES stockitem(id) ON DELETE CASCADE
                )
            `);

            for (const breakup of openingBalanceBreakupData) {
                const { godown, batch, ratePer, amount } = breakup;
                await connection.query(`
                    INSERT INTO sku_opening_balance(stockItemId, godown, batch, ratePer, amount)
                    VALUES (?, ?, ?, ?, ?)
                `, [stockItemId, godown, batch, ratePer, amount]);
            }
        }

        return stockItemId;
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

// POST endpoint to create a stock item
router.post('/create-stockitem', async (req, res) => {
    try {
        const stockItemId = await createStockItem(req.body);
        res.status(201).json({ success: true, stockItemId });
    } catch (error) {
        console.error('Error creating stock item:', error);
        res.status(500).json({ success: false, message: 'Error creating stock item' });
    }
});


// Function to create product cost prices
async function createProductCostPrice(reqBody) {
    const { companyName, productId, costPrices } = reqBody;

    // Construct database name based on company name
    const dbNamePrefix = "ERP_";
    const dbName = dbNamePrefix + companyName.toLowerCase().replace(/\s+/g, '_');
    let connection;

    try {
        // Create a connection to the database
        connection = await mysql.createConnection({ ...dbConfig, database: dbName });

        // Create the product_cost_price table if it does not exist
        await connection.query(`
            CREATE TABLE IF NOT EXISTS product_cost_price (
                id INT AUTO_INCREMENT PRIMARY KEY,
                productId INT,
                costPrice DECIMAL(15, 2),
                applicableDate DATE,
                org_id INT
            )
        `);

        const [orgResult] = await connection.query(`
            SELECT id FROM organization WHERE name = ?
        `, [companyName]);

        const org_id = orgResult[0].id;

        // Insert cost price data
        for (const costPrice of costPrices) {
            const { price, applicableDate, userId } = costPrice;
            const formattedDate = moment(applicableDate).format('YYYY-MM-DD');
            await connection.query(`
                INSERT INTO product_cost_price (productId, costPrice, applicableDate, org_id)
                VALUES (?, ?, ?, ?)
            `, [productId, price, formattedDate, org_id]);
        }

        return productId;
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

router.post('/save-cost-prices', async (req, res) => {
    try {
        const productId = await createProductCostPrice(req.body);
        res.status(201).json({ success: true, productId });
    } catch (error) {
        console.error('Error creating ProductCostPrice:', error);
        res.status(500).json({ success: false, message: 'Error creating ProductCostPrice' });
    }
});


// Function to create product Selling prices
async function createProductSellingPrice(reqBody) {
    const { companyName, productId, sellingPrices, userName } = reqBody;

    // Construct database name based on company name
    const dbNamePrefix = "ERP_";
    const dbName = dbNamePrefix + companyName.toLowerCase().replace(/\s+/g, '_');
    let connection;

    try {
        // Create a connection to the database
        connection = await mysql.createConnection({ ...dbConfig, database: dbName });

        // Create the product_selling_price table if it does not exist
        await connection.query(`
            CREATE TABLE IF NOT EXISTS product_selling_price (
                id INT AUTO_INCREMENT PRIMARY KEY,
                productId INT,
                sellingPrices DECIMAL(15, 2),
                applicableDate DATE,
                userName VARCHAR(255),
                org_id Int
            )
        `);

        const [orgResult] = await connection.query(`
            SELECT id FROM organization WHERE name = ?
        `, [companyName]);

        const org_id = orgResult[0].id;

        // Insert selling price data
        for (const sellingPrice of sellingPrices) {
            const { price, applicableDate, userName } = sellingPrice;
            const formattedDate = moment(applicableDate).format('YYYY-MM-DD');
            await connection.query(`
                INSERT INTO product_selling_price (productId, sellingPrices, applicableDate, userName, org_id)
                VALUES (?, ?, ?, ?, ?)
            `, [productId, price, formattedDate, userName, org_id]);
        }

        return productId;
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
router.post('/save-selling-prices', async (req, res) => {
    try {
        const productId = await createProductSellingPrice(req.body);
        res.status(201).json({ success: true, productId });
    } catch (error) {
        console.error('Error creating ProductSellingPrice:', error);
        res.status(500).json({ success: false, message: 'Error creating ProductSellingPrice' });
    }
});


async function createProductDiscounts(reqBody) {
    const { companyName, productId, discounts } = reqBody;

    // Construct database name based on company name
    const dbNamePrefix = "ERP_";
    const dbName = dbNamePrefix + companyName.toLowerCase().replace(/\s+/g, '_');
    let connection;

    try {
        // Create a connection to the database
        connection = await mysql.createConnection({ ...dbConfig, database: dbName });

        // Create the product_selling_price table if it does not exist
        await connection.query(`
            CREATE TABLE IF NOT EXISTS productdiscounts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                productId INT,
                discount DECIMAL(15, 2),
                applicableDate DATE,
                userName VARCHAR(255),
                thresholdValue Int,
                org_id Int
            )
        `);

        const [orgResult] = await connection.query(`
            SELECT id FROM organization WHERE name = ?
        `, [companyName]);

        const org_id = orgResult[0].id;

        // Insert selling price data
        for (const productdiscount of discounts) {
            const { discount, applicableDate, userName, thresholdValue } = productdiscount;
            const formattedDate = moment(applicableDate).format('YYYY-MM-DD');
            await connection.query(`
                INSERT INTO productdiscounts (productId, discount, applicableDate, userName, thresholdValue, org_id)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [productId, discount, formattedDate, userName, thresholdValue, org_id]);
        }

        return productId;
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

router.post('/save-discounts', async (req, res) => {
    try {
        const productId = await createProductDiscounts(req.body);
        res.status(201).json({ success: true, productId });
    } catch (error) {
        console.error('Error creating ProductSellingPrice:', error);
        res.status(500).json({ success: false, message: 'Error creating ProductSellingPrice' });
    }
});

//view cost prices

async function getProductCostPrices(productId, companyName) {
    const dbNamePrefix = "ERP_";
    const dbName = dbNamePrefix + companyName.toLowerCase().replace(/\s+/g, '_');
    let connection;

    try {
        // Create a connection to the database
        connection = await mysql.createConnection({ ...dbConfig, database: dbName });

        // Query product cost prices
        const [viewResult] = await connection.query(`
            SELECT *, DATE_FORMAT(applicableDate, '%Y-%m-%d') as applicableDate FROM product_cost_price WHERE productId = ?
        `, [productId]);

        return viewResult; // Return the fetched product cost prices
    } catch (err) {
        console.error('Error fetching product cost prices:', err);
        throw err; // Throw the error to handle it in the calling function
    } finally {
        if (connection) {
            // Close the connection
            await connection.end();
        }
    }
}


router.get('/product-cost-prices', async (req, res) => {
    const { productId, companyName } = req.query; // Retrieve productId and companyName from query parameters

    if (!productId || !companyName) {
        return res.status(400).json({ success: false, message: 'productId and companyName parameters are required' });
    }

    try {
        const costPrices = await getProductCostPrices(productId, companyName);
        res.status(200).json({ success: true, costPrices });
    } catch (error) {
        console.error('Error fetching product cost prices:', error);
        res.status(500).json({ success: false, message: 'Error fetching product cost prices' });
    }
});


async function getProductSellingPrices(productId, companyName) {
    const dbNamePrefix = "ERP_";
    const dbName = dbNamePrefix + companyName.toLowerCase().replace(/\s+/g, '_');
    let connection;

    try {
        // Create a connection to the database
        connection = await mysql.createConnection({ ...dbConfig, database: dbName });

        // Query product cost prices
        const [viewResult] = await connection.query(`
            SELECT *, DATE_FORMAT(applicableDate, '%Y-%m-%d') as applicableDate FROM product_selling_price WHERE productId = ?
        `, [productId]);

        return viewResult; // Return the fetched product selling prices
    } catch (err) {
        console.error('Error fetching product selling prices:', err);
        throw err; // Throw the error to handle it in the calling function
    } finally {
        if (connection) {
            // Close the connection
            await connection.end();
        }
    }
}
router.get('/product-selling-prices', async (req, res) => {
    const { productId, companyName } = req.query; // Retrieve productId and companyName from query parameters

    if (!productId || !companyName) {
        return res.status(400).json({ success: false, message: 'productId and companyName parameters are required' });
    }

    try {
        const sellingPrices = await getProductSellingPrices(productId, companyName);
        res.status(200).json({ success: true, sellingPrices });
    } catch (error) {
        console.error('Error fetching product selling prices:', error);
        res.status(500).json({ success: false, message: 'Error fetching product selling prices' });
    }
});

async function getProductDiscount(productId, companyName) {
    const dbNamePrefix = "ERP_";
    const dbName = dbNamePrefix + companyName.toLowerCase().replace(/\s+/g, '_');
    let connection;

    try {
        // Create a connection to the database
        connection = await mysql.createConnection({ ...dbConfig, database: dbName });

        // Query product cost prices
        const [viewResult] = await connection.query(`
            SELECT *, DATE_FORMAT(applicableDate, '%Y-%m-%d') as applicableDate FROM productdiscounts WHERE productId = ?
        `, [productId]);

        return viewResult; // Return the fetched product discount
    } catch (err) {
        console.error('Error fetching product discount:', err);
        throw err; // Throw the error to handle it in the calling function
    } finally {
        if (connection) {
            // Close the connection
            await connection.end();
        }
    }
}
router.get('/product-discount', async (req, res) => {
    const { productId, companyName } = req.query; // Retrieve productId and companyName from query parameters

    if (!productId || !companyName) {
        return res.status(400).json({ success: false, message: 'productId and companyName parameters are required' });
    }

    try {
        const discount = await getProductDiscount(productId, companyName);
        res.status(200).json({ success: true, discount });
    } catch (error) {
        console.error('Error fetching product discount:', error);
        res.status(500).json({ success: false, message: 'Error fetching product discount' });
    }
});

router.post('/itemimport', upload.single('file'), async (req, res) => {
    const file = req.file;
    const { companyName } = req.query;
  
    if (!companyName) {
      return res.status(400).json({ error: 'Company name is required' });
    }
  
    if (!file) {
      return res.status(400).send('No file uploaded');
    }
  
    try {
      // Generate database name based on organization name
     /* const dbName = getDatabaseName(companyName);
  
      // Get a connection from the pool
      const connection = await pool.getConnection();
  
      // Switch to the selected database
      await connection.changeUser({ database: dbName });*/

      const dbNamePrefix = "ERP_";
      const dbName = dbNamePrefix + companyName.toLowerCase().replace(/\s+/g, '_');
      let connection;
      connection = await mysql.createConnection({ ...dbConfig, database: dbName });

      // Read and process the Excel file
      const workbook = xlsx.readFile(file.path, { cellDates: true });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(sheet, { raw: true });

   
      const importData = data.map(row => ({
        name: row['name'], 
        group_alias: row['group_alias'],
        category: row['category'],
        category_alias: row['category_alias'],
        partNo: row['partNo'],
        parentGroup: row['parentGroup'],
        units :  row['units'],
        alternateUnits: row['alternateUnits'],
        Conversion_units: row['Conversion_units'],
        Conversion: row['Conversion'],
        Denominator: row['Denominator'],
        Denominator_units: row['Denominator_units'],
        gstApplicable: row['gstApplicable'] === 'Yes' ? 1 : 0,
        openingBalance: row['openingBalance'],
        openingBalanceRate: row['openingBalanceRate'],
        openingBalanceValue: row['openingBalanceValue']
      }));

      function parseDate(dateInput) {
        let date;
    
        // Check if the input is in 'DD-MM-YYYY' format
        if (moment(dateInput, 'DD-MM-YYYY', true).isValid()) {
            date = moment(dateInput, 'DD-MM-YYYY');
        } else if (moment(dateInput).isValid()) {
            // Check if the input is in any valid date format
            date = moment(dateInput);
        } else {
            return null; // Return null or handle the case when the date is invalid
        }
    
        // Add one day to the date
        date.add(1, 'days');
    
        // Format the date to 'YYYY-MM-DD'
        return date.format('YYYY-MM-DD');
    }
      //gst details
      const importGSTData = data.map(row => ({
        name: row['name'], 
        partNo: row['partNo'],
        applicableDate: row['applicableDate'] ? parseDate(row['applicableDate']) : null,
        hsnSacDetails: row['hsnSacDetails'],
        hsn: row['hsn'],
        taxability : row['taxability'],
        gstRate: row['gstRate']

      }));


      const importGodownData = data.map(row => ({
        name: row['name'], 
        partNo: row['partNo'],
        Godownname: row['godown']
      }));

      //sku openingbalance details
      const importOPData = data.map(row => ({
        name: row['name'], 
        partNo: row['partNo'],
        godown: row['godown'],
        batch : row['batch'],
        quantity: row['quantity'],
        ratePer: row['ratePer'],
        amount: row['amount']

      }));

    //moment(applicableDate).format('YYYY-MM-DD');
      //console.log(importGSTData);
      const query = `INSERT IGNORE INTO stockitem (
                name,
                group_alias,
                category,
                category_alias,
                partNo,
                parentGroup,
                units,
                alternateUnits,
                Conversion_units,
                Conversion,
                Denominator,
                Denominator_units,
                gstApplicable,
                openingBalance,
                openingBalanceRate,
                openingBalanceValue
            ) VALUES ?
            ON DUPLICATE KEY UPDATE
                group_alias = VALUES(group_alias),
                category = VALUES(category),
                category_alias = VALUES(category_alias),
                parentGroup = VALUES(parentGroup),
                units = VALUES(units),
                alternateUnits = VALUES(alternateUnits),
                Conversion_units = VALUES(Conversion_units),
                Conversion = VALUES(Conversion),
                Denominator = VALUES(Denominator),
                Denominator_units = VALUES(Denominator_units),
                gstApplicable = VALUES(gstApplicable),
                openingBalance = VALUES(openingBalance),
                openingBalanceRate = VALUES(openingBalanceRate),
                openingBalanceValue = VALUES(openingBalanceValue)
        `;
      const values = importData.map(item => Object.values(item));
  

      // Group and prepare data for stockgroup_tbl table
      const groupData = importData.reduce((inv, item) => {
        if (!inv[item.parentGroup]) {
            inv[item.parentGroup] = [item.parentGroup, item.group_alias];
        }
        return inv;
    }, {});

     const groupQuery = `INSERT IGNORE INTO stockgroup_tbl (name, group_alias) VALUES ?
     ON DUPLICATE KEY UPDATE
     group_alias = VALUES(group_alias)`;
     const groupValues = Object.values(groupData);


      // Insert data into the database
      const [result] = await connection.query(query, [values]);
      await connection.query(groupQuery, [groupValues]);

       // Fetch the IDs of the inserted/updated rows
       const [rows] = await connection.query(`
        SELECT id, name, partNo FROM stockitem
        WHERE name IN (?) AND partNo IN (?)
    `, [importGSTData.map(item => item.name), importGSTData.map(item => item.partNo)]);

    // Map the item data to their respective IDs
    const idMap = new Map(rows.map(row => [`${row.name}-${row.partNo}`, row.id]));

    // Prepare data for sku_gst_details table
    const gstDetailsQuery = `
        INSERT IGNORE INTO sku_gst_details (
            stockItemId,
            applicableDate,
            hsnSacDetails,
            hsn,
            taxability,
            gstRate
        ) VALUES ?
         ON DUPLICATE KEY UPDATE
    applicableDate = VALUES(applicableDate),
    hsnSacDetails = VALUES(hsnSacDetails),
    hsn = VALUES(hsn),
    taxability = VALUES(taxability),
    gstRate = VALUES(gstRate);
    `;
    const gstDetailsValues = importGSTData.map(item => [
        idMap.get(`${item.name}-${item.partNo}`), // Use the mapping to get the stockItemId
        item.applicableDate,
        item.hsnSacDetails,
        item.hsn,
        item.taxability,
        item.gstRate
    ]);

    // Insert GST details
    await connection.query(gstDetailsQuery, [gstDetailsValues]);

    //Godown
    const godownData = importGodownData.reduce((inv, item) => {
        if (!inv[item.Godownname]) {
            inv[item.Godownname] = [item.Godownname];
        }
        return inv;
    }, {});

     const godownQuery = `INSERT IGNORE INTO godown_tbl (Godownname) VALUES ?
     ON DUPLICATE KEY UPDATE
     Godownname = VALUES(Godownname)`;
     const godownValues = Object.values(godownData);
     await connection.query(godownQuery, [godownValues]);



     //Import OP or Update OP

      // Fetch the IDs of the inserted/updated rows
      const [rowsOP] = await connection.query(`
        SELECT id, name, partNo FROM stockitem
        WHERE name IN (?) AND partNo IN (?)
    `, [importOPData.map(item => item.name), importOPData.map(item => item.partNo)]);

    // Map the item data to their respective IDs
    const idMapOP = new Map(rowsOP.map(row => [`${row.name}-${row.partNo}`, row.id]));

    // Prepare data for sku_opening_balance table
    const OPDetailsQuery = `
        INSERT IGNORE INTO sku_opening_balance (
            stockItemId,
            godown,
            quantity,
            batch,
            ratePer,
            amount
        ) VALUES ?
         ON DUPLICATE KEY UPDATE
    godown = VALUES(godown),
    quantity = VALUES(quantity),
    batch = VALUES(batch),
    ratePer = VALUES(ratePer),
    amount = VALUES(amount);
    `;
    const OPDetailsValues = importOPData.map(item => [
        idMapOP.get(`${item.name}-${item.partNo}`), // Use the mapping to get the stockItemId
        item.godown,
        item.quantity,
        item.batch,
        item.ratePer,
        item.amount
    ]);

    // Insert OP details
    await connection.query(OPDetailsQuery, [OPDetailsValues]);
  
      // Release the connection back to the pool
      await connection.end();
  
      res.status(200).send('Data imported successfully');
      
    } catch (error) {
      console.error('Error importing data:', error);
      res.status(500).json({ error: 'Error importing data' });
    }
  });


  


module.exports = router;
