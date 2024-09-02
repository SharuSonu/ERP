import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import LedgerForm from '../Forms/Ledger/LedgerForm';
import '../../styles/content.css';
import QuoteCreationForm from '../Forms/Quote/QuoteCreationForm';
import StockItemForm from '../Forms/StockItem/StockItemForm';
import StockItemDetail from '../Forms/StockItem/StockItemDetail';
import UnitsCreationForm from '../Forms/Units/UnitsForm';
import StockGroupForm from '../Forms/StockGroup/StockGroup';
import GroupForm from '../Forms/Group/GroupForm';
import StockCategoryForm from '../Forms/StockCategory/StockCategoryForm';
import StockCategoryList from '../Forms/StockCategory/StockCategoryList';
import { useNavigate } from 'react-router-dom';
import {
  BiChevronLeft,
  BiChevronRight
} from 'react-icons/bi';
import VoucherTypeForm from '../Forms/Vouchertype/VouchertypeForm';
import AllInvoicesForm from '../Forms/Invoice/AllInvoices';
import InvoiceForm from '../Forms/Invoice/InvoiceCreation';
import AllQuotesForm from '../Forms/Quote/AllQuotes';
import AllSalesOrderForm from '../Forms/SalesOrder/AllSalesOrder';
import ProductList from '../Forms/StockItem/ProductList';
import PurchaseForm from '../Forms/Purchase/PurchaseForm';
import AllPurchasesForm from '../Forms/Purchase/AllPurchases';
import LedgerList from '../Forms/Ledger/Ledgerlist';
import GroupList from '../Forms/Group/GroupList';
import StockGroupList from '../Forms/StockGroup/StockGroupList';
import Dashboard from '../Forms/Dashboard';
import CompanyParentComponent from '../Forms/CompanyParentComponent';
import StockSummary from '../Forms/StockSummary/StockSummary';
import GodownList from '../Forms/Godown/GodownList';
import GodownForm from '../Forms/Godown/GodownForm';
import PurcOrderForm from '../Forms/PurcOrder/PurcOrderForm';
import AllPurcOrderForm from '../Forms/PurcOrder/AllPurcOrder';
import ReceiptNoteForm from '../Forms/ReceiptNote/ReceiptNoteForm';
import AllReceiptNoteForm from '../Forms/ReceiptNote/AllReceiptNote';

const Content = () => {
  const [currentPage, setCurrentPage] = useState('Dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const navigate = useNavigate();

  const handlePageChange = (pageName) => {
    setCurrentPage(pageName);
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'Dashboard':
        return <Dashboard/>;
      case 'Company':
        return <CompanyParentComponent/>;
      case 'Accounts':
        return <div>Accounts</div>;
      case 'VouchertypeCreation':
        return <VoucherTypeForm />;
      case 'GroupList':
        return <GroupList />;
      case 'StockGroupList':
        return <StockGroupList/>;
      case 'GroupCreation':
        return <GroupForm />;
      case 'Inventory':
        return <div>Inventory</div>;
      case 'UnitsCreation':
        return <UnitsCreationForm />;
      case 'StockItemCreation':
        return <StockItemForm />;
      case 'ProductList':
        return <ProductList/>;
      case 'LedgerList':
        return <LedgerList/>;
      case 'StockGroupCreation':
        return <StockGroupForm />;
      case 'StockCategoryCreation':
        return <StockCategoryForm/>;
        case 'StockCategoryList':
          return <StockCategoryList/>;
      case 'Sales':
        return <div>Sales</div>;
      case 'QuotesCreation':
        return <QuoteCreationForm />;
      case 'InvociesCreation':
          return <InvoiceForm />;
      case 'LedgerCreation':
        return <LedgerForm />;
      case 'PurchaseCreation':
        return <PurchaseForm/>;
      case 'AllPurchases':
        return <AllPurchasesForm/>;
      case 'PurchaseOrdersCreation':
        return <PurcOrderForm/>;
      case 'AllPurcOrderForm':
        return <AllPurcOrderForm/>;

      case 'ReceiptNoteCreation':
        return <ReceiptNoteForm/>;
      case 'ReceiptNote':
        return <AllReceiptNoteForm/>;
      case 'Reports':
        return <div>Reports</div>;
      case 'ALLInvoices':
        return <AllInvoicesForm />;
      case 'AllQuotes':
        return <AllQuotesForm />;
      case 'ALLSalesOrder':
          return <AllSalesOrderForm />;
          case 'GodownCreation':
          return <GodownForm/>;
          case'GodownList':
          return<GodownList/> ;
      case 'StockSummary':
          return <StockSummary/>;
      case 'Help':
        return <div>Help</div>;
      case 'Logout':
        // Navigate to LoginForm
        navigate('/Login');
        // Remove companyName from local storage
        localStorage.removeItem('companyName');
        // Clear companyName in context
        setCompanyName('');
        break;
      default:
        return null;
    }
  };

  return (
    <div className={`content ${isSidebarCollapsed ? 'collapsed' : ''}`}>
      <div className="header-content">
        <Header />
      </div>
      <div className="body-content">
        <div className={`sidebar-body ${isSidebarCollapsed ? 'collapsed' : ''}`}>
          <Sidebar onPageChange={handlePageChange} isSidebarCollapsed={isSidebarCollapsed}/>
        </div>
        <div className={`main-body ${isSidebarCollapsed ? 'collapsed' : ''}`}>
          {renderContent()}
        </div>
      </div>
      <div className={`footer ${isSidebarCollapsed ? 'collapsed' : ''}`} >
      <div className="footer-content"> 
        <div className={`footer-icon`} >
          <div className="menu--toggle" onClick={toggleSidebar}>
            {isSidebarCollapsed ? <BiChevronRight className="icon" /> : <BiChevronLeft className="icon" />}
          </div>
        </div>
        <div className="copyright"><h6>© 2024 SUN IT Solutions Pvt Ltd. All rights reserved.</h6></div>
      </div>
      </div>
    </div>
  );
};

export default Content;
