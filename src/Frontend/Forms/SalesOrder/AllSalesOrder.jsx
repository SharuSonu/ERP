import React, { useState, useEffect } from 'react';
import { Form, Select, Checkbox, Table } from 'antd';
import { CloseOutlined } from '@ant-design/icons';

const { Option } = Select;

const AllSalesOrderForm = () => {
  const [selectedColumns, setSelectedColumns] = useState([
    'date', 'salesorder', 'referencenumber', 'customer', 'status', 'invoiced', 'payment','amount'
  ]); // Default selected columns (all columns)
  const [selectedRowKeys, setSelectedRowKeys] = useState([]); // State for selected rows
  const [salesorderData, setSalesOrderData] = useState([
    // Sample data
    { key: '1', date: '2024-06-01', salesorder: '12345', referencenumber: '54321', customer: 'John Doe', status: 'Pending Approval', invoiced: '', payment:'', amount: '100.00' },
    { key: '2', date: '2024-06-02', salesorder: '12346', referencenumber: '54322', customer: 'Jane Smith', status: 'Approved',  invoiced: '', payment:'', amount: '200.00' },
  ]);
  const [filteredData, setFilteredData] = useState(salesorderData);
  const [selectedStatus, setSelectedStatus] = useState('All');

  const columnsOptions = [
    { label: 'Date', value: 'date' },
    { label: 'SALES ORDER#', value: 'salesorder' },
    { label: 'REFERENCE#', value: 'referencenumber' },
    { label: 'CUSTOMER NAME', value: 'customer' },
    { label: 'STATUS', value: 'status' },
    { label: 'INVOICED', value: 'invoiced' },
    { label: 'PAYMENT', value: 'payment' },
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
      setFilteredData(salesorderData);
    } else {
      setFilteredData(salesorderData.filter(salesorder => salesorder.status === selectedStatus));
    }
  }, [selectedStatus, salesorderData]);

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
      <h2>All SalesOrder</h2>
      
      <Form layout="inline" style={{ marginBottom: 20 }}>
        <Form.Item label="SalesOrder Status">
          <Select defaultValue="All" style={{ width: 200 }} onChange={handleStatusChange}>
            <Option value="All">All</Option>
            <Option value="Draft">Draft</Option>
            <Option value="Pending Approval">Pending Approval</Option>
            <Option value="Approved">Approved</Option>
            <Option value="Confirmed">Confirmed</Option>
            <Option value="Sent">Sent</Option>
            <Option value="Overdue">Overdue</Option>
            <Option value="Partially Invoiced">Partially Invoiced</Option>
            <Option value="Invoiced">Invoiced</Option>
            <Option value="Closed">Closed</Option>
          </Select>
        </Form.Item>
      </Form>

      <div>
        <Checkbox.Group
          options={columnsOptions}
          defaultValue={[
            'date', 'salesorder', 'referencenumber', 'customer', 'status', 'invoiced', 'payment','amount'
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

export default AllSalesOrderForm;
