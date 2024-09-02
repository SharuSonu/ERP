import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { Upload, Input, Button, message, Divider, Table, Pagination, Modal, Form, DatePicker } from 'antd';
import { AppContext } from '../../../Context/AppContext';
import Header from '../../components/Header';
import { SearchOutlined, UploadOutlined } from '@ant-design/icons';
import ProductCostPrice from './ProductCostPrice';
import SellingPriceForm from './ProductSellingPrice';
import DiscountForm from './ProductDiscountForm';
import moment from 'moment';
import {BASE_URL} from '../../utils/Ipurl';

const ProductConfig = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const { companyName } = useContext(AppContext);
  const [editingProductId, setEditingProductId] = useState(null);
  const [editingType, setEditingType] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [filteredProductsData, setFilteredProductsData] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [viewType, setViewType] = useState(null);
  const [costPrices, setCostPrices] = useState([]);
  const [sellingPrices, setSellingPrices] = useState([]);
  const [discount, setDiscount] = useState([]);
  const [filteredCostPrices, setFilteredCostPrices] = useState([]);
  const [filteredSellingPrices, setFilteredSellingPrices] = useState([]);
  const [filteredDiscount, setFilteredDiscount] = useState([]);

  useEffect(() => {
    if (companyName) {
      fetchProducts();
    }
  }, [companyName]);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/admin-products', {
        params: { companyName }
      });
      setProducts(response.data);
      setFilteredProductsData(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      message.error('Failed to fetch products. Please try again.');
    }
  };

  const handlePageChange = (page, pageSize) => {
    setCurrentPage(page);
    setPageSize(pageSize);
  };

  const handleEdit = (product, type) => {
    setEditingProductId(product.id);
    setSelectedProduct(product);
    setEditingType(type);
    setShowAddModal(true);
  };

  const handleSave = async (updatedData) => {
    try {
      await axios.post('http://localhost:5000/api/update-product', {
        productId: editingProductId,
        type: editingType,
        data: updatedData
      });
      message.success('Product updated successfully!');
      fetchProducts();
      setShowAddModal(false);
    } catch (error) {
      console.error('Error saving product:', error);
      message.error('Failed to save product. Please try again.');
    }
  };

  const handleView = async (record, type) => {
    setSelectedProduct(record);
    setViewType(type);
    if (type === 'costPrices') {
      await fetchCostPrices(record.id);
    }
    else 
    if (type === 'sellingPrice'){
      await fetchSellingPrices(record.id);
    }
    else if(type === 'discount'){
      await fetchDiscount(record.id);
    }
    setShowViewModal(true);
  };

  const fetchCostPrices = async (productId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/product-cost-prices`, {
        params: { productId, companyName }
      });
      if (response.data.success) {
        setCostPrices(response.data.costPrices);
        setFilteredCostPrices(response.data.costPrices); // Ensure filteredCostPrices is initialized correctly
      } else {
        message.error('Failed to fetch cost prices.');
      }
    } catch (error) {
      console.error('Error fetching cost prices:', error);
      message.error('Failed to fetch cost prices. Please try again.');
    }
  };

  const fetchSellingPrices = async (productId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/product-selling-prices`, {
        params: { productId, companyName }
      });
      if (response.data.success) {
        setSellingPrices(response.data.sellingPrices);
        setFilteredSellingPrices(response.data.sellingPrices); // Ensure filteredSellingPrices is initialized correctly
      } else {
        message.error('Failed to fetch selling prices.');
      }
    } catch (error) {
      console.error('Error fetching selling prices:', error);
      message.error('Failed to fetch selling prices. Please try again.');
    }
  };

  const fetchDiscount = async (productId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/product-discount`, {
        params: { productId, companyName }
      });
      if (response.data.success) {
        setDiscount(response.data.discount);
        setFilteredDiscount(response.data.discount); // Ensure filteredDiscount is initialized correctly
      } else {
        message.error('Failed to fetch discount.');
      }
    } catch (error) {
      console.error('Error fetching discount:', error);
      message.error('Failed to fetch discount. Please try again.');
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchText(value);
    const filteredData = products.filter(product => product.name.toLowerCase().includes(value));
    setFilteredProductsData(filteredData);
    setCurrentPage(1);
  };

  const handleModalClose = () => {
    setShowAddModal(false);
    setSelectedProduct(null);
  };

  const handleViewModalClose = () => {
    setShowViewModal(false);
    setSelectedProduct(null);
  };

  const handleDateFilterChange = (dates) => {
    if (dates) {
      const [startDate, endDate] = dates;
      const filteredData = costPrices.filter(price => {
        const date = moment(price.applicableDate);
        return date.isBetween(startDate, endDate, null, '[]');
      });
      setFilteredCostPrices(filteredData);
    } else {
      setFilteredCostPrices(costPrices);
    }
  };

  const costPriceColumns = [
    { title: 'Applicable Date', dataIndex: 'applicableDate', key: 'date', render: date => moment(date).format('YYYY-MM-DD') },
    { title: 'Cost Price', dataIndex: 'costPrice', key: 'price' },
  ];

  const sellingPriceColumns = [
    { title: 'Applicable Date', dataIndex: 'applicableDate', key: 'date', render: date => moment(date).format('YYYY-MM-DD') },
    { title: 'Selling Price', dataIndex: 'sellingPrices', key: 'price' },
    { title: 'UserName', dataIndex: 'userName', key: 'userName' }
  ];

  const discountColumns = [
    { title: 'Applicable Date', dataIndex: 'applicableDate', key: 'date', render: date => moment(date).format('YYYY-MM-DD') },
    { title: 'Discount(%)', dataIndex: 'discount', key: 'discount' },
    { title: 'UserName', dataIndex: 'userName', key: 'userName' },
    { title: 'Limit(%)', dataIndex: 'thresholdValue', key: 'thresholdValue' }
  ];

  const columns = [
    { title: 'Product Name', dataIndex: 'name', key: 'productName' },
    {
      title: 'Cost Prices',
      key: 'costPrices',
      render: (text, record) => (
        <>
          <Button onClick={() => handleEdit(record, 'costPrices')}>
            Add
          </Button>
          <Button type="primary" onClick={() => handleView(record, 'costPrices')} style={{ marginLeft: 8, color: 'white' }}>
            View
          </Button>
        </>
      )
    },
    {
      title: 'Selling Price',
      dataIndex: 'sellingPrice',
      key: 'sellingPrice',
      render: (text, record) => (
        <>
          <Button onClick={() => handleEdit(record, 'sellingPrice')}>
            Add
          </Button>
          <Button type="primary" onClick={() => handleView(record, 'sellingPrice')} style={{ marginLeft: 8, color: 'white' }}>
            View
          </Button>
        </>
      )
    },
    {
      title: 'Enable Standard Discount',
      dataIndex: 'enableStandardDiscount',
      key: 'enableStandardDiscount',
      render: (text, record) => (
        <>
          <Button onClick={() => handleEdit(record, 'discount')}>
            Add
          </Button>
          <Button type="primary" onClick={() => handleView(record, 'discount')} style={{ marginLeft: 8, color: 'white' }}>
            View
          </Button>
        </>
      )
    },
  ];

  const selectedProductTitleStyle = {
    fontWeight: 'bold',
  };

  const handleSubmit = async () => {
    if (!file) {
      message.error('Please select a file to upload');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post(BASE_URL+'/itemimport', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        params: {
          companyName: companyName
        }
      });
      message.success('File uploaded successfully');
      setFile(null);
      
    } catch (error) {
      message.error('Failed to upload file');
    }
  };

  const handleUpload = ({ file }) => {
    setFile(file);
    return false;
  };

  const handleRemove = () => {
    setFile(null);
  };

  return (
    <div className='app'>
      <Header />
      <div className="product-main-container">
        <div className="product-table-section">
          <h2>Product Configuration</h2>
          <div style={{ width: 300, margin: '0 auto' }}>
           Upload Products 
          <Upload beforeUpload={() => false} onRemove={handleRemove} onChange={handleUpload}>
          <Button icon={<UploadOutlined />}> Select File</Button>
          </Upload>
         <Button type="primary" onClick={handleSubmit} style={{ marginTop: 16 }}>
            Upload
          </Button>
          </div>
          <Divider/>
          <Input
            placeholder="Search by Product Name"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={handleSearch}
            style={{ marginBottom: 20 }}
          />
          <Table
            dataSource={filteredProductsData.slice((currentPage - 1) * pageSize, currentPage * pageSize)}
            columns={columns}
            rowKey="productId"
            pagination={false}
          />
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={filteredProductsData.length}
            onChange={handlePageChange}
            showSizeChanger
            pageSizeOptions={['50', '100', '500', '1000', '1500', '2000']}
            showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
            style={{ marginTop: 20, textAlign: 'right' }}
          />
        </div>
      </div>

      <Modal
        title={
          <span style={selectedProduct ? selectedProductTitleStyle : {}}>
            Add {editingType && editingType.charAt(0).toUpperCase() + editingType.slice(1)} - {selectedProduct ? selectedProduct.name : ''}
          </span>
        }
        visible={showAddModal}
        onCancel={handleModalClose}
        footer={[
          <Button key="cancel" onClick={handleModalClose}>
            Cancel
          </Button>,
        ]}
        destroyOnClose={true}
        width={1000}
        className={selectedProduct ? 'selected-product-modal' : ''}
      >
        {selectedProduct && editingType === 'costPrices' && <ProductCostPrice productId={selectedProduct.id} />}
        {selectedProduct && editingType === 'sellingPrice' && <SellingPriceForm productId={selectedProduct.id} />}
        {selectedProduct && editingType === 'discount' && <DiscountForm productId={selectedProduct.id} />}
      </Modal>

      <Modal
        title={
          <span style={selectedProduct ? selectedProductTitleStyle : {}}>
            View {viewType && viewType.charAt(0).toUpperCase() + viewType.slice(1)} - {selectedProduct ? selectedProduct.name : ''}
          </span>
        }
        visible={showViewModal}
        onCancel={handleViewModalClose}
        footer={[
          <Button key="close" onClick={handleViewModalClose}>
            Close
          </Button>,
        ]}
        destroyOnClose={true}
        width={1000}
        className={selectedProduct ? 'selected-product-modal' : ''}
      >
        {selectedProduct && viewType === 'costPrices' && (
          <>
            <Form layout="inline">
              <Form.Item label="Date Range">
                <DatePicker.RangePicker
                  onChange={handleDateFilterChange}
                  format="YYYY-MM-DD"
                />
              </Form.Item>
            </Form>
            <Table
              dataSource={filteredCostPrices}
              columns={costPriceColumns}
              rowKey="id"
              pagination={false}
              style={{ marginTop: 20 }}
            />
          </>
        )}

          {selectedProduct && viewType === 'sellingPrice' && (
          <>
            <Form layout="inline">
              <Form.Item label="Date Range">
                <DatePicker.RangePicker
                  onChange={handleDateFilterChange}
                  format="YYYY-MM-DD"
                />
              </Form.Item>
            </Form>
            <Table
              dataSource={filteredSellingPrices}
              columns={sellingPriceColumns}
              rowKey="id"
              pagination={false}
              style={{ marginTop: 20 }}
            />
          </>
        )} 

        {selectedProduct && viewType === 'discount' && (
          <>
            <Form layout="inline">
              <Form.Item label="Date Range">
                <DatePicker.RangePicker
                  onChange={handleDateFilterChange}
                  format="YYYY-MM-DD"
                />
              </Form.Item>
            </Form>
            <Table
              dataSource={filteredDiscount}
              columns={discountColumns}
              rowKey="id"
              pagination={false}
              style={{ marginTop: 20 }}
            />
          </>
        )}  
      </Modal>
    </div>
  );
};

export default ProductConfig;
