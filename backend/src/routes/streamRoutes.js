const express = require('express');
const {
  createStream,
  getStreamByKey,
  getStreams,
  getMyStreamHistory,
  updateStreamStatus,
} = require('../controllers/streamController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/create', authMiddleware, createStream);
router.get('/', getStreams);
router.get('/history/me', authMiddleware, getMyStreamHistory);
router.patch('/status/:streamKey', updateStreamStatus);
router.get('/:streamKey', getStreamByKey);

module.exports = router;
