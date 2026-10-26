import dotenv from 'dotenv';

dotenv.config();

// Local development: a SQLite file next to the backend (no server to run).
// Production (Vercel): a Turso database, configured through env vars.
let url = process.env.TURSO_DATABASE_URL || 'file:local.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

if (process.env.VERCEL && url.startsWith('file:')) {
  // /var/task is read-only on Vercel; /tmp is the only writable place. Data
  // there is throwaway, so this only keeps the API alive until Turso is set.
  url = 'file:/tmp/xm-bakery.db';
  console.warn(
    'TURSO_DATABASE_URL is not set. Using a temporary file database that does NOT ' +
      'persist; add TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in the Vercel project settings.',
  );
}

// Remote Turso URLs use the pure-JS web client (no native binary to load in a
// serverless function). File URLs need the native client.
const isRemote = /^(libsql|https?|wss?):\/\//.test(url);
const { createClient } = isRemote
  ? await import('@libsql/client/web')
  : await import('@libsql/client');

const db = createClient({ url, authToken });

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (
     id         INTEGER PRIMARY KEY AUTOINCREMENT,
     name       TEXT    NOT NULL,
     email      TEXT    NOT NULL UNIQUE,
     password   TEXT    NOT NULL,
     role       TEXT    NOT NULL DEFAULT 'customer',
     created_at TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
   )`,
  `CREATE TABLE IF NOT EXISTS products (
     id         INTEGER PRIMARY KEY AUTOINCREMENT,
     name       TEXT    NOT NULL,
     category   TEXT,
     price      REAL    NOT NULL,
     quantity   INTEGER NOT NULL DEFAULT 0,
     created_at TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
   )`,
  // user_id is optional so guests can order with just contact details.
  `CREATE TABLE IF NOT EXISTS orders (
     id             INTEGER PRIMARY KEY AUTOINCREMENT,
     user_id        INTEGER REFERENCES users(id) ON DELETE SET NULL,
     customer_name  TEXT    NOT NULL,
     phone          TEXT,
     email          TEXT,
     note           TEXT,
     total          REAL    NOT NULL,
     status         TEXT    NOT NULL DEFAULT 'pending',
     payment_method TEXT    NOT NULL DEFAULT 'pay_at_counter',
     payment_status TEXT    NOT NULL DEFAULT 'unpaid',
     created_at     TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
   )`,
  // product_name and price are copied at order time so history survives
  // later edits or deletions of the product.
  `CREATE TABLE IF NOT EXISTS order_items (
     id           INTEGER PRIMARY KEY AUTOINCREMENT,
     order_id     INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
     product_id   INTEGER REFERENCES products(id) ON DELETE SET NULL,
     product_name TEXT    NOT NULL,
     quantity     INTEGER NOT NULL,
     price        REAL    NOT NULL
   )`,
];

let schemaReady = null;

async function migrate() {
  // The first version of the orders table (before guest checkout) had no
  // customer_name column and was never written to, so it is safe to rebuild.
  const info = await db.execute(`PRAGMA table_info(orders)`);
  const columns = info.rows.map((r) => r.name);
  if (columns.length > 0 && !columns.includes('customer_name')) {
    const count = await db.execute('SELECT COUNT(*) AS n FROM orders');
    if (Number(count.rows[0].n) === 0) {
      await db.batch(['DROP TABLE IF EXISTS order_items', 'DROP TABLE IF EXISTS orders'], 'write');
    } else {
      throw new Error('orders table has rows but an old schema; migrate it manually');
    }
  }
  await db.batch(SCHEMA, 'write');
}

// Creates the tables once per process. Safe to call on every request, which is
// what serverless needs because there is no start-up hook to rely on.
export function ensureSchema() {
  if (!schemaReady) {
    schemaReady = migrate().catch((err) => {
      schemaReady = null; // allow a retry on the next request
      throw err;
    });
  }
  return schemaReady;
}

// libSQL returns BIGINT ids; the API has always returned plain numbers.
export const toId = (value) => Number(value);

export default db;
