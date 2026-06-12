import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Upload from '../pages/Upload';
import Chat from '../pages/Chat';
import Analytics from '../pages/Analytics'; 
import DashboardLayout from '../components/DashboardLayout';

const ProtectedLoader = () => {
  const isAuthenticated = localStorage.getItem('token') !== null;
  if (!isAuthenticated) {
    throw new Response("Unauthorized", { status: 401 });
  }
  return null;
};

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />
  },
  {
    path: "/",
    element: <DashboardLayout />,
    loader: ProtectedLoader,
    errorElement: <Navigate to="/login" replace />,
    children: [
      {
        path: "dashboard",
        element: <Dashboard />
      },
      {
        path: "analytics", 
        element: <Analytics />
      },
      {
        path: "upload",
        element: <Upload />
      },
      {
        path: "chat",
        element: <Chat />
      },
      {
        path: "",
        element: <Navigate to="/dashboard" replace />
      }
    ]
  },
  {
    path: "/*",
    element: <div className="flex h-screen items-center justify-center text-xl font-bold bg-main">Error 404: Page Not Found</div>
  }
]);

export default router;