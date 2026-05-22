function setupChatSocket(io) {
  io.on('connection', (socket) => {
    socket.on('joinStream', (streamKey) => {
      if (!streamKey) {
        return;
      }

      socket.join(streamKey);
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
  });
}

module.exports = setupChatSocket;
