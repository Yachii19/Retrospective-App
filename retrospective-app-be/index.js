const express = require('express');
const fs = require('fs');
const cors = require('cors');
const config = require('./config/config');
const sessionRoutes = require('./routes/sessionRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();

app.use(express.json());
app.use(cors({
    origin: config.corsOrigins,
    credentials: true,
}));

if (!fs.existsSync(config.outputFolder)) {
    fs.mkdirSync(config.outputFolder);
}

if (!fs.existsSync(config.dataFolder)) {
    fs.mkdirSync(config.dataFolder);
}

app.use('/sessions', sessionRoutes);
app.use('/feedback', feedbackRoutes);
app.use('/auth', authRoutes);

app.listen(config.port, () => console.log(`Server running on http://localhost:${config.port}`));