import React, { useState, useContext, useEffect } from 'react';
import {
  BiHome,
  BiBookAlt,
  BiSolidReport,
  BiTask,
  BiHelpCircle,
  BiCaretUp,
  BiCaretDown,
  BiLogOut,
  BiMenu,
  BiCog,
  BiUserCircle
} from 'react-icons/bi';

import "../../styles/header.css";
import Header from './Header';
import "../../styles/settings.css";
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { AppContext } from '../../Context/AppContext';
import { message } from 'antd';

const Settings = () => {
    const navigate = useNavigate();

    const handleCloseSettings = () => {
        navigate('/Dashboard');
    };
    const handleAdminSettings = () => {
        if (userName === 'admin') {
        navigate('/Admin');
        }
        else{
            message.warning('Access Denied!');
            
        }
    };
    
    const handleUsersSettings = () => {
        if (userName === 'admin') {
            navigate('/users');
          }
          else{
            message.warning('Access Denied!');
        }
    };

    const handleProductConfigSettings = () => {
        if (userName === 'admin') {
            navigate('/productconfig');
          }
          else{
            message.warning('Access Denied!');
        }
    }

    //TaxesForm
    const handleTaxesSettings = () => {

        if (userName === 'admin') {
            navigate('/Taxes');
          }
          else{

            message.warning('Access Denied!');
        }

    };

    const handleSalesMan = () => {
        if (userName === 'admin') {
            navigate('/SalesManForm');
          }
          else{
            message.warning('Access Denied!');
        }
    };

    const HandleRolesconf = () => {
        if (userName === 'admin') {
            navigate('/Rolesconf');
          }
          else{
            message.warning('Access Denied!');
        }
    };


    const { companyName, setCompanyName } = useContext(AppContext);
    const { userName, setUserName } = useContext(AppContext);

    useEffect(() => {
        const storedCompanyName = localStorage.getItem('companyName');
        if (storedCompanyName) {
          setCompanyName(storedCompanyName);
        }
    
        const storedUserName = localStorage.getItem('userName');
            if (storedUserName) {
                setUserName(storedUserName);
            }
    
      }, []); // Run only once when component mounts
    

    return (
        <div className='app'>        
            
             <Header/>
             <div class="settings-header">
                <div class="settings-title">All Settings</div>
                <div class="settings-search">
                <input type="text" placeholder="Search your settings..." />
                </div>
                <div className="close-settings">
                    <span onClick={handleCloseSettings}>Close Settings</span>
                        <button onClick={handleCloseSettings}>
                        <FontAwesomeIcon icon={faTimes} />
                        </button>
                    </div>

            </div>
            <div className='settings-container'>

                    <div class="settings-grid">
                            <div class="grid-item">
                                <div class="menu-title">Organization</div>
                                    <div class="sub-menu">
                                        <div class="sub-menu-item">Profile</div>
                                        <div class="sub-menu-item">Branding</div>
                                        <div class="sub-menu-item">Currencies</div>
                                        <div class="sub-menu-item">Opening Balance</div>
                                        <div class="sub-menu-item">Manage Subscription</div>
                                    </div>
                           </div>
                
                    <div class="grid-item">
                            <div class="menu-title">Tax & Compilance</div>
                                <div class="sub-menu">
                                    <div class="sub-menu-item" onClick={handleTaxesSettings} style={{cursor: "pointer"}}>Taxes</div>
                                
                                <hr style={{ marginTop: 34 }}/>
                            </div>

                            <div class="menu-title" style={{ marginTop: 10 }}>Admin, Users & Roles</div>
                                <div class="sub-menu">
                                    <div class="sub-menu-item">
                                    <span onClick={handleAdminSettings} style={{cursor: "pointer"}}>Admin</span></div>
                                    <div class="sub-menu-item" onClick={handleUsersSettings} style={{cursor: "pointer"}}>Users</div>
                                    <div class="sub-menu-item"onClick={HandleRolesconf}style={{cursor: "pointer"}}>Roles</div>
                                    <div class="sub-menu-item" onClick={handleSalesMan} style={{cursor: "pointer"}}>SalesMan</div>
                                </div>
                    </div>

                    <div class="grid-item">

                            <div class="menu-title">Preference</div>
                                <div class="sub-menu">
                                    <div class="sub-menu-item">General</div>
                                    <div class="sub-menu-item">Customers and Vendors</div>
                                    <div class="sub-menu-item" onClick={handleProductConfigSettings} style={{cursor: "pointer"}}>Items / Product</div>
                                    <div class="sub-menu-item">Stock Groups</div>
                                    <div class="sub-menu-item">Groups</div>
                            </div>
                    </div>
                
                <div class="grid-item">
                <div class="menu-title">Sales</div>
                <div class="sub-menu">
                    <div class="sub-menu-item">Quotes</div>
                    <div class="sub-menu-item">Sales Orders</div>
                    <div class="sub-menu-item">Delivery Challans</div>
                    <div class="sub-menu-item">Invoices</div>
                    <div class="sub-menu-item">Credit Notes</div>
                    <div class="sub-menu-item">Delivery Notes</div>
                    <div class="sub-menu-item">Packing Slips</div>
                </div>
                </div>
                <div class="grid-item">
                    <div class="menu-title">Purchase</div>
                            <div class="sub-menu">
                            <div class="sub-menu-item">Expenses</div>
                            <div class="sub-menu-item">Bills</div>
                            <div class="sub-menu-item">Purchase Orders</div>
                            <div class="sub-menu-item">Receipt Notes</div>
                </div>

                </div>
                
                <div class="grid-item" style={{ marginBottom: 10 }}>

                            <div class="menu-title">Reminder & Notifications</div>
                                <div class="sub-menu">
                                    <div class="sub-menu-item">Reminders</div>
                                    <div class="sub-menu-item">Email Notifications</div>
                                    <div class="sub-menu-item">SMS Notifications</div>
                            </div>
                </div>

                
            </div>
            
            </div>
        </div>
        
    );
  };

export default Settings;
