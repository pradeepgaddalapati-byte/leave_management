import React from "react";
import { useNavigate } from "react-router-dom";

export default function Navbar({ title }) {
  const navigate = useNavigate();

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login", { replace: true });
  }

  return (
    <header className="navbar">
      <h1>{title}</h1>
      <button type="button" className="secondary-button" onClick={logout}>
        Logout
      </button>
    </header>
  );
}
