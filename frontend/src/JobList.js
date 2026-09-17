import React from 'react';

const ALLOWED_TRANSITIONS = {
  pending: ['running'],
  running: ['completed', 'failed'],
  completed: [],
  failed: []
};

export default function JobList({ jobs, onStatusChange, onDelete }) {
  if (jobs.length === 0) {
    return <p>No jobs found.</p>;
  }

  return (
    <table border="1" cellPadding="8">
      <thead>
        <tr>
          <th>Title</th>
          <th>Type</th>
          <th>Status</th>
          <th>Created At</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {jobs.map((job) => (
          <tr key={job.id}>
            <td>{job.title}</td>
            <td>{job.type}</td>
            <td>{job.status}</td>
            <td>{new Date(job.createdAt).toLocaleString()}</td>
            <td>
              {ALLOWED_TRANSITIONS[job.status].map((nextStatus) => (
                <button
                  key={nextStatus}
                  onClick={() => onStatusChange(job.id, nextStatus)}
                >
                  Mark {nextStatus}
                </button>
              ))}
              <button onClick={() => onDelete(job.id)}>Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
