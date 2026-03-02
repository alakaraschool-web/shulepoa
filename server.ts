import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

// Initialize database tables
db.exec(`
  CREATE TABLE IF NOT EXISTS store (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// For marks, we need a specific table to prevent race conditions
db.exec(`
  CREATE TABLE IF NOT EXISTS marks (
    id TEXT PRIMARY KEY,
    examId TEXT,
    studentId TEXT,
    subject TEXT,
    assessments TEXT,
    total REAL,
    percentage REAL,
    grade TEXT,
    updatedAt TEXT
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // Generic Key-Value Store API
  app.get('/api/store/:key', (req, res) => {
    const row = db.prepare('SELECT value FROM store WHERE key = ?').get(req.params.key) as any;
    if (row) {
      res.json(JSON.parse(row.value));
    } else {
      res.json(null);
    }
  });

  app.post('/api/store/:key', (req, res) => {
    const { key } = req.params;
    const value = JSON.stringify(req.body);
    db.prepare('INSERT INTO store (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, value);
    res.json({ success: true });
  });

  // Marks API to prevent race conditions
  app.get('/api/marks', (req, res) => {
    const rows = db.prepare('SELECT * FROM marks').all() as any[];
    const marks = rows.map(row => ({
      ...row,
      assessments: JSON.parse(row.assessments)
    }));
    res.json(marks);
  });

  app.post('/api/marks', (req, res) => {
    const marks = req.body; // Array of marks to upsert
    const stmt = db.prepare(`
      INSERT INTO marks (id, examId, studentId, subject, assessments, total, percentage, grade, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        assessments = excluded.assessments,
        total = excluded.total,
        percentage = excluded.percentage,
        grade = excluded.grade,
        updatedAt = excluded.updatedAt
    `);
    
    const deleteStmt = db.prepare('DELETE FROM marks WHERE id = ?');

    db.transaction(() => {
      for (const mark of marks) {
        if (mark._delete) {
          deleteStmt.run(mark.id);
        } else {
          stmt.run(
            mark.id,
            mark.examId,
            mark.studentId,
            mark.subject,
            JSON.stringify(mark.assessments),
            mark.total,
            mark.percentage,
            mark.grade,
            mark.updatedAt
          );
        }
      }
    })();
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
