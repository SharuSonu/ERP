import React, { useState, useEffect, useContext} from 'react';
import axios from 'axios';
import { Input, Button, DatePicker, Select, Form, message, Divider } from 'antd';
import moment from 'moment';
import { UserOutlined, DeleteOutlined } from '@ant-design/icons';
import { AppContext } from '../../../Context/AppContext';
import { useNavigate } from 'react-router-dom';
import ProductConfig from './ProductConfig';


const { Option } = Select;

const ProductCostPrice = ({ productId }) => {
  const navigate = useNavigate();
  const [costPrices, setCostPrices] = useState([]);
  const [applicableDates, setApplicableDates] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [users, setUsers] = useState([]);
  const { companyName } = useContext(AppContext);

  useEffect(() => {
    //if(companyName)
     // fetchUsers();
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

  const handleAddCostPrice = () => {
    setCostPrices([...costPrices, '']);
    setApplicableDates([...applicableDates, null]);
    setSelectedUsers([...selectedUsers, null]);
  };

  const handleRemoveCostPrice = (index) => {
    const newCostPrices = [...costPrices];
    const newApplicableDates = [...applicableDates];
    const newSelectedUsers = [...selectedUsers];

    newCostPrices.splice(index, 1);
    newApplicableDates.splice(index, 1);
    newSelectedUsers.splice(index, 1);

    setCostPrices(newCostPrices);
    setApplicableDates(newApplicableDates);
    setSelectedUsers(newSelectedUsers);
  };

  const handleCostPriceChange = (index, value) => {
    const newCostPrices = [...costPrices];
    newCostPrices[index] = value;
    setCostPrices(newCostPrices);
  };

  const handleDateChange = (index, date) => {
    const newApplicableDates = [...applicableDates];
    newApplicableDates[index] = date ? date : null;
    setApplicableDates(newApplicableDates);
  };

  const handleUserChange = (index, value) => {
    const newSelectedUsers = [...selectedUsers];
    newSelectedUsers[index] = value;
    setSelectedUsers(newSelectedUsers);
  };

  const handleSubmit = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/save-cost-prices', {
        companyName:companyName,
        productId: productId,
        costPrices: costPrices.map((price, index) => ({
          price: price,
          applicableDate: applicableDates[index]
          //userId: selectedUsers[index]
        }))
      });
      message.success('Cost prices saved successfully!');
      navigate('/productconfig');
      // Optionally, redirect or perform any necessary action upon successful submission
    } catch (error) {
      console.error('Error saving cost prices:', error);
      message.error('Failed to save cost prices. Please try again.');
    }
  };

  

  return (
    <div className="product-cost-price-container">
        <Divider></Divider>
      <h3>Manage Cost Prices for Product</h3>
      <Form layout="vertical" onFinish={handleSubmit}>
        {costPrices.map((price, index) => (
          <div key={index} className="cost-price-item">
            <Input
              placeholder="Enter Cost Price"
              value={price}
              onChange={(e) => handleCostPriceChange(index, e.target.value)}
              style={{ marginRight: 10, width: 200 }}
              
            />
            <DatePicker
              placeholder="Select Applicable Date"
              value={applicableDates}
              onChange={(date) => handleDateChange(index, date)}
              style={{ marginRight: 10 }}
              allowClear
            />
            
            <Button type="danger" icon={<DeleteOutlined/>} onClick={() => handleRemoveCostPrice(index)} style={{ marginLeft: 10, backgroundColor: '#db331d', color: 'white'}}>
              Remove
            </Button>
          </div>
        ))}
        
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
  <Button 
    type="primary" 
    onClick={handleAddCostPrice} 
    style={{ backgroundColor: '#de9f16' }}
  >
    Add Cost Price
  </Button>
  <Button 
    type="primary"
    htmlType="submit" 
    style={{ marginLeft: 10, color: 'white' }}
  >
    Save
  </Button>
</div>

      </Form>
    </div>
  );
};

export default ProductCostPrice;
