const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database/database.db', (err) => {
    if (err) {
        console.error('Database connection error:', err);
        throw err;
    }
    console.log('Connected to SQLite database');
});

// Initialize Schema
db.serialize(() => {
    db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_number TEXT UNIQUE,
      name TEXT,
      surname TEXT,
      title TEXT,
      email TEXT UNIQUE,
      password TEXT,
      role TEXT,
      gpa REAL,
      skills TEXT,
      transcript_path TEXT,
      resume_path TEXT,
      id_path TEXT
    )
  `);
    db.run(`
    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      department TEXT,
      faculty_admin_id INTEGER,
      date_posted TEXT,
      deadline TEXT,
      employment_period TEXT,
      requirements TEXT,
      description TEXT,
      pay REAL,
      working_hours TEXT,
      work_mode TEXT,
      skills_required TEXT,
      positions_available INTEGER,
      pdf_path TEXT,
      FOREIGN KEY(faculty_admin_id) REFERENCES users(id)
    )
  `);
    db.run(`
    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      job_id INTEGER,
      status TEXT,
      score REAL,
      applied_at TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(job_id) REFERENCES jobs(id)
    )
  `);
});

module.exports = db;