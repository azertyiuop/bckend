import Database from './database.mjs';
import PostgresDatabase from './postgres-database.mjs';
import { SERVER_CONFIG } from '../config.mjs';

export function createDatabase() {
  const databaseUrl = SERVER_CONFIG.DATABASE_URL;
  const dbType = SERVER_CONFIG.DB_TYPE;

  if (dbType === 'sqlite') {
    console.log('🔧 Utilisation forcée de SQLite (DB_TYPE=sqlite)');
    return new Database();
  }

  if (dbType === 'postgres' && !databaseUrl) {
    console.error('⚠️  DB_TYPE=postgres mais DATABASE_URL manquante, utilisation de SQLite');
    return new Database();
  }

  if (databaseUrl) {
    try {
      console.log('🔧 DATABASE_URL détectée, utilisation de PostgreSQL');
      return new PostgresDatabase(databaseUrl);
    } catch (error) {
      console.error('❌ Erreur initialisation PostgreSQL, fallback vers SQLite:', error.message);
      return new Database();
    }
  }

  console.log('🔧 Aucune DATABASE_URL, utilisation de SQLite par défaut');
  return new Database();
}

export default createDatabase;
