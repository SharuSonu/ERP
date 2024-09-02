// Stockcategory.jsx
//Form to create a form in Webpage

import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { Form, Input, Button, Select, Divider,message } from 'antd';
//import { createStockcategory, fetchStockcategory } from '../../utils/RestApi'; // Assuming correct import path
import { AppContext } from '../../../Context/AppContext';


const { Option } = Select;

const StockcategoryForm = () => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const { companyName, setCompanyName } = useContext(AppContext);
  const [groupOptions, setGroupOptions] = useState([]);

  useEffect(() => {
    const storedCompanyName = localStorage.getItem('companyName');
    if (storedCompanyName) {
      setCompanyName(storedCompanyName);
    }
  }, [setCompanyName]);

  useEffect(() => {
    const fetchStockcategoryFromDatabase = async () => {
        try {
            const response = await fetchStockcategory(companyName); // Pass companyName as a parameter
            if (response.success) {
                const databaseStockcategory = response.Stockcategory || []; // Ensure groups is not null
                const combinedStockcategory = [ ...databaseStockcategory]; // Merge defaultGroups with databaseGroups

                // Convert combinedGroups to a Set to remove duplicates, then convert back to an array
                const uniqueStockcategory = Array.from(new Set(combinedStockcategory));

                setGroupOptions(uniqueStockcategory);
            } else {
                console.error('Failed to fetch groups:', response.message);
            }
        } catch (error) {
            console.error('Error fetching groups from database:', error);
        }
    };
    if(companyName)
    fetchStockcategoryFromDatabase();
}, [companyName]);

const onFinish = async (values) => {
  setLoading(true);
  try {
      const response = await axios.post(BASE_URL+'/create-Stockcategory', {
        ...values,
        companyName: companyName
      });
      console.log('Stock Category added:', response.data);
      message.success('Stock Category added successfully!');
  } catch (error) {
    console.error('Error adding  Stock Category:', error);
    message.error('Failed to add Stock Category.Please try again.');
  } finally {
    setLoading(false);
  }
};

const onFinishFailed = (errorInfo) => {
  console.log('Failed:', errorInfo);
  message.error('Please fill in all required fields.');

};

  return (
    <div className="stock-category-form">
      <h4>𝑺𝒕𝒐𝒄𝒌 𝑪𝒂𝒕𝒆𝒈𝒐𝒓𝒚 𝑪𝒓𝒆𝒂𝒕𝒊𝒐𝒏</h4>
      <Divider />

      <Form
        name="stock_category_creation"
        initialValues={{ remember: true }}
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        layout="vertical"
        style={{ maxWidth: '600px' }}
      >
        <Form.Item
          label="Stock Category Name"
          name="Name"
          rules={[{ required: true, message: 'Please input the name!' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Alias"
          name="Namealias"
          rules={[{ required: true, message: 'Please input the alias!' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Stock Category"
          name="Namegroup"
          rules={[{ required: true, message: 'Please select the stock category!' }]}
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

export default StockcategoryForm;
