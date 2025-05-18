const express = require('express');
const nodemailer = require('nodemailer');
const { createApplication, getJobById, getUserById } = require('../database/queries');

const router = express.Router();

// Nodemailer Setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'your-email@gmail.com', // Replace with your email
        pass: 'your-app-password' // Replace with your app-specific password
    }
});

// Middleware to Check Student Role
const requireStudent = (req, res, next) => {
    if (!req.session.user || req.session.user.role !== 'student') return res.redirect('/auth/login');
    next();
};

// Apply for a Job
router.post('/', requireStudent, (req, res) => {
    const { job_id } = req.body;
    const user_id = req.session.user.id;
    const applied_at = new Date().toISOString();

    getJobById(job_id, (err, job) => {
        if (err || !job) return res.redirect('/jobs?error=Job not found');
        const now = new Date();
        const deadline = new Date(job.deadline);
        if (now > deadline) return res.redirect('/jobs?error=Application deadline passed');
        if (job.accepted_count >= job.positions_available) return res.redirect('/jobs?error=Positions filled');

        getUserById(user_id, (err, user) => {
            if (err) return res.redirect('/jobs?error=User not found');
            const skillsMatch = job.skills_required.split(',').filter(s => user.skills.split(',').includes(s)).length;
            const score = (user.gpa * 20) + (skillsMatch * 15); // Simplified AI scoring

            createApplication({ user_id, job_id, status: 'pending', score, applied_at },
                (err) => {
                    if (err) return res.redirect('/jobs?error=Application failed');
                    transporter.sendMail({
                        from: 'your-email@gmail.com',
                        to: user.email,
                        subject: 'Application Submitted',
                        text: `Your application for ${job.title} has been submitted.`
                    });
                    res.redirect('/jobs?success=Application submitted');
                }
            );
        });
    });
});

module.exports = router;