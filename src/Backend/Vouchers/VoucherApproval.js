/*CREATE TABLE voucher_approvals (
    approvalId INT AUTO_INCREMENT PRIMARY KEY,
    voucherId INT NOT NULL,
    approverId INT NOT NULL,
    approvalStatus ENUM('All','Draft','Confirmed','Declined','Expired','Sent','Partially Invoiced','Accepted','Invoiced','Closed','Pending Approval', 'Approved', 'Partially Paid','Unpaid','Overdue','Payment Initiated','Paid','Rejected') NOT NULL,
    approvalDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    comments TEXT,
   );

   Add if neccessary foreign key
    FOREIGN KEY (voucherId) REFERENCES sales_vouchers(id),
    FOREIGN KEY (approverId) REFERENCES users(userId) -- Assuming you have a users table

ALTER TABLE sales_vouchers
ADD COLUMN approvalStatus ENUM('All','Draft','Confirmed','Declined','Expired','Sent','Partially Invoiced','Accepted','Invoiced','Closed','Pending Approval', 'Approved', 'Partially Paid','Unpaid','Overdue','Payment Initiated','Paid','Rejected') DEFAULT 'Pending Approval',
ADD COLUMN approverId INT,
ADD COLUMN approvalDate DATETIME,
ADD COLUMN approvalComments TEXT;



*/