import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { Form, Input, Button, Select, Divider,message } from 'antd';
import { createGodown, fetchGodown } from '../../utils/RestApi'; // Assuming correct import path
import { AppContext } from '../../../Context/AppContext';
import { useNavigate } from 'react-router-dom';
import {BASE_URL} from '../../utils/Ipurl';

const { Option } = Select;

const GodownForm = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { companyName, setCompanyName } = useContext(AppContext);
  const [GodownOptions, setGodownOptions] = useState([]);
  const [loading, setLoading] = useState(false);
 
  
  const defaultGowdown = [
    'Primary'
  ];

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  useEffect(() => {
    const storedCompanyName = localStorage.getItem('companyName');
    if (storedCompanyName) {
      setCompanyName(storedCompanyName);
    }
  }, [setCompanyName]);

  useEffect(() => {
    const fetchGodownFromDatabase = async () => {
        try {
            const response = await fetchGodown(companyName); // Pass companyName as a parameter
            if (response.success) {
                const databaseGodowns = response.Godowns || []; // Ensure groups is not null
                const combinedGodowns = [...defaultGowdown, ...databaseGodowns]; // Merge defaultGroups with databaseGroups

                // Convert combinedGroups to a Set to remove duplicates, then convert back to an array
                const uniqueGodowns = Array.from(new Set(combinedGodowns));

                setGodownOptions(uniqueGodowns);
            } else {
                console.error('Failed to fetch groups:', response.message);
            }
        } catch (error) {
            console.error('Error fetching groups from database:', error);
        }
    };
if(companyName)
    fetchGodownFromDatabase();
}, [companyName]);


const onFinish = async (values) => {
    setLoading(true);
    try {
        const response = await axios.post(BASE_URL+'/create-Godown', {
          ...values,
          companyName: companyName,
        });
        console.log('Godown added:', response.data);
        message.success('Godown added successfully!');
        navigate('/Dashboard');
    } catch (error) {
      console.error('Error adding Godown Man:', error);
      message.error('Failed to add Godown. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo);
    message.error('Please fill in all required fields.');

  };

  return (
    <div className="group-form">
      <h4>Godown Creation</h4>
      
      <Divider />

      <Form
        form={form}
        name="group_creation"
        initialValues={{ remember: true }}
        
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        onCancel={handleCancel}
        layout="vertical"
        style={{ maxWidth: '600px' }}
      >
        <Form.Item
          label="Name"
          name="Godownname"
          rules={[{ required: true, message: 'Please input the name!' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Alias"
          name="Godownalias"
          
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Group"
          name="Godowngroup"
          
        >
          <Select showSearch optionFilterProp="children">
            {GodownOptions.map((Gowdown) => (
              <Option key={Gowdown} value={Gowdown}>
                {Gowdown}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit">
            Submit
          </Button>
          <Button onClick={handleCancel} style={{ marginLeft: '10px' }}>
                Cancel
              </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default GodownForm;
