import React, { useState, useEffect } from 'react';
import { Modal, Button, Select, message, DatePicker, Space, Form, Input } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import axios from 'axios';
import { BASE_URL } from '../../utils/Ipurl';
import moment from 'moment';

const POOrderModal = ({ isModalVisible, setIsModalVisible, setFieldValue, values, companyName, partyName, orderOptions, vchnumval }) => {
  const [form] = Form.useForm(); // Get the form instance
  const [itemOptions, setItemOptions] = useState([]);
  const [GodownOptions, setGodownOptions] = useState([]);
  const [TrackingNoOptions, setTrackingNoOptions] = useState([]);
  const [OrderNoOptions, setOrderNoOptions] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [currentInventoryIndex, setCurrentInventoryIndex] = useState(null);
  //console.log(vchnumval);
  const handleSelectInventoryItem = (index) => {
    setCurrentInventoryIndex(index);
};
  // Function to update itemOptions with value and label
  const updateItemOptions = (inventoryEntries) => {
    const uniqueItems = [...new Set(inventoryEntries.map(entry => entry.itemName))];
    const options = uniqueItems.map(item => ({
      value: item,
      label: item
    }));
    setItemOptions(options);
    return options;
  };

  const handleOk = async () => {
    try {
      setLoadingProducts(true);
      
       // Retrieve the orders from the form
    const orders = form.getFieldValue('orders');

    if (!orders || orders.length === 0) {
      message.error('Please add at least one order before proceeding.');
      return;
    }
    
     // Extract order numbers to pass to the API
     const orderNumbers = orders.map(order => order.orderNumber);
     //console.log(orderNumbers);

      const response = await axios.get(`${BASE_URL}/fetch-all-pending-po-details`, {
        params: {
          cmp: companyName,
          partyAccount: partyName,
          orderNumbers: orderNumbers.join(','),
        }
      });
      
      if (response.data.success) {
        
        const { pendingPOs } = response.data;
        const allEntries = pendingPOs.flatMap(po => po.inventoryEntries);
        // Flatten all batch details within inventory entries
        const allBatchDetails = pendingPOs.flatMap(po =>
          po.inventoryEntries.flatMap(entry => entry.batchDetails)
        );
       
        // Update itemOptions with unique item names
        const options = updateItemOptions(allEntries);
        
        
        // Create a lookup map from itemOptions
        const itemOptionsMap = options.reduce((map, option) => {
          map[option.value] = option;
          return map;
        }, {});
        

        
        // Extract unique Tracking No options from batch details
        //console.log(allBatchDetails);    
    const uniqueTrackingNos = [...new Set(allBatchDetails.map(batch => batch.tracking_no))].filter(Boolean);
    
    const trackingNoOptions = uniqueTrackingNos.map(trackingNo => ({
        value: trackingNo,
        label: trackingNo
    }));
    setTrackingNoOptions(trackingNoOptions);
    
    const uniqueOrderNos = [...new Set(pendingPOs.map(po => po.vouchernumber))].filter(Boolean);
          const orderNoOptions = uniqueOrderNos.map(orderNo => ({
              value: orderNo,
              label: orderNo
          }));
          //console.log(orderNoOptions);
          setOrderNoOptions(orderNoOptions);
   

        const uniqueGodowns = [...new Set(allBatchDetails.map(batch => batch.godown))].filter(Boolean);
        const godownOptions = uniqueGodowns.map(godown => ({
            value: godown,
            label: godown
        }));
    
        // Update the state for Godown options
        setGodownOptions(godownOptions);

        // Map inventoryData using the lookup map
        const inventoryData = allEntries.map(entry => {
         /* const relatedPO = pendingPOs.find(po => 
            String(po.vouchernumber) === String(entry.voucherId)
          );
          console.log('relatedPO:', relatedPO);*/
          const option = itemOptionsMap[entry.itemName];
          return {
            itemName: option,// ? option.value : entry.itemName, // Use itemOptions value or fallback
            quantity: entry.quantity,
            rate: entry.rate,
            discount: entry.discount,
            amount: entry.amount,
            gstrate: entry.gstRate || 0,
            taxamount: entry.taxAmount || 0,
            batchAllocations: allBatchDetails
                .filter(batch => batch.voucherId === entry.voucherId && batch.invId === entry.id) // Filter batches matching the voucherId
                .map(batch => ({
                    trackingNo: {value: vchnumval, label: vchnumval } || '',
                    orderNo: { value: batch.order_no, label: batch.order_no } || '',
                    itemname: batch.itemname || '',
                    godown: godownOptions || '',
                    batch: batch.batch || '',
                    quantity: batch.quantity || 0,
                    rate: batch.rate || 0,
                    discount: batch.discount || 0,
                    amount: batch.amount || 0
                }))
          };
        });

      const inventoryIndex = currentInventoryIndex;
      
        // Update inventory field in the main form
        setFieldValue('inventory', inventoryData);
      
        setIsModalVisible(false); // Close the modal
      } else {
        message.error('Failed to fetch order details.');
      }
    } catch (error) {
      message.error('Error fetching order details.');
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleCancel = () => setIsModalVisible(false);

  const handleOrderNumberChange = (value, index) => {
    //console.log('Selected value:', value);
    //console.log('Order options:', orderOptions);

    // Find the selected order
    const selectedOrder = orderOptions.find(order => order.value === value);
    //console.log('Selected order:', selectedOrder);

    if (selectedOrder) {
      const orders = form.getFieldValue('orders') || [];
      const updatedOrders = orders.map((order, idx) =>
        idx === index ? { ...order, orderDate: moment(selectedOrder.date) } : order
      );
      form.setFieldsValue({ orders: updatedOrders });
    } else {
      console.error('No matching order found');
    }
  };

  return (
    <Modal
      title="Order Details"
      visible={isModalVisible}
      onOk={handleOk}
      onCancel={handleCancel}
      width={800}
    >
      <Form form={form}>
        <Form.List name="orders">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, fieldKey, ...restField }) => (
                <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                  <Form.Item
                    {...restField}
                    name={[name, 'orderNumber']}
                    fieldKey={[fieldKey, 'orderNumber']}
                    label="Order Number"
                    rules={[{ required: true, message: 'Please select the order number!' }]}
                  >
                    <Select
                      placeholder="Select Order Number"
                      options={orderOptions} // Ensure this is an array of options
                      onChange={(value) => handleOrderNumberChange(value, name)} // Pass value and index
                    />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, 'orderDate']}
                    fieldKey={[fieldKey, 'orderDate']}
                    label="Order Date"
                    rules={[{ required: true, message: 'Please select the order date!' }]}
                  >
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                  
                  <MinusCircleOutlined onClick={() => remove(name)} />
                </Space>
              ))}
              <Form.Item>
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                  Add Order
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      </Form>
    </Modal>
  );
};

export default POOrderModal;
