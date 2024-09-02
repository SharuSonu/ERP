// authUtils.js

// Check if the user is authenticated
export const isAuthenticated = () => {
    // Logic to determine if the user is authenticated (e.g., checking for authentication token)
    const authToken = localStorage.getItem('token');
    return !!authToken; // Convert to boolean value
  };
  