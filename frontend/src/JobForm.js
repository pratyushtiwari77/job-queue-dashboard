import React, { useState } from 'react';

export default function JobForm({ onCreate }) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !type.trim()) {
      alert('Title and type are required');
      return;
    }
    await onCreate(title, type);
    setTitle('');
    setType('');
  };

  return (
    <form onSubmit={handleSubmit} className="job-form">
      <input
        placeholder="Job title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <input
        placeholder="Job type (e.g. email, report)"
        value={type}
        onChange={(e) => setType(e.target.value)}
      />
      <button type="submit">Create Job</button>
    </form>
  );
}
