import express from 'express';
import axios from 'axios';

const router = express.Router();

/**
 * @route   GET /api/proxy-stream
 * @desc    Récupère un flux M3U (http ou https) pour le servir en HTTPS
 * @access  Public
 */
router.get('/proxy-stream', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).send('L\'URL du flux est manquante.');
  }

  try {
    const response = await axios.get(url, {
      responseType: 'stream',
      timeout: 10000,
    });

    const contentType = response.headers['content-type'];
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    } else {
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    }

    response.data.pipe(res);

  } catch (error) {
    console.error('Erreur lors du proxy vers l\'URL:', url, error.message);
    res.status(500).send('Erreur interne du serveur proxy.');
  }
});

export default router; // <-- Important pour les modules ES
