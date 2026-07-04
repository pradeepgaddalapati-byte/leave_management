import React, { useEffect, useState } from 'react';
import LeaveCard from '../components/LeaveCard';
import Navbar from '../components/Navbar';
import api, { getApiErrorMessage } from '../services/api';

const emptyEmployeeForm = {
  name: '',
  email: '',
  password: '',
  total_leaves: 20,
};

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [employeeForm, setEmployeeForm] = useState(emptyEmployeeForm);
  const [message, setMessage] = useState('');

  async function loadAdminData() {
    const [dashboardResponse, employeesResponse, leavesResponse] =
      await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/employees'),
        api.get('/admin/leaves'),
    ]);

    setDashboard(dashboardResponse.data);
    setEmployees(Array.isArray(employeesResponse.data) ? employeesResponse.data : []);
    setLeaves(Array.isArray(leavesResponse.data) ? leavesResponse.data : []);
  }

  useEffect(() => {
    loadAdminData().catch(() => setMessage('Unable to load admin data'));
  }, []);

  function updateEmployeeForm(event) {
    const { name, value } = event.target;
    setEmployeeForm({
      ...employeeForm,
      [name]: name === 'total_leaves' ? Number(value) : value,
    });
  }

  async function createEmployee(event) {
    event.preventDefault();
    setMessage('');

    try {
      await api.post('/admin/employees', employeeForm);
      setEmployeeForm(emptyEmployeeForm);
      setMessage('Employee created successfully');
      await loadAdminData();
    } catch (err) {
      setMessage(getApiErrorMessage(err, 'Unable to create employee'));
    }
  }

  async function updateLeaveStatus(leaveId, status) {
    setMessage('');

    try {
      await api.put(`/admin/leaves/${leaveId}`, { status });
      await loadAdminData();
    } catch (err) {
      setMessage(getApiErrorMessage(err, 'Unable to update leave'));
    }
  }

  return (
    <>
      <Navbar title="Admin Dashboard" />
      <main className="page-shell">
        <section className="stats-grid">
          <div className="stat-box">
            <span>Total Employees</span>
            <strong>{dashboard?.total_employees ?? 0}</strong>
          </div>
          <div className="stat-box">
            <span>Pending Leaves</span>
            <strong>{dashboard?.pending_leaves ?? 0}</strong>
          </div>
          <div className="stat-box">
            <span>Approved Leaves</span>
            <strong>{dashboard?.approved_leaves ?? 0}</strong>
          </div>
        </section>

        {message && <p className="notice">{message}</p>}

        <section className="two-column-layout">
          <div>
            <h2>Create Employee</h2>
            <form className="card form-card" onSubmit={createEmployee}>
              <label>
                Name
                <input
                  name="name"
                  value={employeeForm.name}
                  onChange={updateEmployeeForm}
                  required
                />
              </label>
              <label>
                Email
                <input
                  name="email"
                  type="email"
                  value={employeeForm.email}
                  onChange={updateEmployeeForm}
                  required
                />
              </label>
              <label>
                Password
                <input
                  name="password"
                  type="password"
                  value={employeeForm.password}
                  onChange={updateEmployeeForm}
                  required
                  minLength="6"
                />
              </label>
              <label>
                Total Leaves
                <input
                  name="total_leaves"
                  type="number"
                  min="0"
                  value={employeeForm.total_leaves}
                  onChange={updateEmployeeForm}
                />
              </label>
              <button>Create Employee</button>
            </form>

            <h2>Employees</h2>
            <div className="list-stack">
              {employees.map((employee) => (
                <div className="card compact-card" key={employee.id}>
                  <strong>{employee.name}</strong>
                  <span>{employee.email}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2>Leave Requests</h2>
            <div className="list-stack">
              {leaves.map((leave) => (
                <LeaveCard
                  key={leave.id}
                  leave={leave}
                  showEmployee
                  onApprove={(leaveId) => updateLeaveStatus(leaveId, 'APPROVED')}
                  onReject={(leaveId) => updateLeaveStatus(leaveId, 'REJECTED')}
                />
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
