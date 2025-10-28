import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import { SERVER_CONFIG } from '../config.mjs';

const app = express();

app.use(cors({
  origin: SERVER_CONFIG.ALLOWED_ORIGINS,
  methods: ['GET', 'HEAD']
}));

app.get('/proxy-stream', async (req, res) => {
  try {
    const streamUrl = req.query.url;
    if (!streamUrl) {
      return res.status(400).json({ error: 'URL manquante' });
    }

    console.log('Proxying stream URL:', streamUrl);

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
          const proxyUrl = `${req.protocol}://${req.get('host')}/proxy-stream?url=${encodeURIComponent(resolved)}`;
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

const PORT = SERVER_CONFIG.API_PORT;
app.listen(PORT, () => {
  console.log(`Proxy serveur démarré sur le port ${PORT}`);
});
