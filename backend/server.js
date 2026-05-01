const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const http     = require('http');
const { Server } = require('socket.io');
const cookieParser = require('cookie-parser');
const helmet   = require('helmet');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// In production, you must set CLIENT_ORIGIN correctly (e.g., https://yourfrontend.com)
const clientOrigins = process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN.split(',') : ['http://localhost:5173'];

const io = new Server(server, {
  cors: { origin: clientOrigins, methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'], credentials: true }
});

// Pass io to all routes via app.set
app.set('io', io);

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cookieParser());
app.use(cors({
  origin: clientOrigins,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// ── MongoDB connection (cached across serverless warm invocations) ────────────
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) console.error('❌  MONGO_URI is not set in environment variables.');

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;
  await mongoose.connect(MONGO_URI);
  isConnected = true;
  console.log('✅  MongoDB connected');
};

// Lazy-connect middleware — must be registered BEFORE routes so every
// incoming request (including on serverless cold starts) gets a live DB.
app.use(async (_req, _res, next) => {
  try { await connectDB(); next(); }
  catch (err) { next(err); }
});

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/cars',     require('./routes/cars'));
app.use('/api/admin',    require('./routes/admin'));
app.use('/api/mechanic', require('./routes/mechanic'));

// ── Root health-check ────────────────────────────────────────────────────────
app.get('/', (_req, res) => res.json({ message: 'Toyota Workshop API is running 🚗' }));

// ── Start HTTP server (works for both local dev and Railway/production) ──────
const PORT = process.env.PORT || 5000;
connectDB()
  .then(() => server.listen(PORT, () => console.log(`🚀  Server running on port ${PORT}`)))
  .catch((err) => { console.error('❌  DB connection error:', err.message); process.exit(1); });

// ── Export app (kept for compatibility) ──────────────────────────────────────
module.exports = app;
