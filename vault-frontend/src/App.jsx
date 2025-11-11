import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './LoginPage';
import Dashboard from './Dashboard';
import LoginAdminPage from './LoginAdminPage';
import RegisterPage from './RegisterPage';
import AdminDashboard from './AdminDashboard';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
    setLoading(false);
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={<LoginPage />} 
        />
        <Route
          path="/register"
          element={<RegisterPage />}
        />
        <Route 
          path="/dashboard" 
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/" 
          element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} 
        />
        <Route 
          path="/login-admin"
          element={<LoginAdminPage />}
        />
        <Route
          path="/dashboard-admin"
          element={isAuthenticated ? <AdminDashboard /> : <Navigate to="/login-admin" />} 
        />
      </Routes>
    </Router>
  );
}

export default App;