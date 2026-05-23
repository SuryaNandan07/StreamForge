import { useState } from 'react';
import { registerUser } from '../api/api.js';

function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(event) {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    setError('');
    setIsSubmitting(true);

    try {
      const data = await registerUser(formData);
      setMessage(data.message);
      setFormData({ username: '', email: '', password: '' });
    } catch (error) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="auth-shell">
      <div className="content-panel auth-panel">
        <p className="eyebrow">Start streaming</p>
        <h1>Register</h1>
        <p>Create your StreamForge account.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Username
            <input
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Email
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Password
            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </label>

          <button className="button primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account...' : 'Register'}
          </button>
        </form>

        {message && <p className="success-text">{message}</p>}
        {error && <p className="error-text">{error}</p>}
      </div>
    </section>
  );
}

export default Register;
