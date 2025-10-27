import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import { SERVER_CONFIG } from '../config.mjs';

const app = express();

app.use(cors({
  origin: SERVER_CONFIG.ALLOWED_ORIGINS,
  methods: ['GET']
}));

app.get('/proxy-stream', async (req, res) => {
  try {
    const streamUrl = req.query.url;
    
    if (!streamUrl) {
      return res.status(400).json({ error: 'URL manquante' });
    }

    console.log('Proxying stream URL:', streamUrl);

    const response = await fetch(streamUrl);
    
    if (!response.ok) {
      return res.status(response.status).json({ 
        error: `Erreur flux: ${response.statusText}` 
      });
    }

    // Copie des headers importants
    res.setHeader('Content-Type', response.headers.get('Content-Type'));
    
    // Transmission du flux
    response.body.pipe(res);
    
  } catch (error) {
    console.error('Erreur proxy:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

const PORT = SERVER_CONFIG.API_PORT;
app.listen(PORT, () => {
  console.log(`Proxy serveur démarré sur le port ${PORT}`);
});
