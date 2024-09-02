import React, { useState, useContext, useEffect } from 'react';
import { Form, Select, Checkbox, Table, Button, message, Pagination, Input } from 'antd';
import axios from 'axios';
import moment from 'moment';
import { AppContext } from '../../../Context/AppContext';
import '../../../styles/ReceiptNote/AllReceiptNote.css';
import {BASE_URL} from '../../utils/Ipurl';

const { Option } = Select;
const { Search } = Input;

const AllReceiptNoteForm = () => {
  const { companyName } = useContext(AppContext);
  /*const [selectedColumns, setSelectedColumns] = useState([
    'date', 'invoice', 'order', 'customer', 'status', 'dueDate', 'amount', 'balance'
  ]);*/
  const [selectedColumns, setSelectedColumns] = useState([
    'date', 'invoice', 'customer', 'status', 'dueDate', 'amount', 'balance'
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
    //{ label: 'Order Number', value: 'order' },
    { label: 'Customer Name', value: 'customer' },
    { label: 'Status', value: 'status' },
    { label: 'Due Date', value: 'dueDate' },
    { label: 'Amount', value: 'amount' },
    
    //{ label: 'Balance Due', value: 'balance' },
  ];

  useEffect(() => {
    fetchData();
  }, [companyName, currentPage, pageSize, selectedStatus]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(BASE_URL+'/receiptnote_voucher', {
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
          amount: item.totalAmount,
          balance: '0.00' // Replace with actual balance data if available
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
        // Fetch company info
        const cmpresponse = await fetch(BASE_URL + '/organization', {
            headers: {
                'company-name': companyName,
            },
        });
        const cmpdata = await cmpresponse.json();

        // Extract company info
        const cmpaddr1 = cmpdata.addresses && cmpdata.addresses.length > 0 ? cmpdata.addresses[0].streetAddress1 || '' : '';
        const cmpaddr2 = cmpdata.addresses && cmpdata.addresses.length > 0 ? cmpdata.addresses[0].streetAddress2 || '' : '';
        const cmpaddr3 = cmpdata.addresses && cmpdata.addresses.length > 0 ? cmpdata.addresses[0].streetAddress3 || '' : '';
        const cmpaddr4 = cmpdata.addresses && cmpdata.addresses.length > 0 ? cmpdata.addresses[0].streetAddress4 || '' : '';
        const cmpaddr5 = cmpdata.addresses && cmpdata.addresses.length > 0 ? cmpdata.addresses[0].streetAddress5 || '' : '';

        const phone = cmpdata.phone || '';
        const email = cmpdata.email || '';
        const gstin = cmpdata.gstin || '';
     

        // Fetch invoice details
        const response = await axios.get(BASE_URL + `/rcptnote_voucher/${invoiceId}`, {
            params: {
                companyName: companyName
            }
        });

        const partyledgerres = response.data;

             // Fetch Party Ledger and Address info
    const partyledgerresponse = await fetch(`${BASE_URL}/ledger_and_address?companyName=${encodeURIComponent(companyName)}&ledgerName=${encodeURIComponent(partyledgerres.partyAccount)}`);
    const partyledgerdata = await partyledgerresponse.json();

    // Extract ledger info directly from the response object
const ledgerAddr1 = partyledgerdata.addressLine1 || '';
const ledgerAddr2 = partyledgerdata.addressLine2 || '';
const ledgerCity = partyledgerdata.city || '';
const ledgerState = partyledgerdata.state || '';
const ledgerPostalCode = partyledgerdata.postalCode || '';
const ledgerCountry = partyledgerdata.country || '';

const ledgerPhone = partyledgerdata.customerPhone || '';
const ledgerEmail = partyledgerdata.customerEmail || '';
const ledgerGstin = partyledgerdata.GSTIN || '';

        // Fetch item details
        const itemsResponse = await axios.get(BASE_URL + `/rcptnote_inventory`, {
            params: {
                companyName: companyName,
                vouchernumber: invoiceId
            }
        });
        const items = itemsResponse.data; // Assuming the response contains an array of items
        // Calculate total amount from items

        const calculateTotalAmount = (items) => {
          return items.reduce((total, item) => total + (parseFloat(item.amount) || 0), 0);
        };

        const totalAmount = calculateTotalAmount(items);

        // Fetch ledger entries
        const ledgerResponse = await axios.get(BASE_URL + `/rcptnote_ledger_entries`, {
            params: {
                companyName: companyName,
                vouchernumber: invoiceId
            }
        });
        const ledgers = ledgerResponse.data;


         // Fetch hsn details
      const HsnResponse = await axios.get(BASE_URL + `/rcptnote_hsn_tax_details`, {
          params: {
              companyName: companyName,
              vouchernumber: invoiceId
          }
      });
      const hsndetails = HsnResponse.data;

        const calculateLedTotalAmount = (ledgers) => {
          return items.reduce((total, ledger) => total + (parseFloat(ledger.amount) || 0), 0);
        };

        const totalLedAmount = calculateLedTotalAmount(ledgers);

        /*Amount in words*/
            // Convert numbers from 0-19 to words
function numberToWordsBelowTwenty(num) {
  const belowTwenty = [
      'Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
      'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
      'Seventeen', 'Eighteen', 'Nineteen'
  ];
  return belowTwenty[num];
}

// Convert numbers from 20-99 to words
function numberToWordsTens(num) {
  const tens = [
      '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ];
  const tenDigit = Math.floor(num / 10);
  const unitDigit = num % 10;
  return tens[tenDigit] + (unitDigit !== 0 ? ' ' + numberToWordsBelowTwenty(unitDigit) : '');
}

// Convert numbers from 100-999 to words
function numberToWordsHundreds(num) {
  const hundredDigit = Math.floor(num / 100);
  const remainder = num % 100;
  const remainderWords = remainder > 0 ? ' and ' + (remainder < 20 ? numberToWordsBelowTwenty(remainder) : numberToWordsTens(remainder)) : '';
  return numberToWordsBelowTwenty(hundredDigit) + ' Hundred' + remainderWords;
}

// Convert numbers up to 999,999 to words
function convertLargeNumberToWords(num) {
  if (num === 0) return 'Zero';

  const thousands = ['', 'Thousand'];
  let word = '';
  let unit = num % 1000;
  let thousandIndex = 0;

  while (num > 0) {
      if (unit > 0) {
          const unitWords = unit < 100 ? (unit < 20 ? numberToWordsBelowTwenty(unit) : numberToWordsTens(unit)) : numberToWordsHundreds(unit);
          word = unitWords + ' ' + thousands[thousandIndex] + ' ' + word;
      }
      num = Math.floor(num / 1000);
      unit = num % 1000;
      thousandIndex++;
  }

  return word.trim();
}

// Convert amount to words
function convertAmountToWords(amount) {
  // Ensure amount is formatted to two decimal places
  const amountString = amount.toFixed(2);
  const [integerPart, decimalPart] = amountString.split('.');

  // Convert integer part to words
  const integerInWords = convertLargeNumberToWords(parseInt(integerPart, 10));

  // Convert decimal part to words
  const decimalInWords = decimalPart ? numberToWordsTens(parseInt(decimalPart, 10)) : '';

  let words = integerInWords;

  if (decimalInWords) {
      words += ' and ' + decimalInWords + ' Paise Only';
  } else {
      words += ' Only';
  }

  return words;
}
        if (response) {
            const invoiceDetails = response.data;

            // Prepare item rows
            const itemRows = items.map((item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.itemName || ''}</td>
                  <td>${item.hsnCode || ''}</td>
                  <td>${item.quantity || ''}</td>
                  <td>${item.rate || ''}</td>
                  <td>${item.discount || ''}</td>
                  <td>${item.amount || ''}</td>
                </tr>
            `).join('');

            
            // Prepare ledger rows
            const ledgerRows = ledgers.map((ledger) => `
                <tr>
                  <td colspan="6" style="text-align:right;">${ledger.particulars || ''}</td>
                  <td>${ledger.amount || '0.00'}</td>
                </tr>
            `).join('');

            // Prepare tax details rows
            // Calculate totals
        let totalCentralTaxAmount = 0;
        let totalStateTaxAmount = 0;
        let totalTaxAmount = 0;
        let totalTaxAmountSum = 0;

         // Generate tax rows and calculate totals
         const taxRows = hsndetails.map((hsn) => {
          // Ensure values are numeric
          const centralTaxAmount = parseFloat(hsn.CentralTaxAmount) || 0;
          const stateTaxAmount = parseFloat(hsn.StateTaxAmount) || 0;
          const totalTaxAmount = parseFloat(hsn.TotalTaxAmount) || 0; // Renamed to avoid conflict

          // Update totals
          totalCentralTaxAmount += centralTaxAmount;
          totalStateTaxAmount += stateTaxAmount;
          totalTaxAmountSum += totalTaxAmount; // Use totalTaxAmountSum here

          return `
              <tr>
                <td>${hsn.HSNCode || ''}</td>
                <td>${parseFloat(hsn.TaxableValue).toFixed(2) || '0.00'}</td>
                <td>${parseFloat(hsn.CentralTaxRate).toFixed(2) || '0.00'}</td>
                <td>${centralTaxAmount.toFixed(2) || '0.00'}</td>
                <td>${parseFloat(hsn.StateTaxRate).toFixed(2) || '0.00'}</td>
                <td>${stateTaxAmount.toFixed(2) || '0.00'}</td>
                <td>${totalTaxAmount.toFixed(2) || '0.00'}</td>
              </tr>
          `;
      }).join('');


      const ledgstin = ledgerGstin || '';
      const ledstateCode = ledgstin.length >= 2 ? ledgstin.substring(0, 2) : '';

            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
            <html>
<head>
  <title>GRN</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    .invoice-container {
      width: calc(210mm - 25px); 
      height: calc(297mm - 25px);
      padding: 10mm;
      border: 2px solid #000; /* Outer border */
      position: relative;
      display: flex;
      margin: 15px;
      flex-direction: column;
      box-sizing: border-box;
    }
    .header {
      text-align: center;
      margin-bottom: 10px;
    }
    .header h1 {
      margin: 0;
      font-size: 18px;
      font-weight: bold;
    }
    .header-content {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
    }
    .company-details, .invoice-details {
      width: 48%;
      vertical-align: top;
    }
    .company-details {
      text-align: left;
      font-size: 12px;
      line-height: 1.4;
      margin-bottom: 10px;
    }
    .company-details p {
      margin: 2px 0; /* Reduce the margin around paragraphs */
    }
    .invoice-details {
      text-align: right;
      font-size: 12px;
    }
    .invoice-details-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
      font-size: 12px;
    }
    .invoice-details-table td {
      border: 1px solid #ccc;
      padding: 4px;
      text-align: left;
    }
    .invoice-details-table td:nth-child(1) {
      border-right: 1px solid #ccc;
    }
    .invoice-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
      font-size: 12px;
    }
    .invoice-table th, .invoice-table td {
      border: 1px solid #ccc;
      padding: 4px;
      text-align: left;
    }
    .invoice-table th {
      background-color: #f2f2f2;
    }
    .total-section {
      margin-top: 10px;
      text-align: right;
    }
    .footer {
      margin-top: auto;
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      position: relative;
      padding-top: 10px;
      border-top: 1px solid #ccc;
    }
    .footer .declaration {
      text-align: left;
      width: 50%;
    }
    .footer .authorized-signatory {
      text-align: right;
      width: 50%;
    }
    .bank-details-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      margin-top: 10px;
    }
    .bank-details-table td {
      padding: 2px 4px;
      text-align: right;
      border: none;
    }
    .bank-details-table td:first-child {
      font-weight: bold;
    }
    .footer-note {
      font-size: 10px;
      text-align: center;
      margin-top: 10px;
      color: #888;
    }
    @media print {
      .invoice-container {
        page-break-inside: avoid;
      }
      .footer-note {
        position: absolute;
        bottom: 10mm;
        width: 100%;
        text-align: center;
      }
      @page {
        margin: 0; /* Removes default margins */
      }
      .no-print {
        display: none; /* Hides elements with class "no-print" */
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <h1>Receipt Note</h1>
    </div>
    <div class="header-content">
      <div class="company-details">
        <h2>${cmpdata.name || 'Company Name'}</h2>
        <p>${cmpaddr1}</p>
        <p>${cmpaddr2}</p>
        <p>${cmpaddr3}</p>
        <p>${cmpaddr4}</p>
        <p>${cmpaddr5}</p>
        <p>GSTIN/UIN: ${gstin}</p>
        <p>State Name: ${cmpdata.stateName}, Code: ${cmpdata.stateCode || ''}</p>
        <p>E-Mail: ${email}</p>
        <h3>Buyer (Bill to)</h3>
        <p>${invoiceDetails.partyAccount }</p>
        <p>${ledgerAddr1 || ''}</p>
        <p>${ledgerAddr2 || ''}</p>
        <p>${ledgerCity || ''}</p>
        <p>${ledgerState || ''}</p>
        <p>${ledgerPostalCode || ''}</p>
        <p>GSTIN/UIN: ${ledgerGstin || ''}</p>
        <p>State Name: ${ledgerState || ''}, Code: ${ledstateCode || ''}</p>
      </div>
      <div class="invoice-details">
        <table class="invoice-details-table">
          <tbody>
            <tr>
              <td><strong>Invoice No.:</strong> ${invoiceId}</td>
              <td><strong>Dated.:</strong> ${invoiceDetails.voucherDate || '--'}</td>
            </tr>
            <tr>
              <td></td>
              <td><strong>Mode/Terms of Payment:</strong> ${invoiceDetails.paymentTerms}</td>
            </tr>
            <tr>
              <td colspan="2" style="border: 1px solid #ccc; padding: 4px;">
                <strong>Terms of Delivery:</strong> ${invoiceDetails.termsOfDelivery}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <table class="invoice-table">
      <thead>
        <tr>
          <th>Sl No.</th>
          <th>Description of Goods</th>
          <th>HSN/SAC</th>
          <th>Quantity</th>
          <th>Rate</th>
          <th>Disc. %</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
        <tr>
          <td colspan="6" style="text-align:right;"><strong>Total</strong></td>
          <td>${totalAmount || '0.00'}</td>
        </tr>
        ${ledgerRows}
        <tr>
          <td colspan="6" style="text-align:right;"><strong>Grand Total</strong></td>
          <td>${invoiceDetails.totalAmount || '0.00'}</td>
        </tr>
      </tbody>
    </table>

    <p><strong>Amount Chargeable (in words):</strong> ${convertAmountToWords(invoiceDetails.totalAmount) || ''}</p>

    <table class="invoice-table">
      <thead>
        <tr>
          <th>HSN/SAC</th>
          <th>Taxable Value</th>
          <th>Central Tax Rate</th>
          <th>Central Tax Amount</th>
          <th>State Tax Rate</th>
          <th>State Tax Amount</th>
          <th>Total Tax Amount</th>
        </tr>
      </thead>
      <tbody>
        ${taxRows}
       <tr>
                  <td colspan="3" style="text-align:right;"><strong>Total</strong></td>
                  <td>${totalCentralTaxAmount.toFixed(2)}</td>
                  <td></td>
                  <td>${totalStateTaxAmount.toFixed(2)}</td>
                  <td>${totalTaxAmountSum.toFixed(2)}</td>
                </tr>
      </tbody>
    </table>

    <p><strong>Tax Amount (in words):</strong> ${convertAmountToWords(totalTaxAmountSum) || ''}</p>

    <div class="bank-details">
      <table class="bank-details-table">
        <tbody>
          <tr>
            <td>Bank Name:</td>
            <td>${cmpdata.bankName || 'Bank Name'}</td>
          </tr>
          <tr>
            <td>A/c No.:</td>
            <td>${cmpdata.accountNumber || 'Account Number'}</td>
          </tr>
          <tr>
            <td>Branch & IFS Code:</td>
            <td>${cmpdata.branchIFSCode || 'Branch & IFS Code'}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="footer">
      <div class="declaration">
        <p><strong>Declaration:</strong></p>
        <p>We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</p>
      </div>
      <div class="authorized-signatory">
        <p>for ${cmpdata.name || 'Company Name'}</p>
        <pre></pre>
        <p><strong>Authorized Signatory</strong></p>
      </div>
    </div>
  </div>
  <div class="footer-note">
    This is a computer-generated invoice.
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
        console.error('Error fetching Rcptnote invoice details:', error);
        if (axios.isAxiosError(error)) {
            message.error(error.message); // Display Axios error message using Ant Design message component
        } else {
            message.error('Error fetching RcptNote invoice details. Please try again.');
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
        <>
        <div className="btn-group" role="group" aria-label="Actions">

        <Button
            type="secondary"
            className="display-button mr-2"
            onClick={() => handlePrintInvoice(record.invoice)}
          >
            View
          </Button>  


          <Button
            type="default"
            className="print-button mr-2"
            onClick={() => handlePrintInvoice(record.invoice)}
          >
            Print
          </Button>
          
        </div>
        </>
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
      <h2>All ReciptNote</h2>
      
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

export default AllReceiptNoteForm;
