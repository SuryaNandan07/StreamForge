import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import LiveChat from '../components/LiveChat.jsx';
import VideoPlayer from '../components/VideoPlayer.jsx';
import { getStreamByKey } from '../api/api.js';
import { formatDuration } from '../utils/formatDuration.js';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

function Watch() {
  const { streamKey } = useParams();
  const [showPlayer, setShowPlayer] = useState(false);
  const [stream, setStream] = useState(null);
  const [statusError, setStatusError] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [socket, setSocket] = useState(null);
  const [viewerCount, setViewerCount] = useState(0);

  useEffect(() => {
    async function loadStreamStatus() {
      if (!streamKey) {
        return;
      }

      try {
        const data = await getStreamByKey(streamKey);
        setStream(data.stream);
        setStatusError('');
      } catch (error) {
        setStatusError('Could not load stream status.');
      }
    }

    loadStreamStatus();
    const statusRefresh = setInterval(loadStreamStatus, 5000);

    return () => {
      clearInterval(statusRefresh);
    };
  }, [streamKey]);

  useEffect(() => {
    if (!stream?.isLive || !stream.liveStartedAt) {
      setElapsedSeconds(0);
      return;
    }

    function updateElapsedTime() {
      const startedAt = new Date(stream.liveStartedAt).getTime();
      const seconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
      setElapsedSeconds(seconds);
    }

    updateElapsedTime();
    const timer = setInterval(updateElapsedTime, 1000);

    return () => clearInterval(timer);
  }, [stream?.isLive, stream?.liveStartedAt]);

  useEffect(() => {
    if (!streamKey) {
      return;
    }

    const watchSocket = io(SOCKET_URL);

    watchSocket.emit('joinStream', streamKey);
    watchSocket.on('viewer_count', (data) => {
      if (data.streamKey === streamKey) {
        setViewerCount(data.count);
      }
    });

    setSocket(watchSocket);

    return () => {
      watchSocket.disconnect();
      setSocket(null);
    };
  }, [streamKey]);

  function handleRetry() {
    setShowPlayer(false);
    setTimeout(() => setShowPlayer(true), 100);
  }

  return (
    <section className="watch-layout">
      <div className="watch-main">
        <div className="watch-header">
          <div>
            <p className="eyebrow">Now watching</p>
            <h1>{stream?.title || 'StreamForge Channel'}</h1>
            <div className="watch-meta-row">
              <span className={`stream-status ${stream?.isLive ? 'live' : ''}`}>
                {stream?.isLive ? `LIVE - ${formatDuration(elapsedSeconds)}` : 'Offline'}
              </span>
              <span className="viewer-count">{viewerCount} viewers</span>
              {stream?.category && <span className="category-pill">{stream.category}</span>}
            </div>
          </div>
          <div className="creator-chip">{stream?.creator?.username || 'Creator'}</div>
        </div>

        {statusError && <p className="error-text">{statusError}</p>}

        <div className="content-panel video-panel">
          {streamKey && !showPlayer ? (
            <div className="video-placeholder">
              <button className="play-button" onClick={() => setShowPlayer(true)} type="button">
                <span className="play-icon">PLAY</span>
              </button>
              <h2>Click play to load stream</h2>
              <p>Stream video is ready to play when the creator is live.</p>
            </div>
          ) : null}

          {streamKey && showPlayer ? (
            <VideoPlayer
              streamKey={streamKey}
              liveStartedAt={stream?.liveStartedAt}
              onRetry={handleRetry}
            />
          ) : null}

          {showPlayer && (
            <button className="button secondary-button retry-button" onClick={handleRetry} type="button">
              Retry stream
            </button>
          )}
        </div>

        {stream?.description && <p className="watch-description">{stream.description}</p>}
        {streamKey && <p className="muted-line">Channel key: {streamKey}</p>}
      </div>

      <aside className="chat-column">
        <LiveChat streamKey={streamKey} socket={socket} />
      </aside>
    </section>
  );
}

export default Watch;
