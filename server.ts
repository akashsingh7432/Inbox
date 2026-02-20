import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database("mail.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT
  );

  CREATE TABLE IF NOT EXISTS emails (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender TEXT,
    recipient TEXT,
    subject TEXT,
    body TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    folder TEXT DEFAULT 'inbox', -- inbox, sent, drafts, bin
    is_important INTEGER DEFAULT 0,
    is_read INTEGER DEFAULT 0
  );
`);

// Seed some data if empty
const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
if (userCount.count === 0) {
  db.prepare("INSERT INTO users (email, password) VALUES (?, ?)").run("user@example.com", "password123");
  
  const seedEmails = [
    { sender: "google@google.com", recipient: "user@example.com", subject: "Welcome to your new mail", body: "This is a clean, minimal email client built just for you.", folder: "inbox" },
    { sender: "newsletter@tech.com", recipient: "user@example.com", subject: "Weekly Tech Update", body: "Here are the latest trends in web development...", folder: "inbox" },
    { sender: "user@example.com", recipient: "friend@gmail.com", subject: "Project Update", body: "Hey, just wanted to let you know the project is on track.", folder: "sent" },
    { sender: "system@mail.com", recipient: "user@example.com", subject: "Security Alert", body: "A new device logged into your account.", folder: "inbox", is_important: 1 },
  ];

  const insertEmail = db.prepare("INSERT INTO emails (sender, recipient, subject, body, folder, is_important) VALUES (?, ?, ?, ?, ?, ?)");
  seedEmails.forEach(e => insertEmail.run(e.sender, e.recipient, e.subject, e.body, e.folder, e.is_important || 0));
}

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // Auth API (Simple for demo)
  app.post("/api/login", (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ? AND password = ?").get(email, password);
    if (user) {
      res.json({ success: true, user: { email: user.email } });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  });

  // Emails API
  app.get("/api/emails", (req, res) => {
    const { folder, search } = req.query;
    let query = "SELECT * FROM emails WHERE 1=1";
    const params = [];

    if (folder && folder !== 'all') {
      query += " AND folder = ?";
      params.push(folder);
    }
    
    if (search) {
      query += " AND (subject LIKE ? OR body LIKE ? OR sender LIKE ?)";
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    query += " ORDER BY timestamp DESC";
    const emails = db.prepare(query).all(...params);
    res.json(emails);
  });

  app.post("/api/emails", (req, res) => {
    const { recipient, subject, body, folder = 'sent' } = req.body;
    const sender = "user@example.com"; // Hardcoded for this personal app
    const result = db.prepare("INSERT INTO emails (sender, recipient, subject, body, folder) VALUES (?, ?, ?, ?, ?)")
      .run(sender, recipient, subject, body, folder);
    res.json({ success: true, id: result.lastInsertRowid });
  });

  app.patch("/api/emails/:id", (req, res) => {
    const { id } = req.params;
    const { folder, is_important, is_read } = req.body;
    
    const updates = [];
    const params = [];
    
    if (folder !== undefined) { updates.push("folder = ?"); params.push(folder); }
    if (is_important !== undefined) { updates.push("is_important = ?"); params.push(is_important ? 1 : 0); }
    if (is_read !== undefined) { updates.push("is_read = ?"); params.push(is_read ? 1 : 0); }
    
    if (updates.length > 0) {
      params.push(id);
      db.prepare(`UPDATE emails SET ${updates.join(", ")} WHERE id = ?`).run(...params);
    }
    
    res.json({ success: true });
  });

  app.delete("/api/emails/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM emails WHERE id = ?").run(id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
