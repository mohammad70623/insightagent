import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  return (
    <div className="flex h-screen items-center justify-center bg-main">
      <button onClick={() => { localStorage.removeItem('token'); navigate('/login'); }} className="btn btn-error btn-sm">
        Logout
      </button>
    </div>
  );
}