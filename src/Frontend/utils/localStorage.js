// utils/localStorage.js
export const getActiveCompanyName = () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem('companyName') || 'default_company';
    } else {
      return 'default_company'; // Fallback if localStorage is not available
    }
  };


  export const getActiveUser = () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem('userName');
    } else {
      return 'demo'; // Fallback if localStorage is not available
    }
  };
  