import React, { useState, useContext, useEffect } from 'react';
import { Form, Input, Select, Button, Tabs, Checkbox, Divider, Table, DatePicker, Space, Switch } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import '../../../styles/ledgerform.css';
import { createLedger, fetchGroups } from '../../utils/RestApi';
import { AppContext } from '../../../Context/AppContext';
//import '../../../styles/GroupForm.css';

const { Option } = Select;
const { TabPane } = Tabs;

const countries = ['India', 'USA', 'Canada', 'UK']; // Sample list of countries
const states = ['Karnataka', 'New York', 'California', 'Texas']; // Sample list of states
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
    'Unsecured Loans'
];


const LedgerForm = () => {
    const [form] = Form.useForm();
    const { companyName, setCompanyName } = useContext(AppContext);
    const [isGSTRegistered, setIsGSTRegistered] = useState(false);
    const [provideBankDetails, setProvideBankDetails] = useState(false);
    const [showBillBreakup, setShowBillBreakup] = useState(false); 
    const [billBreakupData, setBillBreakupData] = useState([]); 
    const [groupOptions, setGroupOptions] = useState([]);
    
    useEffect(() => {
        const storedCompanyName = localStorage.getItem('companyName');
        if (storedCompanyName) {
          setCompanyName(storedCompanyName);
        }
      }, []); // Run only once when component mounts
    

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
    }, [companyName, defaultGroups]);
        

    const columns = [
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
            render: (_, record, index) => (
                <DatePicker style={{ width: 120 }}
                    placeholder="Date"
                    onChange={(e) => handleBillBreakupChange(index, 'date', e.target.value)}
                />
            ),
        },
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: (_, record, index) => (
                <Input style={{ width: 150 }}
                    placeholder="Name"
                    onChange={(e) => handleBillBreakupChange(index, 'name', e.target.value)}
                />
            ),
        },
        {
            title: 'Due Date',
            dataIndex: 'dueDate',
            key: 'dueDate',
            render: (_, record, index) => (
                <Input style={{ width: 120 }}
                    placeholder="Due Date"
                    onChange={(e) => handleBillBreakupChange(index, 'dueDate', e.target.value)}
                />
            ),
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            render: (_, record, index) => (
                <Input
                style={{ width: 200 }}
                addonAfter={
                    <Select defaultValue="Dr" style={{ width: 80 }}>
                        <Option value="Dr">Dr</Option>
                        <Option value="Cr">Cr</Option>
                    </Select>
                }
                placeholder="Amount"
                onChange={(e) => handleBillBreakupChange(index, 'amount', e.target.value)}
            />
            ),
        },

        {
            title: 'Action',
            key: 'action',
            render: (_, record, index) => (
                <Space size="middle">
                    <CloseOutlined style={{ color: 'red' }} onClick={() => removeBillRow(index)} />
                </Space>
            ),
        },  

    ];

    const removeBillRow = (indexToRemove) => {
        setBillBreakupData((prevData) => {
            // Filter out the row with the specified indexToRemove
            return prevData.filter((_, index) => index !== indexToRemove);
        });
    };

    if (showBillBreakup) {
        console.log('Bill-wise Breakup Data:', billBreakupData);
    }

    // Handle opening balance change
const handleOpeningBalanceChange = (e) => {
    const hasOpeningBalance = e.target.value.trim() !== '';
    setShowBillBreakup(hasOpeningBalance);
};

    const handleBillBreakupChange = (index, field, value) => {
        const updatedData = [...billBreakupData];
        updatedData[index][field] = value;
        setBillBreakupData(updatedData);
    };

    const addBillRow = () => {
        setBillBreakupData([...billBreakupData, {}]);
    };




    const onFinish = async (values) => {
        console.log('Form Values:', values);

        const ledgerData = {
            ...values,
            billingAddress: {
                attention: values.billingAttention,
                countryRegion: values.billingCountryRegion,
                street1: values.billingStreet1,
                street2: values.billingStreet2,
                city: values.billingCity,
                state: values.billingState,
                pincode: values.billingPincode,
                phone: values.billingPhone,
                fax: values.billingFax
            },
            shippingAddress: {
                attention: values.shippingAttention,
                countryRegion: values.shippingCountryRegion,
                street1: values.shippingStreet1,
                street2: values.shippingStreet2,
                city: values.shippingCity,
                state: values.shippingState,
                pincode: values.shippingPincode,
                phone: values.shippingPhone,
                fax: values.shippingFax
            },databaseName: companyName,
            showBillBreakup,
            billbybill : values.maintainBillByBill,
            billBreakupData,
            provideBankDetails
            
        };

        try {
            const response = await createLedger(ledgerData); // Call createLedger function

            if (response.success === true) {
                alert('Ledger created successfully');
                // Handle other success actions like navigation or state updates
                form.resetFields();
                setShowBillBreakup(false);
                setBillBreakupData([]);
                setProvideBankDetails(false);
            } else {
                alert(response.message || 'Failed to create ledger');
            }
        } catch (error) {
            console.error('Error:', error);
            alert(error.message || 'An error occurred');
        }
    };

    return (
        <div className="Ledform-container">
            <h4>𝑳𝒆𝒅𝒈𝒆𝒓 𝑪𝒓𝒆𝒂𝒕𝒊𝒐𝒏</h4>
            <Divider />

            <Form
                form={form}
                name="ledger_creation"
                initialValues={{ remember: true }}
                onFinish={onFinish}
                layout="vertical"
                style={{ width: '600px' }} // Adjust the width of the form container
            >
                <Form.Item
                    label="Company Name"
                    name="companyName"
                    rules={[{ required: true, message: 'Please input your company name!' }]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    label="Customer Display Name"
                    name="customerDisplayName"
                    rules={[{ required: true, message: 'Please input customer display name!' }]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
          label="Parent"
          name="Group"
          rules={[{ required: true, message: 'Please select a group!' }]}
        >
          <Select showSearch optionFilterProp="children">
            {groupOptions.map((group) => (
              <Option key={group} value={group}>
                {group}
              </Option>
            ))}
          </Select>
        </Form.Item>

                <Form.Item label="Primary Contact" style={{ textAlign: 'left' }}>
                    <Form.Item
                        label="Salutation"
                        name="salutation"
                        style={{ display: 'inline-block', width: 'calc(50% - 8px)' }}
                    >
                        <Select>
                            <Option value="Mr">Mr</Option>
                            <Option value="Ms">Ms</Option>
                            <Option value="Mrs">Mrs</Option>
                            <Option value="Dr">Dr</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label="First Name"
                        name="firstName"
                        style={{ display: 'inline-block', width: 'calc(50% - 8px)', marginLeft: '16px' }}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        label="Last Name"
                        name="lastName"
                        style={{ display: 'inline-block', width: 'calc(50% - 8px)', marginLeft: '16px' }}
                    >
                        <Input />
                    </Form.Item>
                </Form.Item>

                <Form.Item
                    label="Customer Email"
                    name="customerEmail"
                    
                >
                    <Input type="email" />
                </Form.Item>

                <Form.Item
                    label="Customer Phone"
                    name="customerPhone"
                    
                >
                    <Input type="tel" />
                </Form.Item>

                <Form.Item
                    label="Customer Mobile"
                    name="customerMobile"
                    
                >
                    <Input type="tel" />
                </Form.Item>

                <Tabs defaultActiveKey="1">
                    <TabPane tab="Other Details" key="1">
                        
                        <Form.Item label="Payment Terms" name="paymentTerms">
                            <Input />
                        </Form.Item>
                        <Form.Item
                            name="maintainBillByBill"
                            valuePropName="checked"
                            style={{ marginBottom: 0 }}
                        >
                            <table style={{ width: '50%' }}>
                                <tbody>
                                    <tr>
                                        <td style={{ width: '90%' }}>Maintain Bill By Bill</td>
                                        <td style={{ width: '10%', textAlign: 'right' }}>
                                        <Switch onChange={(checked) => setShowBillBreakup(checked)}/></td>
                                    </tr>
                                </tbody>
                            </table>
                        </Form.Item>
                        <Form.Item label="Credit Limit (In Days or Date)" name="creditLimitDaysOrDate">
                            <Input />
                        </Form.Item>
                        <Form.Item label="Credit Limit (In Value)" name="creditLimitValue">
                            <Input />
                        </Form.Item>
                        
                        <Form.Item
                                name="provideBankDetails"
                                valuePropName="checked"
                                style={{ marginBottom: 0 }}
                        >
                                <table style={{ width: '50%' }}>
                                    <tbody>
                                        <tr>
                                            <td style={{ width: '90%' }}>Provide Bank Details</td>
                                            <td style={{ width: '10%', textAlign: 'right' }}>
                                            <Switch onChange={(checked) => setProvideBankDetails(checked)} />
                                            </td>
                                         </tr>
                                    </tbody>
                                </table>
                        </Form.Item>

                        {provideBankDetails && (
                            <>
                                <Divider>Bank Details</Divider>
                                <Form.Item label="Transaction Type" name="transactionType">
                                    <Select>
                                        <Option value="e-Fund Transfer">e-Fund Transfer</Option>
                                    </Select>
                                </Form.Item>
                                <Form.Item label="A/c No" name="accountNumber">
                                    <Input />
                                </Form.Item>
                                <Form.Item label="Bank Name" name="bankName">
                                    <Input />
                                </Form.Item>
                                <Form.Item label="Company Bank" name="companyBank">
                                    <Input />
                                </Form.Item>
                                <Form.Item label="IFSC Code" name="ifscCode">
                                    <Input />
                                </Form.Item>
                            </>
                        )}

                        <Form.Item
                            label="PAN"
                            name="pan"
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item
                            label="GSTIN"
                            name="GSTIN"
                            rules={[{ required: true, message: 'Please input GSTIN!' }]}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item label="Currency" name="currency">
                            <Input />
                        </Form.Item>

                        <Form.Item label="Opening Balance" name="openingBalance">
                        <Input
                        style={{ width: 220 }}
                        addonAfter={
                            <Select defaultValue="Dr" style={{ width: 80 }}>
                                <Option value="Dr">Dr</Option>
                                <Option value="Cr">Cr</Option>
                            </Select>
                        }
                        onChange={handleOpeningBalanceChange} // Update the showBillBreakup state based on the input
                    />
                </Form.Item>
                        
                        {/* Conditionally render bill-wise breakup section */}
                {showBillBreakup && (
                    <div>
                        <Divider>Bill-wise Breakup</Divider>
                        <Table
                            dataSource={billBreakupData}
                            columns={columns}
                            pagination={false}
                            rowKey={(record, index) => index}
                        />
                        <Button onClick={addBillRow}>Add Row</Button>
                    </div>
                )}

                
                        
                        <Form.Item label="Documents Uploadfile" name="documents">
                            <Input type="file" />
                        </Form.Item>


                    </TabPane>
                    <TabPane tab="Address" key="2">
                        <div style={{ display: 'flex' }}>
                            {/* Billing Address */}
                            <div style={{ marginRight: '20px'}}>
                                <h4>Billing Address</h4>
                                <Form.Item label="Attention" name="billingAttention">
                                    <Input style={{ width: 200 }}/>
                                </Form.Item>
                                <Form.Item label="Country/Region" name="billingCountryRegion">
                                    <Select showSearch optionFilterProp="children">
                                        {countries.map((country) => (
                                            <Option key={country} value={country}>
                                                {country}
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                                <Form.Item label="Address Street1" name="billingStreet1">
                                    <Input.TextArea rows={4} style={{ width: 300 }} />
                                </Form.Item>
                                <Form.Item label="Address Street2" name="billingStreet2">
                                    <Input.TextArea rows={4} />
                                </Form.Item>
                                <Form.Item label="City" name="billingCity">
                                    <Input />
                                </Form.Item>
                                <Form.Item label="State" name="billingState">
                                    <Select showSearch optionFilterProp="children">
                                        {states.map((state) => (
                                            <Option key={state} value={state}>
                                                {state}
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                                <Form.Item label="Pincode" name="billingPincode">
                                    <Input />
                                </Form.Item>
                                <Form.Item label="Phone" name="billingPhone">
                                    <Input type="tel" />
                                </Form.Item>
                                <Form.Item label="Fax Number" name="billingFax">
                                    <Input type="tel" />
                                </Form.Item>
                            </div>

                            {/* Shipping Address */}
                            <div>
                                <h4>Shipping Address</h4>
                                <Form.Item label="Attention" name="shippingAttention">
                                    <Input style={{ width: 200 }} />
                                </Form.Item>
                                <Form.Item label="Country/Region" name="shippingCountryRegion">
                                    <Select showSearch optionFilterProp="children">
                                        {countries.map((country) => (
                                            <Option key={country} value={country}>
                                                {country}
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                                <Form.Item label="Address Street1" name="shippingStreet1">
                                    <Input.TextArea rows={4} style={{ width: 300 }} />
                                </Form.Item>
                                <Form.Item label="Address Street2" name="shippingStreet2">
                                    <Input.TextArea rows={4} />
                                </Form.Item>
                                <Form.Item label="City" name="shippingCity">
                                    <Input />
                                </Form.Item>
                                <Form.Item label="State" name="shippingState">
                                    <Select showSearch optionFilterProp="children">
                                        {states.map((state) => (
                                            <Option key={state} value={state}>
                                                {state}
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                                <Form.Item label="Pincode" name="shippingPincode">
                                    <Input />
                                </Form.Item>
                                <Form.Item label="Phone" name="shippingPhone">
                                    <Input type="tel" />
                                </Form.Item>
                                <Form.Item label="Fax Number" name="shippingFax">
                                    <Input type="tel" />
                                </Form.Item>
                                <Form.Item name="copyBilling" valuePropName="checked">
                                    <Checkbox
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                const billingValues = form.getFieldsValue([
                                                    'billingAttention',
                                                    'billingCountryRegion',
                                                    'billingStreet1',
                                                    'billingStreet2',
                                                    'billingCity',
                                                    'billingState',
                                                    'billingPincode',
                                                    'billingPhone',
                                                    'billingFax'
                                                ]);
                                                form.setFieldsValue({
                                                    shippingAttention: billingValues.billingAttention,
                                                    shippingCountryRegion: billingValues.billingCountryRegion,
                                                    shippingStreet1: billingValues.billingStreet1,
                                                    shippingStreet2: billingValues.billingStreet2,
                                                    shippingCity: billingValues.billingCity,
                                                    shippingState: billingValues.billingState,
                                                    shippingPincode: billingValues.billingPincode,
                                                    shippingPhone: billingValues.billingPhone,
                                                    shippingFax: billingValues.billingFax
                                                });
                                            } else {
                                                form.resetFields([
                                                    'shippingAttention',
                                                    'shippingCountryRegion',
                                                    'shippingStreet1',
                                                    'shippingStreet2',
                                                    'shippingCity',
                                                    'shippingState',
                                                    'shippingPincode',
                                                    'shippingPhone',
                                                    'shippingFax'
                                                ]);
                                            }
                                        }}
                                    >
                                        Copy Billing address
                                    </Checkbox>
                                </Form.Item>
                            </div>
                        </div>
                    </TabPane>
                    <TabPane tab="Contacts Persons" key="3">
                        {/* Add Contacts Persons Fields Here */}
                    </TabPane>
                </Tabs>

                <Form.Item>
                    <Button type="primary" htmlType="submit">
                        Save
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
};

export default LedgerForm;
