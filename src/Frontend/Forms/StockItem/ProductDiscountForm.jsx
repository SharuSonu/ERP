import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Input, Button, DatePicker, Select, message, Divider } from 'antd';
import moment from 'moment';
import { DeleteOutlined } from '@ant-design/icons';
import { AppContext } from '../../../Context/AppContext';
import { useNavigate } from 'react-router-dom';

const { Option } = Select;

const ProductDiscountForm = ({ productId }) => {
  const navigate = useNavigate();
  const { companyName } = useContext(AppContext);
  const [discounts, setDiscounts] = useState([]);
  const [applicableDates, setApplicableDates] = useState([]);
  const [thresholdValues, setThresholdValues] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (companyName) {
      fetchUsers(); // Fetch users based on companyName when it changes
    }
  }, [companyName]);

  // Function to fetch users
  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/users', {
        params: { companyName: companyName }
      });
      // Handle response and set users state
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      message.error('Failed to fetch users. Please try again.');
    }
  };

  // Function to add a new discount input field
  const handleAddDiscount = () => {
    setDiscounts([...discounts, '']);
    setApplicableDates([...applicableDates, null]);
    setThresholdValues([...thresholdValues, '']);
    setSelectedUsers([...selectedUsers, null]);
  };

  // Function to remove a discount input field
  const handleRemoveDiscount = (index) => {
    const newDiscounts = [...discounts];
    const newApplicableDates = [...applicableDates];
    const newThresholdValues = [...thresholdValues];
    const newSelectedUsers = [...selectedUsers];

    newDiscounts.splice(index, 1);
    newApplicableDates.splice(index, 1);
    newThresholdValues.splice(index, 1);
    newSelectedUsers.splice(index, 1);

    setDiscounts(newDiscounts);
    setApplicableDates(newApplicableDates);
    setThresholdValues(newThresholdValues);
    setSelectedUsers(newSelectedUsers);
  };

  // Function to handle change in discount input field
  const handleDiscountChange = (index, value) => {
    const newDiscounts = [...discounts];
    newDiscounts[index] = value;
    setDiscounts(newDiscounts);
  };

  // Function to handle change in applicable date
  const handleDateChange = (index, date) => {
    const newApplicableDates = [...applicableDates];
    newApplicableDates[index] = date;
    setApplicableDates(newApplicableDates);
  };

  // Function to handle change in threshold value
  const handleThresholdChange = (index, value) => {
    const newThresholdValues = [...thresholdValues];
    newThresholdValues[index] = value;
    setThresholdValues(newThresholdValues);
  };

  const handleUserChange = (index, value) => {
    const newSelectedUsers = [...selectedUsers];
    newSelectedUsers[index] = value;
    setSelectedUsers(newSelectedUsers);
  };

  // Function to handle form submission
  const handleSubmit = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/save-discounts', {
        companyName: companyName,
        productId: productId,
        discounts: discounts.map((discount, index) => ({
          discount: discount,
          applicableDate: applicableDates[index],
          thresholdValue: thresholdValues[index],
          userName: selectedUsers[index]
        }))
      });
      message.success('Discounts saved successfully!');
      //navigate('/productconfig'); // Redirect to product configuration page after successful save
    } catch (error) {
      console.error('Error saving discounts:', error);
      message.error('Failed to save discounts. Please try again.');
    }
  };

  return (
    <div className="product-discount-threshold-container">
      <Divider />
      <h3>Manage Discounts with Threshold Value for Product</h3>
      <form onSubmit={handleSubmit}>
        {discounts.map((discount, index) => (
          <div key={index} className="discount-item">
            <Input
              placeholder="Enter Discount (%)"
              value={discount}
              onChange={(e) => handleDiscountChange(index, e.target.value)}
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
            <Input
              placeholder="Enter Threshold Value (%)"
              value={thresholdValues[index]}
              onChange={(e) => handleThresholdChange(index, e.target.value)}
              style={{ marginRight: 10, width: 200 }}
            />
            <Button
              type="danger"
              icon={<DeleteOutlined />}
              onClick={() => handleRemoveDiscount(index)}
              style={{ marginLeft: 10, backgroundColor: '#db331d', color: 'white' }}
            >
              Remove
            </Button>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 10 }}>
          <Button type="primary" onClick={handleAddDiscount} style={{ backgroundColor: '#de9f16' }}>
            Add Discount
          </Button>
          <Button type="primary" htmlType="submit" style={{ marginLeft: 10, color: 'white' }}>
            Save
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProductDiscountForm;
