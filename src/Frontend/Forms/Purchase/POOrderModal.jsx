import React, { useState, useContext, useEffect } from 'react';
import { Modal, Button, Select, message, DatePicker, Space, Form } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import axios from 'axios';
import { BASE_URL } from '../../utils/Ipurl';
import moment from 'moment';

const POOrderModal = ({ isModalVisible, setIsModalVisible, setFieldValue, values, companyName, partyName, orderOptions, trackingOptions,vchnumval, onOk, onFormValues }) => {
  const [form] = Form.useForm();
  const [itemOptions, setItemOptions] = useState([]);
  const [GodownOptions, setGodownOptions] = useState([]);
  const [TrackingNoOptions, setTrackingNoOptions] = useState([]);
  const [BatchOptions, setBatchOptions] = useState([]);
  const [OrderNoOptions, setOrderNoOptions] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loading, setLoading] = useState(false);


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

  const handleOk = async (values) => {

    const trackinggrn = form.getFieldValue('trackingNos');
    
    if( trackinggrn && trackinggrn.length !== 0)
    {
      try {
        setLoadingProducts(true);
        
         // Retrieve the trackingNos from the form
      const trackingNos = form.getFieldValue('trackingNos');
      console.log(trackingNos);

      if (!trackingNos || trackingNos.length === 0) {
        message.error('Please add at least one tracking before proceeding.');
        return;
      }
      
       // Extract order numbers to pass to the API
       const TrackingNumbers = trackingNos.map(grn => grn.trackingNo);
       //console.log(TrackingNumbers);
  
        const response = await axios.get(`${BASE_URL}/fetch-all-pending-grnpurc-details`, {
          params: {
            cmp: companyName,
            partyAccount: partyName,
            TrackingNumbers: TrackingNumbers.join(','),
          }
        });
        
        if (response.data.success) {
          
          const { pendingGRN } = response.data;
          const allEntries = pendingGRN.flatMap(grn => grn.inventoryEntries);
          // Flatten all batch details within inventory entries
          const allBatchDetails = pendingGRN.flatMap(grn =>
            grn.inventoryEntries.flatMap(entry => entry.batchDetails)
          );
          
          //console.log(allBatchDetails);
          // Update itemOptions with unique item names
          const options = updateItemOptions(allEntries);
          
          
          // Create a lookup map from itemOptions
          const itemOptionsMap = options.reduce((map, option) => {
            map[option.value] = option;
            return map;
          }, {});
          
  
        
          // Extract unique Tracking No options from batch details
              
      const uniqueTrackingNos = [...new Set(allBatchDetails.map(batch => batch.tracking_no))].filter(Boolean);
      
      const trackingNoOptions = uniqueTrackingNos.map(trackingNo => ({
          value: trackingNo,
          label: trackingNo
      }));
      setTrackingNoOptions(trackingNoOptions);
      
      
      const uniqueOrderNos = [...new Set(pendingGRN.map(grn => grn.vouchernumber))].filter(Boolean);
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
              discount: entry.discount || 0,
              amount: entry.amount || 0,
              gstrate: entry.gstRate || 0,
              taxamount: entry.taxAmount || 0,
             batchAllocations: allBatchDetails
                  .filter(batch => batch.voucherId === entry.voucherId && batch.invId === String(entry.id)) // Filter batches matching the voucherId
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
           
        
          setFieldValue('inventory', inventoryData);
        
          setIsModalVisible(false); // Close the modal
        } else {
          message.error('Failed to fetch tracking details.');
        }
      } catch (error) {
        message.error('Error fetching tracking details.');
      } finally {
        setLoadingProducts(false);
      }

    }
    else
    {
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

      const response = await axios.get(`${BASE_URL}/fetch-all-pending-popurc-details`, {
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
            discount: entry.discount || 0,
            amount: entry.amount || 0,
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
         
        //console.log(allBatchDetails);
      //const inventoryIndex = currentInventoryIndex;
      //console.log('Test');
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
  }
  if (onFormValues) {
    onFormValues(form.getFieldsValue());
    console.log(form.getFieldsValue());
  }
  //}
  };

  const handleCancel = () => setIsModalVisible(false);

  const handleOrderNumberChange = (value, index) => {
    const selectedOrder = orderOptions.find((order) => order.value === value);
    if (selectedOrder) {
      const orders = form.getFieldValue('orders') || [];
      const updatedOrders = orders.map((order, idx) =>
        idx === index ? { ...order, orderDate: moment(selectedOrder.date) } : order
      );
      form.setFieldsValue({ orders: updatedOrders });
    }
  };

/*
  useEffect(() => {
    if (isModalVisible) {
      fetchTrackingOptions();
    }
  }, [isModalVisible]); */

  const fetchTrackingOptions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/fetch-all-pending-grn-order`, {
        params: {
          cmp: companyName,
          partyAccount: partyName,
        },
      });

      if (response.data.success) {
        const pendingGRNs = response.data.pendingGRN;
        const uniqueTrackingNos = [...new Set(pendingGRNs.map(grn => grn.vouchernumber))].filter(Boolean);
        const trackingOptions = uniqueTrackingNos.map(trackingNo => ({
          value: trackingNo,
          label: trackingNo,
          date: pendingGRNs.find(grn => grn.vouchernumber === trackingNo).voucherDate
        }));
        setTrackingOptions(trackingOptions);

      } else {
        message.error('Failed to fetch tracking numbers.');
      }
    } catch (error) {
      message.error(error);
      //message.error('Error fetching tracking numbers.');
    } finally {
      setLoading(false);
    }
  };


  const handleTrackingNoChange = async(value, index) => {
   /* const trackingNos = form.getFieldValue('trackingNos') || [];
    const updatedTrackingNos = trackingNos.map((tracking, idx) =>
      idx === index ? { ...tracking, trackingNo: value } : tracking
    );
    form.setFieldsValue({ trackingNos: updatedTrackingNos });*/

    const trackingNos = trackingOptions.find((grn) => grn.value === value);
    if (trackingNos) {
      const grns = form.getFieldValue('trackingNos') || [];
      const updatedGRNS = grns.map((grn, idx) =>
        idx === index ? { ...grn, trackingDate: moment(trackingNos.date) } : grn
      );
      form.setFieldsValue({ trackingNos: updatedGRNS });

       // Fetch PO details based on selected tracking number
       try {
        const response = await axios.get(`${BASE_URL}/fetch-po-details-by-tracking-no`, {
          params: {
            cmp: companyName,
            partyAccount: partyName,
            trackingNo: value,
          },
        });

        if (response.data.success) {
          // Extract the order numbers and dates from the response
          const uniqueOrderNumbers = new Set();
         /* 
          const poDetails = response.data.poDetails.flatMap(po =>
            po.batchDetails.map(batch => ({
                orderNumber: batch.order_no,
                orderDate: moment(batch.voucherDate),
            }))
        );*/

        const poDetails = response.data.poDetails.flatMap(po =>
          po.batchDetails
              .map(batch => ({
                  orderNumber: batch.order_no,
                  orderDate: moment(batch.voucherDate),
              }))
              .filter(detail => {
                  // If the order number is already in the Set, filter it out
                  if (uniqueOrderNumbers.has(detail.orderNumber)) {
                      return false;
                  } else {
                      // Otherwise, add the order number to the Set and include it
                      uniqueOrderNumbers.add(detail.orderNumber);
                      return true;
                  }
              })
      );
  
      //console.log('Unique PO Details by Order Number:', poDetails);
        // Clear existing orders in the form
        form.setFieldsValue({ orders: [] });

        // Insert new orders into the form
        poDetails.forEach(detail => {
            form.getFieldValue('orders').push(detail);
        });

        // Update the form with new values
        form.setFieldsValue({
            orders: form.getFieldValue('orders'),
        });

        // Update the orderOptions for the Select component
        const orderOptions = poDetails.map(detail => ({
            value: detail.orderNumber,
            label: `${detail.orderNumber} - ${detail.orderDate.format('YYYY-MM-DD')}`,
        }));

        setOrderOptions(orderOptions);

        } else {
          message.error('Failed to fetch PO details.');
        }
      } catch (error) {
        //message.error('Error fetching PO details.');
      }

    }



  };

  return (
    <Modal
      title="Order & Tracking Details"
      visible={isModalVisible}
      onOk={handleOk}
      onCancel={handleCancel}
      width={800}
    >
      <Form form={form}>
        {/* Tracking No Details */}
        <Form.List name="trackingNos">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, fieldKey, ...restField }) => (
                <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                  <Form.Item
                    {...restField}
                    name={[name, 'trackingNo']}
                    fieldKey={[fieldKey, 'trackingNo']}
                    label="Tracking Number"
                    rules={[{ required: true, message: 'Please select the tracking number!' }]}
                  >
                    <Select
                      placeholder="Select Tracking Number"
                      options={trackingOptions}
                      onChange={(value) => handleTrackingNoChange(value, name)}
                    />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, 'trackingDate']}
                    fieldKey={[fieldKey, 'trackingDate']}
                    label="Tracking Date"
                    rules={[{ required: true, message: 'Please select the tracking date!' }]}
                  >
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                  <MinusCircleOutlined onClick={() => remove(name)} />
                </Space>
              ))}
              <Form.Item>
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                  Add Tracking Number
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>

        {/* Order No Details */}
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
                      options={orderOptions}
                      onChange={(value) => handleOrderNumberChange(value, name)}
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
