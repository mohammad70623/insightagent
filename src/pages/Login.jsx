import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  return (
    <div className="flex h-screen items-center justify-center bg-main">
      <button onClick={() => { localStorage.setItem('token', 'mock'); navigate('/dashboard'); }} className="btn bg-brand-primary text-black border-none">
        Bypass to Workspace
      </button>
    </div>
  );
}