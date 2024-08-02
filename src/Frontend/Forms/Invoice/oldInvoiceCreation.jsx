import React, { useState, useContext, useEffect } from 'react';
import Select from 'react-select';
import { Formik, Form, Field, FieldArray } from 'formik';
import { Modal, Button, Divider } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import '../../../styles/Invoice/InvoiceForm.css'; // Ensure you have the correct path for your CSS file
import { createSalesVoucher } from '../../utils/RestApi'; // Assuming correct import path
import { AppContext } from '../../../Context/AppContext';
import axios from 'axios';

const ledgerOptions = [
  { value: 'CGST', label: 'CGST' },
  { value: 'SGST', label: 'SGST' },
  { value: 'IGST', label: 'IGST' },
  // Add more options as needed
];

const BillTypeOptions = [
  { value: 'Advance', label: 'Advance' },
  { value: 'Agst Ref', label: 'Agst Ref' },
  { value: 'New Ref', label: 'New Ref' },
  { value: 'On Account', label: 'On Account' },
  // Add more options as needed
];

const getCurrentDateFormatted = () => {
  const currentDate = new Date();
  const dd = String(currentDate.getDate()).padStart(2, '0');
  const mm = String(currentDate.getMonth() + 1).padStart(2, '0'); // January is 0!
  const yyyy = currentDate.getFullYear();
  return `${yyyy}-${mm}-${dd}`;
};

var VoucherTotal = 0;

const initialValues = {
  voucherTypeName: 'Sales',
  voucherDate: getCurrentDateFormatted(),
  partyAccount: null,
  salesLedger: null,
  inventory: [
    { itemName: '', quantity: 0, rate: 0, discount: 0, amount: 0 },
  ],
  ledgerEntries: [
    { particulars: '', rate: 0, amount: 0 },
  ],
  narration: '',
  totalAmount: 0,
  billWiseDetails: [
    { typeOfRef: BillTypeOptions[2], name: '', dueDate: getCurrentDateFormatted(), amount: 0 },
  ],
  orderDetails: {
    orderId: '',
    orderDate: '',
    orderItems: [],
  },
};



const InvoiceForm = () => {

  const {companyName, setCompanyName } = useContext(AppContext);
  const [partyOptions, setPartyOptions] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inventoryOptions, setInventoryOptions] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const [lastVoucherNumber, setLastVoucherNumber] = useState('');  
  const [vchAmount, setvchAmount] = useState(0);

  const [values, setValues] = useState(initialValues);

    // Calculate and update totalAmount whenever inventory or ledger entries change
    useEffect(() => {
        const inventoryTotal = calculateInventorySubtotal(values.inventory);
        const ledgerEntriesTotal = calculateLedgerEntriesSubtotal(values.ledgerEntries);
        const totalAmount = inventoryTotal + ledgerEntriesTotal;
        setValues({ ...values, totalAmount }); // Update totalAmount in Formik state
    }, [values.inventory, values.ledgerEntries]);




  useEffect(() => {
    const storedCompanyName = localStorage.getItem('companyName');
    if (storedCompanyName) {
      setCompanyName(storedCompanyName);
      
    }
  }, [setCompanyName]);

  

//fetching ledgers
useEffect(() => {
  const fetchData = async () => {
    setLoading(true); // Set loading state to true while fetching data
    try {
      const response = await axios.get('http://localhost:5000/api/ledgers', {
        params: {
          companyName: companyName // Pass the companyName as a parameter
        }
      });
      const options = response.data.map(ledger => ({
        value: ledger.ledgername,
        label: ledger.ledgername
      }));
      setPartyOptions(options);
    } catch (error) {
      console.error('Error fetching ledger names:', error);
    } finally {
      setLoading(false); // Set loading state back to false after fetching data
    }
  };

  fetchData(); // Call fetchData function when component mounts
}, [companyName]); // useEffect will re-run whenever companyName changes


//fetching products
useEffect(() => {
  const fetchProducts = async () => {
    setLoadingProducts(true); // Set loading state to true while fetching data
    try {
      const response = await axios.get('http://localhost:5000/api/products', {
        params: {
          companyName: companyName // Pass the companyName as a parameter
        }
      });
      const options = response.data.map(product => ({
        value: product.name,
        label: product.name
      }));
      setInventoryOptions(options);
    } catch (error) {
      console.error('Error fetching product names:', error);
    } finally {
      setLoadingProducts(false); // Set loading state back to false after fetching data
    }
  };

  fetchProducts(); // Call fetchProducts function when component mounts or companyName changes
}, [companyName]);


// Define fetchVoucherNumber outside of useEffect
const fetchVoucherNumber = async () => {
  try {
    const response = await axios.get('http://localhost:5000/api/sales_vouchers/last', {
      params: { companyName }
    });
    const lastVoucherNumber = response.data.vouchernumber;
    return lastVoucherNumber;
  } catch (error) {
    console.error('Failed to fetch the voucher number:', error);
    return null; // Return null or handle the error appropriately
  }
};

//-----------
useEffect(() => {
  fetchVoucherNumber().then((lastVoucherNumber) => {
    if (lastVoucherNumber) {
      setLastVoucherNumber(lastVoucherNumber);
    }
  });
}, [companyName]);

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleSubmit = async (values, {resetForm}) => {
    console.log('Form Values:', values);
    const voucherData = {
        ...values,
        cmp: companyName,
        voucherNumber: Number(lastVoucherNumber)+Number(1),
        partyAccount: values.partyAccount,
      };
      try {
        const response = await createSalesVoucher(voucherData);
  
        if (response.success) {
          alert('Voucher created successfully');
          //form.resetFields();
          resetForm();
          //actions.resetForm({ values: initialValues });
        // Refetch voucher number after form reset
          const newVoucherNumber = await fetchVoucherNumber();
          setLastVoucherNumber(newVoucherNumber);
          
          resetForm();
        } else {
          alert(response.message || 'Failed to create Voucher');
        }
      } catch (error) {
        console.error('Error:', error);
        alert(error.message || 'An error occurred');
      }
  };

  const calculateAmount = (quantity, rate, discount) => {
    const discountAmount = (rate * quantity * discount) / 100;
    return rate * quantity - discountAmount;
  };

  const calculateInventorySubtotal = (inventory) => {
    
    return inventory.reduce((acc, item) => Number(acc) + Number(item.amount), 0);
  };

  const calculateLedgerEntriesSubtotal = (ledgerEntries) => {
    
    return ledgerEntries.reduce((acc, entry) => Number(acc) + Number(entry.amount), 0);
  };
  

  useEffect(() => {
    const inventoryTotal = calculateInventorySubtotal(initialValues.inventory);
    const ledgerEntriesTotal = calculateLedgerEntriesSubtotal(initialValues.ledgerEntries);
    setTotalAmount(inventoryTotal + ledgerEntriesTotal);
    //console.log("total Amt:",inventoryTotal + ledgerEntriesTotal)
  }, [initialValues.inventory+initialValues.ledgerEntries]);
  

  const handleFieldChange = (e, index, field, setFieldValue, values) => {
    const value = parseFloat(e.target.value) || 0;
    setFieldValue(`inventory.${index}.${field}`, value);

    const updatedValues = { ...values };
    updatedValues.inventory[index][field] = value;

    const quantity = field === 'quantity' ? value : updatedValues.inventory[index].quantity;
    const rate = field === 'rate' ? value : updatedValues.inventory[index].rate;
    const discount = field === 'discount' ? value : updatedValues.inventory[index].discount;

    const amount = calculateAmount(quantity, rate, discount);
    setFieldValue(`inventory.${index}.amount`, amount);

    updatedValues.inventory[index].amount = amount;

    const totalInventoryAmount = calculateInventorySubtotal(updatedValues.inventory);
    const totalLedgerEntriesAmount = calculateLedgerEntriesSubtotal(updatedValues.ledgerEntries);
    const totalAmount = totalInventoryAmount + totalLedgerEntriesAmount;

    setFieldValue('totalAmount', totalAmount.toFixed(2));
    setvchAmount(totalAmount.toFixed(2));
  };

  const handleledFieldChange = (e, index, field, setFieldValue, values) => {
    const value = parseFloat(e.target.value) || 0;
    setFieldValue(`ledgerEntries.${index}.${field}`, value);

    const updatedLedgerEntriesValues = { ...values };
    updatedLedgerEntriesValues.ledgerEntries[index][field] = value;

    const ledrate = field === 'rate' ? value : updatedLedgerEntriesValues.ledgerEntries[index].rate;
    const taxamt = vchAmount * ledrate / 100;

    setFieldValue(`ledgerEntries.${index}.amount`, taxamt);
    updatedLedgerEntriesValues.ledgerEntries[index].amount = taxamt;

    const totalLedgerEntriesAmount = calculateLedgerEntriesSubtotal(updatedLedgerEntriesValues.ledgerEntries);
    const totalAmount = calculateInventorySubtotal(values.inventory) + totalLedgerEntriesAmount;

    setFieldValue('totalAmount', totalAmount.toFixed(2));
  };

  const calculateledAmount = (rate, Amount) => {
    const ledAmount = (rate * Amount);
    return ledAmount;
  };


  const calculateInventoryTotal = (inventory) => {
    return inventory.reduce((total, item) => total + item.amount, 0);
  };

  const calculateLedgerEntryTotal = (ledgerEntries) => {
    return ledgerEntries.reduce((total, acc) => total + acc.amount, 0);
  };
  
  return (
    <Formik initialValues={initialValues} onSubmit={handleSubmit}>
      {({ values, setFieldValue }) => (
        <Form className="invoice-form">
          <div className="voucher-top-section">
            <div className="voucher-info">
              <div>
                <label>Voucher Type Name:</label>
                <Field name="voucherTypeName" type="text" readOnly className="field-input" />
              </div>
              <div>
                <label>Voucher Date:</label>
                <Field name="voucherDate" type="date" className="field-input"
                />
              </div>
              <div>
                <label>Voucher Number:</label>
                <Field name="voucherNumber" type="text" className="field-input"
                 value={Number(lastVoucherNumber)+Number(1)}
                />
              </div>
            </div>
            <div className="account-info">
              <div>
                <label>Party A/c Name:</label>
                <Select
                  options={partyOptions}
                  onChange={(option) => setFieldValue('partyAccount', option ? option.value : '')}
                  className="field-input"
                  isLoading={loading}
                />
              </div>
              <div>

                <Button type="primary" onClick={showModal} class="hidden" style={{marginLeft:135,display: "none"}}>
                  Order Details
                </Button>
                
              </div>
                            
            </div>
          </div>

          <div className="inventory-section">
          <div className="legend">
              <h5>Inventory Details</h5>
            </div>
            <FieldArray name="inventory">
              {({ insert, remove, push }) => (
                <div>
                  <table>
                    <thead>
                      <tr>
                      <th className="item-name-col">Name of the Name</th>
                    <th>Quantity</th>
                    <th>Rate</th>
                    <th>Discount (%)</th>
                    <th>Amount</th>
                    <th>GstRate</th>
                    <th>Tax Amount</th>
                    <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {values.inventory.map((item, index) => (
                        <tr key={index}>
                          <td>
                          <Select
                              name={`inventory.${index}.itemName`}
                              placeholder="Name of Item"
                              options={inventoryOptions}
                              onChange={(option) => setFieldValue(`inventory.${index}.itemName`, option ? option.value : '')}
                              className="table-input field-input"
                              isLoading={loadingProducts}
                            />
                          </td>
                          <td>
                          <Field
                              name={`inventory.${index}.quantity`}
                              placeholder="Quantity"
                              type="number"
                              className="table-input field-input"
                              onChange={(e) => handleFieldChange(e, index, 'quantity', setFieldValue, values)}
                            />
                          </td>
                          <td>
                          <Field
                              name={`inventory.${index}.rate`}
                              placeholder="Rate per(UOM)"
                              type="number"
                              className="table-input field-input"
                              onChange={(e) => handleFieldChange(e, index, 'rate', setFieldValue, values)}
                            />
                          </td>
                          <td>
                          <Field
                              name={`inventory.${index}.discount`}
                              placeholder="Discount(%)"
                              type="number"
                              className="table-input field-input"
                              onChange={(e) => handleFieldChange(e, index, 'discount', setFieldValue, values)}
                            />
                          </td>
                          <td>
                            <Field
                              name={`inventory.${index}.amount`}
                              placeholder="Amount"
                              type="number"
                              className="table-input field-input"
                              readOnly
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
                    </tbody>
                  </table>
                  <button type="button" onClick={() => push({ itemName: '', quantity: 0, rate: 0, discount: 0, amount: 0 })}>
                    Add Item
                  </button>
                </div>
              )}
            </FieldArray>
          </div>

          <div className="ledger-entry-section">
          <div className="legend">
              <h5>Ledger Entries</h5>
            </div>
            <FieldArray name="ledgerEntries">
              {({ insert, remove, push }) => (
                <div>
                  <table>
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
                              onChange={(option) => setFieldValue(`ledgerEntries.${index}.particulars`, option ? option.value : '')}
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
                              readOnly
                            />
                          </td>
                          <td>
                            <button type="button" onClick={() => remove(index)}>
                              X
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button type="button" onClick={() => push({ particulars: '', rate: 0, amount: 0 })}>
                    Add Entry
                  </button>
                </div>
              )}
            </FieldArray>
          </div>

          {/* Modal for Order Details */}
          <Modal
            title="Order Details"
            visible={isModalVisible}
            onCancel={handleCancel}
            footer={[
              <Button key="cancel" onClick={handleCancel}>
                Cancel
              </Button>,
              <Button key="submit" type="primary" onClick={handleCancel}>
                Save
              </Button>,
            ]}
          >
            {/* Form inside Modal */}
            <Form>
              <div>
                <label>Order ID:</label>
                <Field name="orderDetails.orderId" type="text" className="field-input" />
              </div>
              <div>
                <label>Order Date:</label>
                <Field name="orderDetails.orderDate" type="date" className="field-input" />
              </div>
              <div>
                <label>Order Items:</label>
                <FieldArray name="orderDetails.orderItems">
                  {({ insert, remove, push }) => (
                    <div>
                      <table>
                        <thead>
                          <tr>
                            <th style={{ width: '60%' }}>Item Name</th>
                            <th style={{ width: '20%' }}>Quantity</th>
                            <th style={{ width: '20%' }}>Rate</th>
                            <th style={{ width: '10%' }}>Discount</th>
                            <th style={{ width: '20%' }}>Amount</th>
                            <th style={{ width: '5%' }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {values.orderDetails.orderItems.map((item, index) => (
                            <tr key={index}>
                              <td>
                                <Field
                                  name={`orderDetails.orderItems.${index}.itemName`}
                                  placeholder="Item Name"
                                  className="table-input field-input"
                                />
                              </td>
                              <td>
                                <Field
                                  name={`orderDetails.orderItems.${index}.quantity`}
                                  placeholder="Quantity"
                                  type="number"
                                  className="table-input field-input"
                                />
                              </td>
                              <td>
                                <Field
                                  name={`orderDetails.orderItems.${index}.rate`}
                                  placeholder="Rate"
                                  type="number"
                                  className="table-input field-input"
                                />
                              </td>
                              <td>
                                <Field
                                  name={`orderDetails.orderItems.${index}.discount`}
                                  placeholder="Discount"
                                  type="number"
                                  className="table-input field-input"
                                />
                              </td>
                              <td>
                                <Field
                                  name={`orderDetails.orderItems.${index}.amount`}
                                  placeholder="Amount"
                                  type="number"
                                  className="table-input field-input"
                                />
                              </td>
                              <td>
                                <button type="button" onClick={() => remove(index)}>
                                  X
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <button type="button" onClick={() => push({ itemName: '', quantity: 0, amount: 0 })}>
                        Add Item
                      </button>
                    </div>
                  )}
                </FieldArray>
              </div>
            </Form>
          </Modal>

          <div className="bill-wise-details-section">
          <div className="legend">
              <h5>Bill-Wise Details</h5>
            </div>
            <FieldArray name="billWiseDetails">
              {({ insert, remove, push }) => (
                <div>
                  <table>
                    <thead>
                      <tr>
                        <th style={{ width: '20%' }}>Type of Ref</th>
                        <th style={{ width: '30%' }}>Name</th>
                        <th style={{ width: '20%' }}>DueDate(Due Days)</th>
                        <th style={{ width: '20%' }}>Amount(Dr/Cr)</th>
                        <th style={{ width: '5%' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {values.billWiseDetails.map((bill, index) => (
                        <tr key={index}>
                          <td>
                          <Select
                              name={`billWiseDetails.${index}.typeOfRef`}
                              placeholder="Type of Ref"
                              options={BillTypeOptions}
                              onChange={(option) => setFieldValue(`billWiseDetails.${index}.typeOfRef`, option)}
                              value={values.billWiseDetails[index].typeOfRef}
                              className="table-input field-input"
                            />
                          </td>
                          <td>
                            <Field
                              name={`billWiseDetails.${index}.name`}
                              placeholder="Name"
                              className="table-input field-input"
                            />
                          </td>
                          <td>
                            <Field
                              name={`billWiseDetails.${index}.dueDate`}
                              placeholder="DueDate(Due Days)"
                              type="date"
                              className="table-input field-input"
                            />
                          </td>
                          <td>
                            <Field
                              name={`billWiseDetails.${index}.amount`}
                              placeholder="Amount(Dr/Cr)"
                              type="number"
                              className="table-input field-input"
                              value={calculateInventorySubtotal(values.inventory)+calculateLedgerEntriesSubtotal(values.ledgerEntries)}
                            />
                          </td>
                          <td>
                            <button type="button" onClick={() => remove(index)}>
                              X
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button type="button" onClick={() => push({ typeOfRef: '', name: '', dueDate: '', amount: 0 })}>
                    Add Bill
                  </button>
                </div>
              )}
            </FieldArray>
          </div>
          <div className="totals-section">
            <div className="subtotal">
              <h3>Sub-Totals:</h3>
              <div className="subtotal-section">
                <p className="subtotal-label">Inventory Sub-Total:</p>
                <p className="subtotal-value">{calculateInventorySubtotal(values.inventory)}</p>
              </div>
              <div className="subtotal-section">
                <p className="subtotal-label">Ledger Entries Sub-Total:</p>
                <p className="subtotal-value">{calculateLedgerEntriesSubtotal(values.ledgerEntries)}</p>
              </div>
              
            </div>
          </div>

           <div className="voucher-bottom-section">
            <div style={{ flex: '1' }}>
              <label>Narration:</label>
              <Field name="narration" as="textarea" className="field-input" />
            </div>
            <div className="form-section">
            <div className="form-row">
              <label>Total Amount:</label>
              <Field name="totalAmount" type="number" step="0.01" value={values.totalAmount} className="field-input" readOnly />
            </div>
          </div>
          </div>

          <button type="submit">SAVE</button>
          <Divider />
        </Form>
      )}
    </Formik>
  );
};


export default InvoiceForm;

