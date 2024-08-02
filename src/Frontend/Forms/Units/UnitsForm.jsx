import React from 'react';
import { Form, Input, Button, Select, Divider, Row, Col } from 'antd';

const { Option } = Select;

const UnitsCreationForm = () => {
  const onFinish = (values) => {
    console.log('Form Values:', values);
    // Handle form submission logic
  };

  return (
    <div className="units-creation-form">
      <h4>Units Creation</h4>
      <Divider />
      <Form
        name="units_creation"
        initialValues={{ remember: true }}
        onFinish={onFinish}
        layout="vertical"
        style={{ maxWidth: '600px' }}
      >
        <Form.Item
          label="Type"
          name="type"
          rules={[{ required: true, message: 'Please select the type!' }]}
        >
          <Select placeholder="Select type">
            <Option value="simple">Simple</Option>
            <Option value="compound">Compound</Option>
          </Select>
        </Form.Item>

        {/* Conditional rendering for Compound Units */}
        <Form.Item
          noStyle
          shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}
        >
          {({ getFieldValue }) => {
            return getFieldValue('type') === 'compound' ? (
              <>
                {/* Label for Compound Unit */}
                <Divider>Compound Unit</Divider>
                <h5>Units with Multiplier Factors</h5>
                <h6>(example: kgs of 1000 gms)</h6>
                <Row gutter={16}>
                  <Col span={10}>
                    <Form.Item
                      label="First Unit"
                      name="firstUnit"
                      rules={[{ required: true, message: 'Please input the first unit!' }]}
                    >
                      <Select placeholder="Select first unit">
                        <Option value="KGS">KGS</Option>
                        <Option value="LBS">LBS</Option>
                        {/* Add more options as needed */}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item
                      label="Value"
                      name="value"
                      rules={[{ required: true, message: 'Please input the value!' }]}
                    >
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      label="Second Unit"
                      name="secondUnit"
                      rules={[{ required: true, message: 'Please input the second unit!' }]}
                    >
                      <Select placeholder="Select second unit">
                        <Option value="GMS">GMS</Option>
                        <Option value="OZ">OZ</Option>
                        {/* Add more options as needed */}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
              </>
            ) : null;
          }}
        </Form.Item>

        {/* Conditional rendering for Simple Units */}
        <Form.Item
          noStyle
          shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}
        >
          {({ getFieldValue }) => {
            return getFieldValue('type') === 'simple' ? (
              <>
                {/* Fields for Simple Unit */}
                <Divider>Simple Unit</Divider>
                <Form.Item
                  label="Symbol"
                  name="symbol"
                  rules={[{ required: true, message: 'Please input the symbol!' }]}
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  label="Formal Name"
                  name="formalName"
                  rules={[{ required: true, message: 'Please input the formal name!' }]}
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  label="Unit Quantity Code (UQC)"
                  name="uqc"
                  rules={[{ required: true, message: 'Please select the UQC!' }]}
                >
                  <Select placeholder="Select UQC">
                    <Option value="nos">NOS-NUMBERS</Option>
                    <Option value="na">Not Applicable</Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  label="Number of Decimal Places"
                  name="decimalPlaces"
                  rules={[{ required: true, message: 'Please input the number of decimal places!' }]}
                >
                  <Input type="number" min={0} />
                </Form.Item>
              </>
            ) : null;
          }}
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

export default UnitsCreationForm;
