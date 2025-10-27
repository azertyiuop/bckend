import './websocket-server.mjs';
import './rtmp.mjs';
import './api-server.mjs';
import './discord-bot.mjs';
import './proxy/proxyServer.mjs';
import { SERVER_CONFIG } from './config.mjs';
import os from 'os';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));

function maskUrl(url) {
  if (!url) return 'Non configurée';
  try {
    const urlObj = new URL(url);
    if (urlObj.password) {
      urlObj.password = '****';
    }
    return urlObj.toString();
  } catch {
    return url.substring(0, 20) + '****';
  }
}

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

function getDatabaseInfo() {
  const dbType = SERVER_CONFIG.DB_TYPE;
  const dbUrl = SERVER_CONFIG.DATABASE_URL;

  if (dbUrl) {
    const isRailway = dbUrl.includes('railway.app');
    return {
      type: `PostgreSQL ${isRailway ? '(Railway)' : ''}`,
      url: maskUrl(dbUrl),
      icon: '🐘',
      host: isRailway ? 'Railway' : 'PostgreSQL distant'
    };
  } else if (dbType === 'sqlite') {
    return {
      type: 'SQLite (local)',
      url: './data/app.db',
      icon: '💾',
      host: 'Fichier local'
    };
  } else {
    return {
      type: 'SQLite (défaut)',
      url: './data/app.db',
      icon: '💾',
      host: 'Fichier local'
    };
  }
}

function getMemoryUsage() {
  const used = process.memoryUsage();
  return `${Math.round(used.heapUsed / 1024 / 1024)} MB`;
}

const dbInfo = getDatabaseInfo();
const isProduction = process.env.NODE_ENV === 'production';
const isDefaultJWT = SERVER_CONFIG.JWT_SECRET === 'your_jwt_secret_change_in_production';
const hasDiscordWebhook = !!SERVER_CONFIG.DISCORD_WEBHOOK_URL;
const railwayDomain = process.env.RAILWAY_PUBLIC_DOMAIN || process.env.RAILWAY_STATIC_URL;
const publicDomain = railwayDomain || process.env.PUBLIC_DOMAIN;
const baseUrl = publicDomain ? `https://${publicDomain}` : 'http://localhost';

console.log('');
console.log('╔═══════════════════════════════════════════════════════════════════╗');
console.log('║                                                                   ║');
console.log('║         🚀  ABD STREAM SERVER - SERVEUR DÉMARRÉ                   ║');
console.log('║                                                                   ║');
console.log('╚═══════════════════════════════════════════════════════════════════╝');
console.log('');

console.log('📋 INFORMATIONS GÉNÉRALES');
console.log('─────────────────────────────────────────────────────────────────────');
console.log(`   Version:              ${pkg.version}`);
console.log(`   Node.js:              ${process.version}`);
console.log(`   Plateforme:           ${os.platform()} ${os.arch()}`);
console.log(`   Mémoire:              ${getMemoryUsage()}`);
console.log(`   Environnement:        ${isProduction ? 'PRODUCTION' : 'DÉVELOPPEMENT'}`);
console.log('');

console.log('🌐 SERVEURS ET PORTS');
console.log('─────────────────────────────────────────────────────────────────────');
if (publicDomain) {
  console.log(`   📡 WebSocket:         wss://${publicDomain}`);
  console.log(`      Port:              ${SERVER_CONFIG.WS_PORT}`);
  console.log('');
  console.log(`   🔧 API REST:          ${baseUrl}/api`);
  console.log(`      Port:              ${SERVER_CONFIG.API_PORT}`);
  console.log(`      Endpoints:         /analytics, /moderation, /users`);
  console.log('');
  console.log(`   🎥 RTMP:              rtmp://${publicDomain}:${SERVER_CONFIG.RTMP_PORT}/live`);
  console.log('');
  console.log(`   🌐 HLS:               ${baseUrl}`);
  console.log(`      Port:              ${SERVER_CONFIG.HTTP_PORT}`);
} else {
  console.log(`   📡 WebSocket:         Port ${SERVER_CONFIG.WS_PORT}`);
  console.log('');
  console.log(`   🔧 API REST:          Port ${SERVER_CONFIG.API_PORT}/api`);
  console.log(`      Endpoints:         /analytics, /moderation, /users`);
  console.log('');
  console.log(`   🎥 RTMP:              Port ${SERVER_CONFIG.RTMP_PORT}/live`);
  console.log('');
  console.log(`   🌐 HLS:               Port ${SERVER_CONFIG.HTTP_PORT}`);
}
console.log('');

console.log('💾 BASE DE DONNÉES');
console.log('─────────────────────────────────────────────────────────────────────');
console.log(`   ${dbInfo.icon} Type:              ${dbInfo.type}`);
console.log(`   📍 Hébergement:       ${dbInfo.host}`);
console.log(`   🔗 URL:               ${dbInfo.url}`);
console.log('');

console.log('🔒 CONFIGURATION SÉCURITÉ');
console.log('─────────────────────────────────────────────────────────────────────');
console.log(`   CORS Origins:         ${SERVER_CONFIG.ALLOWED_ORIGINS.join(', ')}`);
console.log(`   Admin Codes:          ${SERVER_CONFIG.ADMIN_ACCESS_CODES.length} code(s) configuré(s)`);
console.log(`   JWT Secret:           ${isDefaultJWT ? '⚠️  DÉFAUT (à changer!)' : '✅ Personnalisé'}`);
console.log(`   Discord Webhook:      ${hasDiscordWebhook ? '✅ Configuré' : '❌ Non configuré'}`);
console.log(`   Discord Bot:          ${SERVER_CONFIG.DISCORD_BOT_TOKEN ? '✅ Configuré' : '❌ Non configuré'}`);
console.log('');

console.log('📺 CONFIGURATION OBS STUDIO');
console.log('─────────────────────────────────────────────────────────────────────');
if (publicDomain) {
  console.log(`   Serveur RTMP:         rtmp://${publicDomain}:${SERVER_CONFIG.RTMP_PORT}/live`);
  console.log(`   Clé de flux:          votre_cle_de_stream`);
  console.log(`   URL de lecture HLS:   ${baseUrl}/live/votre_cle_de_stream/index.m3u8`);
} else {
  console.log(`   Serveur RTMP:         rtmp://[VOTRE_DOMAINE]:${SERVER_CONFIG.RTMP_PORT}/live`);
  console.log(`   Clé de flux:          votre_cle_de_stream`);
  console.log(`   URL de lecture HLS:   [VOTRE_DOMAINE]/live/votre_cle_de_stream/index.m3u8`);
}
console.log('');

console.log('🔗 URLS DE TEST RAPIDE');
console.log('─────────────────────────────────────────────────────────────────────');
if (publicDomain) {
  console.log(`   Dashboard Analytics:  ${baseUrl}/api/analytics/dashboard`);
  console.log(`   Stats Messages:       ${baseUrl}/api/analytics/messages`);
  console.log(`   Activité Utilisateur: ${baseUrl}/api/analytics/activity`);
} else {
  console.log(`   Dashboard Analytics:  Port ${SERVER_CONFIG.API_PORT}/api/analytics/dashboard`);
  console.log(`   Stats Messages:       Port ${SERVER_CONFIG.API_PORT}/api/analytics/messages`);
  console.log(`   Activité Utilisateur: Port ${SERVER_CONFIG.API_PORT}/api/analytics/activity`);
}
console.log('');

if (isDefaultJWT || !hasDiscordWebhook) {
  console.log('⚠️  AVERTISSEMENTS');
  console.log('─────────────────────────────────────────────────────────────────────');
  if (isDefaultJWT) {
    console.log('   ⚠️  JWT_SECRET utilise la valeur par défaut!');
    console.log('       Définissez JWT_SECRET dans vos variables d\'environnement.');
  }
  if (!hasDiscordWebhook) {
    console.log('   ℹ️  Discord Webhook non configuré (notifications désactivées)');
    console.log('       Définissez DISCORD_WEBHOOK_URL pour activer les notifications.');
  }
  console.log('');
}

console.log('✅ TOUS LES SERVEURS SONT OPÉRATIONNELS');
console.log('─────────────────────────────────────────────────────────────────────');
console.log('   Prêt à accepter les connexions...');
console.log('');
console.log('═══════════════════════════════════════════════════════════════════');
console.log('');
