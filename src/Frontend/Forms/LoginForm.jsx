import React, { useState, useEffect, useContext } from 'react';
import { Form, Input, Button, Radio, Divider, Select, message } from 'antd'; // Import message from antd
import { fetchDatabases, loginAdmin, loginUser } from '../utils/RestApi';
import { useNavigate } from 'react-router-dom';

import '../../styles/loginform.css';
import { AppContext } from '../../Context/AppContext'; // Import AppContext

const { Option } = Select;

const LoginForm = () => {
    const [loginType, setLoginType] = useState('admin');
    const [databases, setDatabases] = useState([]);
    const [error, setError] = useState(''); // State variable for holding error message
    const { setCompanyName } = useContext(AppContext);
    const { userName, setUserName } = useContext(AppContext);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetchDatabases();
                setDatabases(response.databases);
            } catch (error) {
                console.error('Error fetching databases:', error);
            }
        };

        fetchData();
    }, []);

    const handleLoginTypeChange = (e) => {
        setLoginType(e.target.value);
    };

    const onFinish = async (values) => {
        try {
            if(loginType=='admin'){
            const response = await loginAdmin(values);
            localStorage.setItem('token', response.token);
            
            // Extract company name from form values
             //const companyName = values.databaseName.replace(/^erp_/, '').charAt(0).toUpperCase() + values.databaseName.replace(/^erp_/, '').slice(1);
               const companyName = response.comp; 
             //instead of databaseName seting organization table column name value becz of special characters 
            // Set company name context
            setCompanyName(companyName);
            setUserName(values.username);
            localStorage.setItem('companyName', companyName);
            localStorage.setItem('userName', values.username);

            navigate('/Dashboard');
        }
            else
            {
            const response = await loginUser(values);
            localStorage.setItem('token', response.token);
            
            // Extract company name from form values
             const companyName = values.databaseName.replace(/^erp_/, '').charAt(0).toUpperCase() + values.databaseName.replace(/^erp_/, '').slice(1);
        
            // Set company name context
            setCompanyName(companyName);
            setUserName(values.username);
            localStorage.setItem('companyName', companyName);
            localStorage.setItem('userName', values.username);
            navigate('/Dashboard');
            }
            
        } catch (error) {
            console.error('Login failed:', error);
            setError('Invalid username or password'); // Set error message state
            message.error('Invalid username or password'); // Show error message using antd message component
        }
    };

    const handleCreateCompanyAccount = () => {
        navigate('/Register');
    };

    return (
    <div className="Login-main-form">
         <img src="src/assets/images/login/test.jpg" alt="Img" style={{width:'100vw', height:'100vh'}} />
            
       <div className='Login-main-part'>
            <img src="src/assets/images/login/SunIT Logo.png" alt="oops"/>

          <div className="login-form-container">
             <Divider className='Login-title'>RETAIL MANAGEMENT </Divider>
             <Form
                name="login-form"
                initialValues={{ remember: true }}
                onFinish={onFinish}
            >
                <Form.Item name="loginType" initialValue="admin">
                    <Radio.Group onChange={handleLoginTypeChange}>
                        <Radio value="admin">Login as Admin</Radio>
                        <Radio value="user">Login as User</Radio>
                    </Radio.Group>
                </Form.Item>

                <Form.Item
                    name="databaseName"
                    rules={[{ required: true, message: 'Please select a company!' }]}
                >
                    <Select placeholder="Select a company" style={{Color:'#BFDCF2'}}>
                        {databases.map((database) => (
                            <Option key={database} value={database}>
                                {database.replace(/^erp_/, '')}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    name="username"
                    rules={[{ required: true, message: 'Please input your username!' }]}
                    style={{Color:'#BFDCF2'}}
                >
                    <Input placeholder="Username" />
                </Form.Item>

                <Form.Item
                    name="password"
                    rules={[{ required: true, message: 'Please input your password!' }]}
                    style={{Color:'#BFDCF2'}}
                >
                    <Input.Password placeholder="Password" />
                </Form.Item>

                <Form.Item>
                    <Button type="primary" htmlType="submit" style={{backgroundColor:'#046FB0'}}>
                        Login as {loginType === 'admin' ? 'Admin' : 'User'}
                    </Button>
                </Form.Item>

                <Form.Item>
                    <Button type="link" htmlType="button" onClick={handleCreateCompanyAccount} style={{backgroundColor:'#BFDCF2'}}>
                        Create Company Account
                    </Button>
                </Form.Item>

                {error && <p style={{ color: 'red' }}>{error}</p>} {/* Display error message */}
            </Form>
              
         </div>
       </div>
    </div>
     
    );
};



export default LoginForm;
