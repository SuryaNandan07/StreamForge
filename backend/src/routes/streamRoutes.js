const express = require('express');
const {
  createStream,
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

module.exports = router;
