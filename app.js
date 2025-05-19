const express = require('express');
const path = require('path');
const session = require('express-session');
const ejsLayouts = require('express-ejs-layouts');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const jobsRoutes = require('./routes/jobs');
const applicationsRoutes = require('./routes/applications');
const adminRoutes = require('./routes/admin');

const app = express();

// Middleware
app.set('view engine', 'ejs');
app.use(ejsLayouts);
app.set('layout', 'layout');
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));
app.use(express.static('Uploads'));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

// Routes
app.use('/auth', authRoutes);
app.use('/jobs', jobsRoutes);
app.use('/applications', applicationsRoutes);
app.use('/admin', adminRoutes);

// Home Route
app.get('/', (req, res) => {
    res.redirect('/jobs');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`http://localhost:${PORT}`));