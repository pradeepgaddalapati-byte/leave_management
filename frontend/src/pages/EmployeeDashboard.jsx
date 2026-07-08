import React from "react";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

import LeaveCard from "../components/LeaveCard.jsx";
import Navbar from "../components/Navbar.jsx";
import api, { getErrorMessage } from "../services/api.js";

const emptyLeave = {
  leave_type: "Casual Leave",
  start_date: "",
  end_date: "",
  reason: "",
};

export default function EmployeeDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [leaveForm, setLeaveForm] = useState(emptyLeave);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  async function loadData() {
    const [dashboardResponse, leaveResponse] = await Promise.all([
      api.get("/employee/dashboard"),
      api.get("/employee/leaves"),
    ]);

    setDashboard(dashboardResponse.data);
    setLeaves(leaveResponse.data);
  }

  useEffect(() => {
    loadData().catch((err) => setError(getErrorMessage(err)));
  }, []);

  if (!token || role !== "EMPLOYEE") {
    return <Navigate to="/login" replace />;
  }

  const remainingLeaves = dashboard?.balance?.remaining_leaves ?? 0;
  const leaveTypes =
    remainingLeaves > 0
      ? ["Casual Leave", "Sick Leave", "Loss of Pay"]
      : ["Loss of Pay"];

  function updateField(event) {
    setLeaveForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  async function applyLeave(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      await api.post("/employee/leaves", leaveForm);
      setLeaveForm({ ...emptyLeave, leave_type: leaveTypes[0] });
      setMessage("Leave request submitted");
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <>
      <Navbar title="Employee Dashboard" />
      <main className="page-shell">
        {error && <p className="notice">{error}</p>}
        {message && <p className="success-text">{message}</p>}

        <section className="stats-grid">
          <Stat label="Total Leaves" value={dashboard?.balance?.total_leaves ?? 0} />
          <Stat label="Used Leaves" value={dashboard?.balance?.used_leaves ?? 0} />
          <Stat label="Remaining Leaves" value={remainingLeaves} />
        </section>

        <section className="two-column-layout">
          <div className="card">
            <h2>Apply Leave</h2>
            {remainingLeaves <= 0 && (
              <p className="notice">Paid leaves are completed. Use Loss of Pay.</p>
            )}
            <form className="form-card" onSubmit={applyLeave}>
              <label>
                Leave Type
                <select
                  name="leave_type"
                  value={leaveForm.leave_type}
                  onChange={updateField}
                  required
                >
                  {leaveTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Start Date
                <input
                  name="start_date"
                  type="date"
                  value={leaveForm.start_date}
                  onChange={updateField}
                  required
                />
              </label>
              <label>
                End Date
                <input
                  name="end_date"
                  type="date"
                  value={leaveForm.end_date}
                  onChange={updateField}
                  required
                />
              </label>
              <label>
                Reason
                <textarea
                  name="reason"
                  minLength="5"
                  rows="4"
                  value={leaveForm.reason}
                  onChange={updateField}
                  required
                />
              </label>
              <button type="submit">Submit</button>
            </form>
          </div>

          <section>
            <h2>My Leave History</h2>
            <div className="list-stack">
              {leaves.map((leave) => (
                <LeaveCard key={leave.id} leave={leave} />
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
