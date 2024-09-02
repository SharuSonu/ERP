import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Input, Button, DatePicker, Form, message, Divider } from 'antd';
import moment from 'moment';
import { DeleteOutlined } from '@ant-design/icons';
import { AppContext } from '../../../Context/AppContext';
import { useNavigate } from 'react-router-dom';

const ProductCostPrice = ({ productId }) => {
  const navigate = useNavigate();
  const [costPrices, setCostPrices] = useState([]);
  const [applicableDates, setApplicableDates] = useState([]);
  const { companyName } = useContext(AppContext);

  useEffect(() => {
    // Fetch users if necessary
  }, [companyName]);

  const handleAddCostPrice = () => {
    setCostPrices([...costPrices, '']);
    setApplicableDates([...applicableDates, null]);
  };

  const handleRemoveCostPrice = (index) => {
    const newCostPrices = [...costPrices];
    const newApplicableDates = [...applicableDates];

    newCostPrices.splice(index, 1);
    newApplicableDates.splice(index, 1);

    setCostPrices(newCostPrices);
    setApplicableDates(newApplicableDates);
  };

  const handleCostPriceChange = (index, value) => {
    const newCostPrices = [...costPrices];
    newCostPrices[index] = value;
    setCostPrices(newCostPrices);
  };

  function addOneDay(dateInput) {
    let date;

    // Check if input is a string or Date object
    if (typeof dateInput === 'string') {
        date = new Date(dateInput);
    } else if (dateInput instanceof Date) {
        date = new Date(dateInput);
    } else {
        throw new Error('Invalid date input');
    }

    // Validate the date
    if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
    }

    // Add one day
    date.setDate(date.getDate() + 1);
    return date;
}


  const handleDateChange = (index, date) => {
    
    const newApplicableDates = [...applicableDates];
    //let appldate = date
    //newApplicableDates[index] = date ? addOneDay(date) : null;
    newApplicableDates[index] = date; //? addOneDay(date) : null;
    setApplicableDates(newApplicableDates);
  };

  const handleSubmit = async () => {
    try {
        const dataToSend = costPrices.map((price, index) => ({
            price: price,
            applicableDate: applicableDates[index] ? applicableDates[index] : null,
        }));

        const response = await axios.post('http://localhost:5000/api/save-cost-prices', {
            companyName: companyName,
            productId: productId,
            costPrices: dataToSend
        });

        message.success('Cost prices saved successfully!');
        navigate('/productconfig');
    } catch (error) {
        console.error('Error saving cost prices:', error);
        message.error('Failed to save cost prices. Please try again.');
    }
  };

  return (
    <div className="product-cost-price-container">
      <Divider />
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
              value={applicableDates[index]}
              onChange={(date) => handleDateChange(index, date)}
              style={{ marginRight: 10 }}
              allowClear
            />
            <Button 
              type="danger" 
              icon={<DeleteOutlined />} 
              onClick={() => handleRemoveCostPrice(index)} 
              style={{ marginLeft: 10, backgroundColor: '#db331d', color: 'white' }}
            >
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