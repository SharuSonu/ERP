import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import { AppContext } from '../../../Context/AppContext';
import { Table, Divider, Pagination, DatePicker, Input, Button, message, Alert } from 'antd';
import moment from 'moment';

const { RangePicker } = DatePicker;
const { Search } = Input;

const StockSummary = () => {
  const { companyName } = useContext(AppContext);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [period, setPeriod] = useState([]);//useState([moment().startOf('month'), moment().endOf('month')]);
  const [searchText, setSearchText] = useState('');
  const pageSizeOptions = ['10', '50', '100', '500'];

  useEffect(() => {
    fetchStockSummary();
  }, [companyName, currentPage, pageSize, period, searchText]);

  const fetchStockSummary = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/stock-summary', {
        params: {
          companyName,
          page: currentPage,
          limit: pageSize,
          periodFrom: period[0].format('YYYY-MM-DD'),
          periodTo: period[1].format('YYYY-MM-DD'),
        },
      });

      let data = response.data.data;
      if (data.length === 0) {
        const latestResponse = await axios.get('http://localhost:5000/api/stock-summary/latest', {
          params: { companyName },
        });
        data = latestResponse.data.data;
      }

      const updatedData = updateBalances(data);
      //updating the latest modified stock summary for latest record
      //await updateDatabase(updatedData); 
      setProducts(updatedData);
      setLoading(false);
    } catch (err) {
      setError(err);
      setLoading(false);
    }
  };

  const updateBalances = (data) => {
    // Initialize cumulative balances
    let cumulativeBalances = {};
  
    // Iterate over each item in the data array
    return data.map((item, index) => {
      const itemName = item.name;
  
      // Determine if to use previous cumulative balance or initial balance for this item
      const openingBalanceQty = cumulativeBalances[itemName]?.closingBalance.quantity || item['openingBalance.quantity'];
      const openingBalanceAmount = cumulativeBalances[itemName]?.closingBalance.amount || item['openingBalance.amount'];
  
      const inwardsQty = item['inwards.quantity'];
      const inwardsAmount = parseFloat(item['inwards.amount']).toFixed(2);
      const inwardsRate = inwardsQty !== 0 ? inwardsAmount / inwardsQty : 0;

      const outwardsQty = item['outwards.quantity'];
      const outwardsAmount = parseFloat(item['outwards.amount']).toFixed(2);
      const outwardsRate = outwardsQty !== 0 ? outwardsAmount / outwardsQty : 0;


      // Calculate closing balance for the current item
      const closingBalanceQty = openingBalanceQty + item['inwards.quantity'] - item['outwards.quantity'];
      const closingBalanceAmount = openingBalanceAmount + item['inwards.amount'] - item['outwards.amount'];

      const closingBalanceRate = closingBalanceQty !== 0 ? closingBalanceAmount / closingBalanceQty : 0;
      const openingBalanceRate = openingBalanceQty !== 0 ? openingBalanceAmount / openingBalanceQty : 0;
 
  
      // Update cumulative balances for the current item
      cumulativeBalances[itemName] = {
        closingBalance: {
          quantity: closingBalanceQty,
          amount: closingBalanceAmount,
        }
      };
  
      // Return updated item with correct balances
      return {
        ...item,
        'openingBalance.quantity': openingBalanceQty,
        'openingBalance.amount': parseFloat(openingBalanceAmount).toFixed(2),
        'openingBalance.rate': parseFloat(openingBalanceRate).toFixed(2),
        'inwards.rate': parseFloat(inwardsRate).toFixed(2),
        'outwards.rate': parseFloat(outwardsRate).toFixed(2),
        'inwards.amount': inwardsAmount,
        'outwards.amount': outwardsAmount,
        'closingBalance.quantity': closingBalanceQty,
        'closingBalance.amount': parseFloat(closingBalanceAmount).toFixed(2),
        'closingBalance.rate': parseFloat(closingBalanceRate).toFixed(2),
      };
    });
  };
  
  const updateDatabase = async (data) => {
    try {
      await axios.post('http://localhost:5000/api/stock-summary/update', data);
      message.success('Database updated successfully');
    } catch (error) {
      console.error('Error updating database:', error);
      message.error('Failed to update database');
    }
  };

  const handlePageChange = (page, pageSize) => {
    setCurrentPage(page);
    setPageSize(pageSize);
  };

  const handlePageSizeChange = (current, size) => {
    setCurrentPage(1);
    setPageSize(size);
  };

  const handlePeriodChange = (dates) => {
    setPeriod(dates||'');
    setCurrentPage(1);
  };

  const handleSearch = (value) => {
    setSearchText(value);
    setCurrentPage(1);
  };

  const filteredProducts = searchText
    ? products.filter(item => item.name.toLowerCase().includes(searchText.toLowerCase()))
    : products;

  const columns = [
    {
      title: 'Particulars',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Opening Balance',
      children: [
        {
          title: 'Quantity',
          dataIndex: 'openingBalance.quantity',
          key: 'openingBalanceQuantity',
        },
        {
          title: 'Rate',
          dataIndex: 'openingBalance.rate',
          key: 'openingBalanceRate',
        },
        {
          title: 'Amount',
          dataIndex: 'openingBalance.amount',
          key: 'openingBalanceAmount',
        },
      ],
    },
    {
      title: 'Inwards',
      children: [
        {
          title: 'Quantity',
          dataIndex: 'inwards.quantity',
          key: 'inwardsQuantity',
        },
        {
          title: 'Rate',
          dataIndex: 'inwards.rate',
          key: 'inwardsRate',
        },
        {
          title: 'Amount',
          dataIndex: 'inwards.amount',
          key: 'inwardsAmount',
        },
      ],
    },
    {
      title: 'Outwards',
      children: [
        {
          title: 'Quantity',
          dataIndex: 'outwards.quantity',
          key: 'outwardsQuantity',
        },
        {
          title: 'Rate',
          dataIndex: 'outwards.rate',
          key: 'outwardsRate',
        },
        {
          title: 'Amount',
          dataIndex: 'outwards.amount',
          key: 'outwardsAmount',
        },
      ],
    },
    {
      title: 'Closing Balance',
      children: [
        {
          title: 'Quantity',
          dataIndex: 'closingBalance.quantity',
          key: 'closingBalanceQuantity',
        },
        {
          title: 'Rate',
          dataIndex: 'closingBalance.rate',
          key: 'closingBalanceRate',
        },
        {
          title: 'Amount',
          dataIndex: 'closingBalance.amount',
          key: 'closingBalanceAmount',
        },
      ],
    },
  ];

  return (
    <div>
      <h1>Stock Summary</h1>
      <RangePicker
        value={period}
        onChange={handlePeriodChange}
        format="YYYY-MM-DD"
        style={{ marginBottom: 20 }}
      />
      <Search
        placeholder="Search Particulars"
        onChange={(e) => setSearchText(e.target.value)}
        onSearch={handleSearch}
        value={searchText}
        style={{ width: 500, marginBottom: 20 }}
      />
      {filteredProducts.length === 0 && !loading && (
        <Alert
          message="No data available for the selected period"
          type="info"
          showIcon
          style={{ marginBottom: 20 }}
        />
      )}
      <Table
        dataSource={filteredProducts}
        columns={columns}
        loading={loading}
        rowKey="name"
        pagination={false}
      />
      <Divider />
      <Pagination
        current={currentPage}
        pageSize={pageSize}
        total={filteredProducts.length}
        onChange={handlePageChange}
        showSizeChanger
        pageSizeOptions={pageSizeOptions}
        onShowSizeChange={handlePageSizeChange}
        style={{ marginTop: 20, textAlign: 'right' }}
      />
      <Divider></Divider>
    </div>
    
  );
};

StockSummary.propTypes = {
  companyName: PropTypes.string,
};

export default StockSummary;
