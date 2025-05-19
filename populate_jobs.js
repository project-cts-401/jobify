const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { createJob } = require('./database/queries');

// Connect to the SQLite database
const db = new sqlite3.Database('./database/database.db', (err) => {
    if (err) {
        console.error('Database connection error:', err);
        throw err;
    }
    console.log('Connected to SQLite database');
});

// Sample jobs data
const sampleJobs = [{
        title: 'Library Assistant',
        department: 'Library Services',
        faculty_admin_id: 1,
        date_posted: new Date().toISOString(),
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        employment_period: '6 months',
        requirements: 'Basic computer skills, attention to detail',
        description: 'Assist with book shelving, student inquiries, and library operations.',
        pay: 50.0,
        working_hours: '20 hours/week',
        work_mode: 'onsite',
        skills_required: 'organization,communication', // Ensure non-empty
        positions_available: 3,
        pdf_path: path.join(__dirname, 'Uploads', 'job_library_assistant.pdf')
    },
    {
        title: 'IT Support Technician',
        department: 'Information Technology',
        faculty_admin_id: 1,
        date_posted: new Date().toISOString(),
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        employment_period: '3 months',
        requirements: 'Knowledge of Windows, networking basics',
        description: 'Provide technical support for campus computers and networks.',
        pay: 70.0,
        working_hours: '15 hours/week',
        work_mode: 'hybrid',
        skills_required: 'troubleshooting,technical support', // Ensure non-empty
        positions_available: 2,
        pdf_path: path.join(__dirname, 'Uploads', 'job_it_technician.pdf')
    },
    {
        title: 'Research Assistant',
        department: 'Faculty of Science',
        faculty_admin_id: 1,
        date_posted: new Date().toISOString(),
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        employment_period: '12 months',
        requirements: 'Enrolled in a science program, research skills',
        description: 'Support faculty research projects with data collection and analysis.',
        pay: 60.0,
        working_hours: '10 hours/week',
        work_mode: 'remote',
        skills_required: 'data analysis,report writing', // Ensure non-empty
        positions_available: 1,
        pdf_path: path.join(__dirname, 'Uploads', 'job_research_assistant.pdf')
    }
];

// Function to generate placeholder PDFs
const pdfkit = require('pdfkit');
const fs = require('fs');

function generatePlaceholderPDF(job) {
    const doc = new pdfkit();
    doc.pipe(fs.createWriteStream(job.pdf_path));
    doc.fontSize(16).text(`Job Title: ${job.title}`, { align: 'center' });
    doc.fontSize(12).text(`Department: ${job.department}`);
    doc.text(`Posted: ${job.date_posted}`);
    doc.text(`Deadline: ${job.deadline}`);
    doc.text(`Employment Period: ${job.employment_period}`);
    doc.text(`Description: ${job.description}`);
    doc.text(`Requirements: ${job.requirements}`);
    doc.text(`Pay: R${job.pay}`);
    doc.text(`Working Hours: ${job.working_hours}`);
    doc.text(`Work Mode: ${job.work_mode}`);
    doc.text(`Skills Required: ${job.skills_required || 'general'}`);
    doc.text(`Positions Available: ${job.positions_available}`);
    doc.end();
}

// Insert jobs into the database
async function populateJobs() {
    try {
        // Ensure the Uploads folder exists
        if (!fs.existsSync(path.join(__dirname, 'Uploads'))) {
            fs.mkdirSync(path.join(__dirname, 'Uploads'));
        }

        // Generate placeholder PDFs for each job
        sampleJobs.forEach(job => generatePlaceholderPDF(job));

        // Insert each job
        for (const job of sampleJobs) {
            await new Promise((resolve, reject) => {
                createJob(job, (err) => {
                    if (err) {
                        console.error(`Error inserting job ${job.title}:`, err);
                        reject(err);
                    } else {
                        console.log(`Inserted job: ${job.title}`);
                        resolve();
                    }
                });
            });
        }
        console.log('All jobs populated successfully');
    } catch (err) {
        console.error('Error populating jobs:', err);
    } finally {
        db.close((err) => {
            if (err) console.error('Error closing database:', err);
            console.log('Database connection closed');
        });
    }
}

// Run the population script
populateJobs();