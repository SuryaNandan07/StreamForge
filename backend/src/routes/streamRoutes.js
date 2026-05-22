const express = require('express');
const {
  createStream,
  getStreams,
} = require('../controllers/streamController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/create', authMiddleware, createStream);
router.get('/', getStreams);

module.exports = router;
