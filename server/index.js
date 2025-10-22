const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

// Import only the route files we have fully implemented
const authRoutes = require('./routes/authRoutes.js');
const dashboardRoutes = require('./routes/dashboardRoutes.js');
const clientRoutes = require('./routes/clientRoutes.js');
const wasteRoutes = require('./routes/wasteRoutes.js');
const logisticRoutes = require('./routes/logisticRoutes.js');
const masterRoutes = require('./routes/masterRoutes.js');
const reportRoutes = require('./routes/reportRoutes.js');
const settingsRoutes = require('./routes/settingsRoutes.js');
const recyclingProcessRoutes = require('./routes/recyclingProcessRoutes.js');
const userRoutes = require('./routes/userRoutes.js');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// --- Middleware ---
// CORS configuration
app.use(cors({
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT'],
}));

app.use(express.json());

// --- API Routes ---
// Only include the authentication routes for now
app.use('/api/master-data', masterRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/waste-data', wasteRoutes);
app.use('/api/logistics', logisticRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/recycling-processes', recyclingProcessRoutes);
app.use('/api/users', userRoutes);




// A simple test route to confirm the server is running
app.get('/', (req, res) => {
  res.send('Waste Reporting API is running...');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});