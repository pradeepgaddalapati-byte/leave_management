import React from "react";

const statusClassNames = {
  PENDING: "status-pending",
  APPROVED: "status-approved",
  REJECTED: "status-rejected",
};

export default function LeaveCard({ leave, showEmployee = false, onUpdate }) {
  return (
    <article className="card leave-card">
      <div className="card-header">
        <div>
          <h3>{leave.leave_type}</h3>
          {showEmployee && (
            <span>
              {leave.employee_name} ({leave.employee_email})
            </span>
          )}
        </div>
        <span className={`status ${statusClassNames[leave.status] || ""}`}>
          {leave.status}
        </span>
      </div>

      <p>
        {leave.start_date} to {leave.end_date}
      </p>
      <p>{leave.reason}</p>

      {onUpdate && leave.status === "PENDING" && (
        <div className="button-row">
          <button type="button" onClick={() => onUpdate(leave.id, "APPROVED")}>
            Approve
          </button>
          <button
            type="button"
            className="danger-button"
            onClick={() => onUpdate(leave.id, "REJECTED")}
          >
            Reject
          </button>
        </div>
      )}
    </article>
  );
}
