import React from 'react';
import { Route, Navigate } from 'react-router-dom';

const AuthenticatedRoute = ({ element: Element, ...rest }) => {
  const isAuthenticated = () => {
    const authToken = localStorage.getItem('token');
    return !!authToken; // Convert to boolean value
  };

  return (
    <Route
      {...rest}
      element={isAuthenticated() ? <Element /> : <Navigate to="/Login" replace />}
    />
  );
};

export default AuthenticatedRoute;
