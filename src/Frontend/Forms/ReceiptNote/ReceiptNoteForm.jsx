import React, { useState, useContext, useEffect } from 'react';
import Select from 'react-select';
import { Formik, Field, Form, FieldArray, useFormikContext } from 'formik';
import { Modal, Input,  Button, Divider, Table, DatePicker, Space, message } from 'antd';
import { DeleteOutlined, MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import '../../../styles/ReceiptNote/ReceiptNoteForm.css';
import { createReceiptNoteVoucher } from '../../utils/RestApi';
import { AppContext } from '../../../Context/AppContext';
import axios from 'axios';
import {BASE_URL} from '../../utils/Ipurl';
import moment from 'moment';
import POOrderModal from './POOrderModal';
const taxRates = {
  CGST: 9,
  SGST: 9,
  IGST: 18,
  // Add more tax rates as needed
};

const ledgerOptions = [];


const getCurrentDateFormatted = () => {
  const currentDate = new Date();
  const dd = String(currentDate.getDate()).padStart(2, '0');
  const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
  const yyyy = currentDate.getFullYear();
  return `${yyyy}-${mm}-${dd}`;
};

const initialValues = {
  voucherTypeName: 'ReceiptNote',
  voucherDate: getCurrentDateFormatted(),
  voucherNumber: '',
  supplier: null,
  inventory: [
    { itemName: '', quantity: 0, rate: 0, discount: 0, amount: 0, orderNo: 0, taxType: 'IGST' },
  ],
  ledgerEntries: [
    { particulars: '', rate: 0, amount: 0 },
  ],
  narration: '',
  totalAmount: 0,
};

const ReceiptNoteForm = () => {
  const { companyName, setCompanyName } = useContext(AppContext);
  const [supplierOptions, setSupplierOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inventoryOptions, setInventoryOptions] = useState([]);
  const [isBatchModalVisible, setIsBatchModalVisible] = useState(false);
  const [currentInventoryIndex, setCurrentInventoryIndex] = useState(null);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [gstRate, setGstRate] = useState('');
  const [productId, setProductId] = useState(0);
  const [ledgerOptions, setLedgerOptions] = useState([]);
  const [taxInfo, setTaxInfo] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [orders, setOrders] = useState([]);
  //const [form] = Form.useForm();
  const [orderNumbers, setOrderNumbers] = useState([]);
  const [selectedItemIndex, setSelectedItemIndex] = useState(null);
  const [selectedItemName, setSelectedItemName] = useState('');
  const [orderData, setOrderData] = useState([]);
  const [partyName, setPartyName] = useState('');
  const [vchnumval, setvchnumval] = useState('');

  const [orderOptions, setOrderOptions] = useState([
    { value: 'NotApplicable', label: 'NotApplicable' },
    { value: 'EndofList', label: 'EndofList' }
  ]);
  const [trackingOptions, setTrackingOptions] = useState([
    { value: 'NotApplicable', label: 'NotApplicable' },
    { value: 'EndofList', label: 'EndofList' }
  ]);

  const [GodownOptions, setGodownOptions] = useState([
    { value: 'Main Location', label: 'Main Location' }
  ]);

  const [batchOptions, setBatchOptions] = useState([
    { value: 'Primary', label: 'Primary' }
  ]);

 

  // Fetch options for OrderNo and TrackingNo (simulate fetching from an API)
  useEffect(() => {
    // Simulate API calls to fetch data
    const fetchOptions = async () => {
      // Replace with your actual API calls
      //const fetchedOrders = await fetch('/api/orders').then(res => res.json());
      //const fetchedTrackings = await fetch('/api/trackings').then(res => res.json());
     /* 
      setOrderOptions(prevOptions => [
        ...prevOptions,
        ...fetchedOrders.map(order => ({ value: order.id, label: order.name }))
      ]);*/
      
      setTrackingOptions(prevOptions =>[
        ...prevOptions
      ]);


      setGodownOptions(prevOptions =>[
        ...prevOptions
        //...fetchedTrackings.map(tracking => ({ value: Godown.id, label: Godown.name }))
      ]);
    };

    fetchOptions();
  }, []);

  
  const handleShowBatchModal = (index) => {
    setCurrentInventoryIndex(index);
    setIsBatchModalVisible(true);
  };

  const handleBatchModalOk = (index, setFieldValue, values) => {
    const batchAllocations = values.inventory[index].batchAllocations;

    // Sum up quantities, rates, and amounts from batch allocations
    const totalQuantity = batchAllocations.reduce((acc, curr) => acc + parseFloat(curr.quantity || 0), 0);
    const totalAmount = batchAllocations.reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);

    // Calculate the rate based on the total amount and total quantity
    //const rate = totalQuantity > 0 ? totalAmount / totalQuantity : 0;
    const rate = batchAllocations.length > 0 ? parseFloat(batchAllocations[0].rate || 0) : 0;
    
    // Update inventory fields
    setFieldValue(`inventory.${index}.quantity`, totalQuantity);
    setFieldValue(`inventory.${index}.rate`, rate.toFixed(2));
    setFieldValue(`inventory.${index}.amount`, totalAmount.toFixed(2));

    // Close the modal
    setIsBatchModalVisible(false);
  };

  const handleBatchModalCancel = () => {
    setIsBatchModalVisible(false);
  };


  const handleSetupDatabase = async () => {
    setLoading(true);

    try {
      await axios.post(BASE_URL+'/setup-database', { cmp: companyName});
      message.success('Database setup completed successfully');
    } catch (error) {
      console.error('Error setting up database:', error);
      message.error('Failed to setup database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedCompanyName = localStorage.getItem('companyName');
    if (storedCompanyName) {
      setCompanyName(storedCompanyName);
    }
  }, [setCompanyName]);


  useEffect(() => {
    const fetchSuppliers = async () => {
      setLoading(true); 
      try {
        const response = await axios.get(BASE_URL+'/ledgers', {
          params: { companyName }
        });
        const options = response.data.map(ledger => ({
          value: ledger.ledgername,
          label: ledger.ledgername
        }));
        setSupplierOptions(options);
      } catch (error) {
        console.error('Error fetching ledger names:', error);
      } finally {
        setLoading(false); 
      }
    };

    const fetchProducts = async () => {
      setLoadingProducts(true); 
      try {
        const response = await axios.get(BASE_URL+'/products', {
          params: { companyName }
        });
        const options = response.data.map(product => ({
          value: product.name,
          label: product.name
        }));
        setInventoryOptions(options);
      } catch (error) {
        console.error('Error fetching product names:', error);
      } finally {
        setLoadingProducts(false); 
      }
    };

    fetchSuppliers();
    fetchProducts();
  }, [companyName]);

  const handleSupplierChange = (option, setFieldValue) => {
    setFieldValue('supplier', option);
    fetchOrderNumbers(option.value);
    setPartyName(option.value);
  };

  useEffect(() => {
    const fetchTaxes = async () => {
      try {
        const response = await axios.get(BASE_URL+'/taxes', {
          params: { companyName }
        });
        const fetchedTaxInfo = response.data.map(tax => ({ taxid: tax.id, taxname : tax.taxname, taxrate : tax.taxrate, taxtype: tax.taxtype }));
        //console.log(fetchedTaxInfo);
        setTaxInfo(fetchedTaxInfo);

        const taxOptions = response.data.map(tax => ({ value: tax.id, label: tax.taxname }));
        setLedgerOptions(taxOptions);
      } catch (error) {
        console.error('Error fetching taxes:', error);
      }
    };

    fetchTaxes();
  }, [companyName]);


  const handleItemChange = async (option, index, setFieldValue, values) => {
    setFieldValue(`inventory.${index}.itemName`, option);
    setSelectedItemIndex(index);
    setSelectedItemName(option.label);
    setIsBatchModalVisible(true);
    handleShowBatchModal(index);
    try {
      
      const response = await axios.get(BASE_URL+'/stockitem', {
        params: { companyName, productName: option.label }
      });
      const product = response.data;

      const response_gstrate = await axios.get(BASE_URL+'/gst-rate', {
        params: { companyName, productId:  product[0].id }
      });
      const gstrate = response_gstrate.data;
      const gstrateval = gstrate.length > 0 ? gstrate[0].gstRate : 0;

      //console.log("product id",product[0].id)
      setFieldValue(`inventory.${index}.productId`, product[0].id);
      setFieldValue(`inventory.${index}.gstrate`, gstrateval);

      const updatedValues = { ...values };
      updatedValues.inventory[index].gstrate = gstrateval;
      const quantity = updatedValues.inventory[index].quantity;
      const rate = updatedValues.inventory[index].rate;
      const discount = updatedValues.inventory[index].discount;
      const amount = calculateAmount(quantity, rate, discount);
      const taxamount = (Number(gstrateval) * Number(amount))/Number(100);

      setFieldValue(`inventory.${index}.amount`, amount.toFixed(2).toString());
      setFieldValue(`inventory.${index}.taxamount`, taxamount.toFixed(2).toString());

      updatedValues.inventory[index].amount = amount;
      updatedValues.inventory[index].taxamount = taxamount;

      const totalAmount = calculateInventoryTotal(updatedValues.inventory);
      setFieldValue('totalAmount', parseFloat(totalAmount).toFixed(2));
      updateLedgerEntries(values, setFieldValue);
    } catch (error) {
      console.error('Error fetching product id:', error);
    }
  };

  const handleLedgerChange = async(option, index, setFieldValue, values) => {
    try {
      
     /* const response = await axios.get('http://localhost:5000/api/taxes', {
        params: { companyName, particulars: option.label }
      });*/
      //const ledtaxid = response.data;
    const response_gstrate = await axios.get(BASE_URL+'/ledtaxrate', {
      params: { companyName, particulars: option.label }
    });
    const ledtaxrate = response_gstrate.data;
    const gstrateval = ledtaxrate.length > 0 ? ledtaxrate[0].taxrate : 0;
    setFieldValue(`ledgerEntries.${index}.rate`, parseFloat(gstrateval).toFixed(2));
    //const updatedLedgerEntry = [...values.ledgerEntries];
   }catch (error) {
    console.error('Error fetching ledtax id:', error);
  }
  };

  const isEqual = (num1, num2, epsilon = 0.001) => Math.abs(num1 - num2) < epsilon;
  const updateLedgerEntries = (values, setFieldValue) => {
    const newLedgerEntries = [];

    values.inventory.forEach((item) => {
      const gstRate = item.gstrate;
      const taxAmount = item.taxamount;
      //console.log("TaxAmount", taxAmount);

      // Find the corresponding tax info
      //console.log(taxInfo);
    
      let cmpstate = "Karnataka";
      let ledstate = "Karnataka";
      let gsttype = '';
      let sgst_cgstrate = parseFloat(gstRate)/2; 
      
      if (cmpstate.toLowerCase() === ledstate.toLowerCase()) {
        gsttype = "GST";
        //console.log(gsttype, cmpstate, ledstate);
    } else {
        gsttype = "IGST";
        //console.log(gsttype, cmpstate, ledstate);
    }

    // Handle GST case
    if (gsttype === "GST") {
      // Find CGST entry
      const taxInfoEntryCGST = taxInfo.find((tax) => isEqual(parseFloat(tax.taxrate), parseFloat(gstRate)/2) && tax.taxtype === 'CGST');
      if (taxInfoEntryCGST) {
        // Check if a CGST entry already exists
        const existingCGSTEntry = newLedgerEntries.find(entry => entry.particulars.label === taxInfoEntryCGST.taxname);
        if (existingCGSTEntry) {
          existingCGSTEntry.amount = (parseFloat(existingCGSTEntry.amount) + taxAmount / 2).toString();
        } else {
          newLedgerEntries.push({
            particulars: { value: taxInfoEntryCGST.taxid, label: taxInfoEntryCGST.taxname },
            rate: gstRate / 2,
            amount: taxAmount / 2,
          });
        }
      }

      // Find SGST entry
      const taxInfoEntrySGST = taxInfo.find((tax) => isEqual(parseFloat(tax.taxrate), parseFloat(gstRate)/2) && tax.taxtype === 'SGST');
      if (taxInfoEntrySGST) {
        // Check if an SGST entry already exists
        const existingSGSTEntry = newLedgerEntries.find(entry => entry.particulars.label === taxInfoEntrySGST.taxname);
        if (existingSGSTEntry) {
          existingSGSTEntry.amount = (parseFloat(existingSGSTEntry.amount) + taxAmount / 2).toString();
        } else {
          newLedgerEntries.push({
            particulars: { value: taxInfoEntrySGST.taxid, label: taxInfoEntrySGST.taxname },
            rate: gstRate / 2,
            amount: taxAmount / 2,
          });
        }
      }
    } else { // Handle IGST case
      const taxInfoEntryIGST = taxInfo.find((tax) => isEqual(parseFloat(tax.taxrate), parseFloat(gstRate)));
      if (taxInfoEntryIGST) {
        const existingIGSTEntry = newLedgerEntries.find(entry => entry.particulars.label === taxInfoEntryIGST.taxname);
        if (existingIGSTEntry) {
          existingIGSTEntry.amount = (parseFloat(existingIGSTEntry.amount) + taxAmount / 2).toString();
        } else {
        newLedgerEntries.push({
          particulars: { value: taxInfoEntryIGST.taxid, label: taxInfoEntryIGST.taxname },
          rate: gstRate,
          amount: taxAmount,
        });
      }
      }
    }
  });


    setFieldValue('ledgerEntries', newLedgerEntries);
    return newLedgerEntries;
  };

  const handleQuantityChange = (value, index, setFieldValue) => {
    setFieldValue(`inventory.${index}.quantity`, value);
    updateAmountAndTotal(index, value, null, null, setFieldValue);
  };

  const handleRateChange = (value, index, setFieldValue) => {
    setFieldValue(`inventory.${index}.rate`, value);
    updateAmountAndTotal(index, null, value, null, setFieldValue);
  };

  const handleDiscountChange = (value, index, setFieldValue) => {
    setFieldValue(`inventory.${index}.discount`, value);
    updateAmountAndTotal(index, null, null, value, setFieldValue);
  };

  const handleRemoveItem = (index, remove, values, setFieldValue) => {
    updateLedgerEntries(values, setFieldValue);
    remove(index);
    const updatedInventory = [...values.inventory];
    updatedInventory.splice(index, 1);

    const updatedledgerEntries = [...values.ledgerEntries];
    updatedledgerEntries.splice(index, 1);

    /*updateTotalAmount(updatedInventory, updatedledgerEntries, setFieldValue);
    
    setFieldValue('inventory', updatedInventory);
    setTimeout(() => {
      // Note: values.inventory might not yet be updated here because setFieldValue is asynchronous.
      // So we use updatedInventory directly
      updateLedgerEntries({ ...values, inventory: updatedInventory }, setFieldValue);
  }, 0);*/
  const updatedLedgerEntries = updateLedgerEntries({ ...values, inventory: updatedInventory }, setFieldValue);

        setTimeout(() => {
            const totalinvAmount = calculateInventoryTotal(updatedInventory);
            const totalLedgerEntriesAmount = calculateLedgerEntryTotal(updatedLedgerEntries);
            const totalAmount = totalinvAmount + totalLedgerEntriesAmount;
            setFieldValue('totalAmount', parseFloat(totalAmount).toFixed(2));
        }, 0);

  };

  const handleAddItem = (push) => {
    push({ itemName: '', quantity: 0, rate: 0, discount: 0, amount: 0, orderNo : 0, taxType: 'IGST' });
  };

  const calculateAmount = (quantity, rate, discount) => {
    const discountAmount = (rate * quantity * discount) / 100;
    return rate * quantity - discountAmount;
  };

  const updateTotalAmount = (inventory, ledgerEntries, setFieldValue) => {
    const totalAmount = parseFloat(calculateInventoryTotal(inventory)).toFixed(2);
    const totalledAmount = parseFloat(calculateLedgerEntryTotal(ledgerEntries)).toFixed(2);
    //console.log("total led amount", totalledAmount);
    const totalvchamount = parseFloat(totalAmount) + parseFloat(totalledAmount)
    setFieldValue('totalAmount', parseFloat(totalvchamount).toFixed(2) || 0.00);
  };

  const handleFieldChange = (e, index, field, setFieldValue, values) => {
    const value = parseFloat(e.target.value) || 0;
    setFieldValue(`inventory.${index}.${field}`, value.toString(), false);
    
    const updatedValues = { ...values };
    updatedValues.inventory[index][field] = value;

    //const updatedLedgerEntriesValues = { ...values };
    //updatedLedgerEntriesValues.ledgerEntries[index][field] = value;

    const quantity = field === 'quantity' ? value : updatedValues.inventory[index].quantity;
    const rate = field === 'rate' ? value : updatedValues.inventory[index].rate;
    const discount = field === 'discount' ? value : updatedValues.inventory[index].discount;
    const gst_rate = field === 'gstrate' ? value : updatedValues.inventory[index].gstrate;
    //console.log("GSTRate = ", gst_rate);
    const amount = calculateAmount(quantity, rate, discount);
    setFieldValue(`inventory.${index}.amount`, parseFloat(amount).toFixed(2));

    updatedValues.inventory[index].amount = amount;
    const taxableAmount = field === 'amount' ? value : updatedValues.inventory[index].amount;
    const taxamount = (Number(gst_rate)*Number(taxableAmount))/Number(100);
    //console.log("Tax Amount",taxamount);
    setFieldValue(`inventory.${index}.taxamount`,  taxamount.toFixed(2));
    
    updatedValues.inventory[index].taxamount = taxamount.toFixed(2);
    updatedValues.inventory[index].amount = amount;

    const updatedLedgerEntries = updateLedgerEntries(values, setFieldValue);
    setTimeout(() => {
    const totalinvAmount = calculateInventoryTotal(updatedValues.inventory);
    
    const totalLedgerEntriesAmount = calculateLedgerEntryTotal(updatedLedgerEntries);
    const totalAmount = totalinvAmount + totalLedgerEntriesAmount;

    setFieldValue('totalAmount', parseFloat(totalAmount).toFixed(2));
    //console.log("ledger entries total:", totalLedgerEntriesAmount);

    // Debugging output
    //console.log("Updated Values:", updatedValues);
    //console.log("Total Ledger Entries Amount:", totalLedgerEntriesAmount);
    //console.log("Total Amount:", totalAmount);
    }, 0);
  
  };

  //BatchField
  const handleBatchFieldChange = (e, inventoryIndex, batchIndex, field, setFieldValue, values) => {
    //alert('Hi');
    // Parse the new value from the event
    const value = parseFloat(e.target.value) || 0;
  
    // Update the Formik field value
    setFieldValue(`inventory.${inventoryIndex}.batchAllocations.${batchIndex}.${field}`, value.toString(), false);
  
    // Create a copy of the current values
    const updatedValues = { ...values };
    updatedValues.inventory[inventoryIndex].batchAllocations[batchIndex][field] = value;

    const InvOrderNo = updatedValues.inventory[inventoryIndex].batchAllocations[batchIndex].orderNo || 0;
    //console.log(InvOrderNo);
    setFieldValue(`inventory.${inventoryIndex}.orderNo`, InvOrderNo.value);

    // Retrieve the current values for quantity, rate, and discount
    const quantity = updatedValues.inventory[inventoryIndex].batchAllocations[batchIndex].quantity || 0;
    const rate = updatedValues.inventory[inventoryIndex].batchAllocations[batchIndex].rate || 0;
    const discount = updatedValues.inventory[inventoryIndex].batchAllocations[batchIndex].discount || 0;

    setFieldValue(`inventory.${inventoryIndex}.discount`, discount);
    updatedValues.inventory[inventoryIndex].discount = discount;
  
    //console.log("Batch Qty ",quantity);
    // Calculate the amount: Quantity * Rate - Discount
    //const amount = (quantity * rate) - discount;

    // Retrieve gst_rate from the inventory entry
  const gst_rate = updatedValues.inventory[inventoryIndex].gstrate || 0;
  let itemnameval = updatedValues.inventory[inventoryIndex].itemName || '';
  setFieldValue(`inventory.${inventoryIndex}.batchAllocations.${batchIndex}.itemname`, itemnameval.value);
  //console.log("GST RATE : ", gst_rate);  
  // Calculate the amount
  const amount = calculateAmount(quantity, rate, discount);
  setFieldValue(`inventory.${inventoryIndex}.batchAllocations.${batchIndex}.amount`, parseFloat(amount).toFixed(2));
  updatedValues.inventory[inventoryIndex].batchAllocations[batchIndex].amount = amount;

  // Calculate the taxable amount
  const taxableAmount = field === 'amount' ? value : updatedValues.inventory[inventoryIndex].batchAllocations[batchIndex].amount;
  const taxamount = (Number(gst_rate) * Number(taxableAmount)) / 100;
  //console.log("GST AMOUNT : ", taxamount);  
  setFieldValue(`inventory.${inventoryIndex}.taxamount`, taxamount.toFixed(2));
  updatedValues.inventory[inventoryIndex].taxamount = taxamount.toFixed(2);

  
    // Recalculate the total amount for all batches in this inventory item
    const totalBatchAmount = updatedValues.inventory[inventoryIndex].batchAllocations.reduce(
      (total, batch) => total + parseFloat(batch.amount || 0),
      0
    );
  
    // Update the total amount for this inventory item
    setFieldValue(`inventory.${inventoryIndex}.amount`, parseFloat(totalBatchAmount).toFixed(2));
    updatedValues.inventory[inventoryIndex].amount = totalBatchAmount;
    // Recalculate the grand total including ledger entries
    
    setTimeout(() => {
    
      const updatedLedgerEntries = updateLedgerEntries(values, setFieldValue);
      const totalinvAmount = calculateInventoryTotal(updatedValues.inventory);
            
    const totalLedgerEntriesAmount = calculateLedgerEntryTotal(updatedLedgerEntries);
    //console.log("Inv Total: ", totalinvAmount);
    //console.log("Led Total: ", totalLedgerEntriesAmount);
    
    const totalAmount = totalinvAmount + totalLedgerEntriesAmount;

    setFieldValue('totalAmount', parseFloat(totalAmount).toFixed(2));
    
    //console.log("ledger entries total:", totalLedgerEntriesAmount);

    // Debugging output
    //console.log("Updated Values:", updatedValues);
    //console.log("Total Ledger Entries Amount:", totalLedgerEntriesAmount);
    //console.log("Total Amount:", totalAmount);
    }, 0);
  };
  

  const calculateInventoryTotal = (inventory) => {
    return inventory.reduce((total, item) => parseFloat(total) + parseFloat(item.amount), 0);
  };

  const calculateLedgerEntryTotal = (ledgerEntries) => {
    
    return ledgerEntries.reduce((total, entry) => parseFloat(total) + parseFloat(entry.amount), 0);
    
  };

  const handleReset = (resetForm, setFieldValue) => {
    resetForm({ values: initialValues });
    fetchVoucherNumber().then(newVoucherNumber => setFieldValue('voucherNumber', newVoucherNumber));
  };



  const fetchOrderNumbers = async (partyAccount) => {
    try {
      // Ensure to pass the 'cmp' query parameter as needed
      const response = await axios.get(`${BASE_URL}/pending-purchase-orders`, {
        params: { cmp: companyName, partyAccount: partyAccount } 
      });
      const { success, pendingPOs } = response.data;

      if (success && pendingPOs.length > 0) {
        // Map the pendingPOs to the desired format
        const fetchedOrders = response.data.pendingPOs.map(order => ({
          value: order.vouchernumber,
          label: `${order.vouchernumber}`, // Customize label format as needed
          date: order.voucherDate,
          vouchernumber: order.vouchernumber
        }));

        
        setOrderData(fetchedOrders);
        // Combine existing options with new fetched orders and filter out duplicates
        setOrderOptions(prevOptions => {
          const existingValues = new Set(prevOptions.map(option => option.value));
          const uniqueOrders = [
            ...prevOptions,
            ...fetchedOrders.filter(order => !existingValues.has(order.value))
          ];

          return uniqueOrders;
        });

        // Update the state with unique orders
        setOrderNumbers(prevNumbers => {
          const existingValues = new Set(prevNumbers.map(number => number.value));
          const uniqueOrders = [
            ...prevNumbers,
            ...fetchedOrders.filter(order => !existingValues.has(order.value))
          ];

          return uniqueOrders;
        });
      } else {
        //alert('Hi');
        setOrderOptions([]);
        setOrderNumbers([]);
        setOrderOptions([
          { value: 'NotApplicable', label: 'NotApplicable' },
          { value: 'EndofList', label: 'EndofList' }
      ]);
        //console.log('Failed to fetch orders');
        //message.error('Failed to fetch orders');
      }

    } catch (error) {
      message.error('Failed to fetch order numbers');
    }
  };

  /*
  useEffect(() => {
    fetchOrderNumbers(); // Fetch order numbers when the component mounts
  }, []); // Empty dependency array means this effect runs once on mount
*/

  const showModal = () => {
    setIsModalVisible(true);
  };


  const handleOk = async () => {
    
    try {
      
      //alert('Hi');
      //console.log('Before API Call');
      //console.log('API Endpoint:', `${BASE_URL}/fetch-all-pending-po-details`);
      //console.log('API Params:', { cmp: companyName, partyAccount: partyName });
      //console.log('Reached After Params Log'); // Add this after the params log

      const response = await axios.get(`${BASE_URL}/fetch-all-pending-po-details`, {
          params: {
              cmp: companyName, 
              partyAccount: partyName, 
          }
      });

      //setFieldValue(`inventory.0.rate`, 100);
      setIsModalVisible(false);
      
  } catch (error) {
      message.error(error); 
      //message.error('Error fetching order details.');
  }
  };

  // Example functions to update respective sections
const updateInventoryEntries = (order) => {
  // Implement the logic to update InventoryEntries based on order details
  console.log('Updating InventoryEntries for:', order);
};

const updateBatchDetails = (order) => {
  // Implement the logic to update Batch Details based on order details
  console.log('Updating Batch Details for:', order);
};

const updateLegerEntries = (order) => {
  // Implement the logic to update Leger Entries based on order details
  console.log('Updating Leger Entries for:', order);
};
  

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const columns = [
    {
      title: 'Order Number',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
  
    },
    {
      title: 'Order Date',
      dataIndex: 'orderDate',
      key: 'orderDate',
      render: (date) => date.format('YYYY-MM-DD')
    },
  ];


  const handleSubmit = async (values, actions) => {
    console.log('Form Values:', values);
    
    const voucherData = {
      ...values,
      cmp: companyName,
      voucherNumber: values.voucherNumber,
      partyAccount: values.supplier.value,
      vchnumval:values.voucherNumber
    };
    try {
      
      const response = await createReceiptNoteVoucher(voucherData);

      if (response.success) {
        alert('Voucher created successfully');
        actions.resetForm({ values: initialValues });
        const newVoucherNumber = await fetchVoucherNumber();
        actions.setFieldValue('voucherNumber', newVoucherNumber);
      } else {
        alert(response.message || 'Failed to create Voucher');
      }
    } catch (error) {
      console.error('Error:', error);
      alert(error.message || 'An error occurred');
    }
  };

  const fetchVoucherNumber = async () => {
    try {
      //handleSetupDatabase();
      const response = await axios.get(BASE_URL+'/rcptnote_vouchers/last', {
        params: { companyName }
      });
      const lastVoucherNumber = response.data.vouchernumber;
      const currvchno = (Number(lastVoucherNumber) + Number(1));
      setvchnumval(currvchno.toString());
      return (currvchno).toString();
    } catch (error) {
      console.error('Failed to fetch the voucher number:', error);
      return '';
    }
  };

  const handleRemoveOrder = (name) => {
    form.setFieldsValue({
      orders: form.getFieldValue('orders').filter((_, index) => index !== name)
    });
  };

  return (
    <Formik initialValues={initialValues} onSubmit={handleSubmit}>
      {({ values, setFieldValue, resetForm }) => {
        useEffect(() => {
          const fetchVoucherNumberOnMount = async () => {
            const newVoucherNumber = await fetchVoucherNumber();
            if(newVoucherNumber!='NaN')
             setFieldValue('voucherNumber', newVoucherNumber);
            else
             setFieldValue('voucherNumber', 1);
          };
          fetchVoucherNumberOnMount();
        }, [companyName, setFieldValue]);

        return (
          <Form className="receiptnote-form">
            <div className="form-header">
              <h2>ReceiptNote Voucher</h2>
            </div>

            <div className="form-sections">
              <div className="form-row">
                <label>Voucher Type Name:</label>
                <Field name="voucherTypeName" type="text" readOnly className="field-input" />
              </div>
              <div className="form-row">
                <label>Voucher Date:</label>
                <Field name="voucherDate" type="date" className="field-input" />
              </div>
              <div className="form-row">
                <label>Voucher Number:</label>
                <Field name="voucherNumber" type="text" className="field-input" />
              </div>
            </div>

            <div className="form-sections">
              <div className="form-row">
                <label>Supplier:</label>
                <Select
                  options={supplierOptions}
                  onChange={(option) => handleSupplierChange(option, setFieldValue)}
                  className="field-input"
                  isLoading={loading}
                />
              </div>
            </div>

            <>
      <Divider><Button type="primary" onClick={showModal}>
        Track Order
      </Button></Divider>
    {/*  <Modal
        title="Order Details"
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        width={800}
      >
        <Form form={form} layout="vertical" name="orderForm">
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
      </Modal> */}

    <POOrderModal
            isModalVisible={isModalVisible}
            setIsModalVisible={setIsModalVisible}
            setFieldValue={setFieldValue}
            values={values}
            companyName={companyName}
            partyName={partyName}
            orderOptions={orderOptions}
            vchnumval={!isNaN(vchnumval) ? vchnumval : 1}
            
          />
    </>

            <div className="form-sections">
              <div className="form-row">
                <h3>Inventory Details</h3>
              </div>
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th className="item-name-col">Item Name</th>
                    <th>Quantity</th>
                    <th>Rate</th>
                    <th>Discount (%)</th>
                    <th>Amount</th>
                    <th>GstRate</th>
                    <th>Tax Amount</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <FieldArray name="inventory">
                  {({ push, remove }) => (
                    <tbody>
                      {values.inventory.map((item, index) => (
                        <tr key={index}>

                          <td>
                            <Select
                              options={inventoryOptions}
                              onChange={(option) => handleItemChange(option, index, setFieldValue, values)}
                              className="field-input"
                              isLoading={loadingProducts}
                              value={item.itemName}
                            />
                            <Field
                              name={`inventory.${index}.productId`}
                              type="hidden"
                            />

                            <Field
                              name={`inventory.${index}.orderNo`}
                              type="hidden"
                            />
                          {/*<Button type="default" onClick={() => handleShowBatchModal(index)}>
                            Batch Allocations
                          </Button>
                            */}
                          </td>
                          <td>
                            <Field
                              name={`inventory.${index}.quantity`}
                              type="number"
                              className="field-input"
                              onChange={(e) => handleFieldChange(e, index, 'quantity', setFieldValue, values)}
                            />
                          </td>
                          <td>
                            <Field
                              name={`inventory.${index}.rate`}
                              type="number"
                              className="field-input"
                              onChange={(e) => handleFieldChange(e, index, 'rate', setFieldValue, values)}
                            />
                          </td>
                          <td>
                            <Field
                              name={`inventory.${index}.discount`}
                              type="number"
                              className="field-input"
                              onChange={(e) => handleFieldChange(e, index, 'discount', setFieldValue, values)}
                            />
                          </td>
                          <td>
                            <Field
                              name={`inventory.${index}.amount`}
                              type="text"
                              readOnly
                              className="field-input"
                              value={item.amount}
                            />
                          </td>
                          <td>
                            <Field
                              name={`inventory.${index}.gstrate`}
                              type="number"
                              readOnly
                              className="field-input"
                              
                            />
                          </td>
                          <td>
                            <Field
                              name={`inventory.${index}.taxamount`}
                              type="text"
                              readOnly
                              className="field-input"
                            />
                          </td>
                          <td>
                          <Modal
                            title="Batch Details"
                            visible={isBatchModalVisible && currentInventoryIndex === index}
                            onOk={() => handleBatchModalOk(index, setFieldValue, values)}
                            onCancel={handleBatchModalCancel}
                            width={1400}
                          >
                            <p>Selected Item Index: {selectedItemIndex}</p>
                            <p>Selected Item Name: {selectedItemName}</p>
                            <FieldArray name={`inventory.${index}.batchAllocations`}>
                              {({ push, remove }) => (
                                <>
                                  <Table
                                    dataSource={values.inventory[index].batchAllocations}
                                    columns={[
                                      {
                                        title: 'Tracking No',
                                        dataIndex: 'trackingNo',
                                        key: 'trackingNo',
                                        width: 200,
                                        render: (text, record, idx) => (
                                          <Field name={`inventory.${index}.batchAllocations.${idx}.trackingNo`}>
                                            {({ field, form }) => (
                                                <Select
                                                      {...field}
                                                       value={field.value || undefined} // Ensure the value is controlled
                                                      onChange={(value) => form.setFieldValue(`inventory.${index}.batchAllocations.${idx}.trackingNo`, value)}
                                                      options={trackingOptions}
                                                      />
                                                    )}
                                          </Field>
                                        ),
                                      },
                                      {
                                        title: 'Order No',
                                        dataIndex: 'orderNo',
                                        key: 'orderNo',
                                        width: 200,
                                        render: (text, record, idx) => (
                                        
                                          <Field name={`inventory.${index}.batchAllocations.${idx}.orderNo`}>
                                          {({ field, form }) => (
                                              <Select
                                                    {...field}
                                                     value={field.value || undefined} // Ensure the value is controlled
                                                    onChange={(value) => form.setFieldValue(`inventory.${index}.batchAllocations.${idx}.orderNo`, value)}
                                                    options={orderOptions}
                                                    />
                                                  )}
                                        </Field>

                                        ),
                                      },
                                      {
                                        title: 'itemname',
                                        dataIndex: 'itemname',
                                        key: 'itemname',
                                        width: 200,
                                        hidden: true,
                                        render: (text, record, idx) => (
                                          <Field name={`inventory.${index}.batchAllocations.${idx}.itemname`}>
                                            {({ field, form }) => (
                                              <input
                                                type="text" // Ensure it's hidden if you don't want it displayed
                                                {...field}
                                                value={selectedItemName || ''} // Ensure the correct value is passed
                                                onChange={(e) => {
                                                  form.setFieldValue(`inventory.${index}.batchAllocations.${idx}.itemname`, e.target.value);
                                                }}
                                              />
                                            )}
                                          </Field>
                                        ),
                                      },
                                      {
                                        title: 'Godown',
                                        dataIndex: 'godown',
                                        key: 'godown',
                                        width: 200,
                                        render: (text, record, idx) => (
                                          <Field name={`inventory.${index}.batchAllocations.${idx}.godown`}>
                                          {({ field, form }) => (
                                              <Select
                                                    {...field}
                                                     value={field.value || undefined} // Ensure the value is controlled
                                                    onChange={(value) => form.setFieldValue(`inventory.${index}.batchAllocations.${idx}.godown`, value)}
                                                    options={GodownOptions}
                                                    />
                                                  )}
                                        </Field>
                                        ),
                                      },
                                      {
                                        title: 'Batch',
                                        dataIndex: 'batch',
                                        key: 'batch',
                                        width: 150,
                                        render: (text, record, idx) => (
                                          <Field name={`inventory.${index}.batchAllocations.${idx}.batch`}>
                                          {({ field, form }) => (
                                              <Select
                                                    {...field}
                                                     value={field.value || undefined} // Ensure the value is controlled
                                                    onChange={(value) => form.setFieldValue(`inventory.${index}.batchAllocations.${idx}.batch`, value)}
                                                    options={batchOptions}
                                                    />
                                                  )}
                                        </Field>
                                        ),
                                      },
                                      {
                                        title: 'Quantity',
                                        dataIndex: 'quantity',
                                        key: 'quantity',
                                        width: 100,
                                        render: (text, record, idx) => (
                                          <Field name={`inventory.${index}.batchAllocations.${idx}.quantity`}>
                                            {({ field, form }) => (
                                              <Input
                                                {...field}
                                                onChange={(e) => {
                                                  handleBatchFieldChange(e, index, idx, 'quantity', form.setFieldValue, form.values);
                                                  // It's a good idea to explicitly call `form.setFieldValue` here if necessary
                                                  form.setFieldValue(`inventory.${index}.batchAllocations.${idx}.quantity`, e.target.value);
                                                }}
                                              />
                                            )}
                                          </Field>
                                        ),
                                      },
                                      {
                                        title: 'Rate',
                                        dataIndex: 'rate',
                                        key: 'rate',
                                        width: 130,
                                        render: (text, record, idx) => (
                                          <Field name={`inventory.${index}.batchAllocations.${idx}.rate`}>
                                            {({ field, form }) => (
                                              <Input
                                                {...field}
                                                onChange={(e) => {
                                                  handleBatchFieldChange(e, index, idx, 'rate', form.setFieldValue, form.values);
                                                  // Ensure Formik value is updated
                                                  form.setFieldValue(`inventory.${index}.batchAllocations.${idx}.rate`, e.target.value);
                                                }}
                                              />
                                            )}
                                          </Field>
                                        ),
                                      },
                                      {
                                        title: 'Discount',
                                        dataIndex: 'discount',
                                        key: 'discount',
                                        render: (text, record, idx) => (
                                          <Field name={`inventory.${index}.batchAllocations.${idx}.discount`}>
                                            {({ field, form }) => (
                                              <Input
                                                {...field}
                                                onChange={(e) => {
                                                  handleBatchFieldChange(e, index, idx, 'discount', form.setFieldValue, form.values);
                                                  // Ensure Formik value is updated
                                                  form.setFieldValue(`inventory.${index}.batchAllocations.${idx}.discount`, e.target.value);
                                                }}
                                              />
                                            )}
                                          </Field>
                                        ),
                                      },
                                      {
                                        title: 'Amount',
                                        dataIndex: 'amount',
                                        key: 'amount',
                                        width: 150,
                                        render: (text, record, idx) => (
                                          <Field name={`inventory.${index}.batchAllocations.${idx}.amount`}>
                                            {({ field, form }) => (
                                              <Input
                                                {...field}
                                                onChange={(e) => {
                                                  handleBatchFieldChange(e, index, idx, 'amount', form.setFieldValue, form.values);
                                                  // Ensure Formik value is updated
                                                  form.setFieldValue(`inventory.${index}.batchAllocations.${idx}.amount`, e.target.value);
                                                }}
                                              />
                                            )}
                                          </Field>
                                        ),
                                      },
                                      {
                                        title: 'Action',
                                        key: 'action',
                                        render: (text, record, idx) => (
                                          <Button
                                            type="danger"
                                            icon={<DeleteOutlined />}
                                            onClick={() => remove(idx)}
                                          />
                                        ),
                                      },
                                    ]}
                                    pagination={false}
                                    rowKey={(record, idx) => idx}
                                  />
                                  <Button
                                    type="dashed"
                                    onClick={() =>
                                      push({
                                        itemname:'',
                                        trackingNo: '',
                                        orderNo: '',
                                        godown: 'NotApplicable',
                                        batch: '',
                                        quantity: '',
                                        rate: '',
                                        discount: '',
                                        amount: '',
                                      })
                                    }
                                    block
                                    icon={<PlusOutlined />}
                                  >
                                    Add Entry
                                  </Button>
                                </>
                              )}
                            </FieldArray>
                          </Modal>

                            <Button
                              type="danger"
                              icon={<DeleteOutlined />}
                              onClick={() => handleRemoveItem(index, remove, values, setFieldValue)}
                            />
                          </td>
                        </tr>
                      ))}
                      <tr>
                        <td colSpan="8">
                          <Button type="dashed" onClick={() => handleAddItem(push)}>
                            Add Item
                          </Button>
                        </td>
                      </tr>
                    </tbody>
                  )}
                </FieldArray>
              </table>
            </div>

            <div className="ledger-entry-section">
          <div className="legend">
              <h5>Ledger Entries</h5>
            </div>
            <FieldArray name="ledgerEntries">
              {({ insert, remove, push }) => (
                <div>
                  <table className="ledgerentries-table">
                    <thead>
                      <tr>
                        <th style={{ width: '40%' }}>Particulars</th>
                        <th style={{ width: '20%' }}>Rate%</th>
                        <th style={{ width: '30%' }}>Amount</th>
                        <th style={{ width: '5%' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {values.ledgerEntries.map((entry, index) => (
                        <tr key={index}>
                          <td>
                            <Select
                              name={`ledgerEntries.${index}.particulars`}
                              placeholder="Particulars"
                              options={ledgerOptions}
                              onChange={(option) => handleLedgerChange(option, index, setFieldValue, values)}
                              value={values.ledgerEntries[index].particulars}
                              className="table-input field-input"
                            />
                          </td>
                          <td>
                          <Field
                              name={`ledgerEntries.${index}.rate`}
                              placeholder="Rate"
                              type="number"
                              className="table-input field-input"
                              onChange={(e) => handleledFieldChange(e, index, 'rate', setFieldValue, values)}
                            />
                          </td>
                          <td>
                          <Field
                              name={`ledgerEntries.${index}.amount`}
                              placeholder="Amount"
                              type="number"
                              value={values.ledgerEntries[index].amount}
                              className="table-input field-input"
                              
                            />
                          </td>
                          <td>
                          <Button
                              type="danger"
                              icon={<DeleteOutlined />}
                              onClick={() => handleRemoveItem(index, remove, values, setFieldValue)}
                            />
                          </td>
                        </tr>
                      ))}
                      <tr>
                        <td colSpan="4">
                          <Button type="dashed" onClick={() => push({ particulars: '', rate: 0, amount: 0 })}>
                            Add Entry
                          </Button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  
                </div>
              )}
            </FieldArray>
          </div>

            <div className="form-section">
              <div className="form-row">
                <label>Narration:</label>
                <Field name="narration" as="textarea" className="field-input" />
              </div>
              <div className="form-row">
                <label>Total Amount:</label>
                <Field name="totalAmount" type="text" readOnly className="field-input" value={values.totalAmount.toString()} />
              </div>
            </div>
      

            <div className="form-actions">
              <Button type="primary" htmlType="submit">
                Submit
              </Button>              
            </div>
            <Divider></Divider>
          </Form>
        );
      }}
    </Formik>
  );
};

export default ReceiptNoteForm;
