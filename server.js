/**
 * Weather Dashboard — Auth backend
 * Register, login, and optional /me for session check.
 * Users stored in users.json (created automatically). Passwords hashed with bcrypt; JWT for tokens.
 */

const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3001;
const USERS_FILE = path.join(__dirname, 'users.json');
const JWT_SECRET = process.env.JWT_SECRET || 'weather-dashboard-secret-change-in-production';
const JWT_EXPIRES = '7d';

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

function readUsers() {
  try {
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    if (e.code === 'ENOENT') return {};
    throw e;
  }
}

function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// POST /api/register — create account
app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body || {};
  const n = (name || '').trim();
  const e = (email || '').trim().toLowerCase();
  const p = password;

  if (!e || !p) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  if (p.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  const users = readUsers();
  if (users[e]) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }

  const hashed = await bcrypt.hash(p, 10);
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
  users[e] = { id, name: n || e, email: e, passwordHash: hashed };
  writeUsers(users);

  const token = jwt.sign({ userId: id, email: e }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
  res.status(201).json({
    user: { id, name: users[e].name, email: e },
    token,
  });
});

// POST /api/login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body || {};
  const e = (email || '').trim().toLowerCase();
  const p = password;

  if (!e || !p) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const users = readUsers();
  const record = users[e];
  if (!record) {
    return res.status(401).json({ error: 'No account with this email. Please register first.' });
  }

  const ok = await bcrypt.compare(p, record.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = jwt.sign({ userId: record.id, email: e }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
  res.json({
    user: { id: record.id, name: record.name, email: record.email },
    token,
  });
});

// GET /api/me — return current user when token is valid (optional, for refresh)
app.get('/api/me', authMiddleware, (req, res) => {
  const users = readUsers();
  const user = Object.values(users).find((u) => u.id === req.userId);
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }
  res.json({ user: { id: user.id, name: user.name, email: user.email } });
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Weather Dashboard API running at http://localhost:${PORT}`);
});
