import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Navbar({ title }) {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/');
  }

  return (
    <nav className="navbar">
      <h1>{title}</h1>
      <button className="secondary-button" onClick={handleLogout}>
        Logout
      </button>
    </nav>
  );
}
