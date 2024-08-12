import React, { useState, useContext, useEffect } from 'react';
import { Form, Input, Button, Select, Divider } from 'antd';
import { createGroup, fetchGroups } from '../../utils/RestApi'; // Assuming correct import path
import { AppContext } from '../../../Context/AppContext';
import '../../../styles/GroupForm.css';

const { Option } = Select;

const GroupForm = () => {
  const [form] = Form.useForm();
  const { companyName, setCompanyName } = useContext(AppContext);
  const [groupOptions, setGroupOptions] = useState([]);

  const defaultGroups = [
    'Bank Accounts',
    'Bank OD A/c',
    'Branch / Divisions',
    'Capital Account',
    'Cash-in-Hand',
    'Current Assets',
    'Current Liabilities',
    'Deposits (Asset)',
    'Direct Expenses',
    'Direct Incomes',
    'Duties & Taxes',
    'Fixed Assets',
    'Indirect Expenses',
    'Indirect Incomes',
    'Investments',
    'Loans & Advances (Asset)',
    'Loans (Liability)',
    'Misc. Expenses (ASSET)',
    'Provisions',
    'Purchase Accounts',
    'Reserves & Surplus',
    'Sales Accounts',
    'Secured Loans',
    'Stock-in-Hand',
    'Sundry Creditors',
    'Sundry Debtors',
    'Suspense A/c',
    'Unsecured Loans',
    'Primary'
  ];

  useEffect(() => {
    const storedCompanyName = localStorage.getItem('companyName');
    if (storedCompanyName) {
      setCompanyName(storedCompanyName);
    }
  }, [setCompanyName]);

  useEffect(() => {
    const fetchGroupsFromDatabase = async () => {
        try {
            const response = await fetchGroups(companyName); // Pass companyName as a parameter
            if (response.success) {
                const databaseGroups = response.groups || []; // Ensure groups is not null
                const combinedGroups = [...defaultGroups, ...databaseGroups]; // Merge defaultGroups with databaseGroups

                // Convert combinedGroups to a Set to remove duplicates, then convert back to an array
                const uniqueGroups = Array.from(new Set(combinedGroups));

                setGroupOptions(uniqueGroups);
            } else {
                console.error('Failed to fetch groups:', response.message);
            }
        } catch (error) {
            console.error('Error fetching groups from database:', error);
        }
    };

    fetchGroupsFromDatabase();
}, [companyName]);


  const onFinish = async (values) => {
    console.log('Form Values:', values);
    const groupData = {
      ...values,
      databaseName: companyName,
    };
    try {
      const response = await createGroup(groupData);

      if (response.success) {
        alert('Group created successfully');
        form.resetFields();
      } else {
        alert(response.message || 'Failed to create group');
      }
    } catch (error) {
      console.error('Error:', error);
      alert(error.message || 'An error occurred');
    }
  };

  return (
    <div className="common-form">
      <h4>𝑮𝒓𝒐𝒖𝒑 𝑪𝒓𝒆𝒂𝒕𝒊𝒐𝒏</h4>
      <Divider />

      <Form
        form={form}
        name="group_creation"
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
            {groupOptions.map((group) => (
              <Option key={group} value={group}>
                {group}
              </Option>
            ))}
          </Select>
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

export default GroupForm;
