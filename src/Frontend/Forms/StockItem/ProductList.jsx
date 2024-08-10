import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import { AppContext } from '../../../Context/AppContext';
import { Input, Table, Button, message, Pagination, Divider, Spin } from 'antd';
import '../../../styles/ProductList.css';
import { BASE_URL } from '../../utils/Ipurl';

const ProductList = ({ onSelectProduct }) => {
  const { companyName } = useContext(AppContext);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5); // Number of products per page

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);

      try {
        const response = await axios.get(BASE_URL + '/products', {
          params: {
            companyName: companyName,
          }
        });

        setProducts(response.data);
        setLoading(false);
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };

    fetchProducts();
  }, [companyName]);

  // Handle pagination change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Handle page size change
  const handlePageSizeChange = (current, size) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when page size changes
  };

  // Filter products based on search term
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.partNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.parentGroup.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate pagination values
  const indexOfLastProduct = currentPage * pageSize;
  const indexOfFirstProduct = indexOfLastProduct - pageSize;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);

  // Columns configuration for Ant Design Table
  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Part No', dataIndex: 'partNo', key: 'partNo' },
    { title: 'Category', dataIndex: 'category', key: 'category' },
    { title: 'Brand Name', dataIndex: 'parentGroup', key: 'parentGroup' },
    { title: 'Cost', dataIndex: 'cost', key: 'cost' },
    { title: 'Quantity', dataIndex: 'quantity', key: 'quantity' },
    { title: 'Units', dataIndex: 'units', key: 'units' },
    { title: 'Alternate Units', dataIndex: 'alternateUnits', key: 'alternateUnits' },
    { title: 'GST Applicable', dataIndex: 'gstApplicable', key: 'gstApplicable' },
    { title: 'HSN SAC Details', dataIndex: 'hsnSacDetails', key: 'hsnSacDetails' },
    { title: 'HSN', dataIndex: 'hsn', key: 'hsn' },
    { title: 'Taxability', dataIndex: 'taxability', key: 'taxability' },
    { title: 'GST Rate', dataIndex: 'gstRate', key: 'gstRate' },
    { title: 'Applicable Date', dataIndex: 'applicableDate', key: 'applicableDate' },
    { title: 'Action',
      key: 'action',
      render: (_, record) => (
        <div className="btn-group" role="group" aria-label="Actions">
          <Button
            type="default"
            className="edit-button"
            onClick={() => onSelectProduct(record.id)}
          >
            Edit
          </Button>
          <Button
            type="default"
            className="print-button mr-2"
            onClick={() => console.log(`Delete product with ID: ${record.id}`)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  if (loading) return <Spin size="large" />;
  if (error) return <p>Error: {error.message}</p>;

  const pageSizeOptions = ['5', '10', '20', '50'];
  return (
    <div className="product-list">
      <h2>Product List</h2>

      {/* Search Bar */}
      <Input.Search
        className="mb-3"
        placeholder="Search products, PartNo, Group..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* Product Table */}
      <Table
        dataSource={currentProducts}
        columns={columns}
        pagination={false} // Disable default pagination of Ant Design Table
        rowKey="id"
      />

      {/* Pagination */}
      <Pagination
        current={currentPage}
        pageSize={pageSize}
        total={filteredProducts.length}
        onChange={handlePageChange}
        onShowSizeChange={handlePageSizeChange}
        pageSizeOptions={pageSizeOptions}
        showSizeChanger
        showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
        style={{ marginTop: 20, textAlign: 'right' }}
      />
      <Divider />
    </div>
  );
};

ProductList.propTypes = {
  onSelectProduct: PropTypes.func.isRequired
};

export default ProductList;
