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
import '../../styles/sidebar.css';

const Sidebar = ({ onPageChange, isSidebarCollapsed, toggleSidebar }) => {
  const [menuState, setMenuState] = useState({
    mastersOpen: false,
    accountsOpen: false,
    inventoryOpen: false,
    salesOpen: false,
    purchaseOpen: false,
    reportsOpen: false
  });

  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleMenu = (menu) => {
    setMenuState((prevState) => ({
      ...prevState,
      [menu]: !prevState[menu]
    }));
  };

/*
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };*/

  const handlePageChange = (pageName) => {
    onPageChange(pageName);
  };

  return (
    <div className={`menu ${isSidebarCollapsed ? 'collapsed' : ''}`}>
      <div className="menu--list">
        <a href="#" className="item active" onClick={() => handlePageChange('Dashboard')}>
          <BiHome className="icon" />
          {!isSidebarCollapsed && 'Dashboard'}
        </a>
        <a href="#" className="item" onClick={() => handlePageChange('Company')}>
          <BiTask className="icon" />
          {!isSidebarCollapsed && 'Company'}
        </a>
        <div className="item" onClick={() => toggleMenu('mastersOpen')}>
          <BiTask className="icon" />
          {!isSidebarCollapsed && 'Masters'}
          {!isSidebarCollapsed && (menuState.mastersOpen ? <BiCaretUp className="caret-icon" /> : <BiCaretDown className="caret-icon" />)}
        </div>
        {menuState.mastersOpen && !isSidebarCollapsed && (
          <div className="submenu">
            <a href="#" className="submenu-item" onClick={() => toggleMenu('accountsOpen')}>
              Accounts
              {menuState.accountsOpen ? <BiCaretUp className="submenu-caret-icon" /> : <BiCaretDown className="submenu-caret-icon" />}
            </a>
            {menuState.accountsOpen && (
              <div className="submenu">
                <a href="#" className="submenu-item" onClick={() => handlePageChange('GroupList')}>
                  Group <BiPlus className="plus-icon" onClick={(e) => { e.stopPropagation(); handlePageChange('GroupCreation'); }} />
                </a>
                <a href="#" className="submenu-item" onClick={() => handlePageChange('LedgerList')}>
                  Ledger <BiPlus className="plus-icon" onClick={(e) => { e.stopPropagation(); handlePageChange('LedgerCreation'); }} />
                </a>
                <a href="#" className="submenu-item" onClick={() => handlePageChange('Currency')}>
                  Currency <BiPlus className="plus-icon" onClick={(e) => { e.stopPropagation(); handlePageChange('CurrencyCreation'); }} />
                </a>
                <a href="#" className="submenu-item" onClick={() => handlePageChange('VoucherType')}>
                  Voucher Type <BiPlus className="plus-icon" onClick={(e) => { e.stopPropagation(); handlePageChange('VouchertypeCreation'); }} />
                </a>
              </div>
            )}
            <a href="#" className="submenu-item" onClick={() => toggleMenu('inventoryOpen')}>
              Inventory
              {menuState.inventoryOpen ? <BiCaretUp className="submenu-caret-icon" /> : <BiCaretDown className="submenu-caret-icon" />}
            </a>
            {menuState.inventoryOpen && (
              <div className="submenu">
                <a href="#" className="submenu-item" onClick={() => handlePageChange('StockGroupList')}>
                  Stock Group <BiPlus className="plus-icon" onClick={(e) => { e.stopPropagation(); handlePageChange('StockGroupCreation'); }} />
                </a>
                <a href="#" className="submenu-item" onClick={() => handlePageChange('StockCategoryList')}>
                  Stock Category <BiPlus className="plus-icon" onClick={(e) => { e.stopPropagation(); handlePageChange('StockCategoryCreation'); }} />
                </a>
                <a href="#" className="submenu-item" onClick={() => handlePageChange('ProductList')}>
                  Stock Item <BiPlus className="plus-icon" onClick={(e) => { e.stopPropagation(); handlePageChange('StockItemCreation'); }} />
                </a>
                <a href="#" className="submenu-item" onClick={() => handlePageChange('Unit')}>
                  Unit <BiPlus className="plus-icon" onClick={(e) => { e.stopPropagation(); handlePageChange('UnitsCreation'); }} />
                </a>
                <a href="#" className="submenu-item" onClick={() => handlePageChange('GodownList')}>
                  Godown <BiPlus className="plus-icon" onClick={(e) => { e.stopPropagation(); handlePageChange('GodownCreation'); }} />
                </a>
              </div>
            )}
          </div>
        )}
        <div className="item" onClick={() => toggleMenu('salesOpen')}>
          <BiTask className="icon" />
          {!isSidebarCollapsed && 'Sales'}
          {!isSidebarCollapsed && (menuState.salesOpen ? <BiCaretUp className="caret-icon" /> : <BiCaretDown className="caret-icon" />)}
        </div>
        {menuState.salesOpen && !isSidebarCollapsed && (
          <div className="submenu">
            <a href="#" className="submenu-item" onClick={() => handlePageChange('LedgerList')}>
              Buyers <BiPlus className="plus-icon" onClick={(e) => { e.stopPropagation(); handlePageChange('LedgerCreation'); }} />
            </a>
            <a href="#" className="submenu-item" onClick={() => handlePageChange('AllQuotes')}>
              Quotes <BiPlus className="plus-icon" onClick={(e) => { e.stopPropagation(); handlePageChange('QuotesCreation'); }} />
            </a>
             {/*<a href="#" className="submenu-item" onClick={() => handlePageChange('ALLSalesOrder')}>
              Sales Orders <BiPlus className="plus-icon" onClick={(e) => { e.stopPropagation(); handlePageChange('SalesOrdrersCreation'); }} />
            </a>*/}
            <a href="#" className="submenu-item" onClick={() => handlePageChange('DeliveryChallans')}>
              Delivery Challans <BiPlus className="plus-icon" onClick={(e) => { e.stopPropagation(); handlePageChange('DeliveryChallansCreation'); }} />
            </a>
            <a href="#" className="submenu-item" onClick={() => handlePageChange('ALLInvoices')}>
              Invoices <BiPlus className="plus-icon" onClick={(e) => { e.stopPropagation(); handlePageChange('InvociesCreation'); }} />
            </a>
            <a href="#" className="submenu-item" onClick={() => handlePageChange('CreditNotes')}>
              Credit Notes <BiPlus className="plus-icon" onClick={(e) => { e.stopPropagation(); handlePageChange('CreditNotesCreation'); }} />
            </a>
            <a href="#" className="submenu-item" onClick={() => handlePageChange('DeliveryNotes')}>
              Delivery Notes <BiPlus className="plus-icon" onClick={(e) => { e.stopPropagation(); handlePageChange('DeliveryNotesCreation'); }} />
            </a>
            {/*<a href="#" className="submenu-item" onClick={() => handlePageChange('PackingSlips')}>
              Packing Slips <BiPlus className="plus-icon" onClick={(e) => { e.stopPropagation(); handlePageChange('PackingSlipsCreation'); }} />
            </a>*/}
          </div>
        )}
        <div className="item" onClick={() => toggleMenu('purchaseOpen')}>
          <BiTask className="icon" />
          {!isSidebarCollapsed && 'Purchase'}
          {!isSidebarCollapsed && (menuState.purchaseOpen ? <BiCaretUp className="caret-icon" /> : <BiCaretDown className="caret-icon" />)}
        </div>
        {menuState.purchaseOpen && !isSidebarCollapsed && (
          <div className="submenu">
            <a href="#" className="submenu-item" onClick={() => handlePageChange('LedgerList')}>
              Vendors <BiPlus className="plus-icon" onClick={(e) => { e.stopPropagation(); handlePageChange('LedgerCreation'); }} />
            </a>
            <a href="#" className="submenu-item" onClick={() => handlePageChange('AllPurcOrderForm')}>
              Purchase Orders <BiPlus className="plus-icon" onClick={(e) => { e.stopPropagation(); handlePageChange('PurchaseOrdersCreation'); }} />
            </a>
            <a href="#" className="submenu-item" onClick={() => handlePageChange('AllPurchases')}>
              Bills <BiPlus className="plus-icon" onClick={(e) => { e.stopPropagation(); handlePageChange('PurchaseCreation'); }} />
            </a>
            <a href="#" className="submenu-item" onClick={() => handlePageChange('Expenses')}>
              Expenses <BiPlus className="plus-icon" onClick={(e) => { e.stopPropagation(); handlePageChange('ExpensesCreation'); }} />
            </a>
            <a href="#" className="submenu-item" onClick={() => handlePageChange('ReceiptNote')}>
              Receipt Note <BiPlus className="plus-icon" onClick={(e) => { e.stopPropagation(); handlePageChange('ReceiptNoteCreation'); }} />
            </a>
            <a href="#" className="submenu-item" onClick={() => handlePageChange('PaymentMade')}>
              Payment Made <BiPlus className="plus-icon" onClick={(e) => { e.stopPropagation(); handlePageChange('PaymentMadeCreation'); }} />
            </a>
          </div>
        )}
        <div className="item" onClick={() => toggleMenu('reportsOpen')}>
          <BiSolidReport className="icon" />
          {!isSidebarCollapsed && 'Reports'}
          {!isSidebarCollapsed && (menuState.reportsOpen ? <BiCaretUp className="caret-icon" /> : <BiCaretDown className="caret-icon" />)}
        </div>
        {menuState.reportsOpen && !isSidebarCollapsed && (
          <div className="submenu">
            <a href="#" className="submenu-item" onClick={() => handlePageChange('StockSummary')}>
              Stock Summary <BiPlus className="plus-icon" onClick={(e) => { e.stopPropagation(); handlePageChange('StockSummary'); }} />
            </a>
            <a href="#" className="submenu-item" onClick={() => handlePageChange('Daybook')}>
              Daybook <BiPlus className="plus-icon" onClick={(e) => { e.stopPropagation(); handlePageChange('Daybook'); }} />
            </a>
            <a href="#" className="submenu-item" onClick={() => handlePageChange('ALLInvoices')}>
              Sales Register <BiPlus className="plus-icon" onClick={(e) => { e.stopPropagation(); handlePageChange('SalesRegister'); }} />
            </a>
            
          </div>
        )}
        <a href="#" className="item" onClick={() => handlePageChange('Help')}>
          <BiHelpCircle className="icon" />
          {!isSidebarCollapsed && 'Help'}
        </a>
        <a href="#" className="item" onClick={() => handlePageChange('Logout')}>
          <BiLogOut className="icon" />
          {!isSidebarCollapsed && 'Logout'}
        </a>
      </div>
      
    </div>
  );
};

export default Sidebar;
