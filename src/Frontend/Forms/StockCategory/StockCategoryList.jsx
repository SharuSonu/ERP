import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import { AppContext } from '../../../Context/AppContext';
import { createGroup, fetchStockcategory } from '../../utils/RestApi';
import { Input, Table, Button, message, Pagination, Spin, Alert, Modal, Divider, Checkbox, Row, Col, Form, Select } from 'antd';
import '../../../styles/StockGroupList.css';

const StockCategoryList = ({ onSelectStockcategory }) => {
    const { companyName } = useContext(AppContext);
    const [Stockcategorys, setStockcategory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);
    const [StockcategoryOptions, setStockcategoryOptions] = useState([]);

    const defaultcategory =[
        'Primary'
      ];


// set column to display 
    const [columnVisibility, setColumnVisibility] = useState({
        𝙸𝙳: true,
        𝙽𝚊𝚖𝚎: true,
        𝙰𝚕𝚒𝚊𝚜: true,
        𝙶𝚛𝚘𝚞𝚙: true,
        𝙰𝚌𝚝𝚒𝚘𝚗: true,
      });

  const [editStockcategoryId, setEditStockcategoryId] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteStockcategoryId, setdeleteStockcategoryId] = useState(null);
  const [deleteModalVisible, setdeleteModalVisible] = useState(false);

  const [stockcategoryName, setstockcategoryName] = useState('');
  const [stockcategoryalias ,setstockcategoryalias] = useState('');
  const [stockcategorygroup, setstockcategorygroup] = useState('');


  useEffect(() => {
    const fetchStockcategory = async () => {
      setLoading(true);

      try {
        const response = await axios.get(BASE_URL+'/stockcategorylist', {
          params: {
            companyName: companyName,
            page: currentPage,
            limit: pageSize,
          }
        });

        setStockcategory(response.data);
        setLoading(false);
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };

    fetchStockcategory();
}, [companyName, currentPage, pageSize]);

useEffect(() => {
    const fetchStockcategoryFromDatabase = async () => {
      console.log("Fetching stock groups for company:", companyName);
      try {
        const response = await fetchStockcategory(companyName);
        console.log("API response:", response);
        if (response.success) {
          const databasecategory = response.category || [];
          const combinedcategory = [...defaultcategory,...databasecategory];
          const uniquecategory = Array.from(new Set(combinedcategory));
          console.log("Combined and unique groups:", uniquecategory);
          setStockcategoryOptions(uniquecategory);
        } else {
          console.error('Failed to fetch groups:', response.message);
        }
      } catch (error) {
        console.error('Error fetching groups from database:', error);
      }
    };

    if (companyName) {
       // fetchStockcategoryFromDatabase();
    } else {
      console.log("No company name found, setting default groups:", defaultcategory);
      setStockcategoryOptions(defaultcategory);
    }
  }, [companyName]);

  useEffect(() => {
    const fetchcategoryFromDatabase = async () => {
      try {
        const response = await axios.get(BASE_URL+`/stockcategory_edit/${editStockcategoryId}`, {
          params: {
            companyName: companyName,
          }
        });
        console.log('Response from API:', response.data); 
        if (response.data) {
          const { Name, Namealias,Namegroup } = response.data;
          setstockcategoryName(Name);
          setstockcategoryalias(Namealias);
          setstockcategorygroup(Namegroup);
          setEditModalVisible(true);
        } else {
          console.error('Failed to fetch stock group details:', response.data.message);
        }
      } catch (error) {
        console.error('Error fetching stock group details from database:', error);
      }
    };
  
    if (editStockcategoryId) {
        fetchcategoryFromDatabase();
    }
  }, [editStockcategoryId]);

  useEffect(() => {
    const fetchcategoryFromDatabase = async () => {
      try {
        const response = await axios.get(BASE_URL+`/stockcategory_delete/${deleteStockcategoryId}`, {
          params: {
            companyName: companyName,
          }
        });
        console.log('Response from API:', response.data); 
        if (response.data) {
          const { Name, Namealias,Namegroup } = response.data;
          setstockcategoryName(Name);
          setstockcategoryalias(Namealias);
          setstockcategorygroup(Namegroup);
          setdeleteModalVisible(true);
        } else {
          console.error('Failed to fetch stock group details:', response.data.message);
        }
      } catch (error) {
        console.error('Error fetching stock group details from database:', error);
      }
    };
  
    if (deleteStockcategoryId) {
        fetchcategoryFromDatabase();
    }
  }, [deleteStockcategoryId]);

  const handlestockcategoryNameChange = (value) => {
    setstockcategoryName(value);
  };

  const handlestockcategoryaliasChange = (value) => {
    setstockcategoryalias(value);
  };

 const handlestockcategorygroupChange = (value) =>{
    setstockcategorygroup(value);
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

  const filteredStockcategorys = Stockcategorys.filter(Stockcategory =>
    (Stockcategory.Name?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
    (Stockcategory.Namealias?.toLowerCase() ?? '').includes(searchTerm.toLowerCase())||
    (Stockcategory.Namegroup?.toLowerCase() ?? '').includes(searchTerm.toLowerCase())
  );

  const indexOfLastStockcategory = currentPage * pageSize;
  const indexOfFirstStockcategory = indexOfLastStockcategory - pageSize;
  const currentStockcategorys = filteredStockcategorys.slice(indexOfFirstStockcategory, indexOfLastStockcategory);

  const columns = [
    { title: '𝐈𝐃', dataIndex: 'id', key: 'id', visible: columnVisibility.𝙸𝙳 },
    { title: '𝐍𝐚𝐦𝐞', dataIndex: 'Name', key: 'Name', visible: columnVisibility.𝙽𝚊𝚖𝚎 },
    { title: '𝑨𝒍𝒊𝒂𝒔', dataIndex: 'Namealias', key: 'Namealias', visible: columnVisibility.𝙰𝚕𝚒𝚊𝚜 },
    { title: '𝐆𝐫𝐨𝐮𝐩', dataIndex: 'Namegroup', key: 'Namegroup', visible: columnVisibility.𝙶𝚛𝚘𝚞𝚙 },
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

  const openEditModal = (StockcategoryId) => {
    const category = Stockcategorys.find(category =>category.id === StockcategoryId);
    if (category) {
      setEditStockcategoryId(StockcategoryId);
      setstockcategoryName(category.Name);
      setstockcategoryalias(category.Namealias);
      setstockcategorygroup(category.Namegroup)
      setEditModalVisible(true);
    }
  };

  const closeEditModal = () => {
    setEditStockcategoryId(null);
    setEditModalVisible(false);
    // Clear form fields on modal close if needed
    setstockcategoryName('');
    setstockcategoryalias('');
    setstockcategorygroup('');
  };

  const opendeleteModal = (StockcategoryId) => {
    const category = Stockcategorys.find(category =>category.id === StockcategoryId);
    if (category) {
      setdeleteStockcategoryId(StockcategoryId);
      setstockcategoryName(category.Name);
      setstockcategoryalias(category.Namealias);
      setstockcategorygroup(category.Namegroup)
      setdeleteModalVisible(true);
    }
  };


  const closedeleteModal = () => {
    setdeleteStockcategoryId(null);
    setdeleteModalVisible(false);
  
  };

   //Modal Submit
   const handleSubmitEdit = async() => {
    try {
      
      const response = await axios.put(BASE_URL+`/update-stockcategory`, {
        Name: stockcategoryName,       // Assuming groupName, groupAlias, and parentGroup are defined states
        Namealias: stockcategoryalias,
        Namegroup: stockcategorygroup,
        id : editStockcategoryId,
        databaseName:companyName
      });
  
      if (response.data.success) {
        message.success('Stockcategory Updated successfully!');
        console.log('Stockcategory updated successfully');
        refreshStockcategoryList();
        closeEditModal();
      } else {
        console.error('Failed to update Stockcategory:', response.data.message);
        // Handle error condition as needed
      }
    } catch (error) {
      console.error('Error updating Stockcategory:', error);
      // Handle network error or other exceptions
    }
  };


  //Modal Submit
  const handleSubmitdelete = async() => {
    try {
      
      const response = await axios.put(BASE_URL+`/delete-stockcategory`, {
        Name: stockcategoryName,       // Assuming groupName, groupAlias, and parentGroup are defined states
        Namealias: stockcategoryalias,
        Namegroup: stockcategorygroup,
        id : deleteStockcategoryId,
        databaseName:companyName
      });
  
      if (response.data.success) {
        message.success('Stockcategory Deleted successfully!');
        console.log('Stockcategory Deleted successfully');
        refreshStockcategoryList();
        closedeleteModal();
      } else {
        console.error('Failed to Delete Stockcategory:', response.data.message);
        // Handle error condition as needed
      }
    } catch (error) {
      console.error('Error Deleteing Stockcategory:', error);
      // Handle network error or other exceptions
    }
  };

  const refreshStockcategoryList = async () => {
      try {
        const response = await axios.get(BASE_URL+'/stockcategorylist', {
          params: {
            companyName: companyName,
            page: currentPage,
            limit: pageSize,
          }
        });

        setStockcategory(response.data);
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
      <h2>𝑺𝒕𝒐𝒄𝒌 𝑪𝒂𝒕𝒆𝒈𝒐𝒓𝒚 𝑳𝒊𝒔𝒕</h2>

     
      <div className="search-bar-container">
      <Input.Search
        className="mb-3"
        placeholder="Search StockGroup name, parent StockGroup..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      </div>

      
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
        dataSource={currentStockcategorys}
        columns={columns}
        pagination={false}
      />
      </div>

      <Pagination
        current={currentPage}
        pageSize={pageSize}
        total={filteredStockcategorys.length}
        onChange={handlePageChange}
        onShowSizeChange={handlePageSizeChange}
        pageSizeOptions={pageSizeOptions}
        showSizeChanger
        showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
        style={{ marginTop: 20, textAlign: 'right' }}
      />
      <Modal
        title={`Edit Stock Group ID: ${editStockcategoryId}`}
        visible={editModalVisible}
        onCancel={closeEditModal}
        footer={[
          <Button key="cancel" onClick={closeEditModal}>Cancel</Button>,
          <Button key="submit" type="primary" onClick={handleSubmitEdit}>Update</Button>,
        ]}
      >
        <Form layout="vertical">
          <Form.Item label="StockCategory Name">
            <Input value={stockcategoryName} onChange={(e) => handlestockcategoryNameChange(e.target.value)} />
          </Form.Item>
          <Form.Item label="Alias">
            <Input name= "StockCategoryalias" value={stockcategoryalias} onChange={(e) => handlestockcategoryaliasChange(e.target.value)}/>
          </Form.Item>
          <Form.Item label="StocKcategory Group">
          <Input name= "Stockgroupa" value={stockcategorygroup} onChange={(e) => handlestockcategorygroupChange(e.target.value)}/>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
       title={<div style={{ textAlign: 'center', color: 'Highlight' }}>Delete Stock Category </div>}
        visible={deleteModalVisible}
        onCancel={closedeleteModal}
        footer={[
          <Button key="cancel" onClick={closedeleteModal}>Cancel</Button>,
          <Button key="submit" type="primary" onClick={handleSubmitdelete}>OK</Button>,
        ]}
      >
        <p>Are you sure you want to delete Category ?</p>
      </Modal>
      <Divider />
    </div>
  );
};

StockCategoryList.propTypes = {
  onSelectStockcategory: PropTypes.func
};

export default StockCategoryList;
