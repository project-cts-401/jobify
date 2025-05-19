const express = require('express');
const nodemailer = require('nodemailer');
const { createApplication, getJobById, getUserById, getUserApplications, withdrawApplication, hasApplied } = require('../database/queries');

const router = express.Router();

// Nodemailer Setup
console.log('Nodemailer credentials:', {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS ? '[REDACTED]' : undefined
});
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
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

    // Check if user has already applied
    hasApplied(user_id, job_id, (err, applied) => {
        if (err) {
            console.error('Error checking application:', err);
            return res.redirect('/jobs?error=Failed to process application');
        }
        if (applied) {
            return res.redirect('/jobs?error=You have already applied for this job');
        }

        getJobById(job_id, (err, job) => {
            if (err || !job) return res.redirect('/jobs?error=Job not found');
            const now = new Date();
            const deadline = new Date(job.deadline);
            if (now > deadline) return res.redirect('/jobs?error=Application deadline passed');
            if (job.accepted_count >= job.positions_available) return res.redirect('/jobs?error=Positions filled');

            getUserById(user_id, (err, user) => {
                if (err || !user) return res.redirect('/jobs?error=User not found');

                // Handle undefined or empty skills
                const jobSkills = (job.skills_required || '').split(',').filter(s => s.trim());
                const userSkills = (user.skills || '').split(',').filter(s => s.trim());
                const skillsMatch = jobSkills.filter(s => userSkills.includes(s)).length;
                const score = (user.gpa * 20) + (skillsMatch * 15); // Simplified AI scoring

                createApplication({ user_id, job_id, status: 'pending', score, applied_at },
                    (err) => {
                        if (err) {
                            console.error('Error creating application:', err);
                            return res.redirect('/jobs?error=Application failed');
                        }
                        // Send email asynchronously
                        transporter.sendMail({
                            from: process.env.EMAIL_USER,
                            to: user.email,
                            subject: 'Application Submitted',
                            text: `Your application for ${job.title} has been submitted.`
                        }, (emailErr) => {
                            if (emailErr) console.error('Error sending email:', emailErr);
                        });
                        res.redirect('/jobs?success=Application submitted');
                    }
                );
            });
        });
    });
});

// My Applications Page
router.get('/my-applications', requireStudent, (req, res) => {
    const user_id = req.session.user.id;
    getUserApplications(user_id, (err, applications) => {
        if (err) {
            console.error('Error fetching applications:', err);
            return res.render('my-applications', {
                user: req.session.user,
                applications: [],
                error: 'Failed to load applications',
                success: null
            });
        }
        res.render('student-applications', {
            user: req.session.user,
            applications,
            error: null,
            success: req.query.success || null
        });
    });
});

// Withdraw Application
router.post('/withdraw', requireStudent, (req, res) => {
    const { application_id } = req.body;
    const user_id = req.session.user.id;

    withdrawApplication(application_id, user_id, (err) => {
        if (err) {
            console.error('Error withdrawing application:', err);
            return res.redirect('/applications/my-applications?error=Failed to withdraw application');
        }
        // Send withdrawal confirmation email
        getUserById(user_id, (err, user) => {
            if (!err && user) {
                transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: user.email,
                    subject: 'Application Withdrawn',
                    text: 'Your application has been successfully withdrawn.'
                }, (emailErr) => {
                    if (emailErr) console.error('Error sending withdrawal email:', emailErr);
                });
            }
        });
        res.redirect('/applications/my-applications?success=Application withdrawn successfully');
    });
});

module.exports = router;