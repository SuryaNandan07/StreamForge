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

    const existingStream = await Stream.findOne({ creator: user._id }).sort({
      createdAt: -1,
    });

    if (existingStream) {
      existingStream.title = title;
      existingStream.category = category;
      existingStream.description = description;
      existingStream.streamKey = user.streamKey;

      const updatedStream = await existingStream.save();
      await updatedStream.populate('creator', 'username');

      return res.json({
        success: true,
        message: 'Stream info updated successfully',
        stream: updatedStream,
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

    await stream.populate('creator', 'username');

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
    const currentStreamsByCreator = new Map();

    streams.forEach((stream) => {
      const creatorId = stream.creator?._id?.toString();

      if (creatorId && !currentStreamsByCreator.has(creatorId)) {
        currentStreamsByCreator.set(creatorId, stream);
      }
    });

    return res.json({
      success: true,
      streams: Array.from(currentStreamsByCreator.values()),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Could not load streams',
    });
  }
}

async function updateStreamStatus(req, res) {
  try {
    const { streamKey } = req.params;
    const { isLive } = req.body;

    console.log('Status route hit');
    console.log('received streamKey:', streamKey);
    console.log('received isLive value:', isLive);

    if (typeof isLive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isLive must be true or false',
      });
    }

    const matchingStream = await Stream.findOne({ streamKey });

    if (!matchingStream) {
      console.log('stream found/not found: not found');

      return res.status(404).json({
        success: false,
        message: 'Stream not found',
      });
    }

    console.log('stream found/not found: found');

    await Stream.updateMany({ streamKey }, { isLive });

    const stream = await Stream.findOne({ streamKey })
      .sort({ createdAt: -1 })
      .populate('creator', 'username');

    console.log('updated stream result:', stream);

    return res.json({
      success: true,
      message: `Stream marked ${isLive ? 'live' : 'offline'}`,
      stream,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Could not update stream status',
    });
  }
}

module.exports = {
  createStream,
  getStreams,
  updateStreamStatus,
};
