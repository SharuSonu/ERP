import React, { useState, useEffect, useContext } from 'react';
import { Row, Col, Card, Statistic, Spin, message, Table } from 'antd';
import { AppContext } from '../../Context/AppContext';
import { BASE_URL } from '../utils/Ipurl';
import '../../styles/Dashboard.css';
import axios from 'axios';
import { PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const { companyName } = useContext(AppContext);
  const [sales, setSales] = useState(0);
  const [purchases, setPurchases] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [PiechartData, setPieChartData] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [topSuppliers, setTopSuppliers] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const salesResponse = await axios.get(BASE_URL + '/dashboard-sales', {
          params: { companyName },
        });
        setSales(salesResponse.data.dashboardSales);

        const purchasesResponse = await axios.get(BASE_URL + '/dashboard-purchase', {
          params: { companyName },
        });
        setPurchases(purchasesResponse.data.dashboardPurchase);

        const chartResponse = await axios.get(BASE_URL + '/dashboard-chart-data', {
          params: { companyName },
        });
        setChartData(chartResponse.data.chartData);
        setLoading(false);
        /*
        const piechartResponse = await axios.get(BASE_URL + '/dashboard-piechart-data', {
            params: { companyName },
          });
          setPieChartData(piechartResponse.data.chartData);
          setLoading(false);*/

          // Fetch Top Customers
          const topCustomersResponse = await axios.get(BASE_URL + '/dashboard-top-customers', {
            params: { companyName },
        });
        setTopCustomers(topCustomersResponse.data.topCustomers);

        // Fetch Top Suppliers
        const topSuppliersResponse = await axios.get(BASE_URL + '/dashboard-top-suppliers', {
            params: { companyName },
        });
        setTopSuppliers(topSuppliersResponse.data.topSuppliers);


        setLoading(false); 

      } catch (err) {
        setError(err);
        setLoading(false);
        message.error('Failed to load dashboard data');
      }
    };

    fetchDashboardData();
  }, [companyName]);

  if (loading) {
    return <Spin size="large" />;
  }

  if (error) {
    return <p>Error: {error.message}</p>;
  }

  const customerColumns = [
    {
      title: 'Customer Name',
      dataIndex: 'customerName',
      key: 'customerName',
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: text => `₹ ${text.toFixed(2)}`,
    },
  ];

  const supplierColumns = [
    {
      title: 'Supplier Name',
      dataIndex: 'supplierName',
      key: 'supplierName',
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: text => `₹ ${text.toFixed(2)}`,
    },
  ];


  return (
    <div className="dashboard-body">
      <Row gutter={16}>
        <Col span={12}>
          <Card>
            <Statistic
              title="Total Sales"
              value={sales}
              precision={2}
              valueStyle={{ color: '#3f8600' }}
              prefix="₹"
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <Statistic
              title="Total Purchases"
              value={purchases}
              precision={2}
              valueStyle={{ color: '#cf1322' }}
              prefix="₹"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 20 }}>
        <Col span={24}>
          <Card title="Sales and Purchases Over Time">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart
                data={chartData}
                margin={{
                  top: 20, right: 30, left: 20, bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sales" stroke="#8884d8" activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="purchases" stroke="#82ca9d" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
      

     {/*         
      {chartData.length > 0 && (
        <Row gutter={16} style={{ marginTop: 20 }}>
          <Col span={24}>
            <Card title="Sales vs Purchases">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Tooltip />
                  <Legend />
                  <Pie
                    data={PiechartData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={80}
                    fill="#8884d8"
                    label
                  />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>
      )}
        */}

<Row gutter={16} style={{ marginTop: 20 }}>
        <Col span={12}>
          <Card title="Top Customers">
            <Table
              columns={customerColumns}
              dataSource={topCustomers}
              pagination={false}
              rowKey="customerName"
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Top Suppliers">
            <Table
              columns={supplierColumns}
              dataSource={topSuppliers}
              pagination={false}
              rowKey="supplierName"
            />
          </Card>
        </Col>
      </Row>        
    </div>
  );
};

export default Dashboard;
