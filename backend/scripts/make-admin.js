// Promote an existing account to admin:  node scripts/make-admin.js someone@example.com
// (Accounts whose email is listed in ADMIN_EMAILS become admin automatically.)
import db, { ensureSchema } from '../config/db.js';

const email = process.argv[2];
if (!email) {
  console.error('usage: node scripts/make-admin.js <email>');
  process.exit(1);
}

await ensureSchema();
const result = await db.execute({ sql: "UPDATE users SET role = 'admin' WHERE email = ?", args: [email] });
if (result.rowsAffected === 0) {
  console.error(`no user with email ${email}`);
  process.exit(1);
}
console.log(`${email} is now an admin (they need to log in again)`);
