// Runs before `npm run build` and `npm run dev`.
// Ensures the SQLite database + schema exist and the admin account from
// .env is present. Idempotent: safe to run on every build/start.
//
// Requiring ../lib/seed loads .env and requires ../lib/db, which creates
// the database file and runs all migrations. We then seed only the admin
// user and store settings — NOT the demo products/leads (use `npm run seed`
// for that).
const { seedAdmin, seedSettings } = require("../lib/seed");

try {
  seedAdmin();
  seedSettings();
  console.log("✓ Database ready.");
} catch (err) {
  console.error("✗ Database init failed:", err.message);
  process.exit(1);
}
