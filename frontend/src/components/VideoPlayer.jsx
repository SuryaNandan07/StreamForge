import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

const HLS_BASE_URL = import.meta.env.VITE_HLS_BASE_URL || 'http://localhost:8000';

console.log('StreamForge HLS_BASE_URL:', HLS_BASE_URL);

const STREAM_LOAD_ERROR =
  'Could not load live stream. Check if OBS is running and HLS tunnel URL is correct.';

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
    let hls = null;
    let isCancelled = false;

    if (!video || !streamKey) {
      return;
    }

    setStatus('loading');
    setError('');

    console.log('StreamForge VideoPlayer streamKey:', streamKey);
    console.log('StreamForge VideoPlayer HLS_BASE_URL:', HLS_BASE_URL);
    console.log('StreamForge VideoPlayer final HLS URL:', hlsUrl);
    console.log('StreamForge hls.js supported:', Hls.isSupported());
    console.log(
      'StreamForge native HLS supported:',
      Boolean(video.canPlayType('application/vnd.apple.mpegurl'))
    );

    async function loadStream() {
      try {
        const manifestResponse = await fetch(hlsUrl, {
          cache: 'no-store',
        });

        const manifestText = await manifestResponse.text();
        const contentType = manifestResponse.headers.get('content-type') || '';

        console.log('StreamForge HLS manifest status:', manifestResponse.status);
        console.log('StreamForge HLS manifest content-type:', contentType);
        console.log('StreamForge HLS manifest preview:', manifestText.slice(0, 120));

        if (isCancelled) {
          return;
        }

        if (!manifestResponse.ok) {
          setStatus('error');
          setError(STREAM_LOAD_ERROR);
          return;
        }

        if (manifestText.trim().startsWith('<')) {
          setStatus('error');
          setError('HLS tunnel returned HTML instead of playlist.');
          return;
        }

        if (!manifestText.includes('#EXTM3U')) {
          setStatus('error');
          setError(STREAM_LOAD_ERROR);
          return;
        }

        video.onerror = (event) => {
          console.log('StreamForge video error event:', event);
          setStatus('error');
          setError(STREAM_LOAD_ERROR);
        };

        if (Hls.isSupported()) {
          hls = new Hls();

          hls.on(Hls.Events.ERROR, (event, data) => {
            console.log('StreamForge hls.js error event:', event);
            console.log('StreamForge hls.js error data:', data);

            if (data.fatal) {
              setStatus('error');
              setError(STREAM_LOAD_ERROR);
              hls.destroy();
            }
          });

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setStatus('ready');
            video.play().catch((error) => {
              console.log('StreamForge video autoplay after click failed:', error.message);
            });
          });

          hls.loadSource(hlsUrl);
          hls.attachMedia(video);
          return;
        }

        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.removeAttribute('src');
          video.load();
          video.src = hlsUrl;
          video.onloadedmetadata = () => {
            setStatus('ready');
          };
          return;
        }

        setStatus('error');
        setError('This browser does not support HLS playback.');
      } catch (error) {
        console.log('StreamForge HLS manifest fetch error:', error);

        if (!isCancelled) {
          setStatus('error');
          setError(STREAM_LOAD_ERROR);
        }
      }
    }

    loadStream();

    return () => {
      isCancelled = true;
      video.onerror = null;

      if (hls) {
        hls.destroy();
      }
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
