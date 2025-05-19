const express = require('express');
const pdfkit = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { createJob, getAllJobs, searchJobs, getUserApplications } = require('../database/queries');

const router = express.Router();

// Middleware to Check Admin Role
const requireAdmin = (req, res, next) => {
    if (!req.session.user || req.session.user.role !== 'admin') return res.redirect('/auth/login');
    next();
};

// Jobs Page (Homepage)
router.get('/', (req, res) => {
    const success = req.query.success || null;
    const error = req.query.error || null;
    getAllJobs((err, jobs) => {
        if (err) return res.render('index', { user: req.session.user, jobs: [], appliedJobIds: [], error: 'Failed to load jobs', success: null });

        // Get applied job IDs for the logged-in user
        if (req.session.user && req.session.user.role === 'student') {
            getUserApplications(req.session.user.id, (err, applications) => {
                if (err) {
                    console.error('Error fetching user applications:', err);
                    return res.render('index', { user: req.session.user, jobs, appliedJobIds: [], error: 'Failed to load applications', success });
                }
                const appliedJobIds = applications.map(app => app.job_id);
                res.render('index', { user: req.session.user, jobs, appliedJobIds, error, success });
            });
        } else {
            res.render('index', { user: req.session.user, jobs, appliedJobIds: [], error, success });
        }
    });
});

// Search Jobs Page
router.get('/search', (req, res) => {
    const filters = req.query;
    searchJobs(filters, (err, jobs) => {
        if (err) return res.render('jobs', { user: req.session.user, jobs: [], appliedJobIds: [], error: 'Search failed', filters, success: null });

        // Get applied job IDs for the logged-in user
        if (req.session.user && req.session.user.role === 'student') {
            getUserApplications(req.session.user.id, (err, applications) => {
                if (err) {
                    console.error('Error fetching user applications:', err);
                    return res.render('jobs', { user: req.session.user, jobs, appliedJobIds: [], error: 'Failed to load applications', filters, success: null });
                }
                const appliedJobIds = applications.map(app => app.job_id);
                res.render('jobs', { user: req.session.user, jobs, appliedJobIds, filters, error: null, success: null });
            });
        } else {
            res.render('jobs', { user: req.session.user, jobs, appliedJobIds: [], filters, error: null, success: null });
        }
    });
});

// Post Job Page
router.get('/post', requireAdmin, (req, res) => {
    res.render('post-job', { user: req.session.user, error: null, success: null });
});

// Post Job
router.post('/post', requireAdmin, async(req, res) => {
    const { title, department, requirements, description, pay, working_hours, work_mode, skills_required, deadline, employment_period, positions_available } = req.body;
    const date_posted = new Date().toISOString();

    // Ensure uploads folder exists
    const uploadsDir = path.join(__dirname, '..', 'Uploads');
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(UploadsDir, { recursive: true });
    }

    // Generate PDF
    const fileName = `job_${Date.now()}.pdf`;
    const pdfPath = path.join(uploadsDir, fileName);
    const relativePdfPath = `Uploads/${fileName}`;

    try {
        const doc = new pdfkit();
        const stream = fs.createWriteStream(pdfPath);
        doc.pipe(stream);
        doc.fontSize(16).text(`Job Title: ${title}`, { align: 'center' });
        doc.fontSize(12).text(`Department: ${department}`);
        doc.text(`Posted: ${new Date(date_posted).toLocaleDateString()}`);
        doc.text(`Deadline: ${new Date(deadline).toLocaleDateString()}`);
        doc.text(`Employment Period: ${employment_period}`);
        doc.text(`Description: ${description}`);
        doc.text(`Requirements: ${requirements}`);
        doc.text(`Pay: R${pay}`);
        doc.text(`Working Hours: ${working_hours}`);
        doc.text(`Work Mode: ${work_mode}`);
        doc.text(`Skills Required: ${skills_required || 'general'}`);
        doc.text(`Positions Available: ${positions_available}`);
        doc.end();

        // Wait for PDF stream to finish
        await new Promise((resolve, reject) => {
            stream.on('finish', resolve);
            stream.on('error', reject);
        });

        // Insert job into database
        createJob({
                title,
                department,
                faculty_admin_id: req.session.user.id,
                date_posted,
                deadline,
                employment_period,
                requirements,
                description,
                pay,
                working_hours,
                work_mode,
                skills_required: skills_required || 'general',
                positions_available,
                pdf_path: relativePdfPath
            },
            (err) => {
                if (err) {
                    console.error('Error creating job:', err);
                    return res.render('post-job', { user: req.session.user, error: 'Failed to post job', success: null });
                }
                res.redirect('/jobs?success=Job posted successfully');
            }
        );
    } catch (err) {
        console.error('Error generating PDF:', err);
        res.render('post-job', { user: req.session.user, error: 'Failed to generate PDF', success: null });
    }
});

module.exports = router;