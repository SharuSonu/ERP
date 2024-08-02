import React, { useState, useContext, useEffect } from 'react';
import { Form, Input, Button, Select, Upload, Checkbox, DatePicker, Divider } from 'antd';
import { PlusOutlined, MinusCircleOutlined, UploadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../../Context/AppContext';
import moment from 'moment'; // Import moment.js for date handling
const { Option } = Select;

const CompanyEdit = ({
    onFinish,
    customUpload,
    handleLogoFileChange,
    logoFileList,
    setIsGSTRegistered, // Ensure this prop is correctly passed
    isGSTRegistered, // Ensure this prop is correctly passed
}) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const { companyName } = useContext(AppContext);
    const navigate = useNavigate();
    const [organizationDetails, setOrganizationDetails] = useState({
        name: '',
        industry: '',
        country: '',
        state: '',
        branch: '',
        currency: '',
        language: '',
        timezone: '',
        financialYear: null,
        booksFromDate: null,
        email: '',
        phone: '',
        mobile: '',
        faxNumber: '',
        website: '',
        logo: [],
        isGSTRegistered: false,
        gstin: '',
        addresses: [], // Initialize addresses as an empty array
    });

    useEffect(() => {
        fetchOrganizationDetails();
    }, []);

    const fetchOrganizationDetails = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:5000/api/organization', {
                headers: {
                    'company-name': companyName, // Replace with actual logic to get current companyName
                },
            });
            const data = await response.json();
            if (response.ok) {
                // Convert date strings to moment objects
                data.financialYear = data.financialYear ? moment(data.financialYear) : null;
                data.booksFromDate = data.booksFromDate ? moment(data.booksFromDate) : null;

                // Set organization details including addresses
                setOrganizationDetails(data);

                // Set form fields value
                form.setFieldsValue(data);
            } else {
                console.error('Error fetching organization details:', data.message);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const addAddress = () => {
        const newAddresses = [...organizationDetails.addresses, { key: Date.now() }];
        setOrganizationDetails({ ...organizationDetails, addresses: newAddresses });
    };

    const removeAddress = (key) => {
        const newAddresses = organizationDetails.addresses.filter((address) => address.key !== key);
        setOrganizationDetails({ ...organizationDetails, addresses: newAddresses });
    };

    const renderAddresses = () => {
        return organizationDetails.addresses.map((address, index) => (
            <div key={address.key} style={{ position: 'relative', marginBottom: '20px' }}>
                <Form.Item
                    label="Street Address 1"
                    name={['addresses', index, 'streetAddress1']}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    label="Street Address 2"
                    name={['addresses', index, 'streetAddress2']}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    label="Street Address 3"
                    name={['addresses', index, 'streetAddress3']}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    label="Street Address 4"
                    name={['addresses', index, 'streetAddress4']}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    label="Street Address 5"
                    name={['addresses', index, 'streetAddress5']}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    label="City"
                    name={['addresses', index, 'city']}
                    rules={[{ required: true, message: 'Please enter city!' }]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    label="Zip/Postal Code"
                    name={['addresses', index, 'zip']}
                    rules={[{ required: true, message: 'Please enter zip/postal code!' }]}
                >
                    <Input />
                </Form.Item>

                <MinusCircleOutlined
                    style={{ position: 'absolute', top: '0', right: '0', cursor: 'pointer' }}
                    onClick={() => removeAddress(address.key)}
                />
            </div>
        ));
    };

    /*
    const onFinish = async (values) => {
        // Extract values from form
        const {
            name,
            industry,
            country,
            state,
            branch,
            currency,
            language,
            timezone,
            financialYear,
            booksFromDate,
            email,
            phoneNumber,
            mobileNumber,
            faxNumber,
            website,
            logo,
            isGSTRegistered,
            gstin,
            addresses,
        } = values;

        // Prepare updated organization data
        const updatedOrganization = {
            name,
            industry,
            country,
            state,
            branch,
            currency,
            language,
            timezone,
            financialYear: financialYear ? financialYear.format('YYYY-MM-DD') : null,
            booksFromDate: booksFromDate ? booksFromDate.format('YYYY-MM-DD') : null,
            email,
            phoneNumber,
            mobileNumber,
            faxNumber,
            website,
            logo: null, // Extract files from Upload component
            isGSTRegistered,
            gstin,
            addresses, // Assuming addresses are already correctly formatted
        };

        setLoading(true);
        try {
            // Make API call to update organization details
            const response = await fetch('http://localhost:5000/api/organization/update', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'company-name': companyName,
                },
                body: JSON.stringify(updatedOrganization),
            });

            if (response.ok) {
                console.log('Organization updated successfully!');
                // Optionally, navigate to another page or perform additional actions
                navigate('/dashboard'); // Navigate to dashboard or another page
            } else {
                const errorData = await response.json();
                console.error('Error updating organization:', errorData.message);
            }
        } catch (error) {
            console.error('Error updating organization:', error);
        } finally {
            setLoading(false);
        }
    };   */ 

    return (
        <div className="form-container">
            <h2 style={{ textAlign: 'center' }}>Organization Profile</h2>
            <Divider></Divider>
            <Button onClick={fetchOrganizationDetails} loading={loading} type="primary" style={{ marginBottom: '20px' }}>
                Fetch Organization Details
            </Button>
            <Form
                form={form}
                name="organization_profile"
                initialValues={{ remember: true }}
                onFinish={onFinish}
                layout='vertical'
            >
                <Form.Item
                    label="Organization Name"
                    name="name"
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
                    label="Country"
                    name="country"
                    rules={[{ required: true, message: 'Please select country!' }]}
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
                >
                    <Select>
                        <Option value="Delhi">Delhi</Option>
                        <Option value="Mumbai">Mumbai</Option>
                        <Option value="Karnataka">Karnataka</Option>
                    </Select>
                </Form.Item>

                <Form.Item
                    label="Organization Branch"
                    name="branch"
                    rules={[{ required: true, message: 'Please input your organization Branch!' }]}
                >
                    <Input />
                </Form.Item>

                {organizationDetails.addresses.length > 0 && (
                    <Form.Item
                        label="ORGANIZATION ADDRESSES"
                        style={{ textAlign: 'left' }}
                    >
                        {renderAddresses()}
                    </Form.Item>
                )}

                <Form.Item>
                    <Button type="dashed" icon={<PlusOutlined />} onClick={addAddress}>
                        Add Organization Address
                    </Button>
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
                    style={{ width: 300 }}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    label="Phone Number"
                    name="phone"
                    style={{ width: 300 }}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    label="Mobile Number"
                    name="mobile"
                    style={{ width: 300 }}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    label="Fax Number"
                    name="faxNumber"
                    style={{ width: 300 }}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    label="Website"
                    name="website"
                    style={{ width: 300 }}
                >
                    <Input />
                </Form.Item>


                <Form.Item
                    name="isGSTRegistered"
                    valuePropName="checked"
                >
                    <Checkbox onChange={(e) => setIsGSTRegistered(e.target.checked)}>Is GST Registered?</Checkbox>
                </Form.Item>

                {isGSTRegistered && (
                    <Form.Item
                        label="GSTIN"
                        name="gstin"
                        rules={[{ required: true, message: 'Please input GSTIN!' }]}
                    >
                        <Input />
                    </Form.Item>
                )}

            <Form.Item
                label="Upload Logo"
                name="logo"
                valuePropName="fileList"
                getValueFromEvent={handleLogoFileChange}
            >
                <Upload
                    accept=".png,.jpg,.jpeg"
                    customRequest={customUpload}
                    fileList={logoFileList}
                    maxCount={1}
                >
                    <Button icon={<UploadOutlined />}>Click to Upload</Button>
                </Upload>
            </Form.Item>
                <Form.Item>
                    <Button type="primary" htmlType="submit">
                        Save
                    </Button>
                </Form.Item>
            </Form>
            <Divider></Divider>
        </div>
    );
};

export default CompanyEdit;
