import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { Form, Input, Button, message, Space, Table, Pagination, Switch } from 'antd';
import { UserOutlined, LockOutlined, SearchOutlined } from '@ant-design/icons';
import { AppContext } from '../../../Context/AppContext';
import '../../../styles/user.css';
import Header from '../../components/Header';
import { useNavigate } from 'react-router-dom';

const UserForm = () => {
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [filteredUserData, setFilteredUserData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [userEnabled, setUserEnabled] = useState(false); // State to track user enablement
  const { companyName, setCompanyName } = useContext(AppContext);
  const { userName, setUserName } = useContext(AppContext);
  const navigate = useNavigate();

  useEffect(() => {
    const storedCompanyName = localStorage.getItem('companyName');
    if (storedCompanyName) {
      setCompanyName(storedCompanyName);
    }

    const storedUserName = localStorage.getItem('userName');
    if (storedUserName) {
      setUserName(storedUserName);
    }

    fetchUserData();
  }, [companyName]); // Run only once when component mounts

  const fetchUserData = async () => {
    try {
      if (companyName) {
        const response = await axios.get('http://localhost:5000/api/users', {
          params: { companyName: companyName }
        });
        setUserData(response.data);
        setFilteredUserData(response.data);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      message.error('Failed to fetch user data. Please try again.');
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/users-insert', {
        ...values,
        companyName: companyName,
        enabled: userEnabled // Pass user enablement status to API call
      });
      console.log('User added:', response.data);
      message.success('User added successfully!');
      fetchUserData();
    } catch (error) {
      console.error('Error adding user:', error);
      message.error('Failed to add user. Please try again.');
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

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchText(value);
    const filteredData = userData.filter(user => 
      user.username.toLowerCase().includes(value)
    );
    setFilteredUserData(filteredData);
    setCurrentPage(1);
  };

  const handlePageChange = (page, pageSize) => {
    setCurrentPage(page);
    setPageSize(pageSize);
  };

  const columns = [
    {
      title: 'User Name',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <span
          style={{
            color: 'white',
            backgroundColor: status ? 'green' : 'red',
            padding: '2px 6px',
            borderRadius: '4px',
          }}
        >
          {status ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];


  const handleUserStatusChange = async (userId, checked) => {
    try {
      // Update user status in the backend
      await axios.put(`http://localhost:5000/api/users/${userId}`, {
        enabled: checked
      });
      message.success('User status updated successfully!');
      // Refresh user data after status change
      fetchUserData();
    } catch (error) {
      console.error('Error updating user status:', error);
      message.error('Failed to update user status. Please try again.');
    }
  };

  return (
    <div className='app'> 
      <Header className="header"/>
      <div className="main-container">
        <div className="form-section">
          <div className="user-form-container">
            <h3>Add User</h3>
            <Form
              name="userForm"
              onFinish={onFinish}
              onFinishFailed={onFinishFailed}
              layout="vertical"
              className="user-form"
            >
              <Form.Item
                name="username"
                label="Username"
                rules={[{ required: true, message: 'Please enter username' }]}
              >
                <Input prefix={<UserOutlined className="site-form-item-icon" />} />
              </Form.Item>

              <Form.Item
                name="password"
                label="Password"
                rules={[{ required: true, message: 'Please enter password' }]}
              >
                <Input.Password prefix={<LockOutlined className="site-form-item-icon" />} />
              </Form.Item>

              <Form.Item
                name="enabled"
                valuePropName="checked"
                labelCol={{ span: 8 }}
                wrapperCol={{ span: 16 }}
                style={{ marginBottom: 0 }} // Remove bottom margin to align with other form items
                >
  <Space align="baseline">
    <span style={{ marginRight: 8 }}>Enable User</span>
    <Switch onChange={(checked) => setUserEnabled(checked)} />
  </Space>
</Form.Item>

              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" loading={loading} className='submit-button'>
                    Add User
                  </Button>
                  <Button htmlType="reset" onClick={() => {}} className='reset-button'>
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
          <h3>List of Users</h3>
          <Input
            placeholder="Search by username"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={handleSearch}
            style={{ marginBottom: 20 }}
          />
          <Table
            className="user-form-table"
            dataSource={filteredUserData.slice((currentPage - 1) * pageSize, currentPage * pageSize)}
            columns={columns}
            rowKey="id"
            pagination={false}
          />
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={filteredUserData.length}
            onChange={handlePageChange}
            showSizeChanger
            pageSizeOptions={['5', '10', '20', '50']}
            showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
            style={{ marginTop: 20, textAlign: 'right' }}
          />
        </div>
      </div>
    </div>
  );
};

export default UserForm;
