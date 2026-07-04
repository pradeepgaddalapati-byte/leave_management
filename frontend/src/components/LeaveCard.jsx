import React from 'react';

export default function LeaveCard({ leave, showEmployee, onApprove, onReject }) {
  const status = String(leave?.status || 'PENDING');
  const statusClass = `status status-${status.toLowerCase()}`;

  return (
    <article className="card leave-card">
      <div className="card-header">
        <div>
          <h3>{leave?.leave_type || 'Leave Request'}</h3>
          {showEmployee && (
            <p>
              {leave?.employee_name || 'Employee'} ({leave?.employee_email || 'No email'})
            </p>
          )}
        </div>
        <span className={statusClass}>{status}</span>
      </div>
      <p>
        {leave?.start_date || 'Start date'} to {leave?.end_date || 'End date'}
      </p>
      <p>{leave?.reason || 'No reason provided'}</p>
      {status === 'PENDING' && onApprove && onReject && (
        <div className="button-row">
          <button onClick={() => onApprove(leave?.id)}>Approve</button>
          <button className="danger-button" onClick={() => onReject(leave?.id)}>
            Reject
          </button>
        </div>
      )}
    </article>
  );
}
