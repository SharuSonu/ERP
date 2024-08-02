import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import { createSalesman, fetchSalesman } from '../../utils/RestApi';
import { AppContext } from '../../../Context/AppContext';
import { Input, Table, Button, message, Pagination, Spin, Alert, Modal, Divider, Checkbox, Row, Col, Form, Select } from 'antd';
//import { Table, Form, Button, Modal, Switch } from 'antd';
import '../../../styles/GroupList.css';
import { Message } from 'semantic-ui-react';

const { Option } = Select;

const SalesmanList = ({ onSelectSalesman }) => {

  const { companyName } = useContext(AppContext);
  const [Salesman, setsalesman] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [SalesmanOptions, setSalesmanOptions] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({
    id : true,
    SalesManName: true,
    SalesManNumber:true,
    SalesManEmailId:true,
    action: true,
});

  const [editSalesmanId, setEditSalesmanId] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);

  // State variables for salesman details
  const [SalesManName, setSalesManName] = useState('');
  const [SalesManNumber, setSalesManNumber] = useState('');
  const [SalesManEmailId, setSalesManEmailId] = useState('');

  //fetch GroupList for Report view
  useEffect(() => {
    const fetchSalesman = async () => {
      setLoading(true);
      try {
        const response = await axios.get('http://localhost:5000/api/SalesmanList', {
          params: {
            companyName:companyName,
            page:currentPage,
            limit:pageSize,
          }
        });
        setsalesman(response.data);
        setLoading(false);
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };
   if (companyName)
    fetchSalesman();
  }, [companyName, currentPage, pageSize]);


  useEffect(() => {
    const fetchSalesmanFromDatabase = async () => {
        try {
            const response = await fetchSalesman(companyName); // Pass companyName as a parameter
            if (response.success) {
                const databaseSalesman = response.Salesman || []; // Ensure groups is not null
                const combinedSalesman = [ ...databaseSalesman]; // Merge defaultGroups with databaseGroups

                // Convert combinedGroups to a Set to remove duplicates, then convert back to an array
                const uniqueSalesman = Array.from(new Set(combinedSalesman));

                setSalesmanOptions(uniqueSalesman);
            } else {
                console.error('Failed to fetch SalesMan:', response.message);
            }
        } catch (error) {
            console.error('Error fetching Salesmansss from database:', error);
        }
    };
    if(companyName)
     fetchSalesmanFromDatabase();
}, [companyName,currentPage, pageSize]);


useEffect(() => {
    const fetchSalesmanFromDatabase = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/Salesman_edit/${editSalesmanId}`, {
          params: {
            companyName: companyName,
          }
        });
        console.log('Response from API:', response.data); 
        if (response.data) {
          const { SalesManName, SalesManNumber, SalesManEmailId } = response.data;
          setSalesManName(SalesManName);
          setSalesManNumber(SalesManNumber);
          setSalesManEmailId(SalesManEmailId);
          setEditModalVisible(true);
        } else {
          console.error('Failed to fetch Salesman details:', response.data.message);
        }
      } catch (error) {
        console.error('Error fetching Salesman details from database:', error);
      }
    };
    if (editSalesmanId) {
        fetchSalesmanFromDatabase();
      }
    }, [editSalesmanId]);

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

      const filteredSalesman = Salesman.filter(Salesmans=>
        (Salesmans.SalesManName?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
       // (Salesmans.SalesManNumber?.toLowerCase() ?? '').includes(searchTerm.toLowerCase())||
        (Salesmans.SalesManEmailId?.toLowerCase() ?? '').includes(searchTerm.toLowerCase())
      );

  const indexOfLastSalesmans = currentPage * pageSize;
  const indexOfFirstSalesmans = indexOfLastSalesmans - pageSize;
  const currentSalesman= filteredSalesman.slice(indexOfFirstSalesmans, indexOfLastSalesmans);

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', visible: columnVisibility.id },
    { title: 'Salesman Name ', dataIndex: 'SalesManName', key: 'SalesManName', visible: columnVisibility.SalesManName},
    { title: 'SalesMan Number', dataIndex: 'SalesManNumber', key: 'SalesManNumber', visible: columnVisibility.SalesManNumber },
    { title: 'Salesman EmailId', dataIndex: 'SalesManEmailId', key: 'SalesManEmailId', visible: columnVisibility.SalesManEmailId },
    {
      title: 'Action',
      key: 'action',
      visible: columnVisibility.action,
      render: (_, record) => (
        <div className="btn-Salesman" role="salesman" aria-label="Actions">
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
            onClick={() => confirmDelete(record.id)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ].filter(column => column.visible);

  const openEditModal = (SalesmanId) => {
    const Salesmans = Salesman.find(Salesman => Salesman.id === SalesmanId);
    if (Salesmans) {
      setEditSalesmanId(SalesmanId);
      setSalesManName(Salesmans.SalesManName);
      setSalesManNumber(Salesmans.SalesManNumber);
      setSalesManEmailId(Salesmans.SalesManEmailId);
      setEditModalVisible(true);
    }
  };

  const closeEditModal = () => {
    setEditSalesmanId(null);
    setEditModalVisible(false);
    // Clear form fields on modal close if needed
    setSalesManName('');
    setSalesManNumber('');
    setSalesManEmailId('');
  };

  const confirmDelete = (SalesmanId) => {
    Modal.confirm({
      title: 'Are you sure delete this SalesMan?',
      content: 'This action cannot be undone.',
      onOk() {
        console.log(`Delete Group with ID: ${SalesmanId}`);
      }
    });
  };

  //Modal Submit
  const handleSubmitEdit = async() => {
    try {
      const response = await axios.put(`http://localhost:5000/api/update-Salesman`, {
        SalesManName: SalesManName,       // Assuming groupName, groupAlias, and parentGroup are defined states
        SalesManNumber: SalesManNumber,
        SalesManEmailId: SalesManEmailId,
        id : editSalesmanId,
        databaseName:companyName
      });

      if (response.data.success) {
        message.success('SalesMan Updated successfully!');
        console.log('SalesMan updated successfully');
        refreshSalesmanList();
        closeEditModal();
      } else {
        console.error('Failed to update SalesMan:', response.data.message);
        // Handle error condition as needed
      }
    } catch (error) {
      console.error('Error updating Salesman:', error);
      // Handle network error or other exceptions
    }
  };

  const handleSalesmanNameChange = (value) => {
    setSalesManName(value);
  };

  const handleSalesmanNumberChange = (value) => {
    setSalesManNumber(value);
  };

 const handleSalemanEmailidChange = (value) =>{
  setSalesManEmailId(value);
 } 

 const refreshSalesmanList = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/SalesmanList', {
        params: {
          companyName: companyName,
          page: currentPage,
          limit: pageSize,
        }
      });
      setsalesman(response.data);
    } catch (err) {
      console.error('Error refreshing Salesman list:', err);
    }
  };

  if (loading) return <Spin tip="Loading..." />;
  if (error) return <Alert message="Error" description={error.message} type="error" showIcon />;

  const pageSizeOptions = ['5', '10', '20', '50'];

  return (
    <div className="SalesMan-list">
      <h2>SalesMan List</h2>

      <Input.Search
        className="mb-3"
        placeholder="Search SalesMan Name, SalesMan Info..."
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
        dataSource={currentSalesman}
        columns={columns}
        pagination={false}
      />

      <Pagination
        current={currentPage}
        pageSize={pageSize}
        total={filteredSalesman.length}
        onChange={handlePageChange}
        onShowSizeChange={handlePageSizeChange}
        pageSizeOptions={pageSizeOptions}
        showSizeChanger
        showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
        style={{ marginTop: 20, textAlign: 'right' }}
      />

      <Modal
        title={`Edit Salesman ID: ${editSalesmanId}`}
        visible={editModalVisible}
        onCancel={closeEditModal}
        footer={[
          <Button key="cancel" onClick={closeEditModal}>Cancel</Button>,
          <Button key="submit" type="primary" onClick={handleSubmitEdit}>Update</Button>,
        ]}
      >
        <Form layout="vertical">
          <Form.Item label="SalesManName">
            <Input value={SalesManName} onChange={(e) => handleSalesmanNameChange(e.target.value)} />
          </Form.Item>
          <Form.Item label="SalesManNumber">
            <Input value={SalesManNumber} onChange={(e) => handleSalesmanNumberChange(e.target.value)}/>
          </Form.Item>
          <Form.Item label="SalesManEmailId">
          <Input value={SalesManEmailId}  onChange={(e) => handleSalemanEmailidChange(e.target.value)}/>
          </Form.Item>
        </Form>
      </Modal>

      <Divider />
    </div>
  );
};

SalesmanList.propTypes = {
  onSalesmanGroup: PropTypes.func
};

export default SalesmanList;

