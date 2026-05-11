const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const medicationRoutes = require('./routes/medication.routes');
const doseRoutes = require('./routes/dose.routes');
const caregiverRoutes = require('./routes/caregiver.routes');

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'MedApp API running' });
});

// Routes
app.use('/auth', authRoutes);
app.use('/medications', medicationRoutes);
app.use('/doses', doseRoutes);
app.use('/caregivers', caregiverRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
