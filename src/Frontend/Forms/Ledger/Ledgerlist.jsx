import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import { AppContext } from '../../../Context/AppContext';
import { Input, Table, Button, message, Pagination, Spin, Alert, Modal, Divider, Checkbox, Row, Col, Form, Select } from 'antd';
import '../../../styles/LedgerList.css';

const LedgerList = ({ onSelectLedger }) => {
  const { companyName } = useContext(AppContext);
  const [ledgers, setLedgers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // State for column visibility
  const [columnVisibility, setColumnVisibility] = useState({
    id: true,
    ledgername: true,
    GroupName: true,
    customerEmail: true,
    customerPhone: true,
    customerMobile: true,
    GSTIN: true,
    pan: false,
    action: true,
  });

   // State for edit modal
   const [isEditModalVisible, setIsEditModalVisible] = useState(false);
   const [deleteModalVisible, setdeleteModalVisible] = useState(false);
   const [deleteledgerId, setdeleteledgerId] = useState(null);
   const [currentLedger, setCurrentLedger] = useState(null);

  useEffect(() => {
    const fetchLedgers = async () => {
      setLoading(true);

      try {
        const response = await axios.get('http://localhost:5000/api/ledgers', {
          params: {
            companyName: companyName,
            page: currentPage,
            limit: pageSize,
          }
        });

        setLedgers(response.data);
        setLoading(false);
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };

    fetchLedgers();
  }, [companyName, currentPage, pageSize]);


  // prashanth code for delete
  useEffect(() => {
    const fetchSalesmanFromDatabase = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/ledger_delete/${deleteledgerId}`, {
          params: {
            companyName: companyName,
          }
        });
        console.log('Response from API:', response.data); 
        if (response.data) {
          const {} = response.data;
          setdeleteModalVisible(true);
        } else {
          console.error('Failed to fetch Salesman details:', response.data.message);
        }
      } catch (error) {
        console.error('Error fetching Salesman details from database:', error);
      }
    };
    if (deleteledgerId) {
        fetchSalesmanFromDatabase();
      }
    }, [deleteledgerId]);

    // end 

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (current, size) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleCheckboxChange = (e) => {
    setColumnVisibility({ ...columnVisibility, [e.target.name]: e.target.checked });
  };

  const filteredLedgers = ledgers.filter(ledger =>
    (ledger.ledgername?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
    (ledger.customerEmail?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
    (ledger.GroupName?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
    (ledger.customerMobile?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
    (ledger.customerPhone?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
    (ledger.GSTIN?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
    (ledger.pan?.toLowerCase() ?? '').includes(searchTerm.toLowerCase())
  );

  const indexOfLastLedger = currentPage * pageSize;
  const indexOfFirstLedger = indexOfLastLedger - pageSize;
  const currentLedgers = filteredLedgers.slice(indexOfFirstLedger, indexOfLastLedger);

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', visible: columnVisibility.id },
    { title: 'Ledger', dataIndex: 'ledgername', key: 'ledgername', visible: columnVisibility.ledgername },
    { title: 'Group', dataIndex: 'GroupName', key: 'GroupName', visible: columnVisibility.GroupName },
    { title: 'Email', dataIndex: 'customerEmail', key: 'customerEmail', visible: columnVisibility.customerEmail },
    { title: 'Phone', dataIndex: 'customerPhone', key: 'customerPhone', visible: columnVisibility.customerPhone },
    { title: 'Mobile', dataIndex: 'customerMobile', key: 'customerMobile', visible: columnVisibility.customerMobile },
    { title: 'GSTIN', dataIndex: 'GSTIN', key: 'GSTIN', visible: columnVisibility.GSTIN },
    { title: 'PanNo', dataIndex: 'pan', key: 'pan', visible: columnVisibility.pan },
    {
      title: 'Action',
      key: 'action',
      visible: columnVisibility.action,
      render: (_, record) => (
        <div className="btn-group" role="group" aria-label="Actions">
          <Button
            type="default"
            className="edit-button"
            onClick={() => openEditModal(record.id)}
          >
            Edit
          </Button>
          <Button
            type="default"
            className="delete-button mr-2"
            onClick={() => opendeleteModal(record.id)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ].filter(column => column.visible); // Filter out columns based on visibility

  const openEditModal = async (ledgerId) => {
    console.log(`Open edit modal for ledger with ID: ${ledgerId}`);
    try {
      const response = await axios.get(`http://localhost:5000/api/ledgers_edit/${ledgerId}`, {
        params: { companyName }
      });
      setCurrentLedger(response.data);
      setIsEditModalVisible(true);
    } catch (error) {
      message.error('Failed to fetch ledger details.');
    }
  };

  const handleEditModalOk = async () => {
    try {
      await axios.put(`http://localhost:5000/api/ledgers_update/${currentLedger.id}`, currentLedger, {
        params: { companyName: companyName },
        headers: {
          'Content-Type': 'application/json'
        }
      });
      message.success('Ledger updated successfully.');
      setIsEditModalVisible(false);
      setCurrentLedger(null);
      // Refresh the ledger list
      const response = await axios.get('http://localhost:5000/api/ledgers', {
        params: {
          companyName: companyName,
          page: currentPage,
          limit: pageSize,
        }
      });
      setLedgers(response.data);
    } catch (error) {
      message.error('Failed to update ledger.');
    }
  };

  const handleEditModalCancel = () => {
    setIsEditModalVisible(false);
    setCurrentLedger(null);
  };


  // prashanth code for delete
  const opendeleteModal = async (ledgerId) => {
    console.log(`Open edit modal for ledger with ID: ${ledgerId}`);
    try {
      const response = await axios.get(`http://localhost:5000/api/ledger_delete/${ledgerId}`, {
        params: { companyName }
      });
      setCurrentLedger(response.data);
      setdeleteModalVisible(true);
    } catch (error) {
      message.error('Failed to fetch ledger details.');
    }
  };

  const closedeleteModal = () => {
    setdeleteledgerId(null);
    setdeleteModalVisible(false);
    
  };

  //Modal Submit // Prashanth code  delete 
  const handleSubmitdelete = async() => {
    try {
      const response = await axios.put(`http://localhost:5000/api/delete-ledger`, {
        id : currentLedger.id,
        databaseName:companyName
      });

      if (response.data.success) {
        message.success('Ledger Deleted successfully!');
        console.log('Ledger Deleted successfully');
       // Refresh the ledger list
      const response = await axios.get('http://localhost:5000/api/ledgers', {
        params: {
          companyName: companyName,
          page: currentPage,
          limit: pageSize,
        }
      });
      setLedgers(response.data);
        closedeleteModal();
      } else {
        console.error('Failed to Deleted Ledger:', response.data.message);
        // Handle error condition as needed
      }
    } catch (error) {
      console.error('Error Deleting Ledger:', error);
      // Handle network error or other exceptions
    }
  };

// end code

  const handleFormChange = (changedFields, allFields) => {
    setCurrentLedger({ ...currentLedger, ...changedFields });
  };

  

  if (loading) return <Spin tip="Loading..." />;
  if (error) return <Alert message="Error" description={error.message} type="error" showIcon />;

  const pageSizeOptions = ['5', '10', '20', '50'];

  return (
    <div className="ledger-list">
      <h2>Customer List</h2>

      <Input.Search
        className="mb-3"
        placeholder="Search ledgername, customerEmail, GroupName, customerMobile, customerPhone..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <Row gutter={[16, 16]}>
        {Object.keys(columnVisibility).map((key) => (
          <Col key={key}>
            <Checkbox
              name={key}
              checked={columnVisibility[key]}
              onChange={handleCheckboxChange}
            >
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </Checkbox>
          </Col>
        ))}
      </Row>

      <Divider />

      <Table
        dataSource={currentLedgers}
        columns={columns}
        pagination={false}
      />

      <Pagination
        current={currentPage}
        pageSize={pageSize}
        total={filteredLedgers.length}
        onChange={handlePageChange}
        onShowSizeChange={handlePageSizeChange}
        pageSizeOptions={pageSizeOptions}
        showSizeChanger
        showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
        style={{ marginTop: 20, textAlign: 'right' }}
      />
      <Divider></Divider>
      {currentLedger && (
        <Modal
          title="Edit Ledger"
          visible={isEditModalVisible}
          onOk={handleEditModalOk}
          onCancel={handleEditModalCancel}
        >
          <Form
            layout="vertical"
            initialValues={currentLedger}
            onValuesChange={(changedValues, allValues) => handleFormChange(allValues)}
          >
            <Form.Item label="Ledger Name" name="ledgername">
              <Input />
            </Form.Item>
            <Form.Item label="Group Name" name="GroupName">
              <Input />
            </Form.Item>
            <Form.Item label="Customer Email" name="customerEmail">
              <Input />
            </Form.Item>
            <Form.Item label="Customer Phone" name="customerPhone">
              <Input />
            </Form.Item>
            <Form.Item label="Customer Mobile" name="customerMobile">
              <Input />
            </Form.Item>
            <Form.Item label="GSTIN" name="GSTIN">
              <Input />
            </Form.Item>
            <Form.Item label="Pan No" name="pan">
              <Input />
            </Form.Item>
          </Form>
        </Modal>
      )}
        <Modal
       title={<div style={{ textAlign: 'center', color: 'Highlight' }}>Delete Ledger </div>}
        visible={deleteModalVisible}
        onCancel={closedeleteModal}
        footer={[
          <Button key="cancel" onClick={closedeleteModal}>Cancel</Button>,
          <Button key="submit" type="primary" onClick={handleSubmitdelete}>OK</Button>,
        ]}
      >
        <p>Are you sure you want to delete ledger ?</p>
      </Modal>

    </div>
  );
};

LedgerList.propTypes = {
  onSelectLedger: PropTypes.func
};

export default LedgerList;
