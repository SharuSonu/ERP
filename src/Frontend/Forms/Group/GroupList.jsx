import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import { createGroup, fetchGroups } from '../../utils/RestApi';
import { AppContext } from '../../../Context/AppContext';
import { Input, Table, Button, message, Pagination, Spin, Alert, Modal, Divider, Checkbox, Row, Col, Form, Select } from 'antd';

import '../../../styles/GroupList.css';
import { Message } from 'semantic-ui-react';

const { Option } = Select;

const GroupList = ({ onSelectGroup }) => {
  
  const { companyName } = useContext(AppContext);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [groupOptions, setGroupOptions] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({
    id: true,
    name: true,
    parentGroup: true,
    action: true,
  });
  const [editGroupId, setEditGroupId] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteGroupId, setdeleteGroupId] = useState(null);
  const [deleteModalVisible, setdeleteModalVisible] = useState(false);

  // State variables for group details
  const [groupName, setGroupName] = useState('');
  const [parentGroup, setParentGroup] = useState('');
  const [groupalias, setgroupAlias] = useState('');

  // Default groups for Select options (replace with your actual options)
  const defaultGroups = [
    'Bank Accounts',
    'Bank OD A/c',
    'Branch / Divisions',
    'Capital Account',
    'Cash-in-Hand',
    'Current Assets',
    'Current Liabilities',
    'Deposits (Asset)',
    'Direct Expenses',
    'Direct Incomes',
    'Duties & Taxes',
    'Fixed Assets',
    'Indirect Expenses',
    'Indirect Incomes',
    'Investments',
    'Loans & Advances (Asset)',
    'Loans (Liability)',
    'Misc. Expenses (ASSET)',
    'Provisions',
    'Purchase Accounts',
    'Reserves & Surplus',
    'Sales Accounts',
    'Secured Loans',
    'Stock-in-Hand',
    'Sundry Creditors',
    'Sundry Debtors',
    'Suspense A/c',
    'Unsecured Loans'
  ];

  //fetch GroupList for Report view
  useEffect(() => {
    const fetchGroups = async () => {
      setLoading(true);
      try {
        const response = await axios.get('http://localhost:5000/api/groupslist', {
          params: {
            companyName: companyName,
            page: currentPage,
            limit: pageSize,
          }
        });
        setGroups(response.data);
        setLoading(false);
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };
    fetchGroups();
  }, [companyName, currentPage, pageSize]);

  useEffect(() => {
    const fetchGroupsFromDatabase = async () => {
        try {
            const response = await fetchGroups(companyName); // Pass companyName as a parameter
            if (response.success) {
                const databaseGroups = response.groups || []; // Ensure groups is not null
                const combinedGroups = [...defaultGroups, ...databaseGroups]; // Merge defaultGroups with databaseGroups

                // Convert combinedGroups to a Set to remove duplicates, then convert back to an array
                const uniqueGroups = Array.from(new Set(combinedGroups));

                setGroupOptions(uniqueGroups);
            } else {
                console.error('Failed to fetch groups:', response.message);
            }
        } catch (error) {
            console.error('Error fetching groups from database:', error);
        }
    };

    fetchGroupsFromDatabase();
}, [companyName,currentPage, pageSize]);

useEffect(() => {
  const fetchGroupsFromDatabase = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/groups_edit/${editGroupId}`, {
        params: {
          companyName: companyName,
        }
      });
      console.log('Response from API:', response.data); 
      if (response.data) {
        const { name, parentGroup, group_alias } = response.data;
        setGroupName(name);
        setParentGroup(parentGroup);
        setgroupAlias(group_alias);
        setEditModalVisible(true);
      } else {
        console.error('Failed to fetch group details:', response.data.message);
      }
    } catch (error) {
      console.error('Error fetching group details from database:', error);
    }
  };

  if (editGroupId) {
    fetchGroupsFromDatabase();
  }
}, [editGroupId]);


// delete id

useEffect(() => {
  const fetchGroupsFromDatabase = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/groups_delete/${deleteGroupId}`, {
        params: {
          companyName: companyName,
        }
      });
      console.log('Response from API:', response.data); 
      if (response.data) {
        const { name, parentGroup, group_alias } = response.data;
        setGroupName(name);
        setParentGroup(parentGroup);
        setgroupAlias(group_alias);
        setdeleteModalVisible(true);
      } else {
        console.error('Failed to fetch group details:', response.data.message);
      }
    } catch (error) {
      console.error('Error fetching group details from database:', error);
    }
  };

  if (deleteGroupId) {
    fetchGroupsFromDatabase();
  }
}, [deleteGroupId]);

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

  const filteredGroups = groups.filter(group =>
    (group.name?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
    (group.parentGroup?.toLowerCase() ?? '').includes(searchTerm.toLowerCase())
  );

  const indexOfLastGroup = currentPage * pageSize;
  const indexOfFirstGroup = indexOfLastGroup - pageSize;
  const currentGroups = filteredGroups.slice(indexOfFirstGroup, indexOfLastGroup);

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', visible: columnVisibility.id },
    { title: 'Group', dataIndex: 'name', key: 'name', visible: columnVisibility.name },
    { title: 'SubGroup', dataIndex: 'parentGroup', key: 'parentGroup', visible: columnVisibility.parentGroup },
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
            onClick={() => openDeleteModal(record.id)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ].filter(column => column.visible);

  const openEditModal = (groupId) => {
    const group = groups.find(group => group.id === groupId);
    if (group) {
      setEditGroupId(groupId);
      setGroupName(group.name);
      setParentGroup(group.parentGroup);
      setEditModalVisible(true);
    }
  };

  const closeEditModal = () => {
    setEditGroupId(null);
    setEditModalVisible(false);
    // Clear form fields on modal close if needed
    setGroupName('');
    setParentGroup('');
  };

  const openDeleteModal = (groupId) => {
    const group = groups.find(group => group.id === groupId);
    if (group) {
      setdeleteGroupId(groupId);
      setGroupName(group.name);
      setParentGroup(group.parentGroup);
      setdeleteModalVisible(true);
    }
  };

  const closedeleteModal = () => {
    setdeleteGroupId(null);
    setdeleteModalVisible(false);
  };

  //Modal Submit
  const handleSubmitEdit = async() => {
    try {
      const response = await axios.put(`http://localhost:5000/api/update-group`, {
        name: groupName,       // Assuming groupName, groupAlias, and parentGroup are defined states
        group_alias: groupalias,
        parentGroup: parentGroup,
        id : editGroupId,
        databaseName:companyName
      });
  
      if (response.data.success) {
        message.success('Group Updated successfully!');
        console.log('Group updated successfully');
        refreshGroupList();
        closeEditModal();
      } else {
        console.error('Failed to update group:', response.data.message);
        // Handle error condition as needed
      }
    } catch (error) {
      console.error('Error updating group:', error);
      // Handle network error or other exceptions
    }
  };


  // delete code modle

  //Modal Submit
  const handleSubmitDelete = async() => {
    try {
      const response = await axios.put(`http://localhost:5000/api/delete-group`, {
        name: groupName,       // Assuming groupName, groupAlias, and parentGroup are defined states
        group_alias: groupalias,
        parentGroup: parentGroup,
        id : deleteGroupId,
        databaseName:companyName
      });
  
      if (response.data.success) {
        message.success('Group Updated successfully!');
        console.log('Group updated successfully');
        refreshGroupList();
        closedeleteModal();
      } else {
        console.error('Failed to update group:', response.data.message);
        // Handle error condition as needed
      }
    } catch (error) {
      console.error('Error updating group:', error);
      // Handle network error or other exceptions
    }
  };

  const handleGroupNameChange = (value) => {
    setGroupName(value);
  };

  const handleParentGroupChange = (value) => {
    setParentGroup(value);
  };

 const handleGroupAliasNameChange = (value) =>{
  setgroupAlias(value);
 } 
  const refreshGroupList = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/groupslist', {
        params: {
          companyName: companyName,
          page: currentPage,
          limit: pageSize,
        }
      });
      setGroups(response.data);
    } catch (err) {
      console.error('Error refreshing group list:', err);
    }
  };

  if (loading) return <Spin tip="Loading..." />;
  if (error) return <Alert message="Error" description={error.message} type="error" showIcon />;

  const pageSizeOptions = ['5', '10', '20', '50'];

  return (
    <div className="group-list">
      <h2>𝑮𝒓𝒐𝒖𝒑 𝑳𝒊𝒔𝒕</h2>

      <Input.Search
        className="mb-3"
        placeholder="Search group name, parent group..."
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
        dataSource={currentGroups}
        columns={columns}
        pagination={false}
      />

      <Pagination
        current={currentPage}
        pageSize={pageSize}
        total={filteredGroups.length}
        onChange={handlePageChange}
        onShowSizeChange={handlePageSizeChange}
        pageSizeOptions={pageSizeOptions}
        showSizeChanger
        showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
        style={{ marginTop: 20, textAlign: 'right' }}
      />

      <Modal
        title={`Edit Group ID: ${editGroupId}`}
        visible={editModalVisible}
        onCancel={closeEditModal}
        footer={[
          <Button key="cancel" onClick={closeEditModal}>Cancel</Button>,
          <Button key="submit" type="primary" onClick={handleSubmitEdit}>Update</Button>,
        ]}
      >
        <Form layout="vertical">
          <Form.Item label="Group Name">
            <Input value={groupName} onChange={(e) => handleGroupNameChange(e.target.value)} />
          </Form.Item>
          <Form.Item label="Alias">
            <Input name= "groupalias" value={groupalias} onChange={(e) => handleGroupAliasNameChange(e.target.value)}/>
          </Form.Item>
          <Form.Item label="Parent Group">
            <Select showSearch optionFilterProp="children" value={parentGroup} onChange={(value) => handleParentGroupChange(value)}>
              {groupOptions.map(group => (
                <Option key={group} value={group}>{group}</Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`Are you sure you want to delete this Group? :    ${deleteGroupId}`}
        visible={deleteModalVisible}
        onCancel={closedeleteModal}
        footer={[
          <Button key="cancel" onClick={closedeleteModal}>Cancel</Button>,
          <Button key="submit" type="primary" onClick={handleSubmitDelete}>OK</Button>,
        ]}
      >
</Modal>
        
      <Divider />
    </div>
  );
};

GroupList.propTypes = {
  onSelectGroup: PropTypes.func
};

export default GroupList;
