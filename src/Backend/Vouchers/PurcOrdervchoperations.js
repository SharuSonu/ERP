const { router, connect } = require('../db/db'); // Adjust the path as necessary

// Function to create purchase order voucher
async function createPurcOrderVoucher(reqBody) {
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
            INSERT INTO purcorder_vouchers (voucherTypeName, voucherNumber, parentVoucherType, voucherDate, partyAccount, purchaseLedger, narration, totalAmount, approvalStatus, approverId, approvalDate, approvalComments)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [voucherTypeName, voucherNumber, "Purchase", voucherDate, partyAccount, purchaseLedger, narration, totalAmount, 'Pending Approval', 0, `2024-06-20 22:10:56`, '']);

        const voucherId = voucherResult.insertId;

        // Insert into purcorder_inventory table
        for (const item of inventory) {
            const [inventoryResult] = await connection.query(`
                INSERT INTO purcorder_inventory (voucherId, voucherDate, itemName, quantity, rate, discount, amount, trackingDate, order_no, tracking_no, orderDate)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [voucherId, voucherDate, item.itemName.value, item.quantity, item.rate, item.discount, item.amount,null,voucherNumber,'',voucherDate]);

            const inventoryId = inventoryResult.insertId;
             // Insert into purchorder_batchdetails table for each batch allocation
             for (const batch of item.batchAllocations) {
                await connection.query(`
                    INSERT INTO purchorder_batchdetails (voucherId, voucherDate, tracking_no, order_no, itemname, godown, batch, quantity, rate, discount, amount, invId, trackingDate, orderDate)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    voucherId, 
                    voucherDate, 
                    batch.trackingNo.value, 
                    voucherNumber, 
                    item.itemName.value, 
                    batch.godown.value || 'Main Location', 
                    batch.batch.value || '',  
                    batch.quantity, 
                    batch.rate, 
                    batch.discount, 
                    batch.amount,
                    inventoryId,
                    null,
                    null

                ]);
            }
        }

        // Insert into purchase_ledger_entries
        for (const entry of ledgerEntries) {
            await connection.query(`
                INSERT INTO purcorder_ledger_entries (voucherId, particulars, rate, amount)
                VALUES (?, ?, ?, ?)
            `, [voucherId, entry.particulars.label, entry.rate, entry.amount]);
        }

        await connection.commit();
        return voucherId;
    } catch (error) {
        await connection.rollback();
        console.error('Error creating purchase order voucher:', error);
        throw error;
    } finally {
        await connection.end();
    }
}

// Function to delete a purchase order voucher
async function deletePurcOrderVoucher(voucherId, cmp) {
    const connection = await connect(cmp);
    try {
        await connection.beginTransaction();

        // Delete from purchase_inventory table
        await connection.query(`
            DELETE FROM purcorder_inventory WHERE voucherId = ?
        `, [voucherId]);

        // Delete from purcorder_vouchers table
        await connection.query(`
            DELETE FROM purcorder_vouchers WHERE id = ?
        `, [voucherId]);

        // The trigger will automatically update the stock_summary table

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        console.error('Error deleting purchase order voucher:', error);
        throw error;
    } finally {
        await connection.end();
    }
}


// Endpoint to create a purchase order voucher
router.post('/create-purcorder-voucher', async (req, res) => {
    try {
        const voucherId = await createPurcOrderVoucher(req.body);
        res.status(201).json({ success: true, voucherId });
    } catch (error) {
        console.error('Error creating purchase order voucher:', error);
        res.status(500).json({ success: false, message: 'Error creating purchase order voucher' });
    }
});

// Endpoint to delete a purchaseOrder voucher
router.delete('/delete-purcorder-voucher/:voucherId', async (req, res) => {
    const { voucherId } = req.params;
    const { cmp } = req.body; // Assuming cmp is sent in the body
    try {
        await deletePurchaseVoucher(voucherId, cmp);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error deleting purchase order voucher:', error);
        res.status(500).json({ success: false, message: 'Error deleting purchase order voucher' });
    }
});


module.exports = router;
