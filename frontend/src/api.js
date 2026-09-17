const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

async function handleResponse(res) {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Something went wrong');
  }
  return data;
}

export async function getJobs(status) {
  const url = status ? `${API_URL}/jobs?status=${status}` : `${API_URL}/jobs`;
  const res = await fetch(url);
  return handleResponse(res);
}

export async function createJob(title, type) {
  const res = await fetch(`${API_URL}/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, type })
  });
  return handleResponse(res);
}

export async function updateJobStatus(id, status) {
  const res = await fetch(`${API_URL}/jobs/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  return handleResponse(res);
}

export async function deleteJob(id) {
  const res = await fetch(`${API_URL}/jobs/${id}`, {
    method: 'DELETE'
  });
  return handleResponse(res);
}
