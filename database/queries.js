const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/database.db');

const registerUser = (user, callback) => {
    const query = `INSERT INTO users (student_number, name, surname, title, email, password, role, gpa, skills, transcript_path, resume_path, id_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    db.run(query, [
        user.student_number, user.name, user.surname, user.title, user.email, user.password, user.role,
        user.gpa, user.skills, user.transcript_path, user.resume_path, user.id_path
    ], callback);
};

const getUserByEmail = (email, callback) => {
    db.get(`SELECT * FROM users WHERE email = ?`, [email], callback);
};

const getUserById = (id, callback) => {
    db.get(`SELECT * FROM users WHERE id = ?`, [id], callback);
};

const createJob = (job, callback) => {
    const query = `INSERT INTO jobs (title, department, faculty_admin_id, date_posted, deadline, employment_period, requirements, description, pay, working_hours, work_mode, skills_required, positions_available, pdf_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    db.run(query, [
        job.title, job.department, job.faculty_admin_id, job.date_posted, job.deadline,
        job.employment_period, job.requirements, job.description, job.pay, job.working_hours,
        job.work_mode, job.skills_required || 'general', job.positions_available, job.pdf_path
    ], callback);
};

const getAllJobs = (callback) => {
    db.all(`SELECT j.*, u.name as admin_name FROM jobs j LEFT JOIN users u ON j.faculty_admin_id = u.id`, callback);
};

const getJobById = (id, callback) => {
    db.get(`SELECT * FROM jobs WHERE id = ?`, [id], callback);
};

const searchJobs = (filters, callback) => {
    let query = `SELECT j.*, u.name as admin_name FROM jobs j LEFT JOIN users u ON j.faculty_admin_id = u.id WHERE 1=1`;
    const params = [];
    if (filters.query) {
        query += ` AND (j.title LIKE ? OR j.description LIKE ?)`;
        params.push(`%${filters.query}%`, `%${filters.query}%`);
    }
    if (filters.department) {
        query += ` AND j.department LIKE ?`;
        params.push(`%${filters.department}%`);
    }
    if (filters.work_mode) {
        query += ` AND j.work_mode = ?`;
        params.push(filters.work_mode);
    }
    if (filters.min_pay) {
        query += ` AND j.pay >= ?`;
        params.push(filters.min_pay);
    }
    if (filters.skills) {
        const skills = filters.skills.split(',').map(s => s.trim());
        skills.forEach(skill => {
            query += ` AND j.skills_required LIKE ?`;
            params.push(`%${skill}%`);
        });
    }
    db.all(query, params, callback);
};

const createApplication = (application, callback) => {
    const query = `INSERT INTO applications (user_id, job_id, status, score, applied_at) VALUES (?, ?, ?, ?, ?)`;
    db.run(query, [
        application.user_id, application.job_id, application.status, application.score, application.applied_at
    ], callback);
};

const getUserApplications = (user_id, callback) => {
    db.all(`
    SELECT a.*, j.title, j.department, j.pdf_path
    FROM applications a
    JOIN jobs j ON a.job_id = j.id
    WHERE a.user_id = ?
    ORDER BY a.applied_at DESC
  `, [user_id], callback);
};

const withdrawApplication = (application_id, user_id, callback) => {
    db.run(
        `UPDATE applications SET status = 'withdrawn' WHERE id = ? AND user_id = ? AND status = 'pending'`, [application_id, user_id],
        (err) => {
            if (err) return callback(err);
            if (this.changes === 0) return callback(new Error('Application not found or cannot be withdrawn'));
            callback(null);
        }
    );
};

const hasApplied = (user_id, job_id, callback) => {
    db.get(
        `SELECT 1 FROM applications WHERE user_id = ? AND job_id = ?`, [user_id, job_id],
        (err, row) => {
            if (err) return callback(err);
            callback(null, !!row);
        }
    );
};

const updateUserProfile = (user_id, profile, callback) => {
    const query = `
    UPDATE users 
    SET 
      student_number = ?,
      name = ?,
      surname = ?,
      title = ?,
      gpa = ?,
      skills = ?,
      transcript_path = ?,
      resume_path = ?,
      id_path = ?
    WHERE id = ?
  `;
    db.run(query, [
        profile.student_number,
        profile.name,
        profile.surname,
        profile.title,
        profile.gpa,
        profile.skills,
        profile.transcript_path,
        profile.resume_path,
        profile.id_path,
        user_id
    ], (err) => {
        if (err) return callback(err);
        if (this.changes === 0) return callback(new Error('User not found or no changes made'));
        callback(null);
    });
};

const getAdminJobs = (admin_id, callback) => {
    db.all(`
    SELECT j.*, 
           (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) as application_count
    FROM jobs j
    WHERE j.faculty_admin_id = ?
    ORDER BY j.date_posted DESC
  `, [admin_id], callback);
};

const getHighScoringApplicants = (job_id, min_score, callback) => {
    db.all(`
    SELECT a.id as application_id, a.score, a.status, a.applied_at,
           u.student_number, u.name, u.surname, u.gpa, u.skills,
           u.transcript_path, u.resume_path, u.id_path
    FROM applications a
    JOIN users u ON a.user_id = u.id
    WHERE a.job_id = ? AND a.score >= ?
    ORDER BY a.score DESC
  `, [job_id, min_score], callback);
};

module.exports = {
    registerUser,
    getUserByEmail,
    getUserById,
    createJob,
    getAllJobs,
    getJobById,
    searchJobs,
    updateUserProfile,
    createApplication,
    getUserApplications,
    withdrawApplication,
    hasApplied,
    getAdminJobs,
    getHighScoringApplicants
};