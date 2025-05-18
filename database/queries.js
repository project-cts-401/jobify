const db = require('./db');

const registerUser = (user, callback) => {
    const { student_number, name, surname, title, email, password, role, gpa, skills, transcript_path, resume_path, id_path } = user;
    db.run(
        `INSERT INTO users (student_number, name, surname, title, email, password, role, gpa, skills, transcript_path, resume_path, id_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [student_number, name, surname, title, email, password, role, gpa, skills, transcript_path, resume_path, id_path],
        callback
    );
};

const findUserByEmail = (email, callback) => {
    db.get(`SELECT * FROM users WHERE email = ?`, [email], callback);
};

const updateUserProfile = (id, user, callback) => {
    const { student_number, name, surname, title, gpa, skills, transcript_path, resume_path, id_path } = user;
    db.run(
        `UPDATE users SET student_number = ?, name = ?, surname = ?, title = ?, gpa = ?, skills = ?, transcript_path = ?, resume_path = ?, id_path = ? WHERE id = ?`, [student_number, name, surname, title, gpa, skills, transcript_path, resume_path, id_path, id],
        callback
    );
};

const createJob = (job, callback) => {
    const { title, department, faculty_admin_id, date_posted, deadline, employment_period, requirements, description, pay, working_hours, work_mode, skills_required, positions_available, pdf_path } = job;
    db.run(
        `INSERT INTO jobs (title, department, faculty_admin_id, date_posted, deadline, employment_period, requirements, description, pay, working_hours, work_mode, skills_required, positions_available, pdf_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [title, department, faculty_admin_id, date_posted, deadline, employment_period, requirements, description, pay, working_hours, work_mode, skills_required, positions_available, pdf_path],
        callback
    );
};

const getAllJobs = (callback) => {
    db.all(`SELECT j.*, u.name as admin_name FROM jobs j LEFT JOIN users u ON j.faculty_admin_id = u.id`, callback);
};

const searchJobs = (filters, callback) => {
    const { query, department, work_mode, min_pay, skills } = filters;
    let sql = `SELECT j.*, u.name as admin_name FROM jobs j LEFT JOIN users u ON j.faculty_admin_id = u.id WHERE 1=1`;
    const params = [];
    if (query) {
        sql += ` AND (j.title LIKE ? OR j.description LIKE ?)`;
        params.push(`%${query}%`, `%${query}%`);
    }
    if (department) {
        sql += ` AND j.department = ?`;
        params.push(department);
    }
    if (work_mode) {
        sql += ` AND j.work_mode = ?`;
        params.push(work_mode);
    }
    if (min_pay) {
        sql += ` AND j.pay >= ?`;
        params.push(min_pay);
    }
    if (skills) {
        sql += ` AND j.skills_required LIKE ?`;
        params.push(`%${skills}%`);
    }
    db.all(sql, params, callback);
};

const createApplication = (application, callback) => {
    const { user_id, job_id, status, score, applied_at } = application;
    db.run(
        `INSERT INTO applications (user_id, job_id, status, score, applied_at) VALUES (?, ?, ?, ?, ?)`, [user_id, job_id, status, score, applied_at],
        callback
    );
};

const getJobById = (job_id, callback) => {
    db.get(
        `SELECT deadline, positions_available, (SELECT COUNT(*) FROM applications WHERE job_id = ? AND status = 'accepted') as accepted_count FROM jobs WHERE id = ?`, [job_id, job_id],
        callback
    );
};

const getUserById = (user_id, callback) => {
    db.get(`SELECT gpa, skills, student_number, name, surname, title, transcript_path, resume_path FROM users WHERE id = ?`, [user_id], callback);
};

module.exports = {
    registerUser,
    findUserByEmail,
    updateUserProfile,
    createJob,
    getAllJobs,
    searchJobs,
    createApplication,
    getJobById,
    getUserById,
};