const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const moment = require('moment');
const {dbConfig} = require('../dbConfig');

const router = express.Router();
router.use(bodyParser.json());

// Database configuration
/*const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'Admin@12345',
    // No database specified here
};*/


const getDatabaseName = (organizationName) => {
    const dbNamePrefix = "erp_";
    return dbNamePrefix + organizationName.toLowerCase().replace(/\s+/g, '_');
  };



  //Dashboard Sales
async function getDashboardSales(companyName) {
    const dbNamePrefix = "ERP_";
    const dbName = dbNamePrefix + companyName.toLowerCase().replace(/\s+/g, '_');
    let connection;

    try {
        // Create a connection to the database
        connection = await mysql.createConnection({ ...dbConfig, database: dbName });

        // Query product cost prices
        const [viewResult] = await connection.query(`
            SELECT sum(totalAmount) FROM sales_vouchers
        `, [companyName]);

        return viewResult; // Return the fetched 
    } catch (err) {
        console.error('Error fetching dashboardSales:', err);
        throw err; // Throw the error to handle it in the calling function
    } finally {
        if (connection) {
            // Close the connection
            await connection.end();
        }
    }
}


router.get('/dashboard-sales', async (req, res) => {
    const { companyName } = req.query; 

    if (!companyName) {
        return res.status(400).json({ success: false, message: 'companyName parameters are required' });
    }

    try {
        const dashboardSales = await getDashboardSales(companyName);

        if (dashboardSales.length > 0 && dashboardSales[0]['sum(totalAmount)'] !== undefined) {
            res.json({
                success: true,
                dashboardSales: parseFloat(dashboardSales[0]['sum(totalAmount)'].toFixed(2)),
            });
        } else {
            res.json({
                success: true,
                dashboardSales: 0,
            });
        }
    } catch (error) {
        console.error('Error fetching dashboardSales:', error);
        res.status(500).json({ success: false, message: 'Error fetching dashboardSales' });
    }
});


//Dashboard Purchase
async function getDashboardPurchase(companyName) {
    const dbNamePrefix = "ERP_";
    const dbName = dbNamePrefix + companyName.toLowerCase().replace(/\s+/g, '_');
    let connection;

    try {
        // Create a connection to the database
        connection = await mysql.createConnection({ ...dbConfig, database: dbName });

        // Query product cost prices
        const [viewResult] = await connection.query(`
            SELECT sum(totalAmount) FROM purchase_vouchers
        `, [companyName]);

        return viewResult; // Return the fetched 
    } catch (err) {
        console.error('Error fetching dashboardPurchase:', err);
        throw err; // Throw the error to handle it in the calling function
    } finally {
        if (connection) {
            // Close the connection
            await connection.end();
        }
    }
}

//Purchase
router.get('/dashboard-purchase', async (req, res) => {
    const { companyName } = req.query; 

    if (!companyName) {
        return res.status(400).json({ success: false, message: 'companyName parameters are required' });
    }

    try {
        const dashboardPurchase = await getDashboardPurchase(companyName);

        if (dashboardPurchase.length > 0 && dashboardPurchase[0]['sum(totalAmount)'] !== undefined) {
            res.json({
                success: true,
                dashboardPurchase: parseFloat(dashboardPurchase[0]['sum(totalAmount)'].toFixed(2)),
            });
        } else {
            res.json({
                success: true,
                dashboardPurchase: 0,
            });
        }
    } catch (error) {
        console.error('Error fetching dashboardPurchase:', error);
        res.status(500).json({ success: false, message: 'Error fetching dashboardPurchase' });
    }
});


//Sales Over Purchase
async function getDashboardChartData(companyName) {
    const dbNamePrefix = "ERP_";
    const dbName = dbNamePrefix + companyName.toLowerCase().replace(/\s+/g, '_');
    let connection;

    try {
        connection = await mysql.createConnection({ ...dbConfig, database: dbName });
        const [result] = await connection.query(`
            SELECT 
    DATE_FORMAT(COALESCE(sales.voucherDate, purchases.voucherDate), '%Y-%m-%d') AS date,
    COALESCE(sales.sales, 0) AS sales,
    COALESCE(purchases.purchases, 0) AS purchases
FROM 
    (SELECT 
        DATE_FORMAT(voucherDate, '%Y-%m-%d') AS voucherDate,
        SUM(totalAmount) AS sales
     FROM sales_vouchers
     GROUP BY DATE_FORMAT(voucherDate, '%Y-%m-%d')
    ) AS sales
LEFT JOIN
    (SELECT 
        DATE_FORMAT(voucherDate, '%Y-%m-%d') AS voucherDate,
        SUM(totalAmount) AS purchases
     FROM purchase_vouchers
     GROUP BY DATE_FORMAT(voucherDate, '%Y-%m-%d')
    ) AS purchases
ON sales.voucherDate = purchases.voucherDate

UNION ALL

SELECT 
    DATE_FORMAT(COALESCE(sales.voucherDate, purchases.voucherDate), '%Y-%m-%d') AS date,
    COALESCE(sales.sales, 0) AS sales,
    COALESCE(purchases.purchases, 0) AS purchases
FROM 
    (SELECT 
        DATE_FORMAT(voucherDate, '%Y-%m-%d') AS voucherDate,
        SUM(totalAmount) AS sales
     FROM sales_vouchers
     GROUP BY DATE_FORMAT(voucherDate, '%Y-%m-%d')
    ) AS sales
RIGHT JOIN
    (SELECT 
        DATE_FORMAT(voucherDate, '%Y-%m-%d') AS voucherDate,
        SUM(totalAmount) AS purchases
     FROM purchase_vouchers
     GROUP BY DATE_FORMAT(voucherDate, '%Y-%m-%d')
    ) AS purchases
ON sales.voucherDate = purchases.voucherDate
WHERE sales.voucherDate IS NULL

ORDER BY date;

        `);
        return result;
    } catch (err) {
        console.error('Error fetching dashboard chart data:', err);
        throw err;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

router.get('/dashboard-chart-data', async (req, res) => {
    const { companyName } = req.query;

    if (!companyName) {
        return res.status(400).json({ success: false, message: 'companyName parameter is required' });
    }

    try {
        const chartData = await getDashboardChartData(companyName);
        res.json({
            success: true,
            chartData: chartData.map(item => ({
                date: item.date,
                sales: item.sales || 0,
                purchases: item.purchases || 0
            })),
        });
    } catch (error) {
        console.error('Error fetching dashboard chart data:', error);
        res.status(500).json({ success: false, message: 'Error fetching dashboard chart data' });
    }
});


//pie chart
router.get('/dashboard-piechart-data', async (req, res) => {
    const { companyName } = req.query;

    if (!companyName) {
        return res.status(400).json({ success: false, message: 'companyName parameter is required' });
    }

    try {
        const sales = await getDashboardSales(companyName);
        const purchases = await getDashboardPurchase(companyName);

        // Format data for frontend
        const formattedPieChartData = [
            { name: 'Sales', value: parseFloat(sales[0]['sum(totalAmount)'].toFixed(2)) },
            { name: 'Purchases', value: parseFloat(purchases[0]['sum(totalAmount)'].toFixed(2)) }
        ];

        res.json({
            success: true,
            chartData: formattedPieChartData,
        });
    } catch (error) {
        console.error('Error fetching dashboard pie chart data:', error);
        res.status(500).json({ success: false, message: 'Error fetching dashboard pie chart data' });
    }
});



//Top Customers
async function getTopCustomers(companyName) {
    const dbNamePrefix = "ERP_";
    const dbName = dbNamePrefix + companyName.toLowerCase().replace(/\s+/g, '_');
    let connection;

    try {
        connection = await mysql.createConnection({ ...dbConfig, database: dbName });

        const [results] = await connection.query(`
            SELECT
                partyAccount as customerName, 
                SUM(totalAmount) AS totalAmount
            FROM
                sales_vouchers
            GROUP BY
                customerName
            ORDER BY
                totalAmount DESC
            LIMIT 10;
        `);

        return results;
    } catch (err) {
        console.error('Error fetching top customers:', err);
        throw err;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

router.get('/dashboard-top-customers', async (req, res) => {
    const { companyName } = req.query;

    if (!companyName) {
        return res.status(400).json({ success: false, message: 'companyName parameter is required' });
    }

    try {
        const topCustomers = await getTopCustomers(companyName);

        res.json({
            success: true,
            topCustomers: topCustomers.map(item => ({
                customerName: item.customerName,
                totalAmount: parseFloat(item.totalAmount.toFixed(2))
            })),
        });
    } catch (error) {
        console.error('Error fetching top customers:', error);
        res.status(500).json({ success: false, message: 'Error fetching top customers' });
    }
});

//Top Suppliers
async function getTopSuppliers(companyName) {
    const dbNamePrefix = "ERP_";
    const dbName = dbNamePrefix + companyName.toLowerCase().replace(/\s+/g, '_');
    let connection;

    try {
        connection = await mysql.createConnection({ ...dbConfig, database: dbName });

        const [results] = await connection.query(`
            SELECT
                partyAccount As supplierName, 
                SUM(totalAmount) AS totalAmount
            FROM
                purchase_vouchers
            GROUP BY
                supplierName
            ORDER BY
                totalAmount DESC
            LIMIT 10;
        `);

        return results;
    } catch (err) {
        console.error('Error fetching top suppliers:', err);
        throw err;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

router.get('/dashboard-top-suppliers', async (req, res) => {
    const { companyName } = req.query;

    if (!companyName) {
        return res.status(400).json({ success: false, message: 'companyName parameter is required' });
    }

    try {
        const topSuppliers = await getTopSuppliers(companyName);

        res.json({
            success: true,
            topSuppliers: topSuppliers.map(item => ({
                supplierName: item.supplierName,
                totalAmount: parseFloat(item.totalAmount.toFixed(2))
            })),
        });
    } catch (error) {
        console.error('Error fetching top suppliers:', error);
        res.status(500).json({ success: false, message: 'Error fetching top suppliers' });
    }
});


module.exports = router;