const express = require('express');
const {
  createStream,
  getStreams,
  updateStreamStatus,
} = require('../controllers/streamController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/create', authMiddleware, createStream);
router.get('/', getStreams);
router.patch('/status/:streamKey', updateStreamStatus);

module.exports = router;
