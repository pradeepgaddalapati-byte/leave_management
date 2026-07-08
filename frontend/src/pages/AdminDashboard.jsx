import React from "react";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

import LeaveCard from "../components/LeaveCard.jsx";
import Navbar from "../components/Navbar.jsx";
import api, { getErrorMessage } from "../services/api.js";

const emptyEmployee = {
  name: "",
  email: "",
  password: "",
  total_leaves: 20,
};

const emptyEmployeeEdit = {
  name: "",
  email: "",
  password: "",
};

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [employeeForm, setEmployeeForm] = useState(emptyEmployee);
  const [editingEmployeeId, setEditingEmployeeId] = useState(null);
  const [employeeEditForm, setEmployeeEditForm] = useState(emptyEmployeeEdit);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  async function loadData() {
    const [dashboardResponse, employeeResponse, leaveResponse] = await Promise.all([
      api.get("/admin/dashboard"),
      api.get("/admin/employees"),
      api.get("/admin/leaves"),
    ]);

    setDashboard(dashboardResponse.data);
    setEmployees(employeeResponse.data);
    setLeaves(leaveResponse.data);
  }

  useEffect(() => {
    loadData().catch((err) => setError(getErrorMessage(err)));
  }, []);

  if (!token || role !== "ADMIN") {
    return <Navigate to="/login" replace />;
  }

  function updateField(event) {
    const { name, value } = event.target;
    setEmployeeForm((current) => ({
      ...current,
      [name]: name === "total_leaves" ? Number(value) : value,
    }));
  }

  function updateEditField(event) {
    const { name, value } = event.target;
    setEmployeeEditForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function startEditEmployee(employee) {
    setError("");
    setMessage("");
    setEditingEmployeeId(employee.id);
    setEmployeeEditForm({
      name: employee.name,
      email: employee.email,
      password: "",
    });
  }

  function cancelEditEmployee() {
    setEditingEmployeeId(null);
    setEmployeeEditForm(emptyEmployeeEdit);
  }

  async function createEmployee(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      await api.post("/admin/employees", employeeForm);
      setEmployeeForm(emptyEmployee);
      setMessage("Employee created successfully");
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function saveEmployee(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const payload = {
      name: employeeEditForm.name,
      email: employeeEditForm.email,
    };

    if (employeeEditForm.password) {
      payload.password = employeeEditForm.password;
    }

    try {
      await api.put(`/admin/employees/${editingEmployeeId}`, payload);
      setMessage("Employee updated successfully");
      cancelEditEmployee();
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function deleteEmployee(employee) {
    const shouldDelete = window.confirm(
      `Delete ${employee.name}? This will remove their leave requests too.`
    );

    if (!shouldDelete) {
      return;
    }

    setError("");
    setMessage("");

    try {
      await api.delete(`/admin/employees/${employee.id}`);
      setMessage("Employee deleted successfully");
      if (editingEmployeeId === employee.id) {
        cancelEditEmployee();
      }
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function updateLeave(leaveId, status) {
    setError("");
    setMessage("");

    try {
      await api.put(`/admin/leaves/${leaveId}`, { status });
      setMessage(`Leave ${status.toLowerCase()}`);
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <>
      <Navbar title="Admin Dashboard" />
      <main className="page-shell">
        {error && <p className="notice">{error}</p>}
        {message && <p className="success-text">{message}</p>}

        <section className="stats-grid">
          <Stat label="Employees" value={dashboard?.total_employees ?? 0} />
          <Stat label="Pending Leaves" value={dashboard?.pending_leaves ?? 0} />
          <Stat label="Approved Leaves" value={dashboard?.approved_leaves ?? 0} />
        </section>

        <section className="two-column-layout">
          <div className="card">
            <h2>Create Employee</h2>
            <form className="form-card" onSubmit={createEmployee}>
              <label>
                Name
                <input name="name" value={employeeForm.name} onChange={updateField} required />
              </label>
              <label>
                Email
                <input
                  name="email"
                  type="email"
                  value={employeeForm.email}
                  onChange={updateField}
                  required
                />
              </label>
              <label>
                Password
                <input
                  name="password"
                  type="password"
                  minLength="6"
                  value={employeeForm.password}
                  onChange={updateField}
                  required
                />
              </label>
              <label>
                Total Leaves
                <input
                  name="total_leaves"
                  type="number"
                  min="0"
                  value={employeeForm.total_leaves}
                  onChange={updateField}
                  required
                />
              </label>
              <button type="submit">Create</button>
            </form>

            <h2 className="section-title">Employees</h2>
            <div className="list-stack">
              {employees.map((employee) => (
                <article className="compact-card" key={employee.id}>
                  {editingEmployeeId === employee.id ? (
                    <form className="employee-edit-form" onSubmit={saveEmployee}>
                      <label>
                        Name
                        <input
                          name="name"
                          value={employeeEditForm.name}
                          onChange={updateEditField}
                          required
                        />
                      </label>
                      <label>
                        Email
                        <input
                          name="email"
                          type="email"
                          value={employeeEditForm.email}
                          onChange={updateEditField}
                          required
                        />
                      </label>
                      <label>
                        New Password
                        <input
                          name="password"
                          type="password"
                          minLength="6"
                          value={employeeEditForm.password}
                          onChange={updateEditField}
                          placeholder="Leave blank to keep current"
                        />
                      </label>
                      <div className="button-row">
                        <button type="submit">Save</button>
                        <button
                          className="secondary-button"
                          type="button"
                          onClick={cancelEditEmployee}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div>
                        <strong>{employee.name}</strong>
                        <span>{employee.email}</span>
                      </div>
                      <div className="button-row employee-actions">
                        <button
                          className="secondary-button"
                          type="button"
                          onClick={() => startEditEmployee(employee)}
                        >
                          Edit
                        </button>
                        <button
                          className="danger-button"
                          type="button"
                          onClick={() => deleteEmployee(employee)}
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </article>
              ))}
              {employees.length === 0 && <p className="empty-text">No employees yet.</p>}
            </div>
          </div>

          <section>
            <h2>Leave Requests</h2>
            <div className="list-stack">
              {leaves.map((leave) => (
                <LeaveCard
                  key={leave.id}
                  leave={leave}
                  showEmployee
                  onUpdate={updateLeave}
                />
              ))}
              {leaves.length === 0 && <p className="empty-text">No leave requests yet.</p>}
            </div>
          </section>
        </section>
      </main>
    </>
  );
}

function Stat({ label, value }) {
  return (
    <article className="stat-box">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
