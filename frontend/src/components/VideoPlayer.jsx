import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

const HLS_BASE_URL = import.meta.env.VITE_HLS_BASE_URL || 'http://localhost:8000';

function VideoPlayer({ streamKey, liveStartedAt, onRetry }) {
  const videoRef = useRef(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const cacheKey = liveStartedAt
    ? new Date(liveStartedAt).getTime()
    : Date.now();
  const hlsUrl = `${HLS_BASE_URL}/live/${streamKey}/index.m3u8?t=${cacheKey}`;

  useEffect(() => {
    const video = videoRef.current;

    if (!video || !streamKey) {
      return;
    }

    setStatus('loading');
    setError('');

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.removeAttribute('src');
      video.load();
      video.src = hlsUrl;
      video.onloadedmetadata = () => {
        setStatus('ready');
      };
      video.onerror = () => {
        setStatus('error');
        setError('Stream is offline or still starting. Try again in a few seconds.');
      };
      return;
    }

    if (!Hls.isSupported()) {
      setStatus('error');
      setError('This browser does not support HLS playback.');
      return;
    }

    const hls = new Hls();

    hls.loadSource(hlsUrl);
    hls.attachMedia(video);

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      setStatus('ready');
    });

    hls.on(Hls.Events.ERROR, (event, data) => {
      if (data.fatal) {
        setStatus('error');
        setError('Stream is offline or still starting. Try again in a few seconds.');
        hls.destroy();
      }
    });

    return () => {
      hls.destroy();
    };
  }, [hlsUrl, streamKey, liveStartedAt]);

  return (
    <div className="video-player">
      <video ref={videoRef} controls playsInline />

      {status === 'loading' && (
        <p className="video-status">Loading stream...</p>
      )}

      {status === 'error' && (
        <div className="video-error-box">
          <p className="error-text">{error}</p>
          <button className="button secondary-button" type="button" onClick={onRetry}>
            Retry
          </button>
        </div>
      )}
    </div>
  );
}

export default VideoPlayer;
