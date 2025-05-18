const express = require('express');
const pdfkit = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { createJob, getAllJobs, searchJobs } = require('../database/queries');

const router = express.Router();

// Middleware to Check Admin Role
const requireAdmin = (req, res, next) => {
    if (!req.session.user || req.session.user.role !== 'admin') return res.redirect('/auth/login');
    next();
};

// Jobs Page (Homepage)
router.get('/', (req, res) => {
    getAllJobs((err, jobs) => {
        if (err) return res.render('index', { user: req.session.user, jobs: [], error: 'Failed to load jobs' });
        res.render('index', { user: req.session.user, jobs, error: null });
    });
});

// Search Jobs Page
router.get('/search', (req, res) => {
    const filters = req.query;
    searchJobs(filters, (err, jobs) => {
        if (err) return res.render('jobs', { user: req.session.user, jobs: [], error: 'Search failed' });
        res.render('jobs', { user: req.session.user, jobs, filters, error: null });
    });
});

// Post Job Page
router.get('/post', requireAdmin, (req, res) => {
    res.render('post-job', { user: req.session.user, error: null });
});

// Post Job
router.post('/post', requireAdmin, async(req, res) => {
    const { title, department, requirements, description, pay, working_hours, work_mode, skills_required, deadline, employment_period, positions_available } = req.body;
    const date_posted = new Date().toISOString();

    // Generate PDF
    const pdfPath = path.join(__dirname, '..', 'uploads', `job_${Date.now()}.pdf`);
    const doc = new pdfkit();
    doc.pipe(fs.createWriteStream(pdfPath));
    doc.fontSize(16).text(`Job Title: ${title}`, { align: 'center' });
    doc.fontSize(12).text(`Department: ${department}`);
    doc.text(`Posted: ${date_posted}`);
    doc.text(`Deadline: ${deadline}`);
    doc.text(`Employment Period: ${employment_period}`);
    doc.text(`Description: ${description}`);
    doc.text(`Requirements: ${requirements}`);
    doc.text(`Pay: R${pay}`);
    doc.text(`Working Hours: ${working_hours}`);
    doc.text(`Work Mode: ${work_mode}`);
    doc.text(`Skills Required: ${skills_required}`);
    doc.text(`Positions Available: ${positions_available}`);
    doc.end();

    createJob({ title, department, faculty_admin_id: req.session.user.id, date_posted, deadline, employment_period, requirements, description, pay, working_hours, work_mode, skills_required, positions_available, pdf_path: pdfPath },
        (err) => {
            if (err) return res.render('post-job', { user: req.session.user, error: 'Failed to post job' });
            res.redirect('/jobs');
        }
    );
});

module.exports = router;