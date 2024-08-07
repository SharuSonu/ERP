import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import { createGroup, fetchGodown } from '../../utils/RestApi';
import { AppContext } from '../../../Context/AppContext';
import { Input, Table, Button, message, Pagination, Spin, Alert, Modal, Divider, Checkbox, Row, Col, Form, Select } from 'antd';

import '../../../styles/Godown.css';
import { Message } from 'semantic-ui-react';

const { Option } = Select;

const GodownList = ({ onSelectGodown}) => {
  
  const { companyName } = useContext(AppContext);
  const [Godowns, setGodowns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [GodownOptions, setGodownOptions] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({
    id: true,
    Godownname: true,
    Godownalias: true,
    Godowngroup:true,
    action: true,
  });
  const [editGodownId, setEditGodownId] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteGodownId, setdeleteGodownId] = useState(null);
  const [deleteModalVisible, setdeleteModalVisible] = useState(false);

  // State variables for group details
  const [Godownname, setGodownname] = useState('');
  const [Godownalias, setGodownalias] = useState('');
  const [Godowngroup, setGodowngroup] = useState('');


    
  //fetch GodownList for Report view
  useEffect(() => {
    const fetchGodown = async () => {
      setLoading(true);
      try {
        const response = await axios.get('http://localhost:5000/api/Godownlist', {
          params: {
            companyName: companyName,
            page: currentPage,
            limit: pageSize,
          }
        });
        setGodowns(response.data);
        setLoading(false);
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };
    fetchGodown();
  }, [companyName, currentPage, pageSize]);

  useEffect(() => {
    const fetchGodownFromDatabase = async () => {
        try {
            const response = await fetchGodown(companyName); // Pass companyName as a parameter
            if (response.success) {
                const databaseGodown = response.Godown || []; // Ensure groups is not null
                const combinedGodown = [ ...databaseGodown]; // Merge defaultGroups with databaseGroups

                // Convert combinedGroups to a Set to remove duplicates, then convert back to an array
                const uniqueGodown = Array.from(new Set(combinedGodown));

                setGodownOptions(uniqueGodown);
            } else {
                console.error('Failed to fetch groups:', response.message);
            }
        } catch (error) {
            console.error('Error fetching groups from database:', error);
        }
    };

    fetchGodownFromDatabase();
}, [companyName,currentPage, pageSize]);

useEffect(() => {
  const fetchGodownFromDatabase = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/Godown_edit/${editGodownId}`, {
        params: {
          companyName: companyName,
        }
      });
      console.log('Response from API:', response.data); 
      if (response.data) {
        const { Godownname, Godownalias, Godowngroup } = response.data;
        setGodownname(Godownname);
        setGodownalias(Godownalias);
        setGodowngroup(Godowngroup);
        setEditModalVisible(true);
      } else {
        console.error('Failed to fetch Godown details:', response.data.message);
      }
    } catch (error) {
      console.error('Error fetching Godown details from database:', error);
    }
  };

  if (editGodownId) {
    fetchGodownFromDatabase();
  }
}, [editGodownId]);


useEffect(() => {
  const fetchGodownFromDatabase = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/Godown_delete/${deleteGodownId}`, {
        params: {
          companyName: companyName,
        }
      });
      console.log('Response from API:', response.data); 
      if (response.data) {
        const { Godownname, Godownalias, Godowngroup } = response.data;
        setGodownname(Godownname);
        setGodownalias(Godownalias);
        setGodowngroup(Godowngroup);
        setdeleteModalVisible(true);
      } else {
        console.error('Failed to fetch Godown details:', response.data.message);
      }
    } catch (error) {
      console.error('Error fetching Godown details from database:', error);
    }
  };

  if (deleteGodownId) {
    fetchGodownFromDatabase();
  }
}, [deleteGodownId]);


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

  const filteredGodown = Godowns.filter(Godown =>
    (Godown.Godownname?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
    (Godown.Godownalias?.toLowerCase() ?? '').includes(searchTerm.toLowerCase())||
    (Godown.Godowngroup?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) 
  );

  const indexOfLastGodown = currentPage * pageSize;
  const indexOfFirstGodown = indexOfLastGodown - pageSize;
  const currentGodown = filteredGodown.slice(indexOfFirstGodown, indexOfLastGodown);

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', visible: columnVisibility.id },
    { title: 'Name', dataIndex: 'Godownname', key: 'Godownname', visible: columnVisibility.Godownname },
    { title: 'Alias', dataIndex: 'Godownalias', key: 'Godownalias', visible: columnVisibility.Godownalias },
    { title: 'Group', dataIndex: 'Godowngroup', key: 'Godowngroup', visible: columnVisibility.Godowngroup },
    
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
  ].filter(column => column.visible);

  const openEditModal = (GodownId) => {
    const Godown = Godowns.find(Godown => Godown.id === GodownId);
    if (Godown) {
      setEditGodownId(GodownId);
      setGodownname(Godown.Godownname);
      setGodownalias(Godown.Godownalias);
      setGodowngroup(Godown.Godowngroup);
      setEditModalVisible(true);
    }
  };

  const closeEditModal = () => {
    setEditGodownId(null);
    setEditModalVisible(false);
    // Clear form fields on modal close if needed
    setGodownname('');
    setGodownalias('');
    setGodowngroup('');
  };

  const opendeleteModal = (GodownId) => {
    const Godown = Godowns.find(Godown => Godown.id === GodownId);
    if (Godown) {
      setdeleteGodownId(GodownId);
      setGodownname(Godown.Godownname);
      setGodownalias(Godown.Godownalias);
      setGodowngroup(Godown.Godowngroup);
      setdeleteModalVisible(true);
    }
  };

  const closedeleteModal = () => {
    setdeleteGodownId(null);
    setdeleteModalVisible(false);
   
  };

  //Modal Submit
  const handleSubmitEdit = async() => {
    try {
      const response = await axios.put(`http://localhost:5000/api/update-Godown`, {
        Godownname: Godownname,       // Assuming groupName, groupAlias, and parentGroup are defined states
        Godownalias: Godownalias,
        Godowngroup: Godowngroup,
        id : editGodownId,
        databaseName:companyName
      });
  
      if (response.data.success) {
        message.success('Godown Updated successfully!');
        console.log('Godown updated successfully');
        refreshGodownList();
        closeEditModal();
      } else {
        console.error('Failed to update Godown:', response.data.message);
        // Handle error condition as needed
      }
    } catch (error) {
      console.error('Error updating Godown:', error);
      // Handle network error or other exceptions
    }
  };


   //Modal Submit
   const handleSubmitdelete = async() => {
    try {
      const response = await axios.put(`http://localhost:5000/api/delete-Godown`, {
        Godownname: Godownname,       // Assuming groupName, groupAlias, and parentGroup are defined states
        Godownalias: Godownalias,
        Godowngroup: Godowngroup,
        id : deleteGodownId,
        databaseName:companyName
      });
  
      if (response.data.success) {
        message.success('Godown Deleted successfully!');
        console.log('Godown Deleted successfully');
        refreshGodownList();
        closedeleteModal();
      } else {
        console.error('Failed to Delete Godown:', response.data.message);
        // Handle error condition as needed
      }
    } catch (error) {
      console.error('Error Deleting Godown:', error);
      // Handle network error or other exceptions
    }
  };

  const handleGodownnameChange = (value) => {
    setGodownname(value);
  };

  const handleGodownaliasChange = (value) => {
    setGodownalias(value);
  };

 const handleGodowngroupChange = (value) =>{
  setGodowngroup(value);
 } 
  const refreshGodownList = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/Godownlist', {
        params: {
          companyName: companyName,
          page: currentPage,
          limit: pageSize,
        }
      });
      setGodowns(response.data);
    } catch (err) {
      console.error('Error refreshing Godown list:', err);
    }
  };

  if (loading) return <Spin tip="Loading..." />;
  if (error) return <Alert message="Error" description={error.message} type="error" showIcon />;

  const pageSizeOptions = ['5', '10', '20', '50'];

  return (
    <div className="Godown-list">
      <h2>Godown List</h2>

      <Input.Search
        className="mb-3"
        placeholder="Search Godown name, Godown group..."
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
        dataSource={currentGodown}
        columns={columns}
        pagination={false}
      />

      <Pagination
        current={currentPage}
        pageSize={pageSize}
        total={filteredGodown.length}
        onChange={handlePageChange}
        onShowSizeChange={handlePageSizeChange}
        pageSizeOptions={pageSizeOptions}
        showSizeChanger
        showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
        style={{ marginTop: 20, textAlign: 'right' }}
      />

      <Modal
        title={`Edit Godown ID: ${editGodownId}`}
        visible={editModalVisible}
        onCancel={closeEditModal}
        footer={[
          <Button key="cancel" onClick={closeEditModal}>Cancel</Button>,
          <Button key="submit" type="primary" onClick={handleSubmitEdit}>Update</Button>,
        ]}
      >
        <Form layout="vertical">
          <Form.Item label="Name">
            <Input value={Godownname} onChange={(e) => handleGodownnameChange(e.target.value)} />
          </Form.Item>
          <Form.Item label="Alias">
            <Input name= "groupalias" value={Godownalias} onChange={(e) => handleGodownaliasChange(e.target.value)}/>
          </Form.Item>
          <Form.Item label="Group">
            <Select showSearch optionFilterProp="children" value={Godowngroup} onChange={(value) => handleGodowngroupChange(value)}>
              {GodownOptions.map(Gowdon => (
                <Option key={Gowdon} value={Gowdon}>{Gowdon}</Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
       title={<div style={{ textAlign: 'center', color: 'Highlight' }}>Delete Godown </div>}
        visible={deleteModalVisible}
        onCancel={closedeleteModal}
        footer={[
          <Button key="cancel" onClick={closedeleteModal}>Cancel</Button>,
          <Button key="submit" type="primary" onClick={handleSubmitdelete}>OK</Button>,
        ]}
      >
        <p>Are you sure you want to delete Godown ?</p>
      </Modal>

      <Divider />
    </div>
  );
};

GodownList.propTypes = {
  onSelectGodown: PropTypes.func
};

export default GodownList;
