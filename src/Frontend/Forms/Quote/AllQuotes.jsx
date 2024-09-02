import React, { useState, useEffect } from 'react';
import { Form, Select, Checkbox, Table } from 'antd';
import { CloseOutlined } from '@ant-design/icons';

const { Option } = Select;

const AllQuotesForm = () => {
  const [selectedColumns, setSelectedColumns] = useState([
    'date', 'quotenumber', 'referencenumber', 'customer', 'status', 'amount'
  ]); // Default selected columns (all columns)
  const [selectedRowKeys, setSelectedRowKeys] = useState([]); // State for selected rows
  const [quoteData, setQuoteData] = useState([
    // Sample data
    { key: '1', date: '2024-06-01', quotenumber: '12345', referencenumber: '54321', customer: 'John Doe', status: 'Pending Approval', amount: '100.00' },
    { key: '2', date: '2024-06-02', quotenumber: '12346', referencenumber: '54322', customer: 'Jane Smith', status: 'Approved',  amount: '200.00' },
  ]);
  const [filteredData, setFilteredData] = useState(quoteData);
  const [selectedStatus, setSelectedStatus] = useState('All');

  const columnsOptions = [
    { label: 'Date', value: 'date' },
    { label: 'QUOTE NUMBER#', value: 'quotenumber' },
    { label: 'REFERENCE NUMBER', value: 'referencenumber' },
    { label: 'CUSTOMER NAME', value: 'customer' },
    { label: 'STATUS', value: 'status' },
    { label: 'AMOUNT', value: 'amount' },
  ];

  const handleColumnChange = (checkedValues) => {
    setSelectedColumns(checkedValues);
  };

  const handleStatusChange = (value) => {
    setSelectedStatus(value);
  };

  useEffect(() => {
    if (selectedStatus === 'All') {
      setFilteredData(quoteData);
    } else {
      setFilteredData(quoteData.filter(quote => quote.status === selectedStatus));
    }
  }, [selectedStatus, quoteData]);

  const columns = columnsOptions
    .filter(column => selectedColumns.includes(column.value))
    .map(column => ({
      title: column.label,
      dataIndex: column.value,
      key: column.value,
    }));

  // Add a row selection column to the beginning of the columns array
  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedRowKeys) => setSelectedRowKeys(selectedRowKeys),
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>All Quotes</h2>
      
      <Form layout="inline" style={{ marginBottom: 20 }}>
        <Form.Item label="Quote Status">
          <Select defaultValue="All" style={{ width: 200 }} onChange={handleStatusChange}>
            <Option value="All">All</Option>
            <Option value="Draft">Draft</Option>
            <Option value="Pending Approval">Pending Approval</Option>
            <Option value="Approved">Approved</Option>
            <Option value="Sent">Sent</Option>
            <Option value="Accepted">Accepted</Option>
            <Option value="Invoiced">Invoiced</Option>
            <Option value="Declined">Declined</Option>
            <Option value="Expired">Expired</Option>
          </Select>
        </Form.Item>
      </Form>

      <div>
        <Checkbox.Group
          options={columnsOptions}
          defaultValue={[
            'date', 'quotenumber', 'referencenumber', 'customer', 'status', 'amount'
          ]} // Default selected columns (all columns)
          onChange={handleColumnChange}
        />
      </div>

      <Table
        rowSelection={rowSelection} // Add row selection to the table
        dataSource={filteredData}
        columns={columns}
        pagination={false}
        style={{ marginTop: 20 }}
      />
    </div>
  );
};

export default AllQuotesForm;
