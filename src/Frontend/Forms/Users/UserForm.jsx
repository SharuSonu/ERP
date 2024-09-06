import React, { useState } from 'react';

// Define columns with title, dataIndex, and key for each form field
const columns = [
  {
    title: 'User Name',
    dataIndex: 'userName',
    key: 'userName',
  },
  {
    title: 'Voucher Type',
    dataIndex: 'voucherType',
    key: 'voucherType',
  },
  {
    title: 'Alter',
    dataIndex: 'alter',
    key: 'alter',
    type: 'button-group', // Custom type to handle button groups
    options: ['enable', 'disable']
  },
  {
    title: 'Display',
    dataIndex: 'display',
    key: 'display',
    type: 'button-group', // Custom type to handle button groups
    options: ['enable', 'disable']
  },
  {
    title: 'Delete',
    dataIndex: 'delete',
    key: 'delete',
    type: 'button-group', // Custom type to handle button groups
    options: ['enable', 'disable']
  }
];

// Component for managing a user's voucher permissions
const VoucherPermissionsForm = () => {
  const [formData, setFormData] = useState({
    userName: '',
    voucherType: '',
    alter: 'disable', // Default to 'disable'
    display: 'disable', // Default to 'disable'
    delete: 'disable', // Default to 'disable'
  });

  const [feedbackMessage, setFeedbackMessage] = useState('');

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Handle button clicks for permissions
  const handlePermissionChange = (permissionType, value) => {
    setFormData((prevData) => ({
      ...prevData,
      [permissionType]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setFeedbackMessage(`Form submitted with data: ${JSON.stringify(formData)}`);
  };

  return (
    <div>
      <h1>Voucher Permissions Form</h1>
      <form onSubmit={handleSubmit} className="form-container">
        {columns.map((column) => (
          <div className="form-field" key={column.key}>
            <label>{column.title}:</label>
            {column.type === 'button-group' ? (
              <div className="button-group">
                {column.options.map((option) => (
                  <button
                    type="button"
                    key={option}
                    onClick={() => handlePermissionChange(column.dataIndex, option)}
                    className={formData[column.dataIndex] === option ? 'selected' : ''}
                  >
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </button>
                ))}
              </div>
            ) : (
              <input
                type="text"
                name={column.dataIndex}
                value={formData[column.dataIndex]}
                onChange={handleChange}
                required
              />
            )}
          </div>
        ))}
        
        <div className="submit-container">
          <button type="submit" className="submit-button">Submit</button>
        </div>
      </form>

      {/* Feedback Message */}
      {feedbackMessage && <p>{feedbackMessage}</p>}

      {/* Styles for column layout and button selection */}
      <style jsx>{`
        .form-container {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 20px;
          max-width: 800px;
          margin: auto;
        }
        .form-field {
          display: flex;
          flex-direction: column;
        }
        .button-group {
          display: flex;
          gap: 10px;
        }
        button {
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 4px;
          cursor: pointer;
          background-color: #fff;
        }
        .selected {
          background-color: #007bff;
          color: white;
          border: 1px solid #007bff;
        }
        label {
          display: block;
        }
        .submit-button {
          padding: 10px 20px;
          border: 1px solid #007bff;
          background-color: #007bff;
          color: white;
          border-radius: 4px;
          cursor: pointer;
        }
        .submit-button:hover {
          background-color: #0056b3;
        }
        .submit-container {
          grid-column: span 5;
          text-align: center;
        }
      `}</style>
    </div>
  );
};

export default VoucherPermissionsForm;
