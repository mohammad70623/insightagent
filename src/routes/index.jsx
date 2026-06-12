import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import ProtectedRoute from './ProtectedRoute';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      
      {/* Enterprise Workspace (Protected) */}
      <Route 
        path="/dashboard" 
        element = {
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />

      {/* Fallback Catch-All Route */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}