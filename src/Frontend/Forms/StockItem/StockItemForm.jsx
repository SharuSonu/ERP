import React, { useState, useContext, useEffect } from 'react';
import { Form, Input, Button, Select, DatePicker, Space, Row, Col, Divider, Table } from 'antd';
import { MinusCircleOutlined, PlusOutlined, CloseOutlined } from '@ant-design/icons';
import { createStockItem, fetchStockGroups } from '../../utils/RestApi';
import { AppContext } from '../../../Context/AppContext';
import moment from 'moment';
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
      title: 'Godown',
      dataIndex: 'godown',
      key: 'godown',
      render: (_, record, index) => (
        <Input style={{ width: 120 }}
          placeholder="Godown"
          onChange={(e) => handleOpeningBalanceBreakupChange(index, 'godown', e.target.value)}
        />
      ),
    },
    {
      title: 'Batch',
      dataIndex: 'batch',
      key: 'batch',
      render: (_, record, index) => (
        <Input style={{ width: 150 }}
          placeholder="Batch"
          onChange={(e) => handleOpeningBalanceBreakupChange(index, 'batch', e.target.value)}
        />
      ),
    },
    {
      title: 'Rate Per',
      dataIndex: 'ratePer',
      key: 'ratePer',
      render: (_, record, index) => (
        <Input style={{ width: 120 }}
          placeholder="Rate Per"
          onChange={(e) => handleOpeningBalanceBreakupChange(index, 'ratePer', e.target.value)}
        />
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (_, record, index) => (
        <Input style={{ width: 200 }}
          placeholder="Amount"
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

  const handleOpeningBalanceBalanceChange = (e) => {
    const hasOpeningBalance = e.target.value.trim() !== '';
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

  return (
    <div className="SKUForm-container">
      <h4>Stock Item Creation</h4>
      <Divider />
      <Form
        name="stock_item_creation"
        initialValues={{ remember: true }}
        onFinish={onFinish}
        layout="vertical"
        style={{ width: '600px' }}
      >
        <Form.Item
          label="Name"
          name="name"
          rules={[{ required: true, message: 'Please input the name!' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Part No"
          name="partNo"
          
        >
          <Input />
        </Form.Item>

        {/* Other form items... */}
        <Form.Item
          label="Alias"
          name="alias"
          
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="group"
          name="under"
        >
          <Select showSearch optionFilterProp="children">
            {StockGroupOptions.length > 0 ? (
              StockGroupOptions.map((group) => (
                <Option key={group} value={group}>
                  {group}
                </Option>
              ))
            ) : (
              <Option value="" disabled>
                No data
              </Option>
            )}
          </Select>
        </Form.Item>

        <Form.Item
          label="Units"
          name="units"
          
        >
          <Select placeholder="Select units">
            <Option value="nos">Nos</Option>
            <Option value="kg">Kg</Option>
            <Option value="ltr">Ltr</Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="Alternate units"
          name="alternateUnits"
          
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="GST Applicable"
          name="gstApplicable"
          rules={[{ required: true, message: 'Please select if GST is applicable!' }]}
        >
          <Select placeholder="Select GST applicability" onChange={handleGSTApplicableChange}>
            <Option value="yes">Yes</Option>
            <Option value="no">No</Option>
          </Select>
        </Form.Item>

        {isGSTApplicable && (
          <>
            <h4>GST DETAILS</h4>
            <Divider />
            <Form.List name="gstDetails">
              {(fields, { add, remove }) => (
                <>
                  {fields.map((field) => (
                    <div key={field.key} className="gst-detail-group">
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            {...field}
                            label="Applicable Date"
                            name={[field.name, 'applicableDate']}
                            fieldKey={[field.fieldKey, 'applicableDate']}
                            
                          >
                            <DatePicker style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            {...field}
                            label="HSN SAC DETAILS"
                            name={[field.name, 'hsnSacDetails']}
                            fieldKey={[field.fieldKey, 'hsnSacDetails']}
                            
                          >
                            <Input />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            {...field}
                            label="HSN"
                            name={[field.name, 'hsn']}
                            fieldKey={[field.fieldKey, 'hsn']}
                            
                          >
                            <Input />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            {...field}
                            label="Taxability"
                            name={[field.name, 'taxability']}
                            fieldKey={[field.fieldKey, 'taxability']}
                            
                          >
                            <Input />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            {...field}
                            label="GST Rate"
                            name={[field.name, 'gstRate']}
                            fieldKey={[field.fieldKey, 'gstRate']}
                           
                          >
                            <Input />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={12}>
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


        <h4>Opening Balance</h4>
        <Divider />

        <Form.Item
          label="Opening Balance"
          name="openingBalance"
          style={{ width: 200 }}
        >
          <Input onChange={handleOpeningBalanceBalanceChange} />
        </Form.Item>

        {/* Conditionally render Opening Balance breakup section */}
        {showOpeningBalanceBreakup && (
          <div>
            <Divider>Opening Balance Breakup</Divider>
            <Table
              dataSource={openingBalanceBreakupData}
              columns={columns}
              pagination={false}
              rowKey={(record, index) => index}
            />
            <Button onClick={addOpeningBalanceRow}>Add Row</Button>
          </div>
        )}

        <Form.Item
          label="Rate"
          name="openingBalanceRate"
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Value"
          name="openingBalanceValue"
        >
          <Input />
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

export default StockItemForm;
