import React, { useState, useContext, useEffect } from 'react';
import { Form, Input, Button, Select, Divider } from 'antd';
import { createStockGroup, fetchStockGroups } from '../../utils/RestApi'; // Assuming correct import path
import { AppContext } from '../../../Context/AppContext';
//import { AppContext } from '../../../Context/AppContext';
import '../../../styles/StockGroupform.css';

const { Option } = Select;

const StockGroupForm = () => {
  const [form] = Form.useForm();
  const { companyName, setCompanyName } = useContext(AppContext);
  const [StockGroupOptions, setStockGroupOptions] = useState([]);

  const defaultGroups = ['Primary'];

  useEffect(() => {
    const storedCompanyName = localStorage.getItem('companyName');
    if (storedCompanyName) {
      setCompanyName(storedCompanyName);
    }
  }, [setCompanyName]);

  useEffect(() => {
    const fetchStockGroupsFromDatabase = async () => {
      console.log("Fetching stock groups for company:", companyName);
      try {
        const response = await fetchStockGroups(companyName);
        console.log("API response:", response);
        if (response.success) {
          const databaseGroups = response.groups || [];
          const combinedGroups = [...defaultGroups, ...databaseGroups];
          const uniqueGroups = Array.from(new Set(combinedGroups));
          console.log("Combined and unique groups:", uniqueGroups);
          setStockGroupOptions(uniqueGroups);
        } else {
          console.error('Failed to fetch groups:', response.message);
        }
      } catch (error) {
        console.error('Error fetching groups from database:', error);
      }
    };

    if (companyName) {
      fetchStockGroupsFromDatabase();
    } else {
      console.log("No company name found, setting default groups:", defaultGroups);
      setStockGroupOptions(defaultGroups);
    }
  }, [companyName, defaultGroups]);

  const onFinish = async (values) => {
    const stockgroupData = {
      ...values,
      databaseName: companyName,
    };
    try {
      const response = await createStockGroup(stockgroupData);

      if (response.success) {
        alert('StockGroup created successfully');
        form.resetFields();
      } else {
        alert(response.message || 'Failed to create stockgroup');
      }
    } catch (error) {
      console.error('Error:', error);
      alert(error.message || 'An error occurred');
    }
  };

  return (
    <div className="stock-group-form">
      <h4>𝑺𝒕𝒐𝒄𝒌 𝑮𝒓𝒐𝒖𝒑 𝑪𝒓𝒆𝒂𝒕𝒊𝒐𝒏</h4>
      <Divider />

      <Form
        name="stock_group_creation"
        initialValues={{ remember: true }}
        onFinish={onFinish}
        layout="vertical"
        style={{ maxWidth: '600px' }}
      >
        <Form.Item
          label="Name"
          name="name"
          rules={[{ required: true, message: 'Please input the name!' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Alias"
          name="alias"
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Parent"
          name="Group"
        >
          <Select showSearch optionFilterProp="children">
            {StockGroupOptions.length > 0 ? (
              StockGroupOptions.map((group) => (
                <Option key={group} value={group}>
                  {group}
                </Option>
              ))
            ) : (
              <Option value="" disabled>
                No data
              </Option>
            )}
          </Select>
        </Form.Item>

        <h4>Statutory Details</h4>
        <Divider />

        <h5>GST DETAILS</h5>

        <Form.Item
          label="HSN SAC DETAILS"
          name="hsnSacDetails"
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="HSN"
          name="hsn"
        >
          <Input />
        </Form.Item>

        <h5>GST RATE DETAILS</h5>
        <Form.Item
          label="Taxability"
          name="taxability"
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="GST Rate"
          name="gstRate"
        >
          <Input />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit">
            Submit
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default StockGroupForm;
