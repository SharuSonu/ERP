import React, { useState } from 'react';
import { Table, Form, Button, Modal, Switch } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import AdminForm from './AdminForm'; // Adjust the import path as per your file structure
import { useNavigate } from 'react-router-dom';

const AdminTable = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([
    {
      key: '1',
      name: 'Admin',
      surname: '', // Add surname if needed
      email: 'admin', // Default email
      role: 'owner', // Account Owner role
      enabled: true, // Enabled by default
    },
  ]);

  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);

  const columns = [
    {
      title: 'First Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Last Name',
      dataIndex: 'surname', // Adjust dataIndex if surname is added to data structure
      key: 'surname',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
    },
    {
      title: 'Enabled',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (text, record) => (
        <Switch checked={record.enabled} />
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (text, record) => (
        <Button onClick={() => showEditModal(record)}>Edit</Button>
      ),
    },
  ];

  const showEditModal = (record) => {
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleOk = () => {
    form.validateFields().then(values => {
      setData(data.map(item => item.key === values.key ? values : item));
      setIsModalVisible(false);
    });
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const navigatetodashboard = ()=> {
      navigate('/Dashboard');
  }

  return (
    <>
      <Button type="primary" onClick={() => setIsModalVisible(true)}>Add Admin</Button>
      <Button onClick={navigatetodashboard}>Back</Button>
      <Table columns={columns} dataSource={data} rowKey="key" />
      <Modal
        title="Admin Form"
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <Form form={form} layout="vertical">
          <AdminForm form={form} />
        </Form>
      </Modal>
    </>
  );
};

export default AdminTable;
