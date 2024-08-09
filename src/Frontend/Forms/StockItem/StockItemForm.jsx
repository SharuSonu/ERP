import React, { useState, useContext, useEffect } from 'react';
import { Form, Input, Button, Select, DatePicker, Space, Row, Col, Divider, Table } from 'antd';
import { MinusCircleOutlined, PlusOutlined, CloseOutlined } from '@ant-design/icons';
import { createStockItem, fetchStockGroups } from '../../utils/RestApi';
import { AppContext } from '../../../Context/AppContext';
import moment from 'moment';
import '../../../styles/StockItem.css';
const { Option } = Select;

const StockItemForm = () => {
  const [form] = Form.useForm();
  const { companyName, setCompanyName } = useContext(AppContext);
  const [isGSTApplicable, setIsGSTApplicable] = useState(false);
  const [StockGroupOptions, setStockGroupOptions] = useState([]);
  const [showOpeningBalanceBreakup, setShowOpeningBalanceBreakup] = useState(false); 
  const [openingBalanceBreakupData, setOpeningBalanceBreakupData] = useState([
    { godown: '', batch: '', ratePer: '', amount: '' },
  ]);

  const defaultGroups = ['Primary'];

  useEffect(() => {
    const storedCompanyName = localStorage.getItem('companyName');
    if (storedCompanyName) {
      setCompanyName(storedCompanyName);
    }
  }, [setCompanyName]);

  useEffect(() => {
    const fetchStockGroupsFromDatabase = async () => {
      console.log("Fetching stock groups for company:", companyName);
      try {
        const response = await fetchStockGroups(companyName);
        //console.log("API response:", response);
        if (response.success) {
          const databaseGroups = response.groups || [];
          const combinedGroups = [...defaultGroups, ...databaseGroups];
          const uniqueGroups = Array.from(new Set(combinedGroups));
          //console.log("Combined and unique groups:", uniqueGroups);
          setStockGroupOptions(uniqueGroups);
        } else {
          console.error('Failed to fetch groups:', response.message);
        }
      } catch (error) {
        console.error('Error fetching groups from database:', error);
      }
    };

    if (companyName) {
      fetchStockGroupsFromDatabase();
    } else {
      console.log("No company name found, setting default groups:", defaultGroups);
      setStockGroupOptions(defaultGroups);
    }
  }, []);//[companyName, defaultGroups]
  const columns = [
    {
      title: 'Quantity',
      dataIndex: 'Quantity',
      key: 'Quantity',
      render: (_, record, index) => (
        <Input style={{ width: 120 }}
          placeholder="Quantity"
          onChange={(e) => handleOpeningBalanceBreakupChange(index, 'Quantity', e.target.value)}
        />
      ),
    },
    {
      title: 'Rate',
      dataIndex: 'Rate',
      key: 'Rate',
      render: (_, record, index) => (
        <Input style={{ width: 150 }}
          placeholder="Rate"
          onChange={(e) => handleOpeningBalanceBreakupChange(index, 'Rate', e.target.value)}
        />
      ),
    },
    {
      title: 'Per',
      dataIndex: 'Per',
      key: 'Per',
      render: (_, record, index) => (
        <Input style={{ width: 120 }}
          placeholder=" Per"
          onChange={(e) => handleOpeningBalanceBreakupChange(index, 'Per', e.target.value)}
        />
      ),
    },
    {
      title: 'Value',
      dataIndex: 'amount',
      key: 'amount',
      render: (_, record, index) => (
        <Input style={{ width: 200 }}
          placeholder="Value"
          onChange={(e) => handleOpeningBalanceBreakupChange(index, 'amount', e.target.value)}
        />
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record, index) => (
        <Space size="middle">
          <CloseOutlined style={{ color: 'red' }} onClick={() => removeOpeningBalanceRow(index)} />
        </Space>
      ),
    },
  ];

  const handleOpeningBalanceChange = (value) => {
    const hasOpeningBalance = value === 'yes';
    setShowOpeningBalanceBreakup(hasOpeningBalance);
  };

  const handleOpeningBalanceBreakupChange = (index, field, value) => {
    const updatedData = [...openingBalanceBreakupData];
    updatedData[index][field] = value;
    setOpeningBalanceBreakupData(updatedData);
  };

  const addOpeningBalanceRow = () => {
    setOpeningBalanceBreakupData([...openingBalanceBreakupData, {}]);
  };

  const removeOpeningBalanceRow = (indexToRemove) => {
    setOpeningBalanceBreakupData((prevData) => {
      // Filter out the row with the specified indexToRemove
      return prevData.filter((_, index) => index !== indexToRemove);
    });
  };

  const convertDates = (values) => {
    if (values.gstDetails) {
      values.gstDetails = values.gstDetails.map(detail => {
        if (detail.applicableDate) {
          detail.applicableDate = moment(detail.applicableDate).format('YYYY-MM-DD');
        }
        return detail;
      });
    }
    return values;
  };


  const onFinish = async (values) => {
    console.log('Form Values:', values);
    const formattedValues = convertDates(values);
    const stockitemData = {
      ...formattedValues,
      databaseName: companyName,
      openingBalanceBreakupData
    };
    try {
      const response = await createStockItem(stockitemData);

      if (response.success) {
        alert('StockItem created successfully');
        form.resetFields();
      } else {
        alert(response.message || 'Failed to create StockItem');
      }
    } catch (error) {
      console.error('Error:', error);
      alert(error.message || 'An error occurred');
    }
  };

  const handleGSTApplicableChange = (value) => {
    setIsGSTApplicable(value === 'yes');
  };

  const inputStyle = { width: '100%' }; // Style for uniform width

  return (
    <div className="SKUForm-container">
      <h4>Stock Item Creation</h4>
      <Divider />
      <Form
        name="stock_item_creation"
        initialValues={{ remember: true }}
        onFinish={onFinish}
        layout="horizontal"
        style={{ width: '100%' }}
      >
        <Row gutter={16}>
          <Col span={13}>
            <Form.Item
              label="Name"
              name="name"
              rules={[{ required: true, message: 'Please input the name!' }]}
            >
              <Input style={inputStyle} />
            </Form.Item>
          </Col>
  
          <Col span={9}>
            <Form.Item
              label="Part No"
              name="partNo"
            >
              <Input style={inputStyle} className='part-no-right' />
            </Form.Item>
          </Col>
        </Row>
  
        <Row gutter={16}>
          <Col span={13}>
            <Form.Item
              label="Alias"
              name="alias"
            >
              <Input style={inputStyle} />
            </Form.Item>
          </Col>
        </Row>
  
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="Group"
              name="under"
            >
              <Select style={inputStyle} showSearch optionFilterProp="children">
                {StockGroupOptions.length > 0 ? (
                  StockGroupOptions.map((group) => (
                    <Option key={group} value={group}>
                      {group}
                    </Option>
                  ))
                ) : (
                  <Option value="" disabled>No data</Option>
                )}
              </Select>
            </Form.Item>
          </Col>
  
          <Col span={8}>
            <Form.Item
              label="Units"
              name="units"
            >
              <Select style={inputStyle} placeholder="Select units">
                <Option value="nos">Nos</Option>
                <Option value="kg">Kg</Option>
                <Option value="ltr">Ltr</Option>
              </Select>
            </Form.Item>
          </Col>
  
          <Col span={8}>
            <Form.Item
              label="Alternate Units"
              name="alternateUnits"
            >
              <Select style={inputStyle} placeholder="Select units">
                <Option value="nos">Nos</Option>
                <Option value="kg">Kg</Option>
                <Option value="ltr">Ltr</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
  
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="GST Applicable"
              name="gstApplicable"
              rules={[{ required: true, message: 'Please select if GST is applicable!' }]}
            >
              <Select style={inputStyle} placeholder="Select GST applicability" onChange={handleGSTApplicableChange}>
                <Option value="yes">Yes</Option>
                <Option value="no">No</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
  
        {isGSTApplicable && (
          <>
            <h4>GST Details</h4>
            <Divider />
            <Form.List name="gstDetails">
              {(fields, { add, remove }) => (
                <>
                  {fields.map((field) => (
                    <div key={field.key} className="gst-detail-group">
                      <Row gutter={16}>
                        <Col span={8}>
                          <Form.Item
                            {...field}
                            label="Applicable Date"
                            name={[field.name, 'applicableDate']}
                            fieldKey={[field.fieldKey, 'applicableDate']}
                          >
                            <DatePicker style={inputStyle} />
                          </Form.Item>
                        </Col>
  
                        <Col span={8}>
                          <Form.Item
                            {...field}
                            label="HSN SAC Details"
                            name={[field.name, 'hsnSacDetails']}
                            fieldKey={[field.fieldKey, 'hsnSacDetails']}
                          >
                            <Input style={inputStyle} />
                          </Form.Item>
                        </Col>
  
                        <Col span={8}>
                          <Form.Item
                            {...field}
                            label="HSN"
                            name={[field.name, 'hsn']}
                            fieldKey={[field.fieldKey, 'hsn']}
                          >
                            <Input style={inputStyle} />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={8}>
                          <Form.Item
                            {...field}
                            label="Taxability"
                            name={[field.name, 'taxability']}
                            fieldKey={[field.fieldKey, 'taxability']}
                          >
                            <Input style={inputStyle} />
                          </Form.Item>
                        </Col>
  
                        <Col span={8}>
                          <Form.Item
                            {...field}
                            label="GST Rate"
                            name={[field.name, 'gstRate']}
                            fieldKey={[field.fieldKey, 'gstRate']}
                          >
                            <Input style={inputStyle} />
                          </Form.Item>
                        </Col>
  
                        <Col span={8}>
                          <MinusCircleOutlined onClick={() => remove(field.name)} className="remove-button" />
                        </Col>
                      </Row>
                    </div>
                  ))}
                  <Form.Item>
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                      Add GST Details
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </>
        )}
  
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="Enable Opening Balance"
              name="openingBalance"
              rules={[{ required: true, message: 'Please select if Opening Balance is applicable!' }]}
            >
              <Select style={inputStyle} placeholder="Select Opening Balance applicability" onChange={handleOpeningBalanceChange}>
                <Option value="yes">Yes</Option>
                <Option value="no">No</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
  
        {showOpeningBalanceBreakup && (
          <div>
            <Divider>Opening Balance Breakup</Divider>
            <Table
              dataSource={openingBalanceBreakupData}
              columns={columns}
              pagination={false}
              rowKey={(record, index) => index}
            />
            {/*<Button onClick={addOpeningBalanceRow} type="dashed">Add Row</Button>*/}
          </div>
        )}
  
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Submit
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}  

export default StockItemForm;
