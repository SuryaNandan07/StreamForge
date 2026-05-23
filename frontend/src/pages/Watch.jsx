import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import LiveChat from '../components/LiveChat.jsx';
import VideoPlayer from '../components/VideoPlayer.jsx';
import { getStreamByKey } from '../api/api.js';
import { formatDuration } from '../utils/formatDuration.js';

const SOCKET_URL = 'http://localhost:5000';

function Watch() {
  const { streamKey } = useParams();
  const [showPlayer, setShowPlayer] = useState(false);
  const [stream, setStream] = useState(null);
  const [statusError, setStatusError] = useState('');
  const [socket, setSocket] = useState(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

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
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);

      setElapsedSeconds(elapsed);
    }

    updateElapsedTime();
    const timer = setInterval(updateElapsedTime, 1000);

    return () => {
      clearInterval(timer);
    };
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
  }

  return (
    <section className="watch-layout">
      <div className="content-panel video-panel">
        <h1>Watch</h1>
        {streamKey && <p>Stream key: {streamKey}</p>}
        {stream && (
          <div className="watch-meta-row">
            <span className={`stream-status ${stream.isLive ? 'live' : ''}`}>
              {stream.isLive ? `LIVE • ${formatDuration(elapsedSeconds)}` : 'Offline'}
            </span>
            <span className="viewer-count">{viewerCount} viewers</span>
          </div>
        )}
        {statusError && <p className="error-text">{statusError}</p>}

        {streamKey && !showPlayer ? (
          <div className="video-play-card">
            <button
              className="play-stream-button"
              type="button"
              onClick={() => setShowPlayer(true)}
              aria-label="Play stream"
            >
              <span className="play-icon">▶</span>
            </button>
            <h2>Stream video is ready to play</h2>
            <p>Click play to load stream</p>
          </div>
        ) : streamKey ? (
          <VideoPlayer
            streamKey={streamKey}
            liveStartedAt={stream?.liveStartedAt}
            onRetry={handleRetry}
          />
        ) : (
          <div className="video-placeholder">
            <p>Select a stream to watch video.</p>
          </div>
        )}
      </div>

      {streamKey ? (
        <LiveChat streamKey={streamKey} socket={socket} />
      ) : (
        <section className="content-panel">
          <p>Select a stream from Home to open live chat.</p>
        </section>
      )}
    </section>
  );
}

export default Watch;
