import { useParams } from 'react-router-dom';
import LiveChat from '../components/LiveChat.jsx';

function Watch() {
  const { streamKey } = useParams();

  return (
    <section className="watch-layout">
      <div className="content-panel video-panel">
        <h1>Watch</h1>
        {streamKey && <p>Stream key: {streamKey}</p>}

        <div className="video-placeholder">
          <p>Live video will appear here later</p>
        </div>
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
