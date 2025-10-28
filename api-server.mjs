import express from 'express';
import cors from 'cors';
import axios from 'axios'; // <--  : Indispensable pour le proxy
import { getDatabase } from './lib/db-instance.mjs';
import { AnalyticsAPI } from './api/analytics.mjs';
import { ModerationAPI } from './api/moderation.mjs';
import { AuthAPI } from './api/Auth.mjs';

const app = express();
const PORT = process.env.API_PORT || 3002;

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['*'];

app.set('trust proxy', true);

function getRealIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0].trim() ||
         req.headers['x-real-ip'] ||
         req.ip ||
         req.socket?.remoteAddress ||
         'unknown';
}

app.use(cors({
  origin: allowedOrigins.includes('*') ? '*' : (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const db = getDatabase();
const analyticsAPI = new AnalyticsAPI(db);
const moderationAPI = new ModerationAPI(db);
const authAPI = new AuthAPI(db);

// --- ROUTES D'AUTHENTIFICATION ---
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const result = await authAPI.login(username, password);
  res.json(result);
});

// --- ROUTES DES STREAMS (Corrigées et Complètes) ---

// Route pour créer un nouveau flux (si vous en avez besoin plus tard)
app.post('/api/streams', async (req, res) => {
  try {
    const { name, url } = req.body;
    if (!name || !url) {
      return res.status(400).json({ success: false, error: 'Le nom et l\'URL du flux sont requis.' });
    }
    const stmt = await db.prepare('INSERT INTO streams (name, url, created_at) VALUES (?, ?, datetime("now"))');
    await stmt.run(name, url);
    await stmt.finalize();
    res.json({ success: true, stream: { name, url } });
  } catch (error) {
    console.error('Erreur lors de la création du flux:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Route pour lister tous les flux (Corrigée)
app.get('/api/streams', async (req, res) => {
  try {
    const streams = await db.all('SELECT * FROM streams ORDER BY created_at DESC');
    res.json({ success: true, streams });
  } catch (error) {
    console.error('Erreur lors de la récupération des flux:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- NOUVELLE ROUTE PROXY (La solution à votre problème) ---
app.get('/api/proxy-stream', async (req, res) => {
  const targetUrl = req.query.url;

  if (!targetUrl) {
    return res.status(400).send('Le paramètre "url" est requis.');
  }

  try {
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      return res.status(400).send('URL invalide.');
    }

    const response = await axios({
      method: 'get',
      url: targetUrl,
      responseType: 'stream',
    });

    res.setHeader('Content-Type', response.headers['content-type']);
    response.data.pipe(res);

  } catch (error) {
    console.error('Erreur de proxy:', error.message);
    if (error.response) {
      res.status(error.response.status).send(`Erreur distante : ${error.response.statusText}`);
    } else {
      res.status(500).send('Erreur interne du serveur proxy.');
    }
  }
});

// --- ROUTES D'ANALYTICS ---
app.get('/api/analytics/dashboard', async (req, res) => {
  const result = await analyticsAPI.getDashboardStats();
  res.json(result);
});

app.get('/api/analytics/messages', async (req, res) => {
  const period = req.query.period || '7days';
  const result = await analyticsAPI.getMessageStats(period);
  res.json(result);
});

app.get('/api/analytics/activity', async (req, res) => {
  const result = await analyticsAPI.getUserActivityStats();
  res.json(result);
});

app.get('/api/analytics/streams', async (req, res) => {
  const result = await analyticsAPI.getStreamStats();
  res.json(result);
});

app.get('/api/analytics/moderation', async (req, res) => {
  const result = await analyticsAPI.getModerationStats();
  res.json(result);
});

app.get('/api/analytics/logs', async (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  const offset = parseInt(req.query.offset) || 0;
  const result = await analyticsAPI.getActivityLogs(limit, offset);
  res.json(result);
});

// --- ROUTES DE MODÉRATION ---
app.get('/api/moderation/banned', async (req, res) => {
  const result = await moderationAPI.getBannedUsers();
  res.json(result);
});

app.get('/api/moderation/muted', async (req, res) => {
  const result = await moderationAPI.getMutedUsers();
  res.json(result);
});

app.post('/api/moderation/ban', async (req, res) => {
  const { fingerprint, ip, username, reason, duration, adminUsername } = req.body;
  const result = await moderationAPI.banUser(fingerprint, ip, username, reason, duration, adminUsername || 'admin');
  res.json(result);
});

app.post('/api/moderation/unban', async (req, res) => {
  const { fingerprint, ip, adminUsername } = req.body;
  const result = await moderationAPI.unbanUser(fingerprint, ip, adminUsername || 'admin');
  res.json(result);
});

app.post('/api/moderation/mute', async (req, res) => {
  const { fingerprint, username, ip, reason, duration, adminUsername } = req.body;
  const result = await moderationAPI.muteUser(fingerprint, username, ip, reason, duration, adminUsername || 'admin');
  res.json(result);
});

app.post('/api/moderation/unmute', async (req, res) => {
  const { fingerprint, adminUsername } = req.body;
  const result = await moderationAPI.unmuteUser(fingerprint, adminUsername || 'admin');
  res.json(result);
});

app.delete('/api/moderation/message/:id', async (req, res) => {
  const adminUsername = req.body.adminUsername || 'admin';
  const result = await moderationAPI.deleteMessage(req.params.id, adminUsername);
  res.json(result);
});

app.get('/api/moderation/actions', async (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const result = await moderationAPI.getRecentActions(limit);
  res.json(result);
});

app.post('/api/moderation/clear-mutes', async (req, res) => {
  const result = await moderationAPI.clearExpiredMutes();
  res.json(result);
});

// --- ROUTES DU CHAT ---
app.get('/api/chat/messages', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    const streamKey = req.query.streamKey || null;

    let sql = 'SELECT * FROM chat_messages';
    const params = [];

    if (streamKey) {
      sql += ' WHERE stream_key = ?';
      params.push(streamKey);
    }

    sql += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const messages = await db.all(sql, params);
    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/connected-users', async (req, res) => {
  try {
    const users = await db.getConnectedUsers();
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- GESTION DES ERREURS ---
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err);
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

// --- DÉMARRAGE DU SERVEUR ---
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ API Server démarré sur le port ${PORT}`);
});

export default app;
