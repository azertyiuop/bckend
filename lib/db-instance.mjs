import { createDatabase } from './database-factory.mjs';

let dbInstance = null;

export function getDatabase() {
  if (!dbInstance) {
    console.log('✅ Initialisation Database');
    dbInstance = createDatabase();
  }
  return dbInstance;
}

export default getDatabase;
