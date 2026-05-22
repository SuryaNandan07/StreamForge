import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import LiveChat from '../components/LiveChat.jsx';
import VideoPlayer from '../components/VideoPlayer.jsx';
import { getStreams } from '../api/api.js';

function Watch() {
  const { streamKey } = useParams();
  const [showPlayer, setShowPlayer] = useState(false);
  const [stream, setStream] = useState(null);
  const [statusError, setStatusError] = useState('');

  useEffect(() => {
    async function loadStreamStatus() {
      if (!streamKey) {
        return;
      }

      try {
        const data = await getStreams();
        const currentStream = data.streams.find((item) => item.streamKey === streamKey);

        setStream(currentStream || null);
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

  function handleRetry() {
    setShowPlayer(false);
  }

  return (
    <section className="watch-layout">
      <div className="content-panel video-panel">
        <h1>Watch</h1>
        {streamKey && <p>Stream key: {streamKey}</p>}
        {stream && (
          <span className={`stream-status ${stream.isLive ? 'live' : ''}`}>
            {stream.isLive ? 'LIVE' : 'Offline'}
          </span>
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
          <VideoPlayer streamKey={streamKey} onRetry={handleRetry} />
        ) : (
          <div className="video-placeholder">
            <p>Select a stream to watch video.</p>
          </div>
        )}
      </div>

      {streamKey ? (
        <LiveChat streamKey={streamKey} />
      ) : (
        <section className="content-panel">
          <p>Select a stream from Home to open live chat.</p>
        </section>
      )}
    </section>
  );
}

export default Watch;
