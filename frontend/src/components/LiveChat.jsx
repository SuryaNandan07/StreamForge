import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCurrentUser } from '../api/api.js';

function getSavedUser() {
  const savedUser = localStorage.getItem('streamforgeUser');

  if (!savedUser) {
    return null;
  }

  try {
    return JSON.parse(savedUser);
  } catch (error) {
    return null;
  }
}

function LiveChat({ streamKey, socket }) {
  const [user, setUser] = useState(getSavedUser());
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [chatError, setChatError] = useState('');
  const [isCheckingUser, setIsCheckingUser] = useState(true);
  const token = localStorage.getItem('streamforgeToken');

  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setIsCheckingUser(false);
        return;
      }

      if (user?.username) {
        setIsCheckingUser(false);
        return;
      }

      try {
        const data = await getCurrentUser();
        setUser(data.user);
        localStorage.setItem('streamforgeUser', JSON.stringify(data.user));
      } catch (error) {
        setUser(null);
      } finally {
        setIsCheckingUser(false);
      }
    }

    loadUser();
  }, [token, user?.username]);

  useEffect(() => {
    if (!socket) {
      return;
    }

    socket.on('receiveMessage', (newMessage) => {
      setMessages((currentMessages) => [...currentMessages, newMessage]);
    });

    return () => {
      socket.off('receiveMessage');
    };
  }, [socket]);

  function handleSubmit(event) {
    event.preventDefault();
    setChatError('');

    if (!message.trim()) {
      setChatError('Message cannot be empty');
      return;
    }

    socket.emit('sendMessage', {
      streamKey,
      username: user.username,
      message,
    });

    setMessage('');
  }

  if (isCheckingUser) {
    return (
      <section className="live-chat">
        <h2>Live Chat</h2>
        <p>Checking login...</p>
      </section>
    );
  }

  if (!token || !user?.username) {
    return (
      <section className="live-chat locked-chat">
        <h2>Live Chat</h2>
        <p>Please login to join live chat</p>
        <Link className="button primary-button" to="/login">
          Login
        </Link>
      </section>
    );
  }

  return (
    <section className="live-chat">
      <h2>Live Chat</h2>
      <p className="chat-user">Chatting as {user.username}</p>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <p>No messages yet.</p>
        ) : (
          messages.map((chatMessage, index) => (
            <div className="chat-message" key={`${chatMessage.createdAt}-${index}`}>
              <strong>{chatMessage.username}</strong>
              <p>{chatMessage.message}</p>
            </div>
          ))
        )}
      </div>

      <form className="chat-form" onSubmit={handleSubmit}>
        <label>
          Message
          <input
            type="text"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Say something..."
          />
        </label>

        <button className="button primary-button" type="submit" disabled={!socket}>
          Send
        </button>
      </form>

      {chatError && <p className="error-text">{chatError}</p>}
    </section>
  );
}

export default LiveChat;
