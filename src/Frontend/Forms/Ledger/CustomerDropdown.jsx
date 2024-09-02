// CustomerDropdown.jsx

import React, { useState } from 'react';
import Select from 'react-select';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

const CustomerDropdown = () => {
    const [customers, setCustomers] = useState([
        { label: 'Customer 1', value: 'Customer 1' },
        { label: 'Customer 2', value: 'Customer 2' }
    ]);
    const [newCustomerInput, setNewCustomerInput] = useState('');

    const handleInputChange = (inputValue) => {
        setNewCustomerInput(inputValue);
    };

    const handleCreateCustomer = () => {
        if (newCustomerInput.trim() !== '' && !customers.some(customer => customer.label === newCustomerInput)) {
            const newCustomer = { label: newCustomerInput, value: newCustomerInput };
            setCustomers(prevCustomers => [...prevCustomers, newCustomer]);
            setNewCustomerInput('');
            console.log('New Customer Created:', newCustomerInput);
        }
    };

    const customStyles = {
        control: (provided, state) => ({
            ...provided,
            borderRadius: 0,
            borderColor: state.isFocused ? '#80bdff' : '#ced4da',
            boxShadow: state.isFocused ? '0 0 0 0.2rem rgba(0,123,255,.25)' : null,
            '&:hover': {
                borderColor: state.isFocused ? '#80bdff' : '#ced4da'
            }
        }),
        menu: (provided) => ({
            ...provided,
            borderRadius: 0,
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)'
        })
    };

    return (
        <div className="customer-dropdown">
            <Select
                options={customers}
                value={customers.find(customer => customer.label === newCustomerInput)}
                inputValue={newCustomerInput}
                onInputChange={handleInputChange}
                onChange={handleCreateCustomer}
                styles={customStyles}
                placeholder="Select or add a customer"
                isClearable
                isSearchable
            />
            <div className="add-customer-footer">
                <FontAwesomeIcon icon={faPlus} className="add-customer-icon" onClick={handleCreateCustomer} />
            </div>
        </div>
    );
};

export default CustomerDropdown;
