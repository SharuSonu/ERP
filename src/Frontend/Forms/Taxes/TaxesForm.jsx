import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { Form, Input, Select, Button, message, Space, Table, Pagination } from 'antd';
import { PercentageOutlined, EditOutlined, SearchOutlined } from '@ant-design/icons';
import { AppContext } from '../../../Context/AppContext';
import '../../../styles/Taxes/TaxesForm.css';
import Header from '../../components/Header';
import { useNavigate } from 'react-router-dom';

const TaxesForm = () => {
  const [loading, setLoading] = useState(false);
  const [taxData, setTaxData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { companyName } = useContext(AppContext);
  const navigate = useNavigate();

  const { Option } = Select;

// Define your tax type options
const taxTypeOptions = [
  { label: 'SGST', value: 'SGST' },
  { label: 'CGST', value: 'CGST' },
  { label: 'IGST', value: 'IGST' },
];

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const pageSizeOptions = ['5','10', '20', '50', '100'];

  const fetchTaxData = async () => {
    try {
      if (companyName) {
        const response = await axios.get('http://localhost:5000/api/taxes', {
          params: { companyName: companyName }
        });
        setTaxData(response.data);
      }
    } catch (error) {
      console.error('Error fetching tax data:', error);
      message.error('Failed to fetch tax data. Please try again.');
    }
  };

  useEffect(() => {
    if (companyName) {
      fetchTaxData();
    }
  }, [companyName]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/taxes-insert', {
        ...values,
        companyName: companyName,
      });
      console.log('Tax record added:', response.data);
      message.success('Tax record added successfully!');
      fetchTaxData();
    } catch (error) {
      console.error('Error adding tax record:', error);
      message.error('Failed to add tax record. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo);
    message.error('Please fill in all required fields.');
  };

  const navigatetodashboard = () => {
    navigate('/Dashboard');
  };

  const handlePageChange = (page, pageSize) => {
    setCurrentPage(page);
    setPageSize(pageSize);
  };

  const handlePageSizeChange = (current, size) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to the first page when a search is performed
  };

  const filteredData = taxData.filter((tax) =>
    tax.taxname.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const columns = [
    {
      title: 'Tax Name',
      dataIndex: 'taxname',
      key: 'taxname',
    },
    {
      title: 'Tax Rate (%)',
      dataIndex: 'taxrate',
      key: 'taxrate',
    },
    {
      title: 'Tax Type',
      dataIndex: 'taxtype',
      key: 'taxtype',
    },
  ];

  return (
    <div className='app'> 
      <Header className="header"/>
      <div className="main-container">
        <div className="form-section">
          <div className="taxes-form-container">
            <h3>Add Taxes</h3>
            <Form
              name="taxesForm"
              onFinish={onFinish}
              onFinishFailed={onFinishFailed}
              layout="vertical"
              className="taxes-form"
            >
              <Form.Item
                name="taxName"
                label="Tax Name"
                rules={[{ required: true, message: 'Please enter tax name' }]}
              >
                <Input prefix={<EditOutlined className="site-form-item-icon" />} />
              </Form.Item>

              <Form.Item
              name="taxtype"
              label="Tax Type"
              rules={[{ required: true, message: 'Please select tax type' }]}
              >
  <Select prefix={<EditOutlined className="site-form-item-icon" />}>
    {taxTypeOptions.map(option => (
      <Option key={option.value} value={option.value}>
        {option.label}
      </Option>
    ))}
  </Select>
</Form.Item>

              <Form.Item
                name="taxRate"
                label="Tax Rate (%)"
                rules={[{ required: true, message: 'Please enter tax rate' }]}
              >
                <Input prefix={<PercentageOutlined className="site-form-item-icon" />} />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" loading={loading} className="submit-button">
                    Add Record
                  </Button>
                  <Button htmlType="reset" onClick={() => {}} className="reset-button">
                    Reset
                  </Button>
                  <Button onClick={navigatetodashboard} className="cancel-button">
                    Cancel
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        </div>
        <div className="table-section">
          <h3>List of Taxes</h3>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Search by tax name"
            value={searchTerm}
            onChange={handleSearchChange}
            style={{ marginBottom: 20 }}
          />
          <Table
            className="tax-form-table"
            dataSource={paginatedData}
            columns={columns}
            rowKey="id"
            pagination={false} // Disable default pagination
          />
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={filteredData.length}
            onChange={handlePageChange}
            onShowSizeChange={handlePageSizeChange}
            pageSizeOptions={pageSizeOptions}
            showSizeChanger
            showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
            style={{ marginTop: 20, textAlign: 'right' }}
          />
        </div>
      </div>
    </div>
  );
};

export default TaxesForm;
