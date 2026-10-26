// Seeds a few products so the shop is not empty. Safe to re-run: it only
// inserts when the products table is empty.
//   npm run seed                 -> local file database
//   TURSO_DATABASE_URL=... npm run seed   -> remote Turso database
import db, { ensureSchema } from '../config/db.js';

const PRODUCTS = [
  ['Sourdough Loaf', 'Bread', 3500, 12],
  ['Baguette', 'Bread', 1500, 20],
  ['Chocolate Cake', 'Cakes', 18000, 3],
  ['Carrot Cake Slice', 'Cakes', 2500, 10],
  ['Butter Croissant', 'Pastries', 1500, 15],
  ['Mandazi (4)', 'Pastries', 1000, 25],
  ['Oat Cookies (6)', 'Cookies', 2500, 18],
  ['Cinnamon Roll', 'Pastries', 2000, 8],
];

await ensureSchema();

const { rows } = await db.execute('SELECT COUNT(*) AS n FROM products');
if (Number(rows[0].n) > 0) {
  console.log(`products table already has ${rows[0].n} rows, nothing to do`);
} else {
  await db.batch(
    PRODUCTS.map((args) => ({
      sql: 'INSERT INTO products (name, category, price, quantity) VALUES (?, ?, ?, ?)',
      args,
    })),
    'write',
  );
  console.log(`inserted ${PRODUCTS.length} products`);
}
