const express = require('express');
const cors = require('cors');
const { Log } = require('../logging-middleware/logger');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// log every request coming in
app.use((req, res, next) => {
    Log('backend', 'info', 'handler', `${req.method} ${req.url} - incoming request`);
    next();
});

app.use('/api', notificationRoutes);

// 404 handler
app.use((req, res) => {
    Log('backend', 'warn', 'handler', `404 - route not found: ${req.url}`);
    res.status(404).json({ success: false, message: 'route not found' });
});

// global error handler
app.use((err, req, res, next) => {
    Log('backend', 'error', 'handler', `unhandled error: ${err.message}`);
    res.status(500).json({ success: false, message: 'internal server error' });
});

const PORT = 3000;
app.listen(PORT, () => {
    Log('backend', 'info', 'service', `notification server started on port ${PORT}`);
    console.log(`server running on http://localhost:${PORT}`);
});