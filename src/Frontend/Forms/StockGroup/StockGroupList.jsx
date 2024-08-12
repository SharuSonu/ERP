import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import { AppContext } from '../../../Context/AppContext';
import { createGroup, fetchStockGroups } from '../../utils/RestApi';
import { Input, Table, Button, message, Pagination, Spin, Alert, Modal, Divider, Checkbox, Row, Col, Form, Select } from 'antd';
//import '../../../styles/StockGroupList.css';
//import '../../../styles/Godown.css';

import '../../../styles/Formliststyle/Commonform.css';
import '../../../styles/Formliststyle/Tableform.css';
//import dotenv from 'dotenv';
//dotenv.config();


const StockGroupList = ({ onSelectStockGroup }) => {
  const { companyName } = useContext(AppContext);
  const [StockGroups, setStockGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [StockGroupOptions, setStockGroupOptions] = useState([]);
  
  const defaultGroups =[
    'Primary'
  ];
  // State for column visibility
  const [columnVisibility, setColumnVisibility] = useState({
    𝙸𝙳: true,    //Monospace text style format for Fileter titee//
    𝙶𝚛𝚘𝚞𝚙: true,
    𝚂𝚞𝚋𝙶𝚛𝚘𝚞𝚙: true,
    𝙰𝚌𝚝𝚒𝚘𝚗: true,
  });

  const [editStockGroupId, setEditStockGroupId] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteStockGroupId, setdeleteStockGroupId] = useState(null);
  const [deleteModalVisible, setdeleteModalVisible] = useState(false);

  const [stockgroupName, setStockGroupName] = useState('');
  const [parentGroup, setParentGroup] = useState('');
  const [stockgroupalias, setstockgroupAlias] = useState('');


  useEffect(() => {
    const fetchStockGroups = async () => {
      setLoading(true);

      try {
        const response = await axios.get('http://localhost:5000/api/stockgroupslist', {
          params: {
            companyName: companyName,
            page: currentPage,
            limit: pageSize,
          }
        });

        setStockGroups(response.data);
        setLoading(false);
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };

    fetchStockGroups();
  }, [companyName, currentPage, pageSize]);

  useEffect(() => {
    const fetchStockGroupsFromDatabase = async () => {
      console.log("Fetching stock groups for company:", companyName);
      try {
        const response = await fetchStockGroups(companyName);
        console.log("API response:", response);
        if (response.success) {
          const databaseGroups = response.groups || [];
          const combinedGroups = [...defaultGroups, ...databaseGroups];
          const uniqueGroups = Array.from(new Set(combinedGroups));
          console.log("Combined and unique groups:", uniqueGroups);
          setStockGroupOptions(uniqueGroups);
        } else {
          console.error('Failed to fetch groups:', response.message);
        }
      } catch (error) {
        console.error('Error fetching groups from database:', error);
      }
    };

    if (companyName) {
      fetchStockGroupsFromDatabase();
    } else {
      console.log("No company name found, setting default groups:", defaultGroups);
      setStockGroupOptions(defaultGroups);
    }
  }, [companyName]);

  useEffect(() => {
    const fetchGroupsFromDatabase = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/stockgroups_edit/${editStockGroupId}`, {
          params: {
            companyName: companyName,
          }
        });
        console.log('Response from API:', response.data); 
        if (response.data) {
          const { name, parentGroup, group_alias } = response.data;
          setStockGroupName(name);
          setParentGroup(parentGroup);
          setstockgroupAlias(group_alias);
          setEditModalVisible(true);
        } else {
          console.error('Failed to fetch stock group details:', response.data.message);
        }
      } catch (error) {
        console.error('Error fetching stock group details from database:', error);
      }
    };
  
    if (editStockGroupId) {
      fetchGroupsFromDatabase();
    }
  }, [editStockGroupId]);


  useEffect(() => {
    const fetchGroupsFromDatabase = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/stockgroups_delete/${deleteStockGroupId}`, {
          params: {
            companyName: companyName,
          }
        });
        console.log('Response from API:', response.data); 
        if (response.data) {
          const { name, parentGroup, group_alias } = response.data;
          setStockGroupName(name);
          setParentGroup(parentGroup);
          setstockgroupAlias(group_alias);
          setdeleteModalVisible(true);
        } else {
          console.error('Failed to fetch stock group details:', response.data.message);
        }
      } catch (error) {
        console.error('Error fetching stock group details from database:', error);
      }
    };
  
    if (deleteStockGroupId) {
      fetchGroupsFromDatabase();
    }
  }, [deleteStockGroupId]);

  const handleStockGroupNameChange = (value) => {
    setStockGroupName(value);
  };

  const handleParentGroupChange = (value) => {
    setParentGroup(value);
  };

 const handleStockGroupAliasNameChange = (value) =>{
  setstockgroupAlias(value);
 } 

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

  const filteredStockGroups = StockGroups.filter(StockGroup =>
    (StockGroup.name?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
    (StockGroup.parentStockGroup?.toLowerCase() ?? '').includes(searchTerm.toLowerCase())
  );

  const indexOfLastStockGroup = currentPage * pageSize;
  const indexOfFirstStockGroup = indexOfLastStockGroup - pageSize;
  const currentStockGroups = filteredStockGroups.slice(indexOfFirstStockGroup, indexOfLastStockGroup);

  const columns = [
    { title: '𝐈𝐃', dataIndex: 'id', key: 'id', visible: columnVisibility.𝙸𝙳 },
    { title: '𝐆𝐫𝐨𝐮𝐩', dataIndex: 'name', key: 'name', visible: columnVisibility.𝙶𝚛𝚘𝚞𝚙 },
    { title: '𝐒𝐮𝐛 𝐆𝐫𝐨𝐮𝐩', dataIndex: 'parentGroup', key: 'parentGroup', visible: columnVisibility.𝚂𝚞𝚋𝙶𝚛𝚘𝚞𝚙 },
    {
      title: '𝐀𝐜𝐭𝐢𝐨𝐧',
      key: 'action',
      visible: columnVisibility.𝙰𝚌𝚝𝚒𝚘𝚗,
      render: (_, record) => (
        <div className="btn-group" role="StockGroup" aria-label="Actions">
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

  const openEditModal = (StockGroupId) => {
    const group = StockGroups.find(group => group.id === StockGroupId);
    if (group) {
      setEditStockGroupId(StockGroupId);
      setStockGroupName(group.name);
      setParentGroup(group.parentGroup);
      setEditModalVisible(true);
    }
  };

  const closeEditModal = () => {
    setEditStockGroupId(null);
    setEditModalVisible(false);
    // Clear form fields on modal close if needed
    setStockGroupName('');
    setParentGroup('');
  };

  
  const opendeleteModal = (StockGroupId) => {
    const group = StockGroups.find(group => group.id === StockGroupId);
    if (group) {
      setdeleteStockGroupId(StockGroupId);
      setStockGroupName(group.name);
      setParentGroup(group.parentGroup);
      setdeleteModalVisible(true);
    }
  };

  const closedeleteModal = () => {
    setdeleteStockGroupId(null);
    setdeleteModalVisible(false);
  };


   //Modal Submit
   const handleSubmitEdit = async() => {
    try {
      
      const response = await axios.put(`http://localhost:5000/api/update-stockgroup`, {
        name: stockgroupName,       // Assuming groupName, groupAlias, and parentGroup are defined states
        group_alias: stockgroupalias,
        parentGroup: parentGroup,
        id : editStockGroupId,
        databaseName:companyName
      });
  
      if (response.data.success) {
        message.success('Group Updated successfully!');
        console.log('Group updated successfully');
        refreshStockGroupList();
        closeEditModal();
      } else {
        console.error('Failed to update Stock group:', response.data.message);
        // Handle error condition as needed
      }
    } catch (error) {
      console.error('Error updating stock group:', error);
      // Handle network error or other exceptions
    }
  };


  //Modal Submit
  const handleSubmitdelete = async() => {
    try {
      
      const response = await axios.put(`http://localhost:5000/api/delete-stockgroup`, {
        name: stockgroupName,       // Assuming groupName, groupAlias, and parentGroup are defined states
        group_alias: stockgroupalias,
        parentGroup: parentGroup,
        id : deleteStockGroupId,
        databaseName:companyName
      });
  
      if (response.data.success) {
        message.success('Group Deleted successfully!');
        console.log('Group Deleted successfully');
        refreshStockGroupList();
        closedeleteModal();
      } else {
        console.error('Failed to Delete Stock group:', response.data.message);
        // Handle error condition as needed
      }
    } catch (error) {
      console.error('Error Deleteing stock group:', error);
      // Handle network error or other exceptions
    }
  };

  const refreshStockGroupList = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/stockgroupslist', {
          params: {
            companyName: companyName,
            page: currentPage,
            limit: pageSize,
          }
        });

        setStockGroups(response.data);
        setLoading(false);
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };

  if (loading) return <Spin tip="Loading..." />;
  if (error) return <Alert message="Error" description={error.message} type="error" showIcon />;

  const pageSizeOptions = ['5', '10', '20', '50'];

  return (
    <div className="container">
      <h2>𝑺𝒕𝒐𝒄𝒌 𝑮𝒓𝒐𝒖𝒑 𝑳𝒊𝒔𝒕</h2>

      <div className="search-bar-container">
      <Input.Search
        className="mb-3"
        placeholder="Search StockGroup name, parent StockGroup..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
       </div>
      <Divider />

      <Row className="centered-row" gutter={[16, 16]}>
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

      <div className="table-container">
      <Table
        dataSource={currentStockGroups}
        columns={columns}
        pagination={false}
      />
      </div>

      <Pagination
        current={currentPage}
        pageSize={pageSize}
        total={filteredStockGroups.length}
        onChange={handlePageChange}
        onShowSizeChange={handlePageSizeChange}
        pageSizeOptions={pageSizeOptions}
        showSizeChanger
        showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
        style={{ marginTop: 20, textAlign: 'right' }}
      />
      <Modal
        title={`Edit Stock Group ID: ${editStockGroupId}`}
        visible={editModalVisible}
        onCancel={closeEditModal}
        footer={[
          <Button key="cancel" onClick={closeEditModal}>Cancel</Button>,
          <Button key="submit" type="primary" onClick={handleSubmitEdit}>Update</Button>,
        ]}
      >
        <Form layout="vertical">
          <Form.Item label="StockGroup Name">
            <Input value={stockgroupName} onChange={(e) => handleStockGroupNameChange(e.target.value)} />
          </Form.Item>
          <Form.Item label="Alias">
            <Input name= "stockgroupalias" value={stockgroupalias} onChange={(e) => handleStockGroupAliasNameChange(e.target.value)}/>
          </Form.Item>
          <Form.Item label="Parent Group">
            <Select showSearch optionFilterProp="children" value={parentGroup} onChange={(value) => handleParentGroupChange(value)}>
              {StockGroupOptions.map(group => (
                <Option key={group} value={group}>{group}</Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
       title={<div style={{ textAlign: 'center', color: 'Highlight' }}>Delete Stock Group </div>}
        visible={deleteModalVisible}
        onCancel={closedeleteModal}
        footer={[
          <Button key="cancel" onClick={closedeleteModal}>Cancel</Button>,
          <Button key="submit" type="primary" onClick={handleSubmitdelete}>OK</Button>,
        ]}
      >
        <p>Are you sure you want to delete Group ?</p>
      </Modal>
      <Divider />
    </div>
  );
};

StockGroupList.propTypes = {
  onSelectStockGroup: PropTypes.func
};

export default StockGroupList;
