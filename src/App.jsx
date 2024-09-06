// App.jsx

import React, { useState, useEffect } from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from './Frontend/components/Header'; // Assuming you have a Header component
import Sidebar from './Frontend/components/Sidebar'; // Assuming you have a Sidebar component
import './App.css'; // Assuming you have an App.css file for styling
import store from './store';
import { AppProvider } from './Context/AppContext'; // Import AppProvider
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';


import RegisterForm from './Frontend/Forms/RegisterForm';
import Content from './Frontend/components/Content';
//import Home from './Frontend/pages/Home'; // Assuming you have a Home component
/*<Route path="/" exact component={Home} />*/
import AuthenticatedRoute from './Frontend/utils/AuthenticatedRoute';

import Settings from './Frontend/components/Settings';
import { Footer } from 'antd/es/layout/layout';
import LoginForm from './Frontend/Forms/LoginForm';
import AdminForm from './Frontend/Forms/Admin/AdminForm';
import UserForm from './Frontend/Forms/Users/UserForm';
import Rolesconf from './Frontend/Forms/Roles/Rolesconf';
import TaxesForm from './Frontend/Forms/Taxes/TaxesForm';
import ProductConfig from './Frontend/Forms/StockItem/ProductConfig';
import SalesManForm from './Frontend/Forms/SalesMan/SalesManform';

const App = () => {
  const [pageTitle, setPageTitle] = useState("ERP");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  useEffect(() => {
    document.title = pageTitle;
  }, [pageTitle]);

  

  const toggleMenu = (menu) => {
    setMenuState((prevState) => ({
      ...prevState,
      [menu]: !prevState[menu]
    }));
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };



  return (
    <Provider store={store}>
      <AppProvider>
      <Router>
        <div className='app'>        
          <div className='container'>
            <main className='main-content'>
              <Routes>
                <Route path="/" element={<LoginForm setIsAuthenticated={setIsAuthenticated} />} />
                <Route path="/Register" element={<RegisterForm />} />
                <Route path="/Login" element={<LoginForm setIsAuthenticated={setIsAuthenticated} />} />
                <Route path="/Dashboard" element={<Content />} isAuthenticated={isAuthenticated} />
                <Route path="/Settings" element={<Settings/>} />
                <Route path="/Admin" element={<AdminForm/>} />
                <Route path="/Users" element={<UserForm/>} />
                <Route path="/Taxes" element={<TaxesForm/>} />
                <Route path="/Rolesconf" element={<Rolesconf/>} />
                <Route path="/productconfig" element={<ProductConfig/>} />
                <Route path="/SalesManForm" element={<SalesManForm/>} />
                <Route path="*" element={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <div>
                <FontAwesomeIcon icon={faExclamationTriangle} size="2x" style={{ marginRight: '10px' }} />
                <h1>404 - Page Not Found</h1>
            </div>
        </div>} />
              </Routes>
            </main>

          </div>
        </div>
      </Router>
      </AppProvider>
    </Provider>
  );
};

export default App;
