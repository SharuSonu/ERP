import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Input, Button, DatePicker, Select, Form, message, Divider } from 'antd';
import moment from 'moment';
import { UserOutlined, DeleteOutlined } from '@ant-design/icons';
import { AppContext } from '../../../Context/AppContext';
import { useNavigate } from 'react-router-dom';
import ProductConfig from './ProductConfig';

const { Option } = Select;

const ProductSellingPrice = ({ productId }) => {
  const navigate = useNavigate();
  const [sellingPrices, setSellingPrices] = useState([]);
  const [applicableDates, setApplicableDates] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [users, setUsers] = useState([]);
  const { companyName } = useContext(AppContext);

  useEffect(() => {
    if(companyName)
      fetchUsers();
  }, [companyName]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/users', {
        params: { companyName: companyName }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      message.error('Failed to fetch users. Please try again.');
    }
  };

  const handleAddSellingPrice = () => {
    setSellingPrices([...sellingPrices, '']);
    setApplicableDates([...applicableDates, null]);
    setSelectedUsers([...selectedUsers, null]);
  };

  const handleRemoveSellingPrice = (index) => {
    const newSellingPrices = [...sellingPrices];
    const newApplicableDates = [...applicableDates];
    const newSelectedUsers = [...selectedUsers];

    newSellingPrices.splice(index, 1);
    newApplicableDates.splice(index, 1);
    newSelectedUsers.splice(index, 1);

    setSellingPrices(newSellingPrices);
    setApplicableDates(newApplicableDates);
    setSelectedUsers(newSelectedUsers);
  };

  const handleSellingPriceChange = (index, value) => {
    const newSellingPrices = [...sellingPrices];
    newSellingPrices[index] = value;
    setSellingPrices(newSellingPrices);
  };

  const handleDateChange = (index, date) => {
    const newApplicableDates = [...applicableDates];
    newApplicableDates[index] = date;
    setApplicableDates(newApplicableDates);
  };

  const handleUserChange = (index, value) => {
    const newSelectedUsers = [...selectedUsers];
    newSelectedUsers[index] = value;
    setSelectedUsers(newSelectedUsers);
  };

  const handleSubmit = async () => {
    try {
      console.log("Product Id",productId);
      const response = await axios.post('http://localhost:5000/api/save-selling-prices', {
        companyName:companyName,
        productId: productId,
        sellingPrices: sellingPrices.map((price, index) => ({
          price: price,
          applicableDate: applicableDates[index],
          userName: selectedUsers[index]
        }))
      });
      message.success('Selling prices saved successfully!');
      //navigate('/productconfig');
      // Optionally, redirect or perform any necessary action upon successful submission
    } catch (error) {
      console.error('Error saving selling prices:', error);
      message.error('Failed to save selling prices. Please try again.');
    }
  };

  return (
    <div className="product-selling-price-container">
      <Divider></Divider>
      <h3>Manage Selling Prices for Product</h3>
      <Form layout="vertical" onFinish={handleSubmit}>
        {sellingPrices.map((price, index) => (
          <div key={index} className="selling-price-item">
            <Input
              placeholder="Enter Selling Price"
              value={price}
              onChange={(e) => handleSellingPriceChange(index, e.target.value)}
              style={{ marginRight: 10, width: 200 }}
            />
            <DatePicker
              placeholder="Select Applicable Date"
              value={applicableDates}
              onChange={(date) => handleDateChange(index, date)}
              style={{ marginRight: 10 }}
            />
            <Select
              showSearch
              placeholder="Select User"
              value={selectedUsers[index]}
              onChange={(value) => handleUserChange(index, value)}
              style={{ width: 200 }}
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {users.map(user => (
                <Option key={user.id} value={user.username}>
                  {user.username}
                </Option>
              ))}
            </Select>
            <Button type="danger" icon={<DeleteOutlined />} onClick={() => handleRemoveSellingPrice(index)} style={{ marginLeft: 10, backgroundColor: '#db331d', color: 'white' }}>
              Remove
            </Button>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
        <Button type="primary" onClick={handleAddSellingPrice} style={{ backgroundColor: '#de9f16' }}>
          Add Selling Price
        </Button>
        <Button type="primary" htmlType="submit" style={{ marginLeft: 10, color: 'white' }}>
          Save
        </Button>
        </div>
      </Form>
    </div>
  );
};

export default ProductSellingPrice;
