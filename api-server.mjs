import express from 'express';
import cors from 'cors';
import axios from 'axios'; // <--  : Indispensable pour le proxy
import fetch from 'node-fetch';
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

// Route pour lister tous les flux (avec génération automatique de l'URL proxy)
app.get('/api/streams', async (req, res) => {
  try {
    // 1. Récupère les flux avec leurs URLs originales depuis la BDD
    const streams = await db.all('SELECT * FROM streams ORDER BY created_at DESC');

    // 2. Construit l'URL de base de votre propre backend
    const protocol = req.protocol; // 'https'
    const host = req.get('host');   // 'mon-backend.railway.app'
    const proxyBaseUrl = `${protocol}://${host}`;

    // 3. Transforme chaque flux pour remplacer son URL par une URL de proxy
    const transformedStreams = streams.map(stream => {
      const originalUrl = stream.url; // ex: "http://194.62.214.70/..."
      const proxyUrl = `${proxyBaseUrl}/api/proxy-stream?url=${encodeURIComponent(originalUrl)}`;
      
      // Retourne un nouvel objet avec l'URL du proxy
      return { ...stream, url: proxyUrl };
    });

    // 4. Envoie la liste des flux avec les URLs de proxy au frontend
    res.json({ success: true, streams: transformedStreams });

  } catch (error) {
    console.error('Erreur lors de la récupération des flux:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- NOUVELLE ROUTE PROXY (La solution à votre problème) ---
app.get('/api/proxy-stream', async (req, res) => {
  try {
    const streamUrl = req.query.url;
    if (!streamUrl) {
      return res.status(400).json({ error: 'URL manquante' });
    }

    // Forward Range header if present (important pour les segments / seek)
    const forwardHeaders = {};
    const range = req.header('range');
    if (range) forwardHeaders['range'] = range;

    const response = await fetch(streamUrl, { headers: forwardHeaders, redirect: 'follow' });

    if (!response.ok && response.status !== 206) {
      // 206 is partial content and ok
      return res.status(response.status).json({ error: `Erreur flux: ${response.statusText}` });
    }

    const contentType = response.headers.get('content-type') || '';
    const isM3U8 = contentType.includes('application/vnd.apple.mpegurl') ||
                   contentType.includes('application/x-mpegURL') ||
                   /\.m3u8($|\?)/i.test(streamUrl);

    // Si c'est une playlist m3u8 --> lire, réécrire les URLs et renvoyer la playlist proxied
    if (isM3U8) {
      const text = await response.text();
      const lines = text.split(/\r?\n/);

      const proxied = lines.map((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return line; // directive ou commentaire

        try {
          // Résolution des URLs relatives par rapport à la playlist source
          const resolved = new URL(trimmed, streamUrl).href;
          // Construire l'URL proxifiée qui utilise le même host/protocole que le client appelant
          const proxyUrl = `${req.protocol}://${req.get('host')}/api/proxy-stream?url=${encodeURIComponent(resolved)}`;
          return proxyUrl;
        } catch (e) {
          return line;
        }
      }).join('\n');

      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl; charset=utf-8');
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
      return res.status(200).send(proxied);
    }

    // Pour les segments (ts, mp4, etc.) : streamer en binaire en transférant les headers importants
    // Propager status (200 or 206), content-type, content-length, accept-ranges, content-range si présent
    const status = response.status;
    res.status(status);

    const headersToCopy = ['content-type', 'content-length', 'accept-ranges', 'content-range', 'cache-control', 'etag'];
    headersToCopy.forEach(h => {
      const v = response.headers.get(h);
      if (v) res.setHeader(h, v);
    });

    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');

    // Pipe le body vers le client
    const body = response.body;
    if (body) {
      body.pipe(res);
    } else {
      // fallback: read buffer and send
      const buffer = await response.buffer();
      res.send(buffer);
    }
  } catch (error) {
    console.error('Erreur proxy:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Erreur serveur' });
    else res.end();
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
