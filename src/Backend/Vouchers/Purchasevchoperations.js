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
            const [inventoryResult] = await connection.query(`
                INSERT INTO purchase_inventory (voucherId, voucherDate, itemName, quantity, rate, discount, amount, trackingDate, order_no, tracking_no, orderDate)
                VALUES (?, ?, ?, ?, ?, ?, ?,?,?,?,?)
            `, [voucherId, voucherDate, item.itemName.value, item.quantity, item.rate, item.discount, item.amount, voucherDate, item.orderNo, voucherNumber, null]);
           
             //console.log(item.batchAllocations);
             for (const batch of item.batchAllocations) {
                //console.log(batch.itemName);
                const inventoryId = inventoryResult.insertId;
                const godownval = batch.godown.value || 'Main Location';
                await connection.query(`
                    INSERT INTO purchase_batchdetails (voucherId, voucherDate, tracking_no, order_no, itemname, godown, batch, quantity, rate, discount, amount, invId, trackingDate, orderDate)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    voucherId, 
                    voucherDate, 
                    batch.trackingNo.value || '', 
                    batch.orderNo.value || '', 
                    item.itemName.value,
                    godownval || '', 
                    batch.batch.value || '',  
                    batch.quantity, 
                    batch.rate, 
                    batch.discount, 
                    batch.amount,
                    inventoryId,
                    voucherDate,
                    null
                ]);
            }       
        
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


// Function to fetch pending GRN numbers
async function fetchPendingGRN(cmp, partyAccount) {
    const connection = await connect(cmp);
    try {
        // Fetch pending GRN numbers
        const [rows] = await connection.query(`
            SELECT vouchernumber, DATE_FORMAT(voucherDate, '%Y-%m-%d') as voucherDate, partyAccount,totalAmount 
            FROM rcptnote_vouchers
            WHERE status = 'Pending' AND partyAccount = ?
        `, [partyAccount]);

        // Extract GRN numbers
        const pendingGRN = rows.map(row => ({
            vouchernumber: row.vouchernumber,
            voucherDate: row.voucherDate,
            partyAccount: row.partyAccount,
            totalAmount: row.totalAmount
        }));

        return pendingGRN;
    } catch (error) {
        console.error('Error fetching pending GRN:', error);
        throw error;
    } finally {
        await connection.end();
    }
}

// Endpoint to get pending GRN numbers
router.get('/pending-GRN', async (req, res) => {
    const { cmp, partyAccount } = req.query; // Assume 'cmp' is provided as a query parameter
    try {
        const pendingGRN = await fetchPendingGRN(cmp, partyAccount);
        res.status(200).json({ success: true, pendingGRN });
    } catch (error) {
        console.error('Error fetching pending GRN:', error);
        res.status(500).json({ success: false, message: 'Error fetching pending GRN' });
    }
});


async function fetchPendingALLGRNOrderDetails(cmp, partyAccount) {
    const connection = await connect(cmp);
    try {
        // Fetch all pending GRN details
        const [pendingGRN] = await connection.query(`
            SELECT vouchernumber, DATE_FORMAT(voucherDate, '%Y-%m-%d') as voucherDate, partyAccount, totalAmount 
            FROM rcptnote_vouchers 
            WHERE status = 'Pending' AND partyAccount = ?
        `, [partyAccount]);

        // Fetch related details for each GRN
        for (let grn of pendingGRN) {
            // Fetch Inventory Entries
            const [inventoryEntries] = await connection.query(`
                SELECT * FROM rcptnote_inventory WHERE voucherId = ?
            `, [grn.vouchernumber]);

            // Fetch Batch Details
            const [batchDetails] = await connection.query(`
                SELECT * FROM rcptnote_batchdetails WHERE voucherId = ?
            `, [grn.vouchernumber]);

            // Fetch Ledger Entries
            const [ledgerEntries] = await connection.query(`
                SELECT * FROM rcptnote_ledger_entries WHERE voucherId = ?
            `, [grn.vouchernumber]);

            // Add these details to the pendingGRN object
            grn.inventoryEntries = inventoryEntries;
            grn.batchDetails = batchDetails;
            grn.ledgerEntries = ledgerEntries;
        }

        return pendingGRN;
    } catch (error) {
        console.error('Error fetching pending GRN:', error);
        throw error;
    } finally {
        await connection.end();
    }
}

router.get('/fetch-all-pending-grn-order', async (req, res) => {
    const { cmp, partyAccount } = req.query;
    try {
        const pendingGRN = await fetchPendingALLGRNOrderDetails(cmp, partyAccount);
        res.status(200).json({ success: true, pendingGRN });
    } catch (error) {
        console.error('Error fetching pending GRN details:', error);
        res.status(500).json({ success: false, message: 'Error fetching pending GRN details' });
    }
});


router.get('/fetch-po-details-by-tracking-no', async (req, res) => {
    const { cmp, partyAccount, trackingNo } = req.query;
    try {
        const poDetails = await fetchPODetailsByTrackingNo(cmp, partyAccount, trackingNo); // Implement this function to fetch PO details based on trackingNo
        res.status(200).json({ success: true, poDetails });
    } catch (error) {
        console.error('Error fetching PO details:', error);
        res.status(500).json({ success: false, message: 'Error fetching PO details' });
    }
});

// Example of fetchPODetailsByTrackingNo function
async function fetchPODetailsByTrackingNo(cmp, partyAccount, trackingNo) {
    const connection = await connect(cmp);
try {
    // Fetch all pending GRN details based on partyAccount
    const [pendingGRN] = await connection.query(`
        SELECT vouchernumber, DATE_FORMAT(voucherDate, '%Y-%m-%d') as voucherDate, partyAccount, totalAmount 
        FROM rcptnote_vouchers 
        WHERE status = 'Pending' AND partyAccount = ?
    `, [partyAccount]);

    // Iterate over each GRN to fetch related details
    for (let grn of pendingGRN) {

        // Fetch Batch Details based on trackingNo and voucherId
        const [batchDetails] = await connection.query(`
            SELECT tracking_no, order_no, DATE_FORMAT(voucherDate, '%Y-%m-%d') as voucherDate 
            FROM rcptnote_batchdetails 
            WHERE tracking_no = ? GROUP BY 
        tracking_no, order_no, voucherDate
        `, [grn.vouchernumber]);

        // Add these details to the pendingGRN object
        //grn.inventoryEntries = inventoryEntries;
        grn.batchDetails = batchDetails;
        //grn.ledgerEntries = ledgerEntries;
    }

    return pendingGRN;
} catch (error) {
    console.error('Error fetching pending GRN details:', error);
    throw error;
} finally {
    await connection.end();
}
}


async function fetchPendingALLPOPurcDetails(cmp, partyAccount, orderNumbers) {
    const connection = await connect(cmp);
    try {
        // Build the query dynamically based on whether orderNumbers are provided
        let query = `
            SELECT id, vouchernumber, DATE_FORMAT(voucherDate, '%Y-%m-%d') as voucherDate, partyAccount, totalAmount 
            FROM purcorder_vouchers 
            WHERE status = 'Pending' AND partyAccount = ?
        `;
        
        // If orderNumbers are provided, add them to the query
        if (orderNumbers && orderNumbers.length > 0) {
            const placeholders = orderNumbers.map(() => '?').join(',');
            query += ` AND vouchernumber IN (${placeholders})`;
        }

        const params = [partyAccount, ...orderNumbers];
        const [pendingPOs] = await connection.query(query, params);

        // Fetch related details for each PO
        for (let po of pendingPOs) {
            // Fetch Inventory Entries
            const [inventoryEntries] = await connection.query(`
                SELECT * FROM purcorder_inventory WHERE voucherId = ?
            `, [po.id]);

            // Fetch Batch Details
            const [batchDetails] = await connection.query(`
                SELECT * FROM purchorder_batchdetails WHERE voucherId = ?
            `, [po.id]);

            // Process each inventory entry
            for (let inventoryEntry of inventoryEntries) {
                // Fetch total received quantity for the current item
                console.log(`Fetching received quantity for item: ${inventoryEntry.itemName}`);
                const [purchaseEntries] = await connection.query(`
                    SELECT SUM(quantity) as totalReceived 
                    FROM purchase_inventory 
                    WHERE order_no = ? AND itemName = ?
                `, [po.vouchernumber, inventoryEntry.itemName]);

                const totalReceived = purchaseEntries[0]?.totalReceived || 0;
                console.log(`PO Number: ${po.vouchernumber}`, `Item: ${inventoryEntry.itemName}, Total Received: ${totalReceived}`);

                inventoryEntry.initialQuantity = inventoryEntry.quantity; // Store the initial quantity
                inventoryEntry.pendingQuantity = Math.max(0, inventoryEntry.quantity - totalReceived); // Update to pending quantity
                inventoryEntry.quantity = inventoryEntry.pendingQuantity; // Override quantity to pending quantity

                console.log(`Updated Inventory Entry - Item: ${inventoryEntry.itemName}, Pending Quantity: ${inventoryEntry.pendingQuantity}`);

                // Fetch and update batch details if there is pending quantity
                if (inventoryEntry.pendingQuantity > 0) {
                    const relatedBatchDetails = batchDetails.filter(batch => batch.invId === inventoryEntry.id);
                    
                    // Adjust batch details quantities based on pending quantity
                    let totalBatchPending = inventoryEntry.pendingQuantity;
                    for (let batchDetail of relatedBatchDetails) {
                        batchDetail.initialQuantity = batchDetail.quantity; // Store the initial quantity
                        const batchPendingQuantity = Math.min(batchDetail.quantity, totalBatchPending);
                        batchDetail.pendingQuantity = batchPendingQuantity;
                        batchDetail.quantity = batchPendingQuantity; // Override quantity to pending quantity
                        totalBatchPending -= batchPendingQuantity;
                        if (totalBatchPending <= 0) break; // Exit loop when all pending quantity is fulfilled
                    }

                    console.log(`Batch Details for Item: ${inventoryEntry.itemName}`);
                    relatedBatchDetails.forEach(batchDetail => {
                        console.log(`Batch ID: ${batchDetail.id}, Pending Quantity: ${batchDetail.pendingQuantity}`);
                    });

                    inventoryEntry.batchDetails = relatedBatchDetails;
                } else {
                    inventoryEntry.batchDetails = [];
                }
            }

            // Remove inventory entries with zero pending quantity
            po.inventoryEntries = inventoryEntries.filter(entry => entry.pendingQuantity > 0);

            // Fetch Ledger Entries
            const [ledgerEntries] = await connection.query(`
                SELECT * FROM purcorder_ledger_entries WHERE voucherId = ?
            `, [po.id]);

            // Add these details to the pendingPOs object
            po.ledgerEntries = ledgerEntries;
        }

        // Return the pendingPOs array directly
        return pendingPOs;
        
    } catch (error) {
        console.error('Error fetching pending POs:', error);
        throw error;
    } finally {
        await connection.end();
    }
}



router.get('/fetch-all-pending-popurc-details', async (req, res) => {
    const { cmp, partyAccount, orderNumbers } = req.query;

      // Convert orderNumbers from comma-separated string to an array
      const orderNumberArray = orderNumbers ? orderNumbers.split(',') : [];

    try {
        const pendingPOs = await fetchPendingALLPOPurcDetails(cmp, partyAccount, orderNumberArray);
        res.status(200).json({ success: true, pendingPOs });
    } catch (error) {
        console.error('Error fetching pending PO details:', error);
        res.status(500).json({ success: false, message: 'Error fetching pending Purchase Orders details' });
    }
});



async function fetchPendingALLGRNPurcDetails(cmp, partyAccount, TrackingNumbers) {
    const connection = await connect(cmp);
    try {
        // Build the query dynamically based on whether orderNumbers are provided
        let query = `
            SELECT id, vouchernumber, DATE_FORMAT(voucherDate, '%Y-%m-%d') as voucherDate, partyAccount, totalAmount 
            FROM rcptnote_vouchers 
            WHERE status = 'Pending' AND partyAccount = ?
        `;
        
        // If TrackingNumbers are provided, add them to the query
        if (TrackingNumbers && TrackingNumbers.length > 0) {
            const placeholders = TrackingNumbers.map(() => '?').join(',');
            query += ` AND vouchernumber IN (${placeholders})`;
        }

        const params = [partyAccount, ...TrackingNumbers];
        const [pendingGRN] = await connection.query(query, params);

        // Fetch related details for each GRN
        for (let grn of pendingGRN) {
            // Fetch Inventory Entries
            const [inventoryEntries] = await connection.query(`
                SELECT * FROM rcptnote_inventory WHERE voucherId = ?
            `, [grn.id]);

            // Fetch Batch Details
            const [batchDetails] = await connection.query(`
                SELECT * FROM rcptnote_batchdetails WHERE voucherId = ?
            `, [grn.id]);

            //console.log(batchDetails);

            // Process each inventory entry
            for (let inventoryEntry of inventoryEntries) {
                // Fetch total received quantity for the current item
                //console.log(`Fetching received quantity for item: ${inventoryEntry.itemName}`);
                const [purchaseEntries] = await connection.query(`
                    SELECT SUM(quantity) as totalReceived 
                    FROM purchase_inventory 
                    WHERE order_no = ? AND itemName = ?
                `, [grn.vouchernumber, inventoryEntry.itemName]);

                const totalReceived = purchaseEntries[0]?.totalReceived || 0;
                //console.log(`GRN Number: ${grn.vouchernumber}`, `Item: ${inventoryEntry.itemName}, Total Received: ${totalReceived}`);

                inventoryEntry.initialQuantity = inventoryEntry.quantity; // Store the initial quantity
                inventoryEntry.pendingQuantity = Math.max(0, inventoryEntry.quantity - totalReceived); // Update to pending quantity
                inventoryEntry.quantity = inventoryEntry.pendingQuantity; // Override quantity to pending quantity

                console.log(`Updated Inventory Entry - Item: ${inventoryEntry.itemName}, Pending Quantity: ${inventoryEntry.pendingQuantity}`);

                // Fetch and update batch details if there is pending quantity
                if (inventoryEntry.pendingQuantity > 0) {
                    //console.log(batchDetails);
                    const relatedBatchDetails = batchDetails.filter(batch => batch.invId === String(inventoryEntry.id));
                   // console.log(relatedBatchDetails);
                    // Adjust batch details quantities based on pending quantity
                    let totalBatchPending = inventoryEntry.pendingQuantity;
                    for (let batchDetail of relatedBatchDetails) {
                        batchDetail.initialQuantity = batchDetail.quantity; // Store the initial quantity
                        const batchPendingQuantity = Math.min(batchDetail.quantity, totalBatchPending);
                        batchDetail.pendingQuantity = batchPendingQuantity;
                        batchDetail.quantity = batchPendingQuantity; // Override quantity to pending quantity
                        totalBatchPending -= batchPendingQuantity;
                        if (totalBatchPending <= 0) break; // Exit loop when all pending quantity is fulfilled
                    }

                    //console.log(batchDetail);
                    //console.log(`Batch Details for Item: ${inventoryEntry.itemName}`);
                    relatedBatchDetails.forEach(batchDetail => {
                        console.log(`Batch ID: ${batchDetail.id}, Pending Quantity: ${batchDetail.pendingQuantity}`);
                    });

                    inventoryEntry.batchDetails = relatedBatchDetails;
                } else {
                    inventoryEntry.batchDetails = [];
                }
            }

            // Remove inventory entries with zero pending quantity
            grn.inventoryEntries = inventoryEntries.filter(entry => entry.pendingQuantity > 0);

            // Fetch Ledger Entries
            const [ledgerEntries] = await connection.query(`
                SELECT * FROM rcptnote_ledger_entries WHERE voucherId = ?
            `, [grn.id]);

            // Add these details to the pendingGRN object
            grn.ledgerEntries = ledgerEntries;
        }

        // Return the pendingGRN array directly
        //console.log(pendingGRN);
        return pendingGRN;
        
    } catch (error) {
        console.error('Error fetching pending GRN:', error);
        throw error;
    } finally {
        await connection.end();
    }
}

//track GRN In Purchase
router.get('/fetch-all-pending-grnpurc-details', async (req, res) => {
    const { cmp, partyAccount, TrackingNumbers } = req.query;

      // Convert TrackingNumbers from comma-separated string to an array
      const TrackingNumberArray = TrackingNumbers ? TrackingNumbers.split(',') : [];

    try {
        const pendingGRN = await fetchPendingALLGRNPurcDetails(cmp, partyAccount, TrackingNumberArray);
        res.status(200).json({ success: true, pendingGRN });
    } catch (error) {
        console.error('Error fetching pending GRN details:', error);
        res.status(500).json({ success: false, message: 'Error fetching pending GRN details' });
    }
});


const checkQuantityMatching = async (cmp, partyAccount, orderNumbers) => {
    const connection = await connect(cmp); // Pass the company parameter for database connection

    try {
        // Ensure orderNumbers is an array
        const orderNumbersArray = Array.isArray(orderNumbers) ? orderNumbers : orderNumbers.split(',').map(num => num.trim());

        // Fetch total quantities from purchase orders
        const [poQuantities] = await connection.query(`
            SELECT pi.order_no, SUM(pi.quantity) as totalPOQuantity
            FROM purcorder_inventory pi
            JOIN purcorder_vouchers pv ON pi.voucherId = pv.id
            WHERE pi.order_no IN (?)
              AND pv.partyAccount = ?
            GROUP BY pi.order_no
        `, [orderNumbersArray, partyAccount]);

        // Log purchase order quantities
        console.log('Purchase Order Quantities:', poQuantities);

        // Fetch total quantities from received items
        const [receivedQuantities] = await connection.query(`
            SELECT pi.order_no, SUM(pi.quantity) as totalReceivedQuantity
            FROM purchase_inventory pi
            JOIN purcorder_vouchers pv ON pi.voucherId = pv.id
            WHERE pi.order_no IN (?)
              AND pv.partyAccount = ?
            GROUP BY pi.order_no
        `, [orderNumbersArray, partyAccount]);

        // Log received quantities
        console.log('Received Quantities:', receivedQuantities);

        // Check if all quantities match
        const isMatching = poQuantities.every(po => {
            const received = receivedQuantities.find(r => r.order_no === po.order_no);
            return received && po.totalPOQuantity === received.totalReceivedQuantity;
        });

        // Log final matching status
        console.log('Quantities Match:', isMatching);

        return isMatching;
    } catch (error) {
        console.error('Error checking quantity matching:', error);
        throw error;
    } finally {
        await connection.end();
    }
};


router.get('/check-PO_Purcquantity', async (req, res) => {
    const { cmp, partyAccount, orderNumbers } = req.query;

    if (!cmp || !partyAccount || !orderNumbers) {
        return res.status(400).json({ error: 'Missing required query parameters' });
    }

    try {
        // Check if orderNumbers is an array or a string
        let orderNumbersArray;
        if (Array.isArray(orderNumbers)) {
            orderNumbersArray = orderNumbers.map(num => num.trim());
        } else if (typeof orderNumbers === 'string') {
            orderNumbersArray = orderNumbers.split(',').map(num => num.trim());
        } else {
            return res.status(400).json({ error: 'Invalid orderNumbers format' });
        }

        // Call the function to check quantity matching
        const isMatching = await checkQuantityMatching(cmp, partyAccount, orderNumbersArray);

        // Send response based on result
        if (isMatching) {
            res.json({ success: true, message: 'Quantities match' });
        } else {
            res.json({ success: false, message: 'Quantities do not match' });
        }
    } catch (error) {
        console.error('Error checking quantity:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


//update PO status when Purchase is tracked
router.get('/update-postatus', async (req, res) => {
    const { cmp, partyAccount, orderNumbers, status } = req.query;

    // Validate required query parameters
    if (!cmp || !partyAccount || !orderNumbers || !status) {
        return res.status(400).json({ error: 'Missing required query parameters: cmp, partyAccount, orderNumbers, and status' });
    }

    try {
        // Establish a database connection based on cmp
        const connection = await connect(cmp);

        // Ensure orderNumbers is an array of trimmed strings
        const orderNumbersArray = Array.isArray(orderNumbers) 
            ? orderNumbers.map(num => num.trim()) 
            : orderNumbers.split(',').map(num => num.trim());

        // Validate the status value against the allowed enums
        const allowedStatuses = ['Pending', 'Completed'];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status value' });
        }

        // Update the status for all matching records
        const query = `
            UPDATE \`purcorder_vouchers\` 
            SET \`status\` = ? 
            WHERE \`partyAccount\` = ? AND \`vouchernumber\` IN (${orderNumbersArray.map(() => '?').join(',')})
        `;
        const params = [status, partyAccount, ...orderNumbersArray];
        const [result] = await connection.execute(query, params);

        // Check if any rows were affected (i.e., if the update was successful)
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'No matching records found for the specified parameters' });
        }

        // Send success response
        res.json({ success: true, message: 'Status updated successfully' });
    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


module.exports = router;
