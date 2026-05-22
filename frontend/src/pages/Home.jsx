import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { checkBackendHealth } from '../api/api.js';

function Home() {
  const [isCheckingBackend, setIsCheckingBackend] = useState(true);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [backendError, setBackendError] = useState('');

  useEffect(() => {
    async function loadBackendStatus() {
      try {
        const data = await checkBackendHealth();

        setIsBackendConnected(data.success === true);
        setBackendError('');
      } catch (error) {
        setIsBackendConnected(false);
        setBackendError('Could not reach the backend server.');
      } finally {
        setIsCheckingBackend(false);
      }
    }

    loadBackendStatus();
  }, []);

  return (
    <section className="hero-section">
      <p className="eyebrow">Welcome to</p>
      <h1>StreamForge</h1>
      <p className="subtitle">Mini live streaming platform</p>

      <div className="backend-status">
        {isCheckingBackend ? (
          <p>Checking backend...</p>
        ) : (
          <p>Backend: {isBackendConnected ? 'Connected' : 'Not connected'}</p>
        )}

        {backendError && <p className="error-text">{backendError}</p>}
      </div>

      <div className="button-row">
        <Link className="button primary-button" to="/login">
          Login
        </Link>
        <Link className="button secondary-button" to="/register">
          Register
        </Link>
        <Link className="button secondary-button" to="/dashboard">
          Dashboard
        </Link>
      </div>
    </section>
  );
}

export default Home;
