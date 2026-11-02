import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

/**
 * Build pool config:
 *   - If DATABASE_URL is provided (e.g., Neon in production), use it with SSL.
 *   - Otherwise, fall back to individual DB_* vars (local development).
 */
function buildPoolConfig() {
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: true },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    };
  }

  return {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || 'postgres',
    password: String(process.env.DB_PASSWORD ?? ''),
    database: process.env.DB_NAME || 'iagrotech',
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };
}

export const pool = new Pool(buildPoolConfig());

pool.on('error', (err) => {
  console.error('[db] Unexpected error on idle client', err.message);
});

/**
 * Helper to convert named params (:name) to positional ($1, $2...)
 * and return [sql, values] ready for pg.
 */
export function buildQuery(sql, params = {}) {
  if (!params || Object.keys(params).length === 0) {
    return [sql, []];
  }

  const values = [];
  const converted = sql.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (_, key) => {
    if (!(key in params)) {
      throw new Error(`Missing query parameter: ${key}`);
    }
    values.push(params[key]);
    return `$${values.length}`;
  });

  return [converted, values];
}

export async function query(sql, params = {}) {
  const [convertedSql, values] = buildQuery(sql, params);
  const { rows } = await pool.query(convertedSql, values);
  return rows;
}

/**
 * Graceful shutdown: end the pool when the process exits.
 */
function shutdown() {
  pool.end(() => {
    console.log('[db] Pool closed.');
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
