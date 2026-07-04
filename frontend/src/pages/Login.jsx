import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getApiErrorMessage } from '../services/api';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', form);
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('role', response.data.role);
      navigate(response.data.role === 'ADMIN' ? '/admin' : '/employee');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Login failed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-panel">
        <h1>Employee Leave Management</h1>
        <form onSubmit={handleSubmit}>
          <label>
            Email
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={updateField}
              required
            />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={updateField}
              required
            />
          </label>
          {error && <p className="error-text">{error}</p>}
          <button disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
        </form>
      </section>
    </main>
  );
}
