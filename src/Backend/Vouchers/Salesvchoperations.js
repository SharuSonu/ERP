const { router, connect } = require('../db/db'); // Replace with actual path to your db.js file

// Function to create a sales voucher
async function createSalesVoucher(reqBody) {
    const {
        voucherTypeName,
        voucherNumber,
        voucherDate,
        partyAccount,
        salesLedger,
        narration,
        totalAmount,
        inventory,
        ledgerEntries,
        billWiseDetails,
        orderDetails, 
        Payment_Type,
        cmp
    } = reqBody;

    const connection = await connect(cmp);
    try {
        await connection.beginTransaction();

        // Insert into sales_vouchers table
        //console.log('Values to insert:', [voucherTypeName, "Sales", voucherDate, partyAccount, salesLedger, narration, totalAmount]);

        // Assuming partyAccount and salesLedger should be inserted based on their 'value' property
        const partyAccountValue = partyAccount;
        //console.log(salesLedger);
        const salesLedgerValue = salesLedger;

        const [voucherResult] = await connection.query(`
            INSERT INTO sales_vouchers (voucherTypeName, vouchernumber, parentvouchertype, voucherDate, partyAccount, salesLedger, Payment_Type,narration, totalAmount, approvalStatus, approverId, approvalDate, approvalComments)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)
        `, [voucherTypeName, voucherNumber, "Sales", voucherDate, partyAccount, salesLedgerValue,  Payment_Type,narration, totalAmount,'Pending Approval', 0,`2024-06-20 22:10:56`,'']);

        const voucherId = voucherNumber;//voucherResult.insertId;

        // Insert into sales_inventory table
        for (const item of inventory) {
            await connection.query(`
                INSERT INTO sales_inventory (voucherId, voucherDate, itemName, quantity, rate, discount, amount)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [voucherId, voucherDate, item.itemName.value, item.quantity, item.rate, item.discount, item.amount]);
        }

        // Insert into sales_ledger_entries table
        for (const entry of ledgerEntries) {
            await connection.query(`
                INSERT INTO sales_ledger_entries (voucherId, particulars, rate, amount)
                VALUES (?, ?, ?, ?)
            `, [voucherId, entry.particulars.label, entry.rate, entry.amount]);
        }

        // Insert into sales_bill_wise_details table
    /*    for (const bill of billWiseDetails) {
            await connection.query(`
                INSERT INTO sales_bill_wise_details (voucherId, typeOfRef, name, dueDate, amount)
                VALUES (?, ?, ?, ?, ?)
            `, [voucherId, bill.typeOfRef.value, bill.name, bill.dueDate, bill.amount]);
        }*/

        // Insert into sales_order_details table
      /*  for (const orderItem of orderDetails.orderItems) {
            await connection.query(`
                INSERT INTO sales_order_details (voucherId, orderId, orderDate, itemName, quantity, rate, discount, amount)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [voucherId, orderDetails.orderId, orderDetails.orderDate, orderItem.itemName, orderItem.quantity, orderItem.rate, orderItem.discount, orderItem.amount]);
        }*/

        await connection.commit();
        return voucherId;
    } catch (error) {
        await connection.rollback();
        console.error('Error creating sales voucher:', error);
        throw error;
    } finally {
        await connection.end();
    }
}


// Function to delete a sales voucher
async function deleteSalesVoucher(voucherId, cmp) {
    const connection = await connect(cmp);
    try {
        await connection.beginTransaction();

        // Delete from sales_inventory table
        await connection.query(`
            DELETE FROM sales_inventory WHERE voucherId = ?
        `, [voucherId]);

        // Delete from sales_vouchers table
        await connection.query(`
            DELETE FROM sales_vouchers WHERE id = ?
        `, [voucherId]);

        // The trigger will automatically update the stock_summary table

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        console.error('Error deleting sales voucher:', error);
        throw error;
    } finally {
        await connection.end();
    }
}

// Function to create stock_summary table and triggers
async function setupSalesDatabase(cmp) {
    const connection = await connect(cmp);
    try {
        await connection.beginTransaction();

        // Create stock_summary table if not exists
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

        // Create trigger after_sales_inventory_insert
        await connection.query(`
            CREATE TRIGGER after_sales_inventory_insert
            AFTER INSERT ON sales_inventory
            FOR EACH ROW
            BEGIN
                DECLARE closingBalanceQty FLOAT DEFAULT 0;
                DECLARE closingBalanceAmt FLOAT DEFAULT 0;
                DECLARE finBalQty FLOAT DEFAULT 0;
                DECLARE prevClosingBalanceQty FLOAT DEFAULT 0;
                DECLARE prevClosingBalanceAmt FLOAT DEFAULT 0;
                DECLARE prevFinBalQty FLOAT DEFAULT 0;

                -- Fetch the current closing balances
                IF EXISTS (
                    SELECT 1 FROM stock_summary 
                    WHERE stockItemName = NEW.itemName
                ) THEN
                    SELECT 
                        IFNULL(closingBalanceQuantity, 0), IFNULL(closingBalanceValue, 0), IFNULL(FinBalQty, 0)
                    INTO 
                        closingBalanceQty, closingBalanceAmt, finBalQty
                    FROM 
                        stock_summary 
                    WHERE 
                        stockItemName = NEW.itemName
                    ORDER BY 
                        periodTo DESC
                    LIMIT 1;
                END IF;

                -- Fetch the previous closing balances
                IF EXISTS (
                    SELECT 1 FROM stock_summary 
                    WHERE stockItemName = NEW.itemName AND periodTo < NEW.voucherDate
                ) THEN
                    SELECT 
                        IFNULL(closingBalanceQuantity, 0), IFNULL(closingBalanceValue, 0), IFNULL(FinBalQty, 0)
                    INTO 
                        prevClosingBalanceQty, prevClosingBalanceAmt, prevFinBalQty
                    FROM 
                        stock_summary 
                    WHERE 
                        stockItemName = NEW.itemName
                        AND periodTo < NEW.voucherDate
                    ORDER BY 
                        periodTo DESC
                    LIMIT 1;
                END IF;

                -- Update stock_summary table or insert new record if it does not exist
                INSERT INTO stock_summary (
                    stockItemName, periodFrom, periodTo, openingBalanceQuantity, 
                    openingBalanceValue, outwardsQuantity, outwardsValue, 
                    closingBalanceQuantity, closingBalanceValue, FinBalQty
                )
                VALUES (
                    NEW.itemName, NEW.voucherDate, NEW.voucherDate, 
                    prevClosingBalanceQty, prevClosingBalanceAmt, 
                    NEW.quantity, NEW.amount, 
                    closingBalanceQty - NEW.quantity, closingBalanceAmt - NEW.amount, 
                    finBalQty - NEW.quantity
                )
                ON DUPLICATE KEY UPDATE
                    periodTo = NEW.voucherDate,
                    openingBalanceQuantity = prevClosingBalanceQty,
                    openingBalanceValue = prevClosingBalanceAmt,
                    outwardsQuantity = outwardsQuantity + NEW.quantity,
                    outwardsValue = outwardsValue + NEW.amount,
                    closingBalanceQuantity = closingBalanceQty - NEW.quantity,
                    closingBalanceValue = closingBalanceAmt - NEW.amount,
                    FinBalQty = FinBalQty - NEW.quantity;
            END
        `);

        // Create trigger after_sales_inventory_delete
        await connection.query(`
            CREATE TRIGGER after_sales_inventory_delete
            AFTER DELETE ON sales_inventory
            FOR EACH ROW
            BEGIN
                DECLARE closingBalanceQty FLOAT DEFAULT 0;
                DECLARE closingBalanceAmt FLOAT DEFAULT 0;
                DECLARE finBalQty FLOAT DEFAULT 0;

                -- Fetch the current closing balances
                IF EXISTS (
                    SELECT 1 FROM stock_summary 
                    WHERE stockItemName = OLD.itemName
                ) THEN
                    SELECT 
                        IFNULL(closingBalanceQuantity, 0), IFNULL(closingBalanceValue, 0), IFNULL(FinBalQty, 0)
                    INTO 
                        closingBalanceQty, closingBalanceAmt, finBalQty
                    FROM 
                        stock_summary 
                    WHERE 
                        stockItemName = OLD.itemName
                    ORDER BY 
                        periodTo DESC
                    LIMIT 1;
                END IF;

                -- Update stock_summary table
                UPDATE stock_summary 
                SET
                    outwardsQuantity = GREATEST(outwardsQuantity - OLD.quantity, 0),
                    outwardsValue = GREATEST(outwardsValue - OLD.amount, 0),
                    closingBalanceQuantity = GREATEST(closingBalanceQty + OLD.quantity, 0),
                    closingBalanceValue = GREATEST(closingBalanceAmt + OLD.amount, 0),
                    FinBalQty = GREATEST(finBalQty + OLD.quantity, 0)
                WHERE 
                    stockItemName = OLD.itemName;
            END
        `);

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        console.error('Error setting up sales database:', error);
        throw error;
    } finally {
        await connection.end();
    }
}


// Endpoint to create a sales voucher
router.post('/create-sales-voucher', async (req, res) => {
    try {
        const voucherId = await createSalesVoucher(req.body);
        res.status(201).json({ success: true, voucherId });
    } catch (error) {
        console.error('Error creating sales voucher:', error);
        res.status(500).json({ success: false, message: 'Error creating sales voucher' });
    }
});


// Endpoint to delete a sales voucher
router.delete('/delete-sales-voucher/:voucherId', async (req, res) => {
    const { voucherId } = req.params;
    const { cmp } = req.body; // Assuming cmp is sent in the body
    try {
        await deleteSalesVoucher(voucherId, cmp);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error deleting sales voucher:', error);
        res.status(500).json({ success: false, message: 'Error deleting sales voucher' });
    }
});

// Endpoint to setup the database (create tables and triggers)
router.post('/setup-salesdatabase', async (req, res) => {
    const { cmp } = req.body; // Assuming cmp is sent in the body
    try {
        await setupSalesDatabase(cmp);
        res.status(201).json({ success: true });
    } catch (error) {
        console.error('Error setting up database:', error);
        res.status(500).json({ success: false, message: 'Error setting up database' });
    }
});





module.exports = router;
