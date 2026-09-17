import React, { useEffect, useState } from 'react';
import { getJobs, createJob, updateJobStatus, deleteJob } from './api';
import JobForm from './JobForm';
import JobList from './JobList';
import StatusCounts from './StatusCounts';

function App() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  const loadJobs = async () => {
    setLoading(true);
    try {
      const data = await getJobs();
      setJobs(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const handleCreate = async (title, type) => {
    try {
      await createJob(title, type);
      loadJobs();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await updateJobStatus(id, status);
      loadJobs();
    } catch (err) {
      alert(err.message);
      loadJobs();
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this job?')) return;
    try {
      await deleteJob(id);
      loadJobs();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredJobs = filter === 'all' ? jobs : jobs.filter((j) => j.status === filter);

  return (
    <div className="container">
      <h1>Job Queue Dashboard</h1>

      <JobForm onCreate={handleCreate} />

      <StatusCounts jobs={jobs} />

      <div className="filter-bar">
        <label>Filter by status: </label>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="running">Running</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
        <button onClick={loadJobs}>Refresh</button>
      </div>

      {loading && <p>Loading jobs...</p>}
      {error && <p className="error">Error: {error}</p>}

      {!loading && !error && (
        <JobList jobs={filteredJobs} onStatusChange={handleStatusChange} onDelete={handleDelete} />
      )}
    </div>
  );
}

export default App;
