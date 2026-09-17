import React from 'react';

export default function StatusCounts({ jobs }) {
  const counts = {
    pending: 0,
    running: 0,
    completed: 0,
    failed: 0
  };

  jobs.forEach((job) => {
    if (counts[job.status] !== undefined) {
      counts[job.status]++;
    }
  });

  return (
    <div className="status-counts">
      <div className="count-box">Pending: {counts.pending}</div>
      <div className="count-box">Running: {counts.running}</div>
      <div className="count-box">Completed: {counts.completed}</div>
      <div className="count-box">Failed: {counts.failed}</div>
    </div>
  );
}
