import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import { fetchUnits } from '../../utils/RestApi';
import {fetchCompUnits} from  '../../utils/RestApi';
import { AppContext } from '../../../Context/AppContext';
import { Input, Table, Button, message, Pagination, Spin, Alert, Modal, Divider, Checkbox, Row, Col, Form, Select } from 'antd';
//import { Table, Form, Button, Modal, Switch } from 'antd';
import '../../../styles/Unitslist.css';
//import '../../../styles/GroupList.css';
import '../../../styles/Model Styles/UnitsModel.css';


const { Option } = Select;

const UnitsList = ({ onSelectUnit }) => {
  const { companyName } = useContext(AppContext);
  const [units, setUnits] = useState([]);
  const[CompUnits,setCompUnits]= useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTerms, setSearchTerms] = useState('');
  const [currentPageSimple, setCurrentPageSimple] = useState(1);
  const [currentPageCompound, setCurrentPageCompound] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [unitOptions, setUnitOptions] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({
    id: true,
    Symbolname:true,
    Formalname:true,
    QUCname:true,
    Decimalnum:true,
    action: true,
  });
const [columnVisibilitys, setColumnVisibilitys] = useState({
    id: true,
    Firstunit:true,
    NumValue:true,
    Secondunit:true,
    action: true,
});

const [editUnitId, setEditUnitId] = useState(null);
const [editModalVisible, setEditModalVisible] = useState(false);
const [editcompUnitId, setcompEditUnitId] = useState(null);
const [editcompModalVisible, setcompEditModalVisible] = useState(false);
const [deleteUnitId, setdeleteUnitId] = useState(null);
const [deleteModalVisible, setdeleteModalVisible] = useState(false);
const [deletecompUnitId, setcompdeleteUnitId] = useState(null);
const [deletecompModalVisible, setcompdeleteModalVisible] = useState(false);
const [simpleUnits, setSimpleUnits] = useState([]);
const [compoundUnits, setCompoundUnits] = useState([]);

const[Symbolname,setSymbolname]= useState('');
const[Formalname,setFormalname]= useState('');
const[QUCname,setQUCname]=  useState('');
const[Decimalnum, setDecimalnum]=  useState('');

const[Firstunit,setFirstunit]=useState('');
const[NumValue,setNumValue]=useState('');
const[Secondunit,setSecondunit]=useState('');

// Fetch Units List
useEffect(() => {
  const fetchUnits = async () => {
    setLoading(true);
    try {
      // Fetch simple units
      const simpleResponse = await axios.get('http://localhost:5000/api/UnitsList', {
        params: {
          companyName,
          page: currentPage,
          limit: pageSize,
        }
      });
      const simpleUnits = simpleResponse.data;

      setSimpleUnits(simpleUnits);
      setLoading(false);
    } catch (err) {
      setError(err);
      setLoading(false);
    }
  };

  if (companyName) fetchUnits();
}, [companyName, currentPage, pageSize]);


useEffect(() => {
  const fetchCompUnits = async () => {
    setLoading(true);
    try {

      // Fetch compound units
      const compoundResponse = await axios.get('http://localhost:5000/api/CompoundsList', {
        params: {
          companyName,
          page: currentPage,
          limit: pageSize,
        }
      });
      const compoundUnits = compoundResponse.data;

      setCompoundUnits(compoundUnits);
      setLoading(false);
    } catch (err) {
      setError(err);
      setLoading(false);
    }
  };

  if (companyName) fetchCompUnits();
}, [companyName, currentPage, pageSize]);

useEffect(() => {
  const fetchSalesmanFromDatabase = async () => {
      try {
          const response = await fetchCompUnits(companyName); // Pass companyName as a parameter
          if (response.success) {
              const databaseunits = response.units || []; // Ensure groups is not null
              const combinedunits = [ ...databaseunits]; // Merge defaultGroups with databaseGroups

              // Convert combinedGroups to a Set to remove duplicates, then convert back to an array
              const uniqueunits = Array.from(new Set(combinedunits));

              setUnitOptions(uniqueunits);
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
            const response = await fetchUnits(companyName); // Pass companyName as a parameter
            if (response.success) {
                const databaseunits = response.units || []; // Ensure groups is not null
                const combinedunits = [ ...databaseunits]; // Merge defaultGroups with databaseGroups

                // Convert combinedGroups to a Set to remove duplicates, then convert back to an array
                const uniqueunits = Array.from(new Set(combinedunits));

                setUnitOptions(uniqueunits);
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

   // Fetch unit details for editing
   useEffect(() => {
    const fetchUnitDetails = async () => {
      if (editUnitId) {
        try {
          const response = await axios.get(`http://localhost:5000/api/Units_edit/${editUnitId}`, {
            params: { companyName }
          });
          if (response.data) {
            const { Symbolname, Formalname,QUCname,Decimalnum } = response.data;
            setSymbolname(Symbolname);
            setFormalname(Formalname);
            setQUCname(QUCname);
            setDecimalnum(Decimalnum);
            setEditModalVisible(true);
          } else {
            console.error('Failed to fetch unit details:', response.data.message);
          }
        } catch (error) {
          console.error('Error fetching unit details:', error);
        }
      }
    };
    if (editUnitId) {
      fetchUnitDetails();
    }
  }, [editUnitId]);

  useEffect(() => {
    const fetchcompUnitDetails = async () => {
      if (editcompUnitId) {
        try {
          const response = await axios.get(`http://localhost:5000/api/compUnits_edit/${editcompUnitId}`, {
            params: { companyName }
          });
          if (response.data) {
            const { Firstunit, NumValue,Secondunit } = response.data;
            setFirstunit(Firstunit);
            setNumValue(NumValue);
            setSecondunit(Secondunit);
            setcompEditModalVisible(true);
          } else {
            console.error('Failed to fetch unit details:', response.data.message);
          }
        } catch (error) {
          console.error('Error fetching unit details:', error);
        }
      }
    };
    if (editcompUnitId) {
      fetchcompUnitDetails();
    }
  }, [editcompUnitId]);


  // Fetch unit details for Deleting
  useEffect(() => {
    const fetchdeleteUnitDetails = async () => {
      if (deleteUnitId) {
        try {
          const response = await axios.get(`http://localhost:5000/api/Units_delete/${deleteUnitId}`, {
            params: { companyName }
          });
          if (response.data) {
            const { Symbolname, Formalname,QUCname,Decimalnum } = response.data;
            setSymbolname(Symbolname);
            setFormalname(Formalname);
            setQUCname(QUCname);
            setDecimalnum(Decimalnum);
            setdeleteModalVisible(true);
          } else {
            console.error('Failed to fetch unit details:', response.data.message);
          }
        } catch (error) {
          console.error('Error fetching unit details:', error);
        }
      }
    };
    if (deleteUnitId) {
      fetchdeleteUnitDetails();
    }
  }, [deleteUnitId]);

  useEffect(() => {
    const fetchcompdeleteUnitDetails = async () => {
      if (deletecompUnitId) {
        try {
          const response = await axios.get(`http://localhost:5000/api/compUnits_delete/${deletecompUnitId}`, {
            params: { companyName }
          });
          if (response.data) {
            const { Firstunit, NumValue,Secondunit } = response.data;
            setFirstunit(Firstunit);
            setNumValue(NumValue);
            setSecondunit(Secondunit);
            setcompdeleteModalVisible(true);
          } else {
            console.error('Failed to fetch unit details:', response.data.message);
          }
        } catch (error) {
          console.error('Error fetching unit details:', error);
        }
      }
    };
    if (deletecompUnitId) {
      fetchcompdeleteUnitDetails();
    }
  }, [deletecompUnitId]);

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

  const handleCheckboxChanges = (e) => {
    setColumnVisibilitys({ ...columnVisibilitys, [e.target.name]: e.target.checked });
  };

  const filteredSimpleUnits = simpleUnits.filter(unit =>
    (unit.Symbolname?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
    (unit.Formalname?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
    (unit.QUCname?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
    (unit.Decimalnum?.toLowerCase() ?? '').includes(searchTerm.toLowerCase())
  );

  const filteredCompoundUnits = compoundUnits.filter(unit =>
    (unit.Firstunit?.toLowerCase() ?? '').includes(searchTerms.toLowerCase()) ||
    (unit.NumValue?.toLowerCase() ?? '').includes(searchTerms.toLowerCase()) ||
    (unit.Secondunit?.toLowerCase() ?? '').includes(searchTerms.toLowerCase()) 
  );

  const indexOfLastUnit = currentPage * pageSize;
  const indexOfFirstUnit = indexOfLastUnit - pageSize;
  const currentUnits = filteredSimpleUnits.slice(indexOfFirstUnit, indexOfLastUnit);

  const indexOfLastUnits = currentPage * pageSize;
  const indexOfFirstUnits = indexOfLastUnits - pageSize;
  const currentUnitss = filteredCompoundUnits.slice(indexOfFirstUnits, indexOfLastUnits);




  const Simplecolumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', visible: columnVisibility.id },
    { title: 'Symbol Name', dataIndex: 'Symbolname', key: 'Symbolname', visible: columnVisibility.Symbolname },
    { title: 'Formal Name', dataIndex: 'Formalname', key: 'Formalname', visible: columnVisibility.Formalname },
    { title: 'QUC Name', dataIndex: 'QUCname', key: 'QUCname', visible: columnVisibility.QUCname },
    { title: 'Decimal Number', dataIndex: 'Decimalnum', key: 'Decimalnum', visible: columnVisibility.Decimalnum },
    {
      title: 'Action',
      key: 'action',
      visible: columnVisibility.action,
      render: (_, record) => (
        <div className="btn-unit" role="unit" aria-label="Actions">
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

  const Compoundcolumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', visible: columnVisibilitys.id },
    { title: 'First Unit', dataIndex: 'Firstunit', key: 'Firstunit', visible: columnVisibilitys.Firstunit },
    { title: 'Value', dataIndex: 'NumValue', key: 'NumValue', visible: columnVisibilitys.NumValue },
    { title: 'Second Unit', dataIndex: 'Secondunit', key: 'Secondunit', visible: columnVisibilitys.Secondunit },
    {
      title: 'Action',
      key: 'action',
      visible: columnVisibilitys.action,
      render: (_, record) => (
        <div className="btn-unit" role="unit" aria-label="Actions">
          <Button
            type="default"
            className="edit-button"
            onClick={() => opencompEditModal(record.id)}
          >
            Edit
          </Button>
          <Button
            type="default"
            className="delete-button mr-2"
            onClick={() => opencompdeleteModal(record.id)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ].filter(column => column.visible);



  const openEditModal = (unitId) => {
    // Find the unit by its ID from the list of simpleUnits or compoundUnits
    const unit = [...simpleUnits].find(unit => unit.id === unitId);

    if (unit) {
        // Update state with the details of the unit
        setEditUnitId(unitId);
        setSymbolname(unit.Symbolname);
        setFormalname(unit.Formalname);
        setQUCname(unit.QUCname);
        setDecimalnum(unit.Decimalnum);
        setEditModalVisible(true);
    } else {
        console.error('Unit not found:', unitId);
    }
};

const opencompEditModal = (unitId) => {
  // Find the unit by its ID from the list of simpleUnits or compoundUnits
  const unit = [...compoundUnits].find(unit => unit.id === unitId);

  if (unit) {
      // Update state with the details of the unit
      setcompEditUnitId(unitId);
      setFirstunit(unit.Firstunit);
      setNumValue(unit.NumValue);
      setSecondunit(unit.Secondunit);
      setcompEditModalVisible(true);
  } else {
      console.error('Unit not found:', unitId);
  }
};

  const closeEditModal = () => {
    setEditUnitId(null);
    setEditModalVisible(false);
  };

  const closecompEditModal = () => {
    setcompEditUnitId(null);
    setcompEditModalVisible(false);
  };


  const opendeleteModal = (unitId) => {
    // Find the unit by its ID from the list of simpleUnits or compoundUnits
    const unit = [...simpleUnits].find(unit => unit.id === unitId);

    if (unit) {
        // Update state with the details of the unit
        setdeleteUnitId(unitId);
        setdeleteModalVisible(true);
    } else {
        console.error('Unit not found:', unitId);
    }
};

const opencompdeleteModal = (unitId) => {
  // Find the unit by its ID from the list of simpleUnits or compoundUnits
  const unit = [...compoundUnits].find(unit => unit.id === unitId);

  if (unit) {
      // Update state with the details of the unit
      setcompdeleteUnitId(unitId);
      setcompdeleteModalVisible(true);
  } else {
      console.error('Unit not found:', unitId);
  }
};

const closedeleteModal = () => {
  setdeleteUnitId(null);
  setdeleteModalVisible(false);
};

const closecompdeleteModal = () => {
  setcompdeleteUnitId(null);
  setcompdeleteModalVisible(false);
};

  const handleSubmitEdit = async () => {
    try {
      const response = await axios.put('http://localhost:5000/api/Update-Units', {
        Symbolname,
        Formalname,
        QUCname,
        Decimalnum,
        id: editUnitId,
        companyName
      });
  
      if (response.data.success) {
        message.success('Unit updated successfully!');
        refreshUnitsList(); // Ensure these are awaited if they return promises
      //  resetForm(); // Reset form fields
        closeEditModal();
      } else {
        console.error('Failed to update unit:', response.data.message);
        message.error('Update failed: ' + response.data.message);
      }
    } catch (error) {
      console.error('Error updating unit:', error);
      message.error('An error occurred while updating the unit.');
    }
  };


  const handleSubmitdelete = async () => {
    try {
      const response = await axios.put('http://localhost:5000/api/Delete-Units', {
        Symbolname,
        Formalname,
        QUCname,
        Decimalnum,
        id: deleteUnitId,
        companyName
      });
  
      if (response.data.success) {
        message.success('Unit updated successfully!');
        refreshUnitsList(); // Ensure these are awaited if they return promises
      //  resetForm(); // Reset form fields
        closedeleteModal();
      } else {
        console.error('Failed to Deleted unit:', response.data.message);
        message.error('Update failed: ' + response.data.message);
      }
    } catch (error) {
      console.error('Error Deleting unit:', error);
      message.error('An error occurred while Deleting the unit.');
    }
  };



  const handleSubmitcompEdit = async () => {
    try {
      const response = await axios.put('http://localhost:5000/api/Update-compUnits', {
        Firstunit,
        NumValue,
        Secondunit,
        id: editcompUnitId,
        companyName
      });
  
      if (response.data.success) {
        message.success('Compound Unit updated successfully!');
        refreshcompUnitsList();
        //resetForm(); // Reset form fields
        closecompEditModal();
      } else {
        console.error('Failed to update Compound:', response.data.message);
        message.error('Update failed: ' + response.data.message);
      }
    } catch (error) {
      console.error('Error updating Compound:', error);
      message.error('An error occurred while updating the Compound.');
    }
  };


  const handleSubmitcompdelete = async () => {
    try {
      const response = await axios.put('http://localhost:5000/api/Delete-compUnits', {
        Firstunit,
        NumValue,
        Secondunit,
        id: deletecompUnitId,
        companyName
      });
  
      if (response.data.success) {
        message.success('Compound Unit Deleted successfully!');
        refreshcompUnitsList();
        //resetForm(); // Reset form fields
        closecompdeleteModal();
      } else {
        console.error('Failed to Delete Compound:', response.data.message);
        message.error('Update failed: ' + response.data.message);
      }
    } catch (error) {
      console.error('Error Deleting Compound:', error);
      message.error('An error occurred while Deleteing the Compound.');
    }
  };


  const refreshUnitsList = async () => {
    setLoading(true);
    try {
      // Fetch simple units
      const simpleResponse = await axios.get('http://localhost:5000/api/UnitsList', {
        params: {
          companyName,
          page: currentPage,
          limit: pageSize,
        }
      });
      const simpleUnits = simpleResponse.data;

      setSimpleUnits(simpleUnits);
      setLoading(false);
    } catch (err) {
      setError(err);
      setLoading(false);
    }
  };
  const refreshcompUnitsList = async () => {
    setLoading(true);
    try {

      // Fetch compound units
      const compoundResponse = await axios.get('http://localhost:5000/api/CompoundsList', {
        params: {
          companyName,
          page: currentPage,
          limit: pageSize,
        }
      });
      const compoundUnits = compoundResponse.data;

      setCompoundUnits(compoundUnits);
      setLoading(false);
    } catch (err) {
      setError(err);
      setLoading(false);
    }
  };


  const resetForm = () => {
    setSymbolname('');
    setFormalname('');
    setQUCname('');
    setDecimalnum('');
    setFirstunit('');
    setNumValue('');
    setSecondunit('');
  };


  if (loading) return <Spin tip="Loading..." />;
  if (error) return <Alert message="Error" description={error.message} type="error" showIcon />;

 

  const handlePageChangeSimple = (page) => {
    setCurrentPageSimple(page);
  };

  const handlePageChangeCompound = (page) => {
    setCurrentPageCompound(page);
  };


  const pageSizeOptions = ['5', '10', '20', '50'];

  const paginatedSimpleUnits = simpleUnits.slice((currentPageSimple - 1) * pageSize, currentPageSimple * pageSize);
  const paginatedCompoundUnits = compoundUnits.slice((currentPageCompound - 1) * pageSize, currentPageCompound * pageSize);


  return (
    <div className="unit-list">
      <h2>𝑳𝒊𝒔𝒕 𝑶𝒇 𝑼𝒏𝒊𝒕𝒔</h2>

  
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
  
      {/* Simple Units Table */}
      <Input.Search
        className="mb-3"
        placeholder="Search Simple Units Info..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <h3>𝑺𝒊𝒎𝒑𝒍𝒆 𝑼𝒏𝒊𝒕𝒔</h3>
      <Table
        dataSource={paginatedSimpleUnits.filter(unit =>
          (unit.Symbolname?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
          (unit.Formalname?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
          (unit.QUCname?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
          (unit.Decimalnum?.toLowerCase() ?? '').includes(searchTerm.toLowerCase())
        )}
        columns={Simplecolumns}
        pagination={false}
      />

<Pagination
        current={currentPageSimple}
        pageSize={pageSize}
        total={simpleUnits.length}
        onChange={handlePageChangeSimple}
        onShowSizeChange={handlePageSizeChange}
        pageSizeOptions={pageSizeOptions}
        showSizeChanger
        showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
        style={{ marginTop: 20, textAlign: 'right' }}
      />
  
      <Divider />

      
      <Row gutter={[16, 16]}>
        {Object.keys(columnVisibilitys).map((key) => (
          <Col key={key}>
            <Checkbox
              name={key}
              checked={columnVisibilitys[key]}
              onChange={handleCheckboxChanges}
            >
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </Checkbox>
          </Col>
        ))}
      </Row>

      <Divider />
  
      {/* Compound Units Table */}
      <Input.Search
        className="mb-3"
        placeholder="Search Compounds Units Info..."
        value={searchTerms}
        onChange={(e) => setSearchTerms(e.target.value)}
      />
      
      <h3>𝑪𝒐𝒎𝒑𝒐𝒖𝒏𝒅 𝑼𝒏𝒊𝒕𝒔</h3>
      <Table
         dataSource={paginatedCompoundUnits.filter(unit =>
          (unit.Firstunit?.toLowerCase() ?? '').includes(searchTerms.toLowerCase()) ||
          (unit.NumValue?.toLowerCase() ?? '').includes(searchTerms.toLowerCase()) ||
          (unit.Secondunit?.toLowerCase() ?? '').includes(searchTerms.toLowerCase()) 
        )}
        columns={Compoundcolumns}
        pagination={false}
      />
  
  <Pagination
        current={currentPageCompound}
        pageSize={pageSize}
        total={compoundUnits.length}
        onChange={handlePageChangeCompound}
        onShowSizeChange={handlePageSizeChange}
        pageSizeOptions={pageSizeOptions}
        showSizeChanger
        showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
        style={{ marginTop: 20, textAlign: 'right' }}
      />
  
      <Modal
        className="custom-modal"  // Apply custom class
        title={`Edit Unit ID: ${editUnitId}`}
        visible={editModalVisible}
        onCancel={closeEditModal}
        footer={[
          <Button key="cancel" onClick={closeEditModal}>Cancel</Button>,
          <Button key="submit" type="primary" onClick={handleSubmitEdit}>Update</Button>,
        ]}
      >
        <Form layout="vertical">
          <Form.Item label="Symbol Name">
            <Input value={Symbolname} onChange={(e) => setSymbolname(e.target.value)} />
          </Form.Item>
          <Form.Item label="Formal Name">
            <Input value={Formalname} onChange={(e) => setFormalname(e.target.value)} />
          </Form.Item>
          <Form.Item label="QUC Name">
            <Input value={QUCname} onChange={(e) => setQUCname(e.target.value)} />
          </Form.Item>
          <Form.Item label="Decimal Number">
            <Input value={Decimalnum} onChange={(e) => setDecimalnum(e.target.value)} />
          </Form.Item>
        </Form>
      </Modal>

      
  <Modal
  className="custom-modal"  // Apply custom class
  title={`Delete Unit ID: ${deleteUnitId}?`}
  visible={deleteModalVisible}
  onCancel={closedeleteModal}
  footer={[
    <Button key="cancel" onClick={closedeleteModal}>Cancel</Button>,
    <Button key="submit" type="primary" onClick={handleSubmitdelete}>OK</Button>,
  ]}
>
   Are you sure you want to delete ?
</Modal>

      <Modal
        className="custom-modal"  // Apply custom class
        title={`Edit Unit ID: ${editcompUnitId}`}
        visible={editcompModalVisible}
        onCancel={closecompEditModal}
        footer={[
          <Button key="cancel" onClick={closecompEditModal}>Cancel</Button>,
          <Button key="submit" type="primary" onClick={handleSubmitcompEdit}>Update</Button>,
        ]}
      >
        <Form layout="vertical">
          <Form.Item label="First Unit">
            <Input value={Firstunit} onChange={(e) => setFirstunit(e.target.value)} />
          </Form.Item>
          <Form.Item label="Value">
            <Input value={NumValue} onChange={(e) => setNumValue(e.target.value)} />
          </Form.Item>
          <Form.Item label="Secound unit">
            <Input value={Secondunit} onChange={(e) => setSecondunit(e.target.value)} />
          </Form.Item>
          </Form>
      </Modal>
      <Modal
        className="custom-modal"  // Apply custom class
        title={`Delete Unit ID: ${deletecompUnitId}?`}
        visible={deletecompModalVisible}
        onCancel={closecompdeleteModal}
        footer={[
          <Button key="cancel" onClick={closecompdeleteModal}>Cancel</Button>,
          <Button key="submit" type="primary" onClick={handleSubmitcompdelete}>OK</Button>,
        ]}
        >
   Are you sure you want to delete ?
      </Modal>
      <Divider />
    </div>
  );
}

  UnitsList.propTypes = {
    onSelectUnit: PropTypes.func
  };
  
  export default UnitsList;
  


