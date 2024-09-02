// Footer.jsx
import React, { useState } from 'react';
import {
  BiHome,
  BiTask,
  BiSolidReport,
  BiHelpCircle,
  BiCaretUp,
  BiCaretDown,
  BiLogOut,
  BiMenu,
  BiPlus,
  BiChevronLeft,
  BiChevronRight
} from 'react-icons/bi';
import '../../styles/footer.css';

const Footer = () => {
  return <footer className="footer">
    <div className="menu--toggle" onClick={toggleSidebar}>
        {isCollapsed ? <BiChevronRight className="icon" /> : <BiChevronLeft className="icon" />}
      </div>

  </footer>;
};

export default Footer;
