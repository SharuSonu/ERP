import React, { useState } from 'react';
import { Form, Input, Select, Switch, Divider, Button } from 'antd';
import '../../../styles/vouchertype.css'; // Import CSS file for styling

const { Option } = Select;

const VoucherTypeForm = () => {
    const [form] = Form.useForm();
    const [automaticNumbering, setAutomaticNumbering] = useState(true);
    const [additionalNumberingDetails, setAdditionalNumberingDetails] = useState(false);

    const onFinish = (values) => {
        console.log('Form Values:', values);
    };

    return (
        <div className="VoucherTypeForm-container">
            <h4>Voucher Type Creation</h4>
            <div style={{ display: 'flex' }}>
                {/* General Section */}
                <div style={{ marginRight: '20px' }}>
                    <Divider>General</Divider>
                    <Form
                        form={form}
                        name="voucher_type"
                        initialValues={{ remember: true }}
                        onFinish={onFinish}
                        layout="vertical"
                        style={{ width: '400px' }}
                    >

                        <Form.Item
                            name="Name"
                            label="Name"
                            rules={[{ required: true, message: 'Please input the name!' }]}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item label="Select type of voucher" name="voucherType"
                        rules={[{ required: true, message: 'Please input the Type!' }]}>
                            <Select>
                                <Option value="cash">Cash</Option>
                                <Option value="credit">Credit</Option>
                            </Select>
                        </Form.Item>
                        <Form.Item
                            name="abbrevation"
                            label="Abbreviation"
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            name="activateVoucherType"
                            valuePropName="checked"
                            style={{ marginBottom: 0 }}
                        >
                            <table style={{ width: '100%' }}>
                                <tbody>
                                    <tr>
                                        <td style={{ width: '90%' }}>Activate this voucher type</td>
                                        <td style={{ width: '10%', textAlign: 'right' }}><Switch /></td>
                                    </tr>
                                </tbody>
                            </table>
                        </Form.Item>

                        {/* Individual table form fields */}
                        <Form.Item
                            name="methodOfVoucherNumbering"
                            label="Method of Voucher Numbering"
                        >
                            <Select>
                                <Option value="automatic">Automatic</Option>
                                <Option value="manual">Manual</Option>
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="numberingBehaviour"
                            label="Numbering behaviour on insertion/deletion"
                        >
                            <Select>
                                <Option value="retainOriginal">Retain Original No</Option>
                                <Option value="renumberVouchers">Renumber Vouchers</Option>
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="setAlterAdditionalNumberingDetails"
                            valuePropName="checked"
                            style={{ marginBottom: 0 }}
                        >
                            <table style={{ width: '100%' }}>
                                <tbody>
                                    <tr>
                                        <td style={{ width: '90%' }}>Set/Alter additional numbering details</td>
                                        <td style={{ width: '10%', textAlign: 'right' }}><Switch /></td>
                                    </tr>
                                </tbody>
                            </table>
                        </Form.Item>

                        <Form.Item
                            name="allowZeroValuedTransactions"
                            valuePropName="checked"
                            style={{ marginBottom: 0 }}
                        >
                            <table style={{ width: '100%' }}>
                                <tbody>
                                    <tr>
                                        <td style={{ width: '90%' }}>Allow Zero-Valued transactions</td>
                                        <td style={{ width: '10%', textAlign: 'right' }}><Switch /></td>
                                    </tr>
                                </tbody>
                            </table>
                        </Form.Item>

                        <Form.Item
                            name="makeOptionalByDefault"
                            valuePropName="checked"
                            style={{ marginBottom: 0 }}
                        >
                            <table style={{ width: '100%' }}>
                                <tbody>
                                    <tr>
                                        <td style={{ width: '90%' }}>Make this voucher type as 'Optional' By Default</td>
                                        <td style={{ width: '10%', textAlign: 'right' }}><Switch /></td>
                                    </tr>
                                </tbody>
                            </table>
                        </Form.Item>

                        <Form.Item
                            name="allowNarrationInVoucher"
                            valuePropName="checked"
                            style={{ marginBottom: 0 }}
                        >
                            <table style={{ width: '100%' }}>
                                <tbody>
                                    <tr>
                                        <td style={{ width: '90%' }}>Allow Narration in voucher</td>
                                        <td style={{ width: '10%', textAlign: 'right' }}><Switch /></td>
                                    </tr>
                                </tbody>
                            </table>
                        </Form.Item>

                        <Form.Item
                            name="enableDefaultAccountingAllocations"
                            valuePropName="checked"
                            style={{ marginBottom: 0 }}
                        >
                            <table style={{ width: '100%' }}>
                                <tbody>
                                    <tr>
                                        <td style={{ width: '90%' }}>Enable default accounting allocations</td>
                                        <td style={{ width: '10%', textAlign: 'right' }}><Switch /></td>
                                    </tr>
                                </tbody>
                            </table>
                        </Form.Item>
                    </Form>
                </div>

                {/* Printing Section */}
                <div style={{ marginRight: '20px' }}>
                    <Divider>Printing</Divider>
                    <Form
                        form={form}
                        name="voucher_type"
                        initialValues={{ remember: true }}
                        onFinish={onFinish}
                        layout="vertical"
                        style={{ width: '300px' }}
                    >
                        {/* Updated to use Switch */}
                        <Form.Item
                            name="printVoucherAfterSaving"
                            valuePropName="checked"
                            style={{ marginBottom: 0 }}
                        >
                            <table style={{ width: '100%' }}>
                                <tbody>
                                    <tr>
                                        <td style={{ width: '90%' }}>Print voucher after saving</td>
                                        <td style={{ width: '10%', textAlign: 'right' }}><Switch /></td>
                                    </tr>
                                </tbody>
                            </table>
                        </Form.Item>

                        <Form.Item
                            name="useForPOSInvoice"
                            valuePropName="checked"
                            style={{ marginBottom: 0 }}
                        >
                            <table style={{ width: '100%' }}>
                                <tbody>
                                    <tr>
                                        <td style={{ width: '90%' }}>Use for POS invoice</td>
                                        <td style={{ width: '10%', textAlign: 'right' }}><Switch /></td>
                                    </tr>
                                </tbody>
                            </table>
                        </Form.Item>

                        <Form.Item
                            name="defaultTitleToPrint"
                            label="Default title to print"
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            name="defaultBank"
                            label="Default bank"
                        >
                            <Select>
                                <Option value="bank1">Bank 1</Option>
                                <Option value="bank2">Bank 2</Option>
                            </Select>
                        </Form.Item>
                        {/* Add more form items for the Printing section here */}
                    </Form>
                </div>

                {/* Name of Class Section */}
                <div>
                    <Divider>Name of Class</Divider>
                    <Form
                        form={form}
                        name="voucher_type"
                        initialValues={{ remember: true }}
                        onFinish={onFinish}
                        layout="vertical"
                        style={{ width: '300px' }}
                    >
                        {/* Add form items for the Name of Class section here */}
                        <Form.Item
                            name="nameOfClass"
                            label="Name of Class"
                        >
                            <Input />
                        </Form.Item>
                    </Form>
                </div>
            </div>
            <div>
                <Button type="primary" htmlType="submit">Submit</Button>
            </div>
            <Divider></Divider>
        </div>
    );
};

export default VoucherTypeForm;
