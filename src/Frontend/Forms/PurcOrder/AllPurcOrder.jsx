import React, { useState, useContext, useEffect } from 'react';
import { Form, Select, Checkbox, Table, Button, message, Pagination, Input } from 'antd';
import axios from 'axios';
import moment from 'moment';
import { AppContext } from '../../../Context/AppContext';
import '../../../styles/PurcOrder/AllPurcOrder.css';
import {BASE_URL} from '../../utils/Ipurl';

const { Option } = Select;
const { Search } = Input;

const AllPurcOrderForm = () => {
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
      const response = await axios.get(BASE_URL+'/purcorder_voucher', {
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
      const response = await axios.get(BASE_URL+`/purcorder_voucher/${invoiceId}`, {
        params: {
          companyName: companyName
        }
      });
      if (response.data) {
        const invoiceDetails = response.data; // Adjust this based on your backend response structure

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
          <html>
            <head>
              <title>POS Invoice - ${invoiceId}</title>
              <style>
                body {
                  font-family: Arial, sans-serif;
                }
                .invoice {
                  width: 100%;
                  max-width: 800px;
                  margin: auto;
                  padding: 20px;
                  border: 1px solid #ccc;
                }
                .header {
                  text-align: center;
                  margin-bottom: 20px;
                }
                .content {
                  margin-bottom: 20px;
                }
                /* Add more styles as needed */
              </style>
            </head>
            <body>
              <div class="invoice">
                <div class="header">
                  <h2>Purchase Invoice - ${invoiceId}</h2>
                  <p>Date: ${moment().format('YYYY-MM-DD')}</p>
                </div>
                <div class="content">
                  <p>Customer: ${invoiceDetails.partyAccount}</p>
                  <p>Status: ${invoiceDetails.approvalStatus}</p>
                  <p>Amount: ${invoiceDetails.totalAmount}</p>
                  <p>Narration: ${invoiceDetails.narration}</p>
                  
                </div>
                <div class="footer">
                  <p>Thank you for your business!</p>
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
      console.error('Error fetching Purchase invoice details:', error);
      if (axios.isAxiosError(error)) {
        message.error(error.message); // Display Axios error message using Ant Design message component
      } else {
        message.error('Error fetching Purchase invoice details. Please try again.');
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

          <Button
            type="secondary"
            className="convert-button mr-2"
            onClick={() => handlePrintInvoice(record.invoice)}
          >
            Convert to GRN
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
      <h2>All Purchase Order</h2>
      
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

export default AllPurcOrderForm;
