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
import { useNavigate } from 'react-router-dom';
import Settings from './Settings';
import { AppContext } from '../../Context/AppContext';

const Header = () => {
  const { companyName, setCompanyName } = useContext(AppContext);
  const { userName, setUserName } = useContext(AppContext);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();

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

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  //Settings Page
  const goToSettingsPage = () => {
    navigate('/Settings'); // Navigate to settings page
  };

  return (
    <header className="header">
      <div className="logo">
        <BiBookAlt className="logo-icon" />
        {!isCollapsed && <h3>Sun IT <span> Solutions</span></h3>}
        <BiMenu className="collapse-icon" />
        <div className="search-box">
          <input type="text" placeholder="Search..." />
        </div>
      </div>

      <div className="header-right">
        <div className="login-company">{companyName}</div>
        <BiUserCircle className="user-icon" />
        <div className="login-user">{userName}</div>
        <BiCog className="settings-icon" onClick={goToSettingsPage} />
      </div>
    </header>
  );
};

export default Header;
