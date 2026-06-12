import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * @description Route Guard - Redirects unauthorized requests back to login gateway
 */
export default function ProtectedRoute({ children }) {
  const isAuthenticated = localStorage.getItem('token') !== null;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}