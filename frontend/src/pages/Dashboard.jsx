import { useEffect, useState } from 'react';
import { createStream, getCurrentUser } from '../api/api.js';

const RTMP_URL = 'rtmp://localhost:1935/live';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [streamForm, setStreamForm] = useState({
    title: '',
    category: '',
    description: '',
  });
  const [createdStream, setCreatedStream] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingStream, setIsCreatingStream] = useState(false);
  const [error, setError] = useState('');
  const [streamMessage, setStreamMessage] = useState('');
  const [streamError, setStreamError] = useState('');
  const [copyMessage, setCopyMessage] = useState('');
  const token = localStorage.getItem('streamforgeToken');

  useEffect(() => {
    async function loadCurrentUser() {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await getCurrentUser();
        setUser(data.user);
      } catch (error) {
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadCurrentUser();
  }, [token]);

  function handleStreamFormChange(event) {
    setStreamForm({
      ...streamForm,
      [event.target.name]: event.target.value,
    });
  }

  async function handleCreateStream(event) {
    event.preventDefault();
    setStreamMessage('');
    setStreamError('');
    setIsCreatingStream(true);

    try {
      const data = await createStream(streamForm);
      setCreatedStream(data.stream);
      setStreamMessage(data.message);
      setStreamForm({ title: '', category: '', description: '' });
    } catch (error) {
      setStreamError(error.message);
    } finally {
      setIsCreatingStream(false);
    }
  }

  async function handleCopyStreamKey() {
    try {
      await navigator.clipboard.writeText(user.streamKey);
      setCopyMessage('Stream key copied');
    } catch (error) {
      setCopyMessage('Could not copy stream key');
    }
  }

  if (!token) {
    return (
      <section className="content-panel">
        <h1>Dashboard</h1>
        <p>Please login to access dashboard</p>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="content-panel">
        <h1>Dashboard</h1>
        <p>Loading dashboard...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="content-panel">
        <h1>Dashboard</h1>
        <p className="error-text">{error}</p>
      </section>
    );
  }

  return (
    <section className="content-panel dashboard-panel">
      <h1>Creator Dashboard</h1>
      <p>Your basic stream setup details.</p>

      <div className="dashboard-grid">
        <div className="dashboard-item">
          <span>Username</span>
          <strong>{user.username}</strong>
        </div>

        <div className="dashboard-item">
          <span>Email</span>
          <strong>{user.email}</strong>
        </div>

        <div className="dashboard-item">
          <span>RTMP URL</span>
          <code>{RTMP_URL}</code>
        </div>

        <div className="dashboard-item">
          <span>Stream Key</span>
          <div className="stream-key-row">
            <code>{user.streamKey}</code>
            <button className="button secondary-button" type="button" onClick={handleCopyStreamKey}>
              Copy
            </button>
          </div>
          {copyMessage && <p className="success-text">{copyMessage}</p>}
        </div>
      </div>

      <div className="stream-form-section">
        <h2>Create / Update Stream Info</h2>
        <p>This saves your current channel listing. Actual video streaming uses your stream key.</p>

        <form className="auth-form" onSubmit={handleCreateStream}>
          <label>
            Title
            <input
              name="title"
              type="text"
              value={streamForm.title}
              onChange={handleStreamFormChange}
              required
            />
          </label>

          <label>
            Category
            <input
              name="category"
              type="text"
              value={streamForm.category}
              onChange={handleStreamFormChange}
              required
            />
          </label>

          <label>
            Description
            <textarea
              name="description"
              value={streamForm.description}
              onChange={handleStreamFormChange}
              rows="4"
            />
          </label>

        <button className="button primary-button" type="submit" disabled={isCreatingStream}>
            {isCreatingStream ? 'Saving stream info...' : 'Create / Update Stream Info'}
          </button>
        </form>

        {streamMessage && <p className="success-text">{streamMessage}</p>}
        {streamError && <p className="error-text">{streamError}</p>}

        {createdStream && (
          <div className="created-stream-box">
            <h3>Current Stream Info</h3>
            <p>
              <strong>Title:</strong> {createdStream.title}
            </p>
            <p>
              <strong>Category:</strong> {createdStream.category}
            </p>
            <p>
              <strong>Status:</strong> Offline
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

export default Dashboard;
