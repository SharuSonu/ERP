// SalesManform.jsx
//Form to create a form in Webpage

import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { Modal,Button, Form, Input,message} from 'antd';
import { UserOutlined, LockOutlined, NumberOutlined } from '@ant-design/icons';
import { AppContext } from '../../../Context/AppContext';
import '../../../styles/UserForm.css';
import Header from '../../components/Header';
import { createSalesman, fetchSalesman } from '../../utils/RestApi';
import { useNavigate } from 'react-router-dom';
import SalesmanList from './SalesManlist';
import '../../../styles/Salesman.css';


const SalesManForm = () => {
  
    const [loading, setLoading] = useState(false);
    const { companyName, setCompanyName } = useContext(AppContext);
    const { userName, setUserName } = useContext(AppContext);
    const navigate = useNavigate();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [SalesmanOptions, setSalesmanOptions] = useState([]);
    
  
    useEffect(() => {
      const storedCompanyName = localStorage.getItem('companyName');
      if (storedCompanyName) {
        setCompanyName(storedCompanyName);
      }
          
    }, [companyName]); // Run only once when component mounts

    const showModal = () => {
      setIsModalVisible(true);
    };

    
    const handleCancel = () => {
      setIsModalVisible(false);
    };

    useEffect(() => {
      const fetchSalesmanFromDatabase = async () => {
          try {
              const response = await fetchSalesman(companyName); // Pass companyName as a parameter
              if (response.success) {
                  const databaseSalesman = response.Salesman || []; // Ensure groups is not null
                  const combinedSalesman = [ ...databaseSalesman]; // Merge defaultGroups with databaseGroups
  
                  // Convert combinedGroups to a Set to remove duplicates, then convert back to an array
                  const uniqueSalesman = Array.from(new Set(combinedSalesman));
  
                  setSalesmanOptions(uniqueSalesman);
              } else {
                  console.error('Failed to fetch groups:', response.message);
              }
          } catch (error) {
              console.error('Error fetching groups from database:', error);
          }
      };
      if(companyName)
       fetchSalesmanFromDatabase();
  }, [companyName]);
  
  
    const onFinish = async (values) => {
      setLoading(true);
      try {
          const response = await axios.post('http://localhost:5000/api/create-Salesman', {
            ...values,
            companyName: companyName,
          });
          console.log('Sales Man added:', response.data);
          message.success('Sales Man added successfully!');
          navigate('/Dashboard');
      } catch (error) {
        console.error('Error adding Sales Man:', error);
        message.error('Failed to add Sales Man. Please try again.');
      } finally {
        setLoading(false);
      }
    };
  
    const onFinishFailed = (errorInfo) => {
      console.log('Failed:', errorInfo);
      message.error('Please fill in all required fields.');
  
    };
    
  
    return (
      
      <div>
        <h2 style={{ textAlign: 'center' }}>𝑺𝒂𝒍𝒆𝒔 𝑷𝒆𝒓𝒔𝒐𝒏 𝑷𝒓𝒐𝒇𝒊𝒍𝒆</h2>
        <Button type="primary" onClick={showModal}>
          Sales Person Creation 
        </Button>
        <Modal
        
          title={<div style={{ textAlign: 'center' }}>𝑬𝒏𝒕𝒆𝒓 𝑺𝒂𝒍𝒆𝒔 𝑷𝒆𝒓𝒔𝒐𝒏 𝑫𝒆𝒕𝒂𝒊𝒍𝒔</div>}
          visible={isModalVisible}
          onCancel={handleCancel}
          footer={null} // No footer or customize with actions if needed
        >
          
          <Form
          
          name="SalesMan"
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          layout="vertical"
          className="SalesMan-form"
          >
            <Form.Item
             label={<span style={{ fontFamily: 'Arial', fontSize: '13px', fontWeight: 'bold' }}>SalesMan Name</span>}
              name="SalesManName"
              rules={[{ required: true, message: 'Please enter your  Salesman name!' }]}
            >
              <Input />
            </Form.Item>
  
            <Form.Item
              label={<span style={{ fontFamily: 'Arial', fontSize: '13px', fontWeight: 'bold' }}>SalesMan Number</span>}
              name="SalesManNumber"
              rules={[{ required: true, message: 'Please enter your  Salesman Number!' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label={<span style={{ fontFamily: 'Arial', fontSize: '13px', fontWeight: 'bold' }}>SalesMan Email ID</span>}
              name="SalesManEmailId"
              rules={[{ required: true, message: 'Please enter your  Salesman EmailID!' }]}
            >
              <Input />
            </Form.Item>
  
            <Form.Item>
              <Button type="primary" htmlType="submit">
                Save
              </Button>
              <Button onClick={handleCancel} style={{ marginLeft: '10px' }}>
                Cancel
              </Button>
            </Form.Item>
          </Form>
        </Modal>  
        <SalesmanList></SalesmanList>
      </div>
    );
  };
      
      
  export default SalesManForm;
  