const express = require('express');
const fs = require('fs');
const cors = require('cors');
const config = require('./config/config');
const sessionRoutes = require('./routes/sessionRoutes');

const app = express();

app.use(express.json());
app.use(cors({
    origin: config.corsOrigins,
    credentials: true,
}));

// Ensure directories exist
if (!fs.existsSync(config.outputFolder)) {
    fs.mkdirSync(config.outputFolder);
}

if (!fs.existsSync(config.dataFolder)) {
    fs.mkdirSync(config.dataFolder);
}

// Routes
app.use('/sessions', sessionRoutes);

app.listen(config.port, () => console.log(`Server running on http://localhost:${config.port}`));