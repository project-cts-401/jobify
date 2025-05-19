const express = require('express');
const { getAdminJobs, getHighScoringApplicants, getJobById } = require('../database/queries');

const router = express.Router();

// Middleware to Check Admin Role
const requireAdmin = (req, res, next) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.redirect('/auth/login?error=Unauthorized access');
    }
    next();
};

// Admin Dashboard: List Jobs Posted by Admin
router.get('/jobs', requireAdmin, (req, res) => {
    getAdminJobs(req.session.user.id, (err, jobs) => {
        if (err) {
            console.error('Error fetching admin jobs:', err);
            return res.render('admin-jobs', {
                user: req.session.user,
                jobs: [],
                error: 'Failed to load jobs',
                success: null
            });
        }
        res.render('admin-jobs', {
            user: req.session.user,
            jobs,
            error: null,
            success: null
        });
    });
});

// View High-Scoring Applicants for a Job
router.get('/jobs/:id/applications', requireAdmin, (req, res) => {
    const job_id = req.params.id;
    const min_score = 80; // "Very good" score threshold
    getHighScoringApplicants(job_id, min_score, (err, applicants) => {
        if (err) {
            console.error('Error fetching applicants:', err);
            return res.render('admin-applicants', {
                user: req.session.user,
                job: null,
                applicants: [],
                error: 'Failed to load applicants',
                success: null
            });
        }
        // Fetch job details for context
        getJobById(job_id, (err, job) => {
            if (err || !job) {
                console.error('Error fetching job:', err);
                return res.render('admin-applicants', {
                    user: req.session.user,
                    job: null,
                    applicants: [],
                    error: 'Job not found',
                    success: null
                });
            }
            res.render('admin-applicants', {
                user: req.session.user,
                job,
                applicants,
                error: null,
                success: null
            });
        });
    });
});

module.exports = router;