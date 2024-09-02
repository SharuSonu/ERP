import React from 'react';
import { Form, Input, Button, DatePicker, Table, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import '../../../styles/Quotecreate.css';

const QuoteCreationForm = () => {
  const [form] = Form.useForm();

  // Handle form submission
  const onFinish = (values) => {
    // Add logic for form submission
    console.log('Quote Data Submitted:', values);
  };

  // Add a new item row
  const handleAdd = () => {
    const items = form.getFieldValue('items') || [];
    form.setFieldsValue({
      items: [...items, { itemCode: '', itemDescription: '', quantity: '', rate: '', amount: '', tax: '', discount: '' }],
    });
  };

  // Remove an item row
  const handleRemove = (index) => {
    const items = form.getFieldValue('items') || [];
    items.splice(index, 1);
    form.setFieldsValue({ items });
  };

  const columns = [
    { title: 'Item Code', dataIndex: 'itemCode', key: 'itemCode', render: (_, record, index) => (
        <Form.Item
          name={[index, 'itemCode']}
          style={{ margin: 0 }}
          rules={[{ required: true, message: 'Please enter the item code' }]}
        >
          <Input />
        </Form.Item>
    )},
    { title: 'Item Description', dataIndex: 'itemDescription', key: 'itemDescription', render: (_, record, index) => (
        <Form.Item
          name={[index, 'itemDescription']}
          style={{ margin: 0 }}
          rules={[{ required: true, message: 'Please enter the item description' }]}
        >
          <Input />
        </Form.Item>
    )},
    { title: 'Quantity', dataIndex: 'quantity', key: 'quantity', render: (_, record, index) => (
        <Form.Item
          name={[index, 'quantity']}
          style={{ margin: 0 }}
          rules={[{ required: true, message: 'Please enter the quantity' }]}
        >
          <Input type="number" />
        </Form.Item>
    )},
    { title: 'Rate', dataIndex: 'rate', key: 'rate', render: (_, record, index) => (
        <Form.Item
          name={[index, 'rate']}
          style={{ margin: 0 }}
          rules={[{ required: true, message: 'Please enter the rate' }]}
        >
          <Input type="number" />
        </Form.Item>
    )},
    { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (_, record, index) => (
        <Form.Item
          name={[index, 'amount']}
          style={{ margin: 0 }}
          rules={[{ required: true, message: 'Please enter the amount' }]}
        >
          <Input type="number" />
        </Form.Item>
    )},
    { title: 'Tax', dataIndex: 'tax', key: 'tax', render: (_, record, index) => (
        <Form.Item
          name={[index, 'tax']}
          style={{ margin: 0 }}
        >
          <Input />
        </Form.Item>
    )},
    { title: 'Discount', dataIndex: 'discount', key: 'discount', render: (_, record, index) => (
        <Form.Item
          name={[index, 'discount']}
          style={{ margin: 0 }}
        >
          <Input />
        </Form.Item>
    )},
    { title: 'Action', key: 'action', render: (_, record, index) => (
        <Space size="middle">
          <Button type="link" onClick={() => handleRemove(index)}>Remove</Button>
        </Space>
    )},
  ];

  return (
    <div className="form-container">
      <h2>Create Quote</h2>
      <Form form={form} onFinish={onFinish} layout="vertical" className="quote-form">
        <div className="form-row">
          {/* Quote Details */}
          <Form.Item name="quoteDate" label="Quote Date" className="form-item" rules={[{ required: true, message: 'Please select the quote date' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="quoteNumber" label="Quote Number" className="form-item" rules={[{ required: true, message: 'Please enter the quote number' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="quoteType" label="Quote Type" className="form-item">
            <Input />
          </Form.Item>
          <Form.Item name="validityPeriod" label="Validity Period" className="form-item">
            <Input />
          </Form.Item>
        </div>

        <div className="form-row">
          {/* Customer Details */}
          <Form.Item name="customerName" label="Customer Name" className="form-item" rules={[{ required: true, message: 'Please enter the customer name' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="customerAddress" label="Customer Address" className="form-item">
            <Input />
          </Form.Item>
          <Form.Item name="contactPerson" label="Contact Person" className="form-item">
            <Input />
          </Form.Item>
          <Form.Item name="contactPhone" label="Contact Phone" className="form-item">
            <Input />
          </Form.Item>
          <Form.Item name="contactEmail" label="Contact Email" className="form-item">
            <Input type="email" />
          </Form.Item>
          <Form.Item name="referenceNumber" label="Reference Number" className="form-item">
            <Input />
          </Form.Item>
        </div>

        {/* Item Details */}
        <Form.List name="items">
          {(fields, { add, remove }) => (
            <>
              <Table
                columns={columns}
                dataSource={fields}
                rowKey="key"
                pagination={false}
                footer={() => (
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    icon={<PlusOutlined />}
                  >
                    Add Item
                  </Button>
                )}
              />
            </>
          )}
        </Form.List>

        <div className="form-row">
          {/* Additional Details */}
          <Form.Item name="deliveryDate" label="Delivery Date" className="form-item">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="paymentTerms" label="Payment Terms" className="form-item">
            <Input />
          </Form.Item>
          <Form.Item name="quoteStatus" label="Quote Status" className="form-item">
            <Input />
          </Form.Item>
          <Form.Item name="remarks" label="Remarks" className="form-item">
            <Input />
          </Form.Item>
        </div>

        <div className="form-row">
          {/* Project and Cost Information */}
          <Form.Item name="costCenter" label="Cost Center" className="form-item">
            <Input />
          </Form.Item>
          <Form.Item name="project" label="Project" className="form-item">
            <Input />
          </Form.Item>
          <Form.Item name="salesperson" label="Salesperson" className="form-item">
            <Input />
          </Form.Item>
          <Form.Item name="shippingMethod" label="Shipping Method" className="form-item">
            <Input />
          </Form.Item>
        </div>

        {/* Submit Button */}
        <Form.Item>
          <Button type="primary" htmlType="submit" className="submit-button">
            Submit
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default QuoteCreationForm;
