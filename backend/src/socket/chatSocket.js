function setupChatSocket(io) {
  function emitViewerCount(streamKey) {
    const room = io.sockets.adapter.rooms.get(streamKey);
    const viewerCount = room ? room.size : 0;

    io.to(streamKey).emit('viewer_count', {
      streamKey,
      count: viewerCount,
    });
  }

  io.on('connection', (socket) => {
    console.log('Socket connected');

    socket.on('joinStream', (streamKey) => {
      if (!streamKey || !streamKey.trim()) {
        return;
      }

      const cleanStreamKey = streamKey.trim();

      socket.join(cleanStreamKey);
      socket.data.streamKey = cleanStreamKey;
      emitViewerCount(cleanStreamKey);
    });

    socket.on('sendMessage', ({ streamKey, username, message }) => {
      if (
        !streamKey ||
        !username ||
        !message ||
        !streamKey.trim() ||
        !username.trim() ||
        !message.trim()
      ) {
        return;
      }

      const chatMessage = {
        username: username.trim(),
        message: message.trim(),
        createdAt: new Date().toISOString(),
      };

      // Only users watching the same streamKey room receive this message.
      io.to(streamKey).emit('receiveMessage', chatMessage);
    });

    socket.on('disconnecting', () => {
      const streamKey = socket.data.streamKey;

      if (streamKey) {
        const room = io.sockets.adapter.rooms.get(streamKey);
        const viewerCount = room ? Math.max(room.size - 1, 0) : 0;

        io.to(streamKey).emit('viewer_count', {
          streamKey,
          count: viewerCount,
        });
      }
    });
  });
}

module.exports = setupChatSocket;
