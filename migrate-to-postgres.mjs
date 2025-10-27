import Database from './lib/database.mjs';
import PostgresDatabase from './lib/postgres-database.mjs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function migrateData() {
  console.log('🚀 Début de la migration SQLite → PostgreSQL');

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL non définie. Veuillez définir cette variable d\'environnement.');
    process.exit(1);
  }

  const sqliteDbPath = path.join(__dirname, 'data', 'app.db');
  const sqliteDb = new Database(sqliteDbPath);
  const postgresDb = new PostgresDatabase(databaseUrl);

  try {
    await new Promise(resolve => setTimeout(resolve, 2000));

    const tables = [
      { name: 'users', idField: 'id' },
      { name: 'connected_users', idField: 'id' },
      { name: 'chat_messages', idField: 'id' },
      { name: 'banned_users', idField: 'id' },
      { name: 'muted_users', idField: 'id' },
      { name: 'streams', idField: 'id' },
      { name: 'activity_logs', idField: 'id' }
    ];

    const stats = {
      total: 0,
      success: 0,
      errors: 0
    };

    for (const table of tables) {
      console.log(`\n📦 Migration de la table: ${table.name}`);

      try {
        const rows = await sqliteDb.all(`SELECT * FROM ${table.name}`);
        console.log(`   Trouvé ${rows.length} enregistrements`);

        if (rows.length === 0) {
          console.log(`   ✅ Table ${table.name} vide, passage à la suivante`);
          continue;
        }

        for (const row of rows) {
          try {
            const columns = Object.keys(row);
            const values = Object.values(row);

            const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
            const columnNames = columns.join(', ');

            const insertSql = `INSERT INTO ${table.name} (${columnNames})
                               VALUES (${placeholders})
                               ON CONFLICT (${table.idField}) DO NOTHING`;

            await postgresDb.pool.query(insertSql, values);
            stats.success++;
            stats.total++;
          } catch (error) {
            console.error(`   ⚠️  Erreur insertion dans ${table.name}:`, error.message);
            stats.errors++;
            stats.total++;
          }
        }

        console.log(`   ✅ Table ${table.name} migrée avec succès`);
      } catch (error) {
        console.error(`   ❌ Erreur lecture table ${table.name}:`, error.message);
      }
    }

    console.log('\n📊 Statistiques de migration:');
    console.log(`   Total: ${stats.total} enregistrements`);
    console.log(`   Succès: ${stats.success}`);
    console.log(`   Erreurs: ${stats.errors}`);

    console.log('\n✅ Migration terminée avec succès!');
    console.log('\n📝 Prochaines étapes:');
    console.log('   1. Vérifiez que DATABASE_URL est configurée sur Railway');
    console.log('   2. Déployez votre application sur Railway');
    console.log('   3. Les données seront maintenant dans PostgreSQL');
    console.log('   4. SQLite reste disponible en local (DB_TYPE=sqlite)');

  } catch (error) {
    console.error('❌ Erreur pendant la migration:', error);
    process.exit(1);
  } finally {
    sqliteDb.close();
    await postgresDb.close();
  }
}

migrateData().catch(console.error);
