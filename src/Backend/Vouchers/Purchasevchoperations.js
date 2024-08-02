const { router, connect } = require('../db/db'); // Adjust the path as necessary

// Function to create purchase voucher
async function createPurchaseVoucher(reqBody) {
    const {
        voucherTypeName,
        voucherNumber,
        voucherDate,
        partyAccount,
        purchaseLedger,
        narration,
        totalAmount,
        inventory,
        ledgerEntries,
        billWiseDetails,
        orderDetails, 
        cmp
    } = reqBody;

    const connection = await connect(cmp);
    try {
        await connection.beginTransaction();

        const [voucherResult] = await connection.query(`
            INSERT INTO purchase_vouchers (voucherTypeName, voucherNumber, parentVoucherType, voucherDate, partyAccount, purchaseLedger, narration, totalAmount, approvalStatus, approverId, approvalDate, approvalComments)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [voucherTypeName, voucherNumber, "Purchase", voucherDate, partyAccount, purchaseLedger, narration, totalAmount, 'Pending Approval', 0, `2024-06-20 22:10:56`, '']);

        const voucherId = voucherResult.insertId;

        // Insert into purchase_inventory table
        for (const item of inventory) {
            await connection.query(`
                INSERT INTO purchase_inventory (voucherId, voucherDate, itemName, quantity, rate, discount, amount)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [voucherId, voucherDate, item.itemName.value, item.quantity, item.rate, item.discount, item.amount]);
        }

        // Insert into purchase_ledger_entries
        for (const entry of ledgerEntries) {
            await connection.query(`
                INSERT INTO purchase_ledger_entries (voucherId, particulars, rate, amount)
                VALUES (?, ?, ?, ?)
            `, [voucherId, entry.particulars.label, entry.rate, entry.amount]);
        }

        await connection.commit();
        return voucherId;
    } catch (error) {
        await connection.rollback();
        console.error('Error creating purchase voucher:', error);
        throw error;
    } finally {
        await connection.end();
    }
}

// Function to delete a purchase voucher
async function deletePurchaseVoucher(voucherId, cmp) {
    const connection = await connect(cmp);
    try {
        await connection.beginTransaction();

        // Delete from purchase_inventory table
        await connection.query(`
            DELETE FROM purchase_inventory WHERE voucherId = ?
        `, [voucherId]);

        // Delete from purchase_vouchers table
        await connection.query(`
            DELETE FROM purchase_vouchers WHERE id = ?
        `, [voucherId]);

        // The trigger will automatically update the stock_summary table

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        console.error('Error deleting purchase voucher:', error);
        throw error;
    } finally {
        await connection.end();
    }
}

// Function to create stock_summary table and triggers
async function setupDatabase(cmp) {
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

        // Create trigger after_purchase_inventory_insert
        await connection.query(`
            CREATE TRIGGER after_purchase_inventory_insert
            AFTER INSERT ON purchase_inventory
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
                    openingBalanceValue, inwardsQuantity, inwardsValue, 
                    closingBalanceQuantity, closingBalanceValue, FinBalQty
                )
                VALUES (
                    NEW.itemName, NEW.voucherDate, NEW.voucherDate, 
                    prevClosingBalanceQty, prevClosingBalanceAmt, 
                    NEW.quantity, NEW.amount, 
                    closingBalanceQty + NEW.quantity, closingBalanceAmt + NEW.amount, 
                    finBalQty + NEW.quantity
                )
                ON DUPLICATE KEY UPDATE
                    periodTo = NEW.voucherDate,
                    openingBalanceQuantity = prevClosingBalanceQty,
                    openingBalanceValue = prevClosingBalanceAmt,
                    inwardsQuantity = inwardsQuantity + NEW.quantity,
                    inwardsValue = inwardsValue + NEW.amount,
                    closingBalanceQuantity = closingBalanceQty + NEW.quantity,
                    closingBalanceValue = closingBalanceAmt + NEW.amount,
                    FinBalQty = FinBalQty + NEW.quantity;
            END
        `);

        // Create trigger after_purchase_inventory_delete
        await connection.query(`
            CREATE TRIGGER after_purchase_inventory_delete
            AFTER DELETE ON purchase_inventory
            FOR EACH ROW
            BEGIN
                DECLARE closingBalanceQty FLOAT DEFAULT 0;
                DECLARE closingBalanceAmt FLOAT DEFAULT 0;

                -- Fetch the current closing balances
                IF EXISTS (
                    SELECT 1 FROM stock_summary 
                    WHERE stockItemName = OLD.itemName
                ) THEN
                    SELECT 
                        IFNULL(closingBalanceQuantity, 0), IFNULL(closingBalanceValue, 0)
                    INTO 
                        closingBalanceQty, closingBalanceAmt
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
                    inwardsQuantity = GREATEST(inwardsQuantity - OLD.quantity, 0),
                    inwardsValue = GREATEST(inwardsValue - OLD.amount, 0),
                    closingBalanceQuantity = GREATEST(closingBalanceQty - OLD.quantity, 0),
                    closingBalanceValue = GREATEST(closingBalanceAmt - OLD.amount, 0)
                WHERE 
                    stockItemName = OLD.itemName;
            END
        `);

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        console.error('Error setting up database:', error);
        throw error;
    } finally {
        await connection.end();
    }
}

// Endpoint to create a purchase voucher
router.post('/create-purchase-voucher', async (req, res) => {
    try {
        const voucherId = await createPurchaseVoucher(req.body);
        res.status(201).json({ success: true, voucherId });
    } catch (error) {
        console.error('Error creating purchase voucher:', error);
        res.status(500).json({ success: false, message: 'Error creating purchase voucher' });
    }
});

// Endpoint to delete a purchase voucher
router.delete('/delete-purchase-voucher/:voucherId', async (req, res) => {
    const { voucherId } = req.params;
    const { cmp } = req.body; // Assuming cmp is sent in the body
    try {
        await deletePurchaseVoucher(voucherId, cmp);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error deleting purchase voucher:', error);
        res.status(500).json({ success: false, message: 'Error deleting purchase voucher' });
    }
});

// Endpoint to setup the database (create tables and triggers)
router.post('/setup-database', async (req, res) => {
    const { cmp } = req.body; // Assuming cmp is sent in the body
    try {
        await setupDatabase(cmp);
        res.status(201).json({ success: true });
    } catch (error) {
        console.error('Error setting up database:', error);
        res.status(500).json({ success: false, message: 'Error setting up database' });
    }
});

// Function to fetch stock summary data
async function fetchStockSummary({ companyName, periodFrom, periodTo, page, limit }) {
    const offset = (page - 1) * limit;
    const connection = await connect(companyName);
    try {
        const [rows] = await connection.query(`
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
            FROM stock_summary s
            WHERE periodFrom = (
                SELECT MAX(periodFrom) 
                FROM stock_summary 
                WHERE stockItemName = s.stockItemName 
                    AND periodFrom >= ? 
                    AND periodTo <= ?
            )
            LIMIT ? OFFSET ?
        `, [periodFrom, periodTo, parseInt(limit), parseInt(offset)]);

        const [totalRows] = await connection.query(`
            SELECT COUNT(DISTINCT stockItemName) as total 
            FROM stock_summary 
            WHERE periodFrom >= ? AND periodTo <= ?
        `, [periodFrom, periodTo]);

        return { data: rows, total: totalRows[0].total };
    } catch (error) {
        console.error('Error fetching stock summary:', error);
        throw error;
    } finally {
        await connection.end();
    }
}

// Endpoint to fetch stock summary
router.get('/stock-summary', async (req, res) => {
    const { companyName, periodFrom, periodTo, page, limit } = req.query;
    try {
        const stockSummaryData = await fetchStockSummary({
            companyName,
            periodFrom,
            periodTo,
            page,
            limit,
        });
        res.status(200).json(stockSummaryData);
    } catch (error) {
        console.error('Error fetching stock summary:', error);
        res.status(500).json({ success: false, message: 'Error fetching stock summary' });
    }
});

module.exports = router;
