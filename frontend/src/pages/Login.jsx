import { useState } from 'react';
import { loginUser } from '../api/api.js';

function Login() {
  const [formData, setFormData] = useState({
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
      const data = await loginUser(formData);

      localStorage.setItem('streamforgeToken', data.token);
      localStorage.setItem('streamforgeUser', JSON.stringify(data.user));

      setMessage(data.message);
      setFormData({ email: '', password: '' });
    } catch (error) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="auth-shell">
      <div className="content-panel auth-panel">
        <p className="eyebrow">Welcome back</p>
        <h1>Login</h1>
        <p>Sign in to your StreamForge account.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
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
            {isSubmitting ? 'Signing in...' : 'Login'}
          </button>
        </form>

        {message && <p className="success-text">{message}</p>}
        {error && <p className="error-text">{error}</p>}
      </div>
    </section>
  );
}

export default Login;
