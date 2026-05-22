const cors = require('cors');
const dotenv = require('dotenv');
const express = require('express');
const healthRoutes = require('./routes/healthRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// All backend API routes will start with /api.
app.use('/api', healthRoutes);

app.listen(PORT, () => {
  console.log(`StreamForge backend running on port ${PORT}`);
});
