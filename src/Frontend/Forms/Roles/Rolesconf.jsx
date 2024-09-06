import React, { useState } from 'react';
import { Switch, Button } from 'antd';

const VoucherPermissionsForm = () => {
  const [formData, setFormData] = useState({
    userName: '',
    voucherType: '',
    alter: 'no', // Default to 'no'
    display: 'no', // Default to 'no'
    delete: 'no', // Default to 'no'
  });

  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [permissionsList, setPermissionsList] = useState([]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Handle switch changes for permissions
  const handlePermissionChange = (permissionType, value) => {
    setFormData((prevData) => ({
      ...prevData,
      [permissionType]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setPermissionsList((prevList) => [
      ...prevList,
      { ...formData, id: Date.now() }, // Add a unique ID for each entry
    ]);
    setFeedbackMessage(`Form submitted with data: ${JSON.stringify(formData)}`);
    setFormData({
      userName: '',
      voucherType: '',
      alter: 'no',
      display: 'no',
      delete: 'no',
    }); // Reset form data after submission
  };

  return (
    <div className="container">
      <div className="form-container">
        <h1 className="title">Voucher Permissions Form</h1>
        <form onSubmit={handleSubmit} className="form">
          <table>
            <tbody>
              {/* User Name Field */}
              <tr>
                <td>
                  <label>User Name:</label>
                </td>
                <td>
                  <input
                    type="text"
                    name="userName"
                    value={formData.userName}
                    onChange={handleChange}
                    required
                  />
                </td>
              </tr>

              {/* Voucher Type Field */}
              <tr>
                <td>
                  <label>Voucher Type:</label>
                </td>
                <td>
                  <input
                    type="text"
                    name="voucherType"
                    value={formData.voucherType}
                    onChange={handleChange}
                    required
                  />
                </td>
              </tr>

              {/* Permissions Fields */}
              <tr>
                <td>
                  <label>Alter:</label>
                </td>
                <td>
                  <Switch
                    checked={formData.alter === 'enable'}
                    onChange={(checked) => handlePermissionChange('alter', checked ? 'enable' : 'disable')}
                  />
                </td>
              </tr>

              <tr>
                <td>
                  <label>Display:</label>
                </td>
                <td>
                  <Switch
                    checked={formData.display === 'enable'}
                    onChange={(checked) => handlePermissionChange('display', checked ? 'enable' : 'disable')}
                  />
                </td>
              </tr>

              <tr>
                <td>
                  <label>Delete:</label>
                </td>
                <td>
                  <Switch
                    checked={formData.delete === 'enable'}
                    onChange={(checked) => handlePermissionChange('delete', checked ? 'enable' : 'disable')}
                  />
                </td>
              </tr>
            </tbody>
          </table>

          {/* Submit Button */}
          <Button type="primary" htmlType="submit">
            Submit
          </Button>
        </form>

        {/* Feedback Message */}
        {feedbackMessage && <p>{feedbackMessage}</p>}
      </div>

      <div className="list-container">
        <h2>Submitted Permissions</h2>
        <table>
          <thead>
            <tr>
              <th>User Name</th>
              <th>Voucher Type</th>
              <th>Alter</th>
              <th>Display</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {permissionsList.map((permission) => (
              <tr key={permission.id}>
                <td>{permission.userName}</td>
                <td>{permission.voucherType}</td>
                <td>{permission.alter}</td>
                <td>{permission.display}</td>
                <td>{permission.delete}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Styles for the form */}
      <style jsx>{`
        .container {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          height: 100vh; /* Full viewport height */
          padding: 20px; /* Padding to avoid content touching edges */
        }
        .form-container {
          width: 45%;
        }
        .list-container {
          width: 45%;
        }
        .title {
          margin-bottom: 20px; /* Space between title and form */
        }
        .form {
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background-color: #f9f9f9;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        td, th {
          padding: 10px;
          border: 1px solid #ddd;
        }
        th {
          background-color: #f4f4f4;
        }
        input {
          width: 100%;
          padding: 8px;
          border: 1px solid #d9d9d9;
          border-radius: 4px;
        }
        .ant-switch {
          margin-left: 8px;
        }
        button[type="submit"] {
          margin-top: 20px;
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          background-color: #007bff;
          color: white;
          cursor: pointer;
        }
        button[type="submit"]:hover {
          background-color: #0056b3;
        }
        .list-container {
          margin-top: 20px;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background-color: #f1f1f1;
        }
        .list-container h2 {
          margin-bottom: 10px;
        }
      `}</style>
    </div>
  );
};

export default VoucherPermissionsForm;
