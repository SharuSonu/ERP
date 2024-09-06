import React, { useState } from 'react';
import PropTypes from 'prop-types';

const TableData = ({ data, onEdit, onDelete, onSave }) => {
  const [editableRows, setEditableRows] = useState([]);

  const handleEditChange = (index, field, value) => {
    const updatedRows = [...editableRows];
    updatedRows[index] = {
      ...updatedRows[index],
      [field]: value
    };
    setEditableRows(updatedRows);
  };

  const handleSave = (index) => {
    onSave(index, editableRows[index]);
    // Reset the editable row
    const updatedRows = [...editableRows];
    updatedRows[index] = null;
    setEditableRows(updatedRows);
  };

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={{ border: '1px solid #ddd', padding: '8px' }}>User Name</th>
          <th style={{ border: '1px solid #ddd', padding: '8px' }}>Voucher Type</th>
          <th style={{ border: '1px solid #ddd', padding: '8px' }}>Access Type</th>
          <th style={{ border: '1px solid #ddd', padding: '8px' }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {data && data.length > 0 ? (
          data.map((user, index) => (
            <tr key={index}>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                {editableRows[index] ? (
                  <select
                    value={editableRows[index]?.userName || user.userName}
                    onChange={(e) => handleEditChange(index, 'userName', e.target.value)}
                  >
                    {/* Add your options here */}
                    <option value="Alice">Alice</option>
                    <option value="Bob">Bob</option>
                    <option value="Charlie">Charlie</option>
                  </select>
                ) : (
                  user.userName
                )}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                {editableRows[index] ? (
                  <select
                    value={editableRows[index]?.voucherType || user.voucherType}
                    onChange={(e) => handleEditChange(index, 'voucherType', e.target.value)}
                  >
                    {/* Add your options here */}
                    <option value="Gold">Gold</option>
                    <option value="Silver">Silver</option>
                    <option value="Bronze">Bronze</option>
                  </select>
                ) : (
                  user.voucherType
                )}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                {editableRows[index] ? (
                  <select
                    value={editableRows[index]?.accessType || user.accessType}
                    onChange={(e) => handleEditChange(index, 'accessType', e.target.value)}
                  >
                    {/* Add your options here */}
                    <option value="Full">Full</option>
                    <option value="Limited">Limited</option>
                  </select>
                ) : (
                  user.accessType
                )}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                {editableRows[index] ? (
                  <>
                    <button onClick={() => handleSave(index)}>Save</button>
                    <button onClick={() => setEditableRows(editableRows.filter((_, i) => i !== index))} style={{ marginLeft: '5px' }}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => {
                      const updatedRows = [...editableRows];
                      updatedRows[index] = {
                        userName: user.userName,
                        voucherType: user.voucherType,
                        accessType: user.accessType
                      };
                      setEditableRows(updatedRows);
                    }}>Edit</button>
                    <button onClick={() => onDelete(index)} style={{ marginLeft: '5px' }}>Delete</button>
                  </>
                )}
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="4" style={{ textAlign: 'center', padding: '8px' }}>No data available</td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

TableData.propTypes = {
  data: PropTypes.array.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
};

export default TableData;
