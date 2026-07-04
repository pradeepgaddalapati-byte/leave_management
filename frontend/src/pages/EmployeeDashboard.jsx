import React, { useEffect, useState } from 'react';
import LeaveCard from '../components/LeaveCard';
import Navbar from '../components/Navbar';
import api, { getApiErrorMessage } from '../services/api';

const emptyLeaveForm = {
  leave_type: 'Casual Leave',
  start_date: '',
  end_date: '',
  reason: '',
};
const paidLeaveTypes = ['Casual Leave', 'Sick Leave'];
const lossOfPayLeaveType = 'Loss of Pay';

export default function EmployeeDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [leaveForm, setLeaveForm] = useState(emptyLeaveForm);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function loadEmployeeData() {
    const [dashboardResponse, leavesResponse] = await Promise.all([
      api.get('/employee/dashboard'),
      api.get('/employee/leaves'),
    ]);

    setDashboard(dashboardResponse.data);
    setLeaves(Array.isArray(leavesResponse.data) ? leavesResponse.data : []);
  }

  useEffect(() => {
    loadEmployeeData().catch(() => setMessage('Unable to load employee data'));
  }, []);

  const balance = dashboard?.balance;
  const hasNoRemainingLeaves =
    balance?.remaining_leaves !== undefined && balance.remaining_leaves <= 0;
  const leaveTypeOptions = hasNoRemainingLeaves
    ? [lossOfPayLeaveType]
    : [...paidLeaveTypes, lossOfPayLeaveType];

  useEffect(() => {
    if (hasNoRemainingLeaves && leaveForm.leave_type !== lossOfPayLeaveType) {
      setLeaveForm((currentForm) => ({
        ...currentForm,
        leave_type: lossOfPayLeaveType,
      }));
    }
  }, [hasNoRemainingLeaves, leaveForm.leave_type]);

  function updateLeaveForm(event) {
    setLeaveForm({ ...leaveForm, [event.target.name]: event.target.value });
  }

  async function applyLeave(event) {
    event.preventDefault();
    setMessage('');
    setSubmitting(true);

    try {
      await api.post('/employee/leaves', leaveForm);
      setLeaveForm(emptyLeaveForm);
      await loadEmployeeData();
      setMessage('Leave request submitted');
    } catch (err) {
      setMessage(getApiErrorMessage(err, 'Unable to apply for leave'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Navbar title="Employee Dashboard" />
      <main className="page-shell">
        <section className="stats-grid">
          <div className="stat-box">
            <span>Total Leaves</span>
            <strong>{balance?.total_leaves ?? 0}</strong>
          </div>
          <div className="stat-box">
            <span>Used Leaves</span>
            <strong>{balance?.used_leaves ?? 0}</strong>
          </div>
          <div className="stat-box">
            <span>Remaining Leaves</span>
            <strong>{balance?.remaining_leaves ?? 0}</strong>
          </div>
        </section>

        {message && <p className="notice">{message}</p>}

        <section className="two-column-layout">
          <div>
            <h2>Apply for Leave</h2>
            <form className="card form-card" onSubmit={applyLeave}>
              <label>
                Leave Type
                <select
                  name="leave_type"
                  value={leaveForm.leave_type}
                  onChange={updateLeaveForm}
                >
                  {leaveTypeOptions.map((leaveType) => (
                    <option key={leaveType}>{leaveType}</option>
                  ))}
                </select>
              </label>
              <label>
                Start Date
                <input
                  name="start_date"
                  type="date"
                  value={leaveForm.start_date}
                  onChange={updateLeaveForm}
                  required
                />
              </label>
              <label>
                End Date
                <input
                  name="end_date"
                  type="date"
                  value={leaveForm.end_date}
                  onChange={updateLeaveForm}
                  required
                />
              </label>
              <label>
                Description
                <textarea
                  name="reason"
                  value={leaveForm.reason}
                  onChange={updateLeaveForm}
                  rows="4"
                  required
                />
              </label>
              <button disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Leave Request'}
              </button>
            </form>
          </div>

          <div>
            <h2>My Leave History</h2>
            <div className="list-stack">
              {leaves.length > 0 ? (
                leaves.map((leave) => <LeaveCard key={leave.id} leave={leave} />)
              ) : (
                <p className="empty-text">No leave requests yet.</p>
              )}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
