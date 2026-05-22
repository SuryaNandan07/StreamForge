const Stream = require('../models/Stream');
const User = require('../models/User');

async function createStream(req, res) {
  try {
    const { title, category, description } = req.body;

    if (!title || !category) {
      return res.status(400).json({
        success: false,
        message: 'Title and category are required',
      });
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const stream = await Stream.create({
      title,
      category,
      description,
      creator: user._id,
      streamKey: user.streamKey,
      isLive: false,
    });

    return res.status(201).json({
      success: true,
      message: 'Stream created successfully',
      stream,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Could not create stream',
    });
  }
}

async function getStreams(req, res) {
  try {
    const streams = await Stream.find()
      .populate('creator', 'username')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      streams,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Could not load streams',
    });
  }
}

module.exports = {
  createStream,
  getStreams,
};
