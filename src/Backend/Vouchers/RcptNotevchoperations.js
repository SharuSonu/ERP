const { router, connect } = require('../db/db');

// Function to create rcptnote order voucher
async function createRcptNoteVoucher(reqBody) {
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
            INSERT INTO rcptnote_vouchers (voucherTypeName, voucherNumber, parentVoucherType, voucherDate, partyAccount, purchaseLedger, narration, totalAmount, approvalStatus, approverId, approvalDate, approvalComments)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [voucherTypeName, voucherNumber, "ReceiptNote", voucherDate, partyAccount, purchaseLedger, narration, totalAmount, 'Pending Approval', 0, `2024-06-20 22:10:56`, '']);

        const voucherId = voucherResult.insertId;

        // Insert into rcptnote_inventory table
        for (const item of inventory) {
            //console.log(item.orderNo);
            
            const [inventoryResult] = await connection.query(`
                INSERT INTO rcptnote_inventory (voucherId, voucherDate, itemName, quantity, rate, discount, amount, trackingDate, order_no, tracking_no, orderDate)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [voucherId, voucherDate, item.itemName.value, item.quantity, item.rate, item.discount, item.amount, voucherDate, item.orderNo, voucherNumber, null]);
        
             // Insert into purchorder_batchdetails table for each batch allocation
             //console.log(item.batchAllocations);
             for (const batch of item.batchAllocations) {
                //console.log(batch.itemName);
                const inventoryId = inventoryResult.insertId;
                const godownval = batch.godown.value || 'Main Location';
                await connection.query(`
                    INSERT INTO rcptnote_batchdetails (voucherId, voucherDate, tracking_no, order_no, itemname, godown, batch, quantity, rate, discount, amount, invId, trackingDate, orderDate)
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

        // Insert into rcptnote_ledger_entries
        for (const entry of ledgerEntries) {
            await connection.query(`
                INSERT INTO rcptnote_ledger_entries (voucherId, particulars, rate, amount)
                VALUES (?, ?, ?, ?)
            `, [voucherId, entry.particulars.label, entry.rate, entry.amount]);
        }

        await connection.commit();
        return voucherId;
    } catch (error) {
        await connection.rollback();
        console.error('Error creating rcptnote voucher:', error);
        throw error;
    } finally {
        await connection.end();
    }
}

// Endpoint to create a rcptnote voucher
router.post('/create-rcptnote-voucher', async (req, res) => {
    try {
        const voucherId = await createRcptNoteVoucher(req.body);
        res.status(201).json({ success: true, voucherId });
    } catch (error) {
        console.error('Error creating rcptnote voucher:', error);
        res.status(500).json({ success: false, message: 'Error creating rcptnote voucher' });
    }
});


// Function to fetch pending PO numbers
async function fetchPendingPOs(cmp, partyAccount) {
    const connection = await connect(cmp);
    try {
        // Fetch pending PO numbers
        const [rows] = await connection.query(`
            SELECT vouchernumber, DATE_FORMAT(voucherDate, '%Y-%m-%d') as voucherDate, partyAccount,totalAmount 
            FROM purcorder_vouchers 
            WHERE status = 'Pending' AND partyAccount = ?
        `, [partyAccount]);

        // Extract PO numbers
        const pendingPOs = rows.map(row => ({
            vouchernumber: row.vouchernumber,
            voucherDate: row.voucherDate,
            partyAccount: row.partyAccount,
            totalAmount: row.totalAmount
        }));

        return pendingPOs;
    } catch (error) {
        console.error('Error fetching pending POs:', error);
        throw error;
    } finally {
        await connection.end();
    }
}

// Endpoint to get pending PO numbers
router.get('/pending-purchase-orders', async (req, res) => {
    const { cmp, partyAccount } = req.query; // Assume 'cmp' is provided as a query parameter
    try {
        const pendingPOs = await fetchPendingPOs(cmp, partyAccount);
        res.status(200).json({ success: true, pendingPOs });
    } catch (error) {
        console.error('Error fetching pending POs:', error);
        res.status(500).json({ success: false, message: 'Error fetching pending Purchase Orders' });
    }
});


/*
async function fetchPendingALLPODetails(cmp, partyAccount, orderNumbers) {
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

            // Map batchDetails to corresponding inventoryEntries
    for (let inventoryEntry of inventoryEntries) {

        const [rcptnoteEntries] = await connection.query(`
            SELECT SUM(quantity) as totalReceived 
            FROM rcptnote_inventory 
            WHERE voucherId = ? AND itemName = ?
        `, [po.id, inventoryEntry.itemName]);

        const totalReceived = rcptnoteEntries[0]?.totalReceived || 0;
        inventoryEntry.pendingQuantity = inventoryEntry.quantity - totalReceived;

        // If pending quantity is greater than 0, fetch batch details
        if (inventoryEntry.pendingQuantity > 0) {
            const [batchDetails] = await connection.query(`
                SELECT * FROM purchorder_batchdetails 
                WHERE voucherId = ? AND invId = ?
            `, [po.id, inventoryEntry.id]);

            inventoryEntry.batchDetails = batchDetails;
        } else {
            inventoryEntry.batchDetails = [];
        }

        // Filter batchDetails that match the current inventoryEntry's id (invId)
      //  inventoryEntry.batchDetails = batchDetails.filter(batch => batch.invId === inventoryEntry.id);
    }

            // Fetch Ledger Entries
            const [ledgerEntries] = await connection.query(`
                SELECT * FROM purcorder_ledger_entries WHERE voucherId = ?
            `, [po.id]);

            // Filter inventory entries to include only those with pending quantities
            po.inventoryEntries = inventoryEntries.filter(entry => entry.pendingQuantity > 0);
            po.ledgerEntries = ledgerEntries;

            // Add these details to the pendingPOs object
            po.inventoryEntries = inventoryEntries;
            //po.batchDetails = batchDetails;
            po.ledgerEntries = ledgerEntries;
        }

        return pendingPOs;
    } catch (error) {
        console.error('Error fetching pending POs:', error);
        throw error;
    } finally {
        await connection.end();
    }
}
*/

async function fetchPendingALLPODetails(cmp, partyAccount, orderNumbers) {
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
                const [rcptnoteEntries] = await connection.query(`
                    SELECT SUM(quantity) as totalReceived 
                    FROM rcptnote_inventory 
                    WHERE order_no = ? AND itemName = ?
                `, [po.vouchernumber, inventoryEntry.itemName]);

                const totalReceived = rcptnoteEntries[0]?.totalReceived || 0;
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



router.get('/fetch-all-pending-po-details', async (req, res) => {
    const { cmp, partyAccount, orderNumbers } = req.query;

      // Convert orderNumbers from comma-separated string to an array
      const orderNumberArray = orderNumbers ? orderNumbers.split(',') : [];

    try {
        const pendingPOs = await fetchPendingALLPODetails(cmp, partyAccount, orderNumberArray);
        res.status(200).json({ success: true, pendingPOs });
    } catch (error) {
        console.error('Error fetching pending PO details:', error);
        res.status(500).json({ success: false, message: 'Error fetching pending Purchase Orders details' });
    }
});

module.exports = router;