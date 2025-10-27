import NodeMediaServer from 'node-media-server';

global.version = '2.7.4';

const config = {
  rtmp: {
    port: 1935,
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60
  },
  http: {
    port: 8003,
    allow_origin: '*'
  }
};

const nms = new NodeMediaServer(config);

nms.on('prePublish', (id, streamPath, args) => {
  const streamKey = id.streamName;
  console.log(`[RTMP] Flux reçu: ${streamKey}`);
  console.log(`[RTMP] URL: rtmp://localhost:1935${streamPath}`);
});

nms.on('donePublish', (id, streamPath, args) => {
  const streamKey = id.streamName;
  console.log(`[RTMP] Flux arrêté: ${streamKey}`);
});

try {
  nms.run();
  console.log('Serveur RTMP démarré');
  console.log('URL: rtmp://localhost:1935/live');
  console.log('');
  console.log('Configuration OBS:');
  console.log('  Serveur: rtmp://localhost:1935/live');
  console.log('  Clé de flux: votre_cle');
} catch (error) {
  console.error('Erreur:', error.message);
  process.exit(1);
}

process.on('SIGINT', () => {
  console.log('\nArrêt du serveur...');
  nms.stop();
  process.exit(0);
});

export default nms;
