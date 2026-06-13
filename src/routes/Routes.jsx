import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import DashboardLayout from '../components/DashboardLayout';


const Landing = lazy(() => import('../pages/Landing')); 
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Analytics = lazy(() => import('../pages/Analytics'));
const Upload = lazy(() => import('../pages/Upload'));
const Chat = lazy(() => import('../pages/Chat'));
const Admin = lazy(() => import('../pages/Admin'));
const Billing = lazy(() => import('../pages/Billing')); 

const LazyFallback = () => (
  <div className="flex h-[80vh] w-full items-center justify-center bg-transparent">
    <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
  </div>
);

const RequireAuth = ({ children }) => {
  const isAuthenticated = localStorage.getItem('token') !== null;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const RequireAdmin = ({ children }) => {
  const userRole = localStorage.getItem('user_role') || 'user';
  if (userRole !== 'admin') {
    
    return <Navigate to="/app/dashboard" replace />;
  }
  return children;
};

const router = createBrowserRouter([
  {
    
    path: "/",
    element: <Suspense fallback={<LazyFallback />}><Landing /></Suspense>
  },
  {
    path: "/login",
    element: <Login />
  },
  {
    
    path: "/app", 
    element: (
      <RequireAuth>
        <Suspense fallback={<LazyFallback />}>
          <DashboardLayout />
        </Suspense>
      </RequireAuth>
    ),
    children: [
      {
        path: "dashboard", 
        element: <Suspense fallback={<LazyFallback />}><Dashboard /></Suspense>
      },
      {
        path: "analytics",
        element: <Suspense fallback={<LazyFallback />}><Analytics /></Suspense>
      },
      {
        path: "upload",
        element: <Suspense fallback={<LazyFallback />}><Upload /></Suspense>
      },
      {
        path: "chat",
        element: <Suspense fallback={<LazyFallback />}><Chat /></Suspense>
      },
      {
        path: "admin",
        element: <RequireAdmin><Suspense fallback={<LazyFallback />}><Admin /></Suspense></RequireAdmin>
      },
      {
        path: "billing", 
        element: <Suspense fallback={<LazyFallback />}><Billing /></Suspense>
      },
      {
        path: "",
        
        element: <Navigate to="dashboard" replace /> 
      }
    ]
  },
  {
    path: "/*",
    element: <div className="flex h-screen items-center justify-center text-sm font-bold bg-main text-brand-muted font-mono">Error 404: Route Architecture Broken</div>
  }
]);

export default router;