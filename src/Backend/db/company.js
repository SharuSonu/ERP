const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const {dbConfig, pool} = require('../dbConfig');
const cors = require('cors');
router.use(cors());
router.use(bodyParser.json());
const multer = require('multer');
const CryptoJS = require('crypto-js');
const fs = require('fs');
const path = require('path');

// Endpoint to create database and tables
router.post('/create-db', async (req, res) => {
    // Destructure fields from req.body
    const {
        organizationName, organizationBranch, industry, country, state,
        currency, language, timezone, isGSTRegistered, gstin,
        email, phone, mobile, fax, website, logo, addresses,
        financialYear, booksFromDate
    } = req.body;

    // Database name setup
    const dbNamePrefix = "ERP_";
    const dbName = dbNamePrefix + organizationName.toLowerCase().replace(/\s+/g, '_');

    let connection;
    try {
        // Connect to the default existing database
        connection = await mysql.createConnection(dbConfig);

        // Create Database if it does not exist
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
        // Switch to the newly created database
        await connection.changeUser({ database: dbName });

        // Create Organization Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS organization (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                branch VARCHAR(255),
                industry VARCHAR(255),
                country VARCHAR(255),
                state VARCHAR(255),
                currency VARCHAR(255),
                language VARCHAR(255),
                timezone VARCHAR(255),
                isGSTRegistered BOOLEAN,
                gstin VARCHAR(255),
                email VARCHAR(255),
                phone VARCHAR(20),
                mobile VARCHAR(20),
                fax VARCHAR(20),
                website VARCHAR(255),
                logo VARCHAR(255),
                financialYear DATE NOT NULL,
                booksFromDate DATE NOT NULL
            )
        `);

        // Insert Organization Data
        const [orgResult] = await connection.query(`
            INSERT INTO organization (
                name, branch, industry, country, state, currency, language, timezone, isGSTRegistered, gstin,
                email, phone, mobile, fax, website, logo, financialYear, booksFromDate
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            organizationName, organizationBranch, industry, country, state,
            currency, language, timezone, isGSTRegistered, gstin,
            email, phone, mobile, fax, website, logo,
            financialYear, booksFromDate
        ]);

        const orgId = orgResult.insertId;

        // Create Address Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS address (
                id INT AUTO_INCREMENT PRIMARY KEY,
                org_id INT,
                streetAddress1 VARCHAR(255),
                streetAddress2 VARCHAR(255),
                streetAddress3 VARCHAR(255),
                streetAddress4 VARCHAR(255),
                streetAddress5 VARCHAR(255),
                city VARCHAR(255),
                zip VARCHAR(255),
                FOREIGN KEY (org_id) REFERENCES organization(id)
            )
        `);

        // Insert Address Data
        const addressValues = addresses.map(address => [
            orgId,
            address.streetAddress1 || null,
            address.streetAddress2 || null,
            address.streetAddress3 || null,
            address.streetAddress4 || null,
            address.streetAddress5 || null,
            address.city,
            address.zip
        ]);

        if (addressValues.length > 0) {
            await connection.query(`
                INSERT INTO address (org_id, streetAddress1, streetAddress2, streetAddress3, streetAddress4, streetAddress5, city, zip)
                VALUES ?
            `, [addressValues]);
        }

        // Create Admin Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS admin (
                id INT AUTO_INCREMENT PRIMARY KEY,
                org_id INT,
                username VARCHAR(50) NOT NULL,
                password VARCHAR(255) NOT NULL,
                FOREIGN KEY (org_id) REFERENCES organization(id)
            )
        `);

        //group
        await connection.query(`
            CREATE TABLE group_tbl (
            id int NOT NULL AUTO_INCREMENT,
            name varchar(255) NOT NULL,
            group_alias varchar(255) DEFAULT NULL,
            parentGroup varchar(255) DEFAULT NULL,
            PRIMARY KEY (id)
          )
         `);
         //ledger
         await connection.query(`
         CREATE TABLE ledger (
            id int NOT NULL AUTO_INCREMENT,
            ledgername varchar(255) NOT NULL,
            customerDisplayName varchar(255) DEFAULT NULL,
            GroupName varchar(255) DEFAULT NULL,
            salutation varchar(50) DEFAULT NULL,
            firstName varchar(255) DEFAULT NULL,
            lastName varchar(255) DEFAULT NULL,
            customerEmail varchar(255) DEFAULT NULL,
            customerPhone varchar(50) DEFAULT NULL,
            customerMobile varchar(50) DEFAULT NULL,
            pan varchar(50) DEFAULT NULL,
            GSTIN varchar(50) DEFAULT NULL,
            currency varchar(50) DEFAULT NULL,
            openingBalance float DEFAULT NULL,
            paymentTerms varchar(255) DEFAULT NULL,
            maintainBillByBill tinyint(1) DEFAULT NULL,
            creditLimitDaysOrDate varchar(50) DEFAULT NULL,
            creditLimitValue float DEFAULT NULL,
            provideBankDetails tinyint(1) DEFAULT NULL,
            PRIMARY KEY (id)
          )
           `); 
            //ledger address
         await connection.query(`
            CREATE TABLE ledger_address (
   id int NOT NULL AUTO_INCREMENT,
   ledgerId int NOT NULL,
   type enum('billing','shipping') DEFAULT NULL,
   addressLine1 varchar(255) DEFAULT NULL,
   addressLine2 varchar(255) DEFAULT NULL,
   city varchar(100) DEFAULT NULL,
   state varchar(100) DEFAULT NULL,
   postalCode varchar(20) DEFAULT NULL,
   country varchar(100) DEFAULT NULL,
   PRIMARY KEY (id),
   KEY ledgerId (ledgerId)
 )
            `);   

            await connection.query(`CREATE TABLE ledger_bank_details (
                id int NOT NULL AUTO_INCREMENT,
                ledgerId int NOT NULL,
                transactionType varchar(50) DEFAULT NULL,
                accountNumber varchar(50) DEFAULT NULL,
                bankName varchar(255) DEFAULT NULL,
                companyBank varchar(255) DEFAULT NULL,
                ifscCode varchar(50) DEFAULT NULL,
                PRIMARY KEY (id),
                KEY (ledgerId)
              )`
            );

            //ledgerbillwise
            await connection.query(`CREATE TABLE ledger_billwise (
                id int NOT NULL AUTO_INCREMENT,
                ledgerId int NOT NULL,
                date date DEFAULT NULL,
                name varchar(255) DEFAULT NULL,
                dueDate date DEFAULT NULL,
                amount float DEFAULT NULL,
                PRIMARY KEY (id),
                KEY (ledgerId)
              )`);

              //Stock Summary      
              await connection.query(`
                CREATE TABLE IF NOT EXISTS stock_summary (
                id INT NOT NULL AUTO_INCREMENT,
                stockItemName VARCHAR(255) NOT NULL,
                periodFrom DATE NOT NULL,
                periodTo DATE NOT NULL,
                openingBalanceQuantity FLOAT DEFAULT 0,
                openingBalanceRate FLOAT DEFAULT 0,
                openingBalanceValue FLOAT DEFAULT 0,
                inwardsQuantity FLOAT DEFAULT 0,
                inwardsRate FLOAT DEFAULT 0,
                inwardsValue FLOAT DEFAULT 0,
                outwardsQuantity FLOAT DEFAULT 0,
                outwardsRate FLOAT DEFAULT 0,
                outwardsValue FLOAT DEFAULT 0,
                closingBalanceQuantity FLOAT DEFAULT 0,
                closingBalanceRate FLOAT DEFAULT 0,
                closingBalanceValue FLOAT DEFAULT 0,
                FinBalQty FLOAT DEFAULT 0,
                PRIMARY KEY (id),
                UNIQUE KEY unique_stock_period (stockItemName, periodFrom, periodTo)
            )
            `);

            //salesman table
            await connection.query(`
                CREATE TABLE IF NOT EXISTS Salesman (
                id INT AUTO_INCREMENT PRIMARY KEY,
                SalesManName VARCHAR(225) NOT NULL ,
                SalesManNumber INT,
                SalesManEmailId varchar(225) NOT NULL
            )
        `);

        //godowm table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS Godown_tbl (
                id INT AUTO_INCREMENT PRIMARY KEY,
                Godownname VARCHAR(255) NOT NULL,
                Godownalias VARCHAR(255),
                Godowngroup VARCHAR(255)
            )
        `);
// stock category
        await connection.query(`CREATE TABLE IF NOT EXISTS stockCategory_tbl (
            id INT AUTO_INCREMENT PRIMARY KEY,
             Name varchar(255) NOT NULL,
             Namealias varchar(255) DEFAULT NULL,
             Namegroup varchar(255) DEFAULT NULL
           )`);

            //purchase voucher
            await connection.query(`CREATE TABLE purchase_vouchers (
                id int NOT NULL AUTO_INCREMENT,
                voucherTypeName varchar(255) NOT NULL,
                parentVoucherType varchar(255) DEFAULT NULL,
                voucherDate date DEFAULT NULL,
                partyAccount varchar(255) DEFAULT NULL,
                purchaseLedger varchar(255) DEFAULT NULL,
                narration text,
                totalAmount float NOT NULL,
                approvalStatus enum('All','Draft','Confirmed','Declined','Expired','Sent','Partially Invoiced','Accepted','Invoiced','Closed','Pending Approval','Approved','Partially Paid','Unpaid','Overdue','Payment Initiated','Paid','Rejected') DEFAULT 'Pending Approval',
                approverId int DEFAULT NULL,
                approvalDate datetime DEFAULT CURRENT_TIMESTAMP,
                approvalComments text,
                vouchernumber varchar(255) DEFAULT NULL,
                PRIMARY KEY (id)
              )`);
               
            //purchase Inventory
            await connection.query(`CREATE TABLE purchase_inventory (
                id int NOT NULL AUTO_INCREMENT,
                voucherId int DEFAULT NULL,
                voucherDate date DEFAULT NULL,
                itemName varchar(255) NOT NULL,
                quantity float NOT NULL,
                rate float NOT NULL,
                discount float DEFAULT '0',
                amount float NOT NULL,
                PRIMARY KEY (id),
                KEY (voucherId)
              )`);


               //purchase ledger entries
            await connection.query(`CREATE TABLE purchase_ledger_entries (
                id int NOT NULL AUTO_INCREMENT,
                voucherId int DEFAULT NULL,
                particulars varchar(255) NOT NULL,
                rate float NOT NULL,
                amount float NOT NULL,
                PRIMARY KEY (id),
                KEY (voucherId)
              )`);

            //sales billwise
            await connection.query(`CREATE TABLE sales_bill_wise_details (
                id int NOT NULL AUTO_INCREMENT,
                voucherId int DEFAULT NULL,
                typeOfRef varchar(255) NOT NULL,
                name varchar(255) NOT NULL,
                dueDate date DEFAULT NULL,
                amount float NOT NULL,
                PRIMARY KEY (id),
                KEY (voucherId)
              )`);

            //sales inventory
            await connection.query(`CREATE TABLE sales_inventory (
                id int NOT NULL AUTO_INCREMENT,
                voucherId int DEFAULT NULL,
                itemName varchar(255) NOT NULL,
                quantity int NOT NULL,
                rate float NOT NULL,
                discount float NOT NULL,
                amount float NOT NULL,
                PRIMARY KEY (id),
                KEY (voucherId)
              )`);
             

            //sales ledger entries
            await connection.query(`CREATE TABLE sales_ledger_entries (
                id int NOT NULL AUTO_INCREMENT,
                voucherId int DEFAULT NULL,
                particulars varchar(255) NOT NULL,
                rate float NOT NULL,
                amount float NOT NULL,
                PRIMARY KEY (id),
                KEY (voucherId)
              )`);

             //sales order details
             await connection.query(`CREATE TABLE sales_order_details (
                id int NOT NULL AUTO_INCREMENT,
                voucherId int DEFAULT NULL,
                orderId varchar(50) NOT NULL,
                orderDate date DEFAULT NULL,
                itemName varchar(255) NOT NULL,
                quantity int NOT NULL,
                rate float NOT NULL,
                discount float DEFAULT NULL,
                amount float NOT NULL,
                PRIMARY KEY (id),
                KEY (voucherId)
              )`);
              
             //sales voucher
             await connection.query(`CREATE TABLE sales_vouchers (
                id int NOT NULL AUTO_INCREMENT,
                voucherTypeName varchar(255) NOT NULL,
                parentVoucherType varchar(255) DEFAULT NULL,
                voucherDate date DEFAULT NULL,
                partyAccount varchar(255) DEFAULT NULL,
                salesLedger varchar(255) DEFAULT NULL,
                narration text,
                totalAmount float NOT NULL,
                approvalStatus enum('All','Draft','Confirmed','Declined','Expired','Sent','Partially Invoiced','Accepted','Invoiced','Closed','Pending Approval','Approved','Partially Paid','Unpaid','Overdue','Payment Initiated','Paid','Rejected') DEFAULT 'Pending Approval',
                approverId int DEFAULT NULL,
                approvalDate datetime DEFAULT CURRENT_TIMESTAMP,
                approvalComments text,
                vouchernumber varchar(255) DEFAULT NULL,
                PRIMARY KEY (id)
              )`);
                

              //sku_gst_details
              await connection.query(`CREATE TABLE sku_gst_details (
                id int NOT NULL AUTO_INCREMENT,
                stockItemId int DEFAULT NULL,
                applicableDate date DEFAULT NULL,
                hsnSacDetails varchar(255) DEFAULT NULL,
                hsn varchar(255) DEFAULT NULL,
                taxability varchar(255) DEFAULT NULL,
                gstRate decimal(5,2) DEFAULT NULL,
                PRIMARY KEY (id),
                KEY (stockItemId)
              )`);

              //sku_openingbalance
              await connection.query(`CREATE TABLE sku_opening_balance (
                id int NOT NULL AUTO_INCREMENT,
                stockItemId int DEFAULT NULL,
                quantity float DEFAULT NULL, 
                godown varchar(255) DEFAULT NULL,
                batch varchar(255) DEFAULT NULL,
                ratePer float DEFAULT NULL,
                amount float DEFAULT NULL,
                PRIMARY KEY (id),
                KEY (stockItemId)
              )`);
             
              //stockgroup
              await connection.query(`CREATE TABLE stockgroup_tbl (
                id int NOT NULL AUTO_INCREMENT,
                name varchar(255) NOT NULL,
                group_alias varchar(255) DEFAULT NULL,
                parentGroup varchar(255) DEFAULT NULL,
                PRIMARY KEY (id)
              )`);
               

              //stockitem
              await connection.query(`CREATE TABLE stockitem (
                id int NOT NULL AUTO_INCREMENT,
                name varchar(255) NOT NULL,
                group_alias varchar(255) DEFAULT NULL,
                category varchar(255) DEFAULT NULL,
                category_alias varchar(255) DEFAULT NULL,
                partNo varchar(255) DEFAULT NULL,
                parentGroup varchar(255) DEFAULT NULL,
                units varchar(50) DEFAULT NULL,
                alternateUnits varchar(50) DEFAULT NULL,
                Conversion_units varchar(50) DEFAULT NULL,
                Conversion float DEFAULT NULL,
                Denominator_units varchar(50) DEFAULT NULL,
                Denominator float DEFAULT NULL, 
                gstApplicable tinyint(1) DEFAULT NULL,
                openingBalance float DEFAULT NULL,
                openingBalanceRate float DEFAULT NULL,
                openingBalanceValue float DEFAULT NULL,
                PRIMARY KEY (id)
              )`);
             
             
              //tax_voucherapproval
              await connection.query(`CREATE TABLE tax_vch_details (
                id int NOT NULL AUTO_INCREMENT,
                taxname varchar(255) NOT NULL,
                taxrate float NOT NULL,
                taxvalue float NOT NULL,
                voucherid int NOT NULL,
                PRIMARY KEY (id)
              )`);
             
             await connection.query(`CREATE TABLE taxinfo (
                id int NOT NULL AUTO_INCREMENT,
                org_id INT,
                taxname varchar(255) NOT NULL,
                taxrate float NOT NULL,
                taxtype ENUM('SGST', 'CGST', 'IGST') DEFAULT 'SGST',
                PRIMARY KEY (id)
              )`);
             
             await connection.query(`CREATE TABLE voucher_approvals (
                approvalId int NOT NULL AUTO_INCREMENT,
                voucherId int NOT NULL,
                approverId int NOT NULL,
                approvalStatus enum('All','Draft','Confirmed','Declined','Expired','Sent','Partially Invoiced','Accepted','Invoiced','Closed','Pending Approval','Approved','Partially Paid','Unpaid','Overdue','Payment Initiated','Paid','Rejected') NOT NULL,
                approvalDate datetime DEFAULT CURRENT_TIMESTAMP,
                comments text,
                PRIMARY KEY (approvalId)
              )`);



              //PurcOrder 
               
            await connection.query(`CREATE TABLE purcorder_vouchers (
                id int NOT NULL AUTO_INCREMENT,
                voucherTypeName varchar(255) NOT NULL,
                parentVoucherType varchar(255) DEFAULT NULL,
                voucherDate date DEFAULT NULL,
                partyAccount varchar(255) DEFAULT NULL,
                purchaseLedger varchar(255) DEFAULT NULL,
                narration text,
                totalAmount float NOT NULL,
                approvalStatus enum('All','Draft','Confirmed','Declined','Expired','Sent','Partially Invoiced','Accepted','Invoiced','Closed','Pending Approval','Approved','Partially Paid','Unpaid','Overdue','Payment Initiated','Paid','Rejected') DEFAULT 'Pending Approval',
                approverId int DEFAULT NULL,
                approvalDate datetime DEFAULT CURRENT_TIMESTAMP,
                approvalComments text,
                vouchernumber varchar(255) DEFAULT NULL,
                PRIMARY KEY (id)
              )`);
               
            //purcOrder Inventory
            await connection.query(`CREATE TABLE purcorder_inventory (
                id int NOT NULL AUTO_INCREMENT,
                voucherId int DEFAULT NULL,
                voucherDate date DEFAULT NULL,
                itemName varchar(255) NOT NULL,
                quantity float NOT NULL,
                rate float NOT NULL,
                discount float DEFAULT '0',
                amount float NOT NULL,
                PRIMARY KEY (id),
                KEY (voucherId)
              )`);


               //purcorder ledger entries
            await connection.query(`CREATE TABLE purcorder_ledger_entries (
                id int NOT NULL AUTO_INCREMENT,
                voucherId int DEFAULT NULL,
                particulars varchar(255) NOT NULL,
                rate float NOT NULL,
                amount float NOT NULL,
                PRIMARY KEY (id),
                KEY (voucherId)
              )`);      


               
              
        // Hash the default admin password using bcryptjs
        const hashedPassword = await bcrypt.hash('12345', 10);

        // Insert Default Admin
        await connection.query(`
            INSERT INTO admin (org_id, username, password)
            VALUES (?, ?, ?)
        `, [orgId, 'admin', hashedPassword]);

        // Return success message
        res.json({ success: true, message: 'Database and tables created, data inserted successfully' });
    } catch (err) {
        console.error('Error:', err);
        // Return error message
        res.status(500).json({ success: false, message: 'An error occurred' });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});

router.get('/organization', async (req, res) => {
  //console.log("CompanyName : ", req.headers['company-name']);
  const companyName = req.headers['company-name'];

  if (!companyName) {
      return res.status(400).json({ success: false, message: 'Company name header is required' });
  }

  const dbName = "erp_" + companyName.toLowerCase().replace(/\s+/g, '_');
  let connection;

  try {
      // Connect to the database
      connection = await mysql.createConnection({
          ...dbConfig,
          database: dbName
      });

      // Fetch organization details
      const [orgDetails] = await connection.query(`SELECT * FROM organization LIMIT 1`);
      if (orgDetails.length === 0) {
          return res.status(404).json({ success: false, message: 'Organization not found' });
      }
      // Fetch addresses for the organization

      const orgId = typeof orgDetails[0].id === 'string' ? parseInt(orgDetails[0].id, 10) : orgDetails[0].id;
      const [addresses] = await connection.query(`SELECT * FROM address WHERE org_id = ?`, [orgId]);

      // Assign addresses to organization object
      const organization = orgDetails[0];
      organization.addresses = addresses;
      //console.log('Address:', addresses);

      res.json(organization);
  } catch (err) {
      console.error('Error fetching organization details:', err);
      res.status(500).json({ success: false, message: 'An error occurred' });
  } finally {
      if (connection) {
          await connection.end();
      }
  }
});

router.put('/organization/update', async (req, res) => {
  const companyName = req.headers['company-name'];

  if (!companyName) {
      return res.status(400).json({ success: false, message: 'Company name header is required' });
  }

  const dbName = "erp_" + companyName.toLowerCase().replace(/\s+/g, '_');
  let connection;

  try {
      // Connect to the database
      connection = await mysql.createConnection({
          ...dbConfig,
          database: dbName
      });

      const {
          name, branch, industry, country, state,
          currency, language, timezone, isGSTRegistered, gstin,
          email, phone, mobile, fax, website, logo, addresses,
          financialYear, booksFromDate
      } = req.body;

      // Fetch organization ID first
      const [orgIdRows] = await connection.query(`SELECT id FROM organization LIMIT 1`);
      if (orgIdRows.length === 0) {
          return res.status(404).json({ success: false, message: 'Organization not found' });
      }
      const orgId = orgIdRows[0].id;

      // Update Organization Table
      await connection.query(`
          UPDATE organization
          SET name = ?, branch = ?, industry = ?, country = ?, state = ?,
              currency = ?, language = ?, timezone = ?, isGSTRegistered = ?, gstin = ?,
              email = ?, phone = ?, mobile = ?, fax = ?, website = ?, logo = ?,
              financialYear = ?, booksFromDate = ?
          WHERE id = ?
      `, [
          name, branch, industry, country, state,
          currency, language, timezone, isGSTRegistered, gstin,
          email, phone, mobile, fax, website, logo,
          financialYear, booksFromDate,
          orgId
      ]);

      // Delete existing addresses for the organization
      await connection.query(`
          DELETE FROM address
          WHERE org_id = ?
      `, [orgId]);

      // Insert new addresses for the organization
      const addressValues = addresses.map(address => [
          orgId,
          address.streetAddress1 || null,
          address.streetAddress2 || null,
          address.streetAddress3 || null,
          address.streetAddress4 || null,
          address.streetAddress5 || null,
          address.city,
          address.zip
      ]);

      if (addressValues.length > 0) {
          await connection.query(`
              INSERT INTO address (org_id, streetAddress1, streetAddress2, streetAddress3, streetAddress4, streetAddress5, city, zip)
              VALUES ?
          `, [addressValues]);
      }

      res.json({ success: true, message: 'Organization details updated successfully' });
  } catch (err) {
      console.error('Error updating organization details:', err);
      res.status(500).json({ success: false, message: 'An error occurred' });
  } finally {
      if (connection) {
          await connection.end();
      }
  }
});

// Multer configuration for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      cb(null, './uploads'); // Destination folder for file uploads
  },
  filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
  },
});
const upload = multer({ storage });

// Handle encrypted file upload
router.post('/upload', upload.single('file'), async (req, res) => {
  const companyName = req.headers['company-name'];

    if (!companyName) {
        return res.status(400).json({ success: false, message: 'Company name header is required' });
    }

    const dbName = "erp_" + companyName.toLowerCase().replace(/\s+/g, '_');
    let connection;

    try {
        // Connect to the database with dynamic database name
        connection = await mysql.createConnection({
            ...dbConfig,
            database: dbName
        });

        if (!req.file) {
          return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      // Read file content
      const fileContent = fs.readFileSync(req.file.path);

      // Encrypt file content
      const encryptedContent = CryptoJS.AES.encrypt(fileContent.toString(), 'encryption_secret').toString();

      // Save encrypted content to MySQL database
      const sql = 'INSERT INTO encrypted_files (original_name, mime_type, encrypted_content) VALUES (?, ?, ?)';
      const [result] = await connection.query(sql, [req.file.originalname, req.file.mimetype, encryptedContent]);

      console.log('File saved to MySQL:', result);

      return res.status(200).json({ success: true, message: 'File uploaded and saved successfully' });




    } catch (error) {
        console.error('Error connecting to database:', error);
        return res.status(500).json({ success: false, message: 'Error connecting to database', error: error.message });

    } finally {
        // Close connection
        if (connection) {
            connection.end();
        }
    }
});

module.exports = router;