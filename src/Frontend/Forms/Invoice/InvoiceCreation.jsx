import React, { useState, useContext, useEffect } from 'react';
import Select from 'react-select';
import { Formik, Form, Field, FieldArray } from 'formik';
import { Button, Divider,message } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import '../../../styles/Invoice/InvoiceForm.css';
import { createSalesVoucher } from '../../utils/RestApi';
import { AppContext } from '../../../Context/AppContext';
import axios from 'axios';

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
  voucherTypeName: 'Sales',
  voucherDate: getCurrentDateFormatted(),
  voucherNumber: '',
  supplier: null,
  inventory: [
    { itemName: '', quantity: 0, rate: 0, discount: 0, amount: 0, taxType: 'IGST' },
  ],
  ledgerEntries: [
    { particulars: '', rate: 0, amount: 0 },
  ],
  narration: '',
  totalAmount: 0,
};

const InvoiceForm = () => {
  const { companyName, setCompanyName, userName } = useContext(AppContext);
  const [supplierOptions, setSupplierOptions] = useState([]);
  const [Salesmanoptions,setSalesmanOptions]=useState([]);
  const [loading, setLoading] = useState(false);
  const [inventoryOptions, setInventoryOptions] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [gstRate, setGstRate] = useState('');
  const [productId, setProductId] = useState(0);
  const [ledgerOptions, setLedgerOptions] = useState([]);
  const [taxInfo, setTaxInfo] = useState([]);
  const [vchDate, setVchDate] = useState(getCurrentDateFormatted());
  const [DiscountLimit, setDiscountLimit] = useState(0);

  
  const handleSetupDatabase = async () => {
    setLoading(true);

    try {
      await axios.post('http://localhost:5000/api/setup-salesdatabase', { cmp: companyName});
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
        const response = await axios.get('http://localhost:5000/api/ledgers', {
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
        const response = await axios.get('http://localhost:5000/api/products', {
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
  };

  useEffect(() => {
    const fetchTaxes = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/taxes', {
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


  //fetching SalesMan
useEffect(() => {
  const fetchData = async () => {
    setLoading(true); // Set loading state to true while fetching data
    try {
      const response = await axios.get('http://localhost:5000/api/SalesmanList', {
        params: {
          companyName: companyName // Pass the companyName as a parameter
        }
      });
      const options = response.data.map(Salesman => ({
        value: Salesman.SalesManName,
        label: Salesman.SalesManName
      }));
      setSalesmanOptions(options);
    } catch (error) {
      console.error('Error fetching Salesman names:', error);
    } finally {
      setLoading(false); // Set loading state back to false after fetching data
    }
  };

  fetchData(); // Call fetchData function when component mounts
}, [companyName]); // useEffect will re-run whenever companyName changes




  const handleItemChange = async (option, index, setFieldValue, values) => {
    setFieldValue(`inventory.${index}.itemName`, option);
    try {
      
      const response = await axios.get('http://localhost:5000/api/stockitem', {
        params: { companyName, productName: option.label }
      });
      const product = response.data;
      //console.log(product);
      const vchDate = values.voucherDate;
      //console.log(values.voucherDate);
      const response_ProdSellingPrice = await axios.get('http://localhost:5000/api/lastSellingPrice', {
        params: { companyName, productId:  product[0].id, userName, vchDate }
      });

      const ProdSellingPrice = response_ProdSellingPrice.data;
      //console.log(ProdSellingPrice.data.sellingPrices);
      const productRate = ProdSellingPrice.data.sellingPrices ? parseFloat(ProdSellingPrice.data.sellingPrices) : 0.00;

      if(productRate > 0){
        setFieldValue(`inventory.${index}.rate`, productRate);
      }
      else{
        setFieldValue(`inventory.${index}.rate`, 0.00);
      }

      const response_ProdDiscount = await axios.get('http://localhost:5000/api/lastDiscount', {
        params: { companyName, productId:  product[0].id, userName, vchDate }
      });
      const ProdDiscountRes = response_ProdDiscount.data;
      const productDiscountval = ProdDiscountRes.data.discount ? parseFloat(ProdDiscountRes.data.discount) : 0.00;
      const productDiscountimit = ProdDiscountRes.data.thresholdValue ? parseFloat(ProdDiscountRes.data.thresholdValue) : 0.00;
      
      if(productDiscountval > 0){
        setDiscountLimit(productDiscountimit);
        setFieldValue(`inventory.${index}.discount`, productDiscountval);
        //console.log("Limit:",DiscountLimit);
      }
      else{
        setDiscountLimit(0);
        //console.log("Discount:",productDiscountval);
        setFieldValue(`inventory.${index}.discount`, 0.00);
      }

      const response_gstrate = await axios.get('http://localhost:5000/api/gst-rate', {
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
      const rate = productRate || updatedValues.inventory[index].rate;
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
    const response_gstrate = await axios.get('http://localhost:5000/api/ledtaxrate', {
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
    push({ itemName: '', quantity: 0, rate: 0, discount: 0, amount: 0, taxType: 'IGST' });
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

    if (field === 'discount' && value > DiscountLimit) {
      alert(`Discount cannot exceed ${DiscountLimit}%`);
      // Optionally, reset the field value to the maximum allowed
      setFieldValue(`inventory.${index}.discount`, DiscountLimit);
      return;
    }

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

  const handleSubmit = async (values, actions) => {
    console.log('Form Values:', values);
    
    const voucherData = {
      ...values,
      cmp: companyName,
      voucherNumber: Number(values.voucherNumber),
      partyAccount: values.supplier.value,
    };
    try {
      
      const response = await createSalesVoucher(voucherData);

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
      handleSetupDatabase();
      const response = await axios.get('http://localhost:5000/api/sales_vouchers/last', {
        params: { companyName }
      });
      const lastVoucherNumber = response.data.vouchernumber;
      const currvchno = (Number(lastVoucherNumber) + Number(1));
      return (currvchno).toString();
    } catch (error) {
      console.error('Failed to fetch the voucher number:', error);
      return '';
    }
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
          <Form className="sales-form">
            <div className="form-header">
              <h2>Sales Voucher</h2>
            </div>

            <div className="form-sections">
              <div className="form-row">
                <label>Voucher Type Name:</label>
                <Field name="voucherTypeName" type="text" readOnly className="field-input" />
              </div>
              <div className="form-row">
                <label>Voucher Date:</label>
                <Field name="voucherDate" type="date" className="field-input"
                
                onChange={async (e) => {
                  const newVoucherDate = e.target.value;
                  setFieldValue('voucherDate', newVoucherDate);
                  
                  // Update rate for all inventory items based on new date
                  for (let i = 0; i < values.inventory.length; i++) {
                    const itemName = values.inventory[i].itemName;
                    if (itemName) {
                      console.log(itemName)
                      //await handleItemChange({label: itemName }, i, setFieldValue, values);
                    }
                  }
                }}
                />
              </div>
              <div className="form-row">
                <label>Voucher Number:</label>
                <Field name="voucherNumber" type="text" className="field-input" />
              </div>
            </div>

            <div className="form-sections">
              <div className="form-row">
                <label>Party A/c Name:</label>
                <Select
                  options={supplierOptions}
                  onChange={(option) => handleSupplierChange(option, setFieldValue)}
                  className="field-input"
                  isLoading={loading}
                />
                <label>Salesman Name:</label>
                <Select
                  options={Salesmanoptions}
                  onChange={(option) => setFieldValue('salesLedger', option ? option.value : '')}
                  className="field-input"
                  isLoading={loading}
                />
              </div>
            </div>



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
                              value={item.amount.toString()}
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

export default InvoiceForm;
