import React, { useState, useContext, useEffect } from 'react';
import { Form, Select, Checkbox, Table, Button, message, Pagination, Input } from 'antd';
import axios from 'axios';
import moment from 'moment';
import { AppContext } from '../../../Context/AppContext';
import '../../../styles/Invoice/AllInvoices.css';

const { Option } = Select;
const { Search } = Input;

const AllInvoicesForm = () => {
  const { companyName } = useContext(AppContext);
  const [selectedColumns, setSelectedColumns] = useState([
    'date', 'invoice', 'order', 'customer', 'status', 'dueDate', 'amount', 'balance'
  ]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [invoiceData, setInvoiceData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState(''); // State for search query
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1); // State for current page
  const [pageSize, setPageSize] = useState(5); // State for page size
  const [totalItems, setTotalItems] = useState(0); // State for total items

  const columnsOptions = [
    { label: 'Date', value: 'date' },
    { label: 'Invoice#', value: 'invoice' },
    { label: 'Order Number', value: 'order' },
    { label: 'Customer Name', value: 'customer' },
    { label: 'Status', value: 'status' },
    { label: 'Due Date', value: 'dueDate' },
    { label: 'Amount', value: 'amount' },
    { label: 'Balance Due', value: 'balance' },
  ];

  useEffect(() => {
    fetchData();
  }, [companyName, currentPage, pageSize, selectedStatus]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/sales_voucher', {
        params: {
          companyName: companyName,
          page: currentPage,
          limit: pageSize,
          status: selectedStatus === 'All' ? null : selectedStatus
        }
      });
      
      if (response.data && response.data.invoices) {
          
        const { invoices, totalCount } = response.data;
        const formattedData = invoices.map((item, index) => ({
          key: item.id.toString(), // Use a unique key for Ant Design Table
          date: item.voucherDate ? moment(item.voucherDate).format('YYYY-MM-DD') : '',
          invoice: item.vouchernumber.toString(),
          order: '', // Replace with actual order data if available
          customer: item.partyAccount,
          status: item.approvalStatus,
          dueDate: '', // Replace with actual due date if available
          amount: item.totalAmount.toFixed(2),
          balance: item.totalAmount.toFixed(2) // Replace with actual balance data if available
        }));

        setInvoiceData(formattedData);
        setFilteredData(formattedData);
        setTotalItems(totalCount);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      message.error('Error fetching data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    filterData();
  }, [selectedStatus, invoiceData, searchQuery]);

  const filterData = () => {
    let filtered = invoiceData;

    if (selectedStatus !== 'All') {
      filtered = filtered.filter(invoice => invoice.status === selectedStatus);
    }

    if (searchQuery) {
      filtered = filtered.filter(invoice =>
        invoice.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.invoice.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.date.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredData(filtered);
  };

  const handleColumnChange = (checkedValues) => {
    setSelectedColumns(checkedValues);
  };

  const handleStatusChange = (value) => {
    setSelectedStatus(value);
    setCurrentPage(1); // Reset current page when status changes
  };

  const handleSearch = (value) => {
    setSearchQuery(value);
    setCurrentPage(1); // Reset current page when search query changes
  };

      
  const handlePrintInvoice = async (invoiceId) => {
    try {
      const cmpresponse = await fetch('http://localhost:5000/api/organization', {
        headers: {
            'company-name': companyName, // Replace with actual logic to get current companyName
        },
    });
    const cmpdata = await cmpresponse.json();
    const cmpaddr1 = cmpdata.addresses && cmpdata.addresses.length > 0 ? cmpdata.addresses[0].streetAddress1 || '' : '';
    const cmpaddr2 = cmpdata.addresses && cmpdata.addresses.length > 0 ? cmpdata.addresses[0].streetAddress2 || '' : '';
    const cmpaddr3 = cmpdata.addresses && cmpdata.addresses.length > 0 ? cmpdata.addresses[0].streetAddress3 || '' : '';
    const cmpaddr4 = cmpdata.addresses && cmpdata.addresses.length > 0 ? cmpdata.addresses[0].streetAddress4 || '' : '';
    const cmpaddr5 = cmpdata.addresses && cmpdata.addresses.length > 0 ? cmpdata.addresses[0].streetAddress5 || '' : '';

    const phone = cmpdata.phone || '';
    const email = cmpdata.email || '';
    const gstin = cmpdata.gstin || '';


    //console.log("data : ",cmpdata);
      const response = await axios.get(`http://localhost:5000/api/sales_voucher/${invoiceId}`, {
        params: {
          companyName: companyName
        }
      });
      if (response.data) {
        const invoiceDetails = response.data; // Adjust this based on your backend response structure
  
        // Fetch item details
        const itemsResponse = await axios.get(`http://localhost:5000/api/sales_inventory`, {
        params: {
        companyName: companyName,   
        vouchernumber: invoiceId
             }
          });
          const items = itemsResponse.data; // Assuming the response contains an array of items

        const ledgerResponse = await axios.get(`http://localhost:5000/api/sales_ledger_entries`, {
            params: {
            companyName: companyName,   
            vouchernumber: invoiceId
                 }
              });
        const ledgers = ledgerResponse.data;  


        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
          <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>POS Invoice - ${invoiceId}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
    }
    .invoice {
      width: 80mm; /* Adjust to thermal printer width */
      margin: auto;
      padding: 10px;
      border: 1px solid #ccc; /* Optional border for the entire invoice */
      border-radius: 5px;
    }
    .header {
      text-align: center;
      margin-bottom: 10px;
    }
    .content {
      margin-bottom: 10px;
    }
    .footer {
      text-align: center;
      margin-top: 10px;
    }
    .field {
      display: flex;
      margin-bottom: 5px;
    }
    .label {
      width: 70px;
      font-weight: bold;
      margin-right: 15px;
    }
    .value {
      flex: 1;
      
    }
    .row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    th, td {
      border-top: 1px dashed #000;
      border-bottom: 1px dashed #000;
      padding: 4px;
      text-align: left;
    }
    th {
      background-color: #f2f2f2;
      
    }
    .total {
      text-align: right;
      font-weight: bold;
    }
    .divider {
      border-top: 1px dashed #000;
      margin: 10px 0;
    }
    .cmpaddress{
    text-align: center;
    }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <h2>${cmpdata.name}</h2>
      <Pre class="cmpaddress"> ${cmpaddr1}
 ${cmpaddr2}
 ${cmpaddr3}
 ${cmpaddr4}
 ${cmpaddr5}
  Ph:${phone}
    Email: ${email}
    GSTIN: ${gstin}</pre>
      <h3>Invoice</h3>
    </div>
    <div class="content">
      <div class="divider"></div>
      <div class="row">
        <small><span class="label">Bill No: </span>
        <span class="value">${invoiceId}</span>
        <span class="label">Time:</span>
        <span class="value">${moment().format('HH:mm:ss')}</span></small>
      </div>
      <div class="row">
        <small><span class="label">Bill Date: </span>
        <span class="value">${moment().format('DD-MM-YYYY')}</span></small>
      </div>
      <div class="row">
        <small><span class="label">Customer: </span>
        <span class="value">${invoiceDetails.partyAccount}</span></small>
      </div>
      <div class="row">
        <small><span class="label">SalesPerson: </span>
        <span class="value">${invoiceDetails.salesLedger}</span></small>
      </div>
      
      <div class="row">
        <small><span class="label">Narration:  </span>
        <span class="value">${invoiceDetails.narration}</span></small>
      </div>
      <div class="divider"></div>
      <table>
        <thead>
          <tr>
            <th><small>Sl</small></th>
            <th><small>Description</small></th>
            <th><small>Qty</small></th>
            <th><small>Rate</small></th>
            <th><small>Amount</small></th>
          </tr>
        </thead>
        
        <tbody>
          ${items.map((item, index) => `
            <tr>
              <td><small>${index + 1}</small></td>
              <td><small>${item.itemName}</small></td>
              <td><small>${item.quantity}</small></td>
              <td><small>${item.rate.toFixed(2)}</small></td>
              <td><small>${item.amount.toFixed(2)}</small></td>
            </tr>
          `).join('')}
          <tr>
            <td colspan="2" class="total">Total</td>
            <td class="total">${items.reduce((acc, item) => acc + item.quantity, 0)}</td>
            <td></td>
            <td class="total">${items.reduce((acc, item) => acc + item.amount, 0).toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      <table>
        <thead>
          <tr>
            <th><small>GST%</small></th>
            <th><small>CGST%</small></th>
            <th><small>CGST</small></th>
            <th><small>SGST%</small></th>
            <th><small>SGST</small></th>
          </tr>
        </thead>
        
        <tbody>
          ${ledgers.map((ledger, index) => `
            <tr>
              <td><small>${((ledger.rate)*2).toFixed(2)}</small></td>
              <td><small>${ledger.rate.toFixed(2)}</small></td>
              <td><small>${ledger.amount.toFixed(2)}</small></td>
              <td><small>${ledger.rate.toFixed(2)}</small></td>
              <td><small>${ledger.amount.toFixed(2)}</small></td>
            </tr>
          `).join('')}
          <tr>
            <td colspan="2" class="total">Total</td>
            <td></td>
            <td></td>
            <td class="total">${ledgers.reduce((acc, ledger) => acc + ledger.amount, 0).toFixed(2)}</td>

          </tr>
        </tbody>
      </table>
      <!-- Combined Total -->
      <div class="divider"></div>
      <div class="row">
        <span class="label">Total: </span>
        <span class="total">${(items.reduce((acc, item) => acc + item.amount, 0) + ledgers.reduce((acc, ledger) => acc + ledger.amount, 0)).toFixed(2)}</span>
      </div>
      <h3>CASH</h3>      
    </div>  
    <div class="footer">
      <pre>*Thank you for your business*
*POWEREBY: SUNIT SOLUTIONS*</p>
    </div>
  </div>
  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>

        `);
        printWindow.document.close();
      }
    } catch (error) {
      console.error('Error fetching invoice details:', error);
      if (axios.isAxiosError(error)) {
        message.error(error.message); // Display Axios error message using Ant Design message component
      } else {
        message.error('Error fetching invoice details. Please try again.');
      }
    }
  };
  
  const handleExport = (invoiceId) => {
    // Add your export logic here
    console.log(`Export invoice with ID: ${invoiceId}`);
  };

  const handleEdit = (invoiceId) => {
    // Add your edit logic here
    console.log(`Edit invoice with ID: ${invoiceId}`);
  };

  const columns = [
    ...columnsOptions
      .filter(column => selectedColumns.includes(column.value))
      .map(column => ({
        title: column.label,
        dataIndex: column.value,
        key: column.value,
      })),
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <div className="btn-group" role="group" aria-label="Actions">
          <Button
            type="default"
            className="print-button mr-2"
            onClick={() => handlePrintInvoice(record.invoice)}
          >
            Print
          </Button>

        
        </div>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedRowKeys) => setSelectedRowKeys(selectedRowKeys),
  };

  const handlePageChange = (page, pageSize) => {
    setCurrentPage(page);
    setPageSize(pageSize);
  };

  const pageSizeOptions = ['5', '10', '20', '50'];
  return (
    <div style={{ padding: 20 }}>
      <h2>All Invoices</h2>
      
      <Form layout="inline" style={{ marginBottom: 20 }}>
        <Form.Item label="Invoice Status">
          <Select defaultValue="All" style={{ width: 200 }} onChange={handleStatusChange}>
            <Option value="All">All</Option>
            <Option value="Pending Approval">Pending Approval</Option>
            <Option value="Approved">Approved</Option>
            <Option value="Partially Paid">Partially Paid</Option>
            <Option value="Unpaid">Unpaid</Option>
            <Option value="Overdue">Overdue</Option>
            <Option value="Payment Initiated">Payment Initiated</Option>
            <Option value="Paid">Paid</Option>
          </Select>
        </Form.Item>
        <Form.Item label="Search">
          <Search
            placeholder="Search by customer, invoice, or date"
            onSearch={handleSearch}
            style={{ width: 300 }}
            enterButton
          />
        </Form.Item>
      </Form>

      <div>
        <Checkbox.Group
          options={columnsOptions}
          value={selectedColumns}
          onChange={handleColumnChange}
        />
      </div>

      <Table
        rowSelection={rowSelection}
        dataSource={filteredData}
        columns={columns}
        pagination={false} // Set pagination to false for now
        loading={loading}
        style={{ marginTop: 20 }}
      />
      
      <Pagination
        current={currentPage}
        pageSize={pageSize}
        total={totalItems}
        onChange={handlePageChange}
        showSizeChanger
        onShowSizeChange={handlePageChange}
        pageSizeOptions={pageSizeOptions}
        showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
        style={{ marginTop: 20, textAlign: 'right' }}
      />
    </div>
  );
};

export default AllInvoicesForm;
