// src/context/AppContext.js

import React, { createContext, useState, useEffect } from 'react';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const [companyName, setCompanyName] = useState('');
    const [userName, setUserName] = useState('');

    useEffect(() => {
        const storedCompanyName = localStorage.getItem('companyName');
        if (storedCompanyName) {
          setCompanyName(storedCompanyName);
        }

        const storedUserName = localStorage.getItem('userName');
        if (storedUserName) {
            setUserName(storedUserName);
        }

      }, []);

    return (
        <AppContext.Provider value={{ companyName, setCompanyName , userName, setUserName}}>
            {children}
        </AppContext.Provider>
    );
};
