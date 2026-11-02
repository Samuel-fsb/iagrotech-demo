/**
 * Setup script: applies schema and reference data to the database.
 *
 * Usage:
 *   node database/setup.js              — schema only (safe to run multiple times)
 *   node database/setup.js --with-refs  — schema + reference data (plans, promo codes)
 *
 * Set DATABASE_URL in .env for Neon/production, or DB_* vars for local dev.
 * Do NOT run this with --seed in production; demo user data is in seed.sql
 * and should only be loaded in local/demo environments.
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));

const withRefs = process.argv.includes('--with-refs');
const withSeed = process.argv.includes('--with-seed');

/**
 * Build a pg Client config from the environment.
 * DATABASE_URL takes priority (Neon + other hosted providers).
 * Falls back to individual DB_* vars for local PostgreSQL.
 */
function buildClientConfig(database) {
  if (process.env.DATABASE_URL) {
    console.log('ℹ️  Using DATABASE_URL (Neon / hosted PostgreSQL).');
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: true },
    };
  }

  const dbName = database || process.env.DB_NAME || 'iagrotech';
  return {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || 'postgres',
    password: String(process.env.DB_PASSWORD ?? ''),
    database: dbName,
  };
}

async function run() {
  // When using DATABASE_URL the database already exists (Neon manages it).
  // Only attempt CREATE DATABASE for local dev without DATABASE_URL.
  if (!process.env.DATABASE_URL) {
    const dbName = process.env.DB_NAME || 'iagrotech';

    const adminClient = new Client({
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT || 5432),
      user: process.env.DB_USER || 'postgres',
      password: String(process.env.DB_PASSWORD ?? ''),
      database: 'postgres',
    });

    try {
      await adminClient.connect();
      console.log(`✅ Conectado ao PostgreSQL como '${process.env.DB_USER || 'postgres'}'`);

      const exists = await adminClient.query(
        `SELECT 1 FROM pg_database WHERE datname = $1`,
        [dbName],
      );

      if (exists.rows.length === 0) {
        await adminClient.query(`CREATE DATABASE "${dbName}"`);
        console.log(`✅ Banco '${dbName}' criado com sucesso.`);
      } else {
        console.log(`ℹ️  Banco '${dbName}' já existe.`);
      }
    } catch (err) {
      console.error('❌ Erro ao conectar/criar banco:', err.message);
      console.error('\nDica: verifique DB_USER, DB_PASSWORD e DB_HOST no arquivo .env');
      process.exit(1);
    } finally {
      await adminClient.end();
    }
  }

  // Apply schema and optionally reference data / seed
  const client = new Client(buildClientConfig());

  try {
    await client.connect();
    console.log('✅ Conectado ao banco de destino.');

    const schemaPath = join(__dirname, 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');
    await client.query(schema);
    console.log('✅ Schema aplicado (schema.sql)');

    if (withRefs || withSeed) {
      // Ref data: plans and promo codes only (no admin users)
      const refSql = readFileSync(join(__dirname, 'refs.sql'), 'utf-8');
      await client.query(refSql);
      console.log('✅ Dados de referência inseridos (refs.sql)');
    }

    if (withSeed) {
      // Demo/local only — do not run in production
      if (process.env.NODE_ENV === 'production') {
        console.warn('⚠️  --with-seed ignorado em NODE_ENV=production.');
      } else {
        const seedSql = readFileSync(join(__dirname, 'seed.sql'), 'utf-8');
        await client.query(seedSql);
        console.log('✅ Dados de demonstração inseridos (seed.sql)');
      }
    }

    console.log('\n🎉 Banco pronto! Inicie o servidor com: npm run dev:api');
  } catch (err) {
    console.error('❌ Erro ao aplicar schema/dados:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
