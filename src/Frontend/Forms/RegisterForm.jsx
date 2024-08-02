import React, { useState, useContext } from 'react';
import { Form, Input, Select, Button, Checkbox, DatePicker, Upload, message } from 'antd';
import { PlusOutlined, MinusCircleOutlined, UploadOutlined } from '@ant-design/icons';
import moment from 'moment'; // Import moment.js for date formatting
import { createDatabase } from '../utils/RestApi';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../../Context/AppContext';

const { Option } = Select;

const RegisterForm = () => {
    const [isGSTRegistered, setIsGSTRegistered] = useState(false);
    const [addresses, setAddresses] = useState([]);
    const [logoFileList, setLogoFileList] = useState([]);
    const { setCompanyName } = useContext(AppContext);
    const navigate = useNavigate();

    const onFinish = async (values) => {
        const formattedAddresses = addresses.map((address, index) => ({
            streetAddress1: values[`streetAddress1_${index}`] || '',
            streetAddress2: values[`streetAddress2_${index}`] || '',
            streetAddress3: values[`streetAddress3_${index}`] || '',
            streetAddress4: values[`streetAddress4_${index}`] || '',
            streetAddress5: values[`streetAddress5_${index}`] || '',
            city: values[`city_${index}`] || '',
            zip: values[`zip_${index}`] || ''
        }));

        // Format dates using moment.js
        const formattedFinancialYear = moment(values.financialYear).format('YYYY-MM-DD');
        const formattedBooksFromDate = moment(values.booksFromDate).format('YYYY-MM-DD');
  
        const payload = { ...values, addresses: formattedAddresses, financialYear: formattedFinancialYear, booksFromDate: formattedBooksFromDate };

        try {
            const response = await createDatabase(payload);

            if (response.success === true) {
                alert('Organization created successfully');
                setCompanyName(values.organizationName);
                localStorage.setItem('companyName', values.organizationName);
                navigate('/Dashboard');
            } else {
                alert(response.message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert(error.message || 'An error occurred');
        }
    };

    const addAddress = () => {
        setAddresses([...addresses, { key: Date.now() }]);
    };

    const removeAddress = (key) => {
        setAddresses(addresses.filter(address => address.key !== key));
    };

    const handleLogoFileChange = ({ fileList }) => {
        setLogoFileList(fileList);
    };

    // Custom function for file upload
    const customUpload = async (options) => {
        const { onSuccess, onError, file } = options;

        try {
            // Simulating file upload success
            setTimeout(() => {
                onSuccess("Ok");
            }, 2000);
        } catch (error) {
            console.error('File upload error:', error);
            onError("Upload failed");
        }
    };

    return (
        <div className="form-container" style={{ padding: '50px', margin: 'auto', marginLeft: '250px', marginRight: '250px' }}>
            <h2 style={{ textAlign: 'center' }}>Set up your organization profile</h2>
            <p style={{ textAlign: 'left', marginTop: 40 }}>ORGANIZATIONAL DETAILS</p>

            <Form
                name="organization_profile"
                initialValues={{ remember: true }}
                onFinish={onFinish}
                layout='vertical'
            >
                <Form.Item
                    label="Organization Name"
                    name="organizationName"
                    rules={[{ required: true, message: 'Please input your organization name!' }]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    label="Industry"
                    name="industry"
                    
                >
                    <Select>
                        <Option value="IT">IT</Option>
                        <Option value="Finance">Finance</Option>
                        <Option value="Healthcare">Healthcare</Option>
                        <Option value="Traders">Traders</Option>
                    </Select>
                </Form.Item>

                <Form.Item
                    label="Organization Location"
                    style={{ textAlign: 'left' }}
                >
                    <Form.Item
                        label="Country"
                        name="country"
                        rules={[{ required: true, message: 'Please select country!' }]}
                        style={{ display: 'inline-block', width: 'calc(50% - 8px)' }}
                    >
                        <Select>
                            <Option value="India">India</Option>
                            <Option value="USA">USA</Option>
                            <Option value="UK">UK</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label="State/Union Territory"
                        name="state"
                        rules={[{ required: true, message: 'Please select state/union territory!' }]}
                        style={{ display: 'inline-block', width: 'calc(50% - 8px)', marginLeft: '16px' }}
                    >
                        <Select>
                            <Option value="Delhi">Delhi</Option>
                            <Option value="Mumbai">Mumbai</Option>
                            <Option value="Karnataka">Karnataka</Option>
                        </Select>
                    </Form.Item>
                </Form.Item>

                <Form.Item
                    label="Organization Branch"
                    name="organizationBranch"
                    rules={[{ required: true, message: 'Please input your organization Branch!' }]}
                >
                    <Input />
                </Form.Item>

                {addresses.length > 0 && (
                    <Form.Item
                        label="ORGANIZATION ADDRESSES"
                        style={{ textAlign: 'left' }}
                    >
                        {addresses.map((address, index) => (
                            <div key={address.key} style={{ position: 'relative', marginBottom: '20px' }}>
                                <Form.Item
                                    label="Street Address 1"
                                    name={`streetAddress1_${index}`}
                                >
                                    <Input />
                                </Form.Item>

                                <Form.Item
                                    label="Street Address 2"
                                    name={`streetAddress2_${index}`}
                                >
                                    <Input />
                                </Form.Item>

                                <Form.Item
                                    label="Street Address 3"
                                    name={`streetAddress2_${index}`}
                                >
                                    <Input />
                                </Form.Item>

                                <Form.Item
                                    label="Street Address 4"
                                    name={`streetAddress2_${index}`}
                                >
                                    <Input />
                                </Form.Item>

                                <Form.Item
                                    label="Street Address 5"
                                    name={`streetAddress2_${index}`}
                                >
                                    <Input />
                                </Form.Item>
                            
                                <Form.Item
                                    label="City"
                                    name={`city_${index}`}
                                    rules={[{ required: true, message: 'Please enter city!' }]}
                                >
                                    <Input />
                                </Form.Item>

                                <Form.Item
                                    label="Zip/Postal Code"
                                    name={`zip_${index}`}
                                    rules={[{ required: true, message: 'Please enter zip/postal code!' }]}
                                >
                                    <Input />
                                </Form.Item>

                                <MinusCircleOutlined
                                    style={{ position: 'absolute', top: '0', right: '0', cursor: 'pointer' }}
                                    onClick={() => removeAddress(address.key)}
                                />
                            </div>
                        ))}
                    </Form.Item>
                )}

                <Form.Item>
                    <Button type="dashed" icon={<PlusOutlined />} onClick={addAddress}>Add Organization Address</Button>
                </Form.Item>

                <Form.Item
                    label="REGIONAL SETTINGS"
                    style={{ textAlign: 'left' }}
                >
                    <Form.Item
                        label="Currency"
                        name="currency"
                        rules={[{ required: true, message: 'Please select currency!' }]}
                        style={{ display: 'inline-block', width: 'calc(50% - 8px)' }}
                    >
                        <Select>
                            <Option value="INR">INR</Option>
                            <Option value="USD">USD</Option>
                            <Option value="EUR">EUR</Option>
                            <Option value="GBP">GBP</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label="Language"
                        name="language"
                        rules={[{ required: true, message: 'Please select language!' }]}
                        style={{ display: 'inline-block', width: 'calc(50% - 8px)', marginLeft: '16px' }}
                    >
                        <Select>
                            <Option value="English">English</Option>
                            <Option value="Spanish">Spanish</Option>
                            <Option value="French">French</Option>
                        </Select>
                    </Form.Item>
                </Form.Item>

                <Form.Item
                    label="Time Zone"
                    name="timezone"
                    rules={[{ required: true, message: 'Please select time zone!' }]}
                >
                    <Select>
                        <Option value="GMT">GMT</Option>
                        <Option value="EST">EST</Option>
                        <Option value="PST">PST</Option>
                    </Select>
                </Form.Item>

                <Form.Item
                    label="Financial Year Beginning From"
                    name="financialYear"
                    rules={[{ required: true, message: 'Please select financial year beginning!' }]}
                >
                    <DatePicker picker="year" />
                </Form.Item>

                <Form.Item
                    label="Books from Date"
                    name="booksFromDate"
                    rules={[{ required: true, message: 'Please select books from date!' }]}
                >
                    <DatePicker />
                </Form.Item>

                <Form.Item
                    label="Email"
                    name="email"
                    style={{width:300}}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    label="Phone Number"
                    name="phoneNumber"
                    style={{width:300}}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    label="Mobile Number"
                    name="mobileNumber"
                    style={{width:300}}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    label="Fax Number"
                    name="faxNumber"
                    style={{width:300}}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                                    label="Website"
                                    name="website"
                                    style={{width:300}}
                                >
                                    <Input />
                                </Form.Item>
                
                                <Form.Item
                                    label="Upload Logo"
                                    name="logo"
                                    valuePropName="fileList"
                                    getValueFromEvent={e => Array.isArray(e) ? e : e && e.fileList}
                                    
                                >
                                    <Upload
                                        accept=".png,.jpg,.jpeg"
                                        beforeUpload={() => false}
                                        customRequest={customUpload}
                                        onChange={handleLogoFileChange}
                                        fileList={logoFileList}
                                        maxCount={1}
                                    >
                                        <Button icon={<UploadOutlined />}>Click to Upload</Button>
                                    </Upload>
                                </Form.Item>
                
                                <Form.Item
                                    label="Is this business registered for GST?"
                                    name="isGSTRegistered"
                                    valuePropName="checked"
                                >
                                    <Checkbox onChange={(e) => setIsGSTRegistered(e.target.checked)}>Yes</Checkbox>
                                </Form.Item>
                
                                {isGSTRegistered && (
                                    <Form.Item
                                        label="Enter Your GSTIN"
                                        name="gstin"
                                        rules={[{ required: true, message: 'Please enter your GSTIN!' }]}
                                    >
                                        <Input />
                                    </Form.Item>
                                )}
                
                                <Form.Item>
                                    <Button type="primary" htmlType="submit">Submit</Button>
                                </Form.Item>
                            </Form>
                        </div>
                    );
                };
                
                export default RegisterForm;
                
                   
