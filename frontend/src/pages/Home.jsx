import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { checkBackendHealth, getStreams } from '../api/api.js';
import { formatDuration } from '../utils/formatDuration.js';

function Home() {
  const [isCheckingBackend, setIsCheckingBackend] = useState(true);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [backendError, setBackendError] = useState('');
  const [streams, setStreams] = useState([]);
  const [isLoadingStreams, setIsLoadingStreams] = useState(true);
  const [streamsError, setStreamsError] = useState('');
  const [now, setNow] = useState(Date.now());
  const visibleStreams = [];
  const seenCreators = new Set();

  streams.forEach((stream) => {
    const creatorId = stream.creator?._id || stream.creator?.username || stream.streamKey;

    if (!seenCreators.has(creatorId)) {
      seenCreators.add(creatorId);
      visibleStreams.push(stream);
    }
  });

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

    async function loadStreams() {
      try {
        const data = await getStreams();
        setStreams(data.streams);
        setStreamsError('');
      } catch (error) {
        setStreamsError(error.message);
      } finally {
        setIsLoadingStreams(false);
      }
    }

    loadBackendStatus();
    loadStreams();
    const streamRefresh = setInterval(loadStreams, 5000);
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      clearInterval(streamRefresh);
      clearInterval(timer);
    };
  }, []);

  function getLiveDuration(stream) {
    if (!stream.isLive || !stream.liveStartedAt) {
      return '';
    }

    const startedAt = new Date(stream.liveStartedAt).getTime();
    const elapsed = Math.floor((now - startedAt) / 1000);

    return formatDuration(elapsed);
  }

  return (
    <>
      <section className="hero-section">
        <p className="eyebrow">Live now, forged by creators</p>
        <h1>StreamForge</h1>
        <p className="subtitle">Build, stream, and connect live</p>

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

      <section className="stream-list-section">
        <div className="section-heading">
          <p className="eyebrow">Browse channels</p>
          <h2>Live Streams</h2>
        </div>

        {isLoadingStreams && <p>Loading streams...</p>}
        {streamsError && <p className="error-text">{streamsError}</p>}

        {!isLoadingStreams && visibleStreams.length === 0 && (
          <p>No streams created yet. Create one from the Dashboard.</p>
        )}

        <div className="stream-card-grid">
          {visibleStreams.map((stream) => (
            <article className="stream-card" key={stream._id}>
              <div>
                <span className={`stream-status ${stream.isLive ? 'live' : ''}`}>
                  {stream.isLive ? `LIVE • ${getLiveDuration(stream)}` : 'Offline'}
                </span>
                <h3>{stream.title}</h3>
                <p>{stream.description || 'No description yet.'}</p>
              </div>

              <div className="stream-card-meta">
                <span className="category-pill">{stream.category}</span>
                <span>Creator: {stream.creator?.username || 'Unknown'}</span>
              </div>

              <Link className="button stream-cta" to={`/watch/${stream.streamKey}`}>
                Watch
              </Link>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

export default Home;
