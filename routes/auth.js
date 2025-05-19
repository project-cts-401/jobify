const express = require('express');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const { registerUser, getUserByEmail, updateUserProfile } = require('../database/queries');

const router = express.Router();

// File Upload Setup
const storage = multer.diskStorage({
    destination: './uploads',
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage });

// Middleware to Check Authentication
const requireAuth = (req, res, next) => {
    if (!req.session.user) return res.redirect('/auth/login');
    next();
};

// Login Page
router.get('/login', (req, res) => {
    res.render('login', { user: req.session.user, error: null, success: null });
});

// Login
router.post('/login', async(req, res) => {
    const { email, password } = req.body;
    getUserByEmail(email, async(err, user) => {
        if (err || !user) return res.render('login', { user: null, error: 'Invalid credentials', success: null });
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.render('login', { user: null, error: 'Invalid credentials', success: null });
        req.session.user = { id: user.id, email: user.email, role: user.role };
        res.redirect('/jobs');
    });
});

// Register Page
router.get('/register', (req, res) => {
    res.render('register', { user: req.session.user, error: null, success: null });
});

// Register
router.post('/register', upload.fields([{ name: 'transcript' }, { name: 'resume' }, { name: 'id_doc' }]), async(req, res) => {
    try {
        const { student_number, name, surname, title, email, password, role, gpa, skills } = req.body;
        const transcript_path = req.files.transcript ? req.files.transcript[0].path : null;
        const resume_path = req.files.resume ? req.files.resume[0].path : null;
        const id_path = req.files.id_doc ? req.files.id_doc[0].path : null;
        const hashedPassword = await bcrypt.hash(password, 10);
        registerUser({ student_number, name, surname, title, email, password: hashedPassword, role, gpa, skills, transcript_path, resume_path, id_path },
            (err) => {
                if (err) return res.render('register', { user: null, error: 'User exists or invalid data', success: null });
                res.redirect('/auth/login?success=Registration successful');
            }
        );
    } catch (err) {
        res.render('register', { user: null, error: 'Server error', success: null });
    }
});

// Profile Page
router.get('/profile', requireAuth, (req, res) => {
    getUserByEmail(req.session.user.email, (err, user) => {
        if (err) return res.redirect('/auth/login');
        res.render('profile', { user: req.session.user, profile: user, error: null, success: null });
    });
});

// Update Profile
router.post('/profile', requireAuth, upload.fields([{ name: 'transcript' }, { name: 'resume' }, { name: 'id_doc' }]), (req, res) => {
    const { student_number, name, surname, title, gpa, skills } = req.body;
    const transcript_path = req.files.transcript ? req.files.transcript[0].path : req.body.existing_transcript;
    const resume_path = req.files.resume ? req.files.resume[0].path : req.body.existing_resume;
    const id_path = req.files.id_doc ? req.files.id_doc[0].path : req.body.existing_id;
    updateUserProfile(req.session.user.id, { student_number, name, surname, title, gpa, skills, transcript_path, resume_path, id_path }, (err) => {
        if (err) return res.render('profile', { user: req.session.user, profile: req.session.user, error: 'Update failed', success: null });
        res.redirect('/jobs?success=Profile updated');
    });
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/auth/login');
});

module.exports = router;