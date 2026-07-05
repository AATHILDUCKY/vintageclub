// Reset the About page content to the built-in defaults.
//
// The About copy/images are stored as `home_about_*` overrides in the settings
// table (written whenever the admin saves the CMS). Clearing them lets the
// current defaults in lib/models.js (HOME_CONTENT_DEFAULTS) take effect, so the
// page reflects the latest brand story. Everything stays editable afterwards —
// saving in the admin simply writes the overrides again.
//
//   node scripts/reset-about.js
const path = require("path");
const Database = require("better-sqlite3");

const dbPath = path.join(__dirname, "..", "data", "vintage.db");
const db = new Database(dbPath);

const info = db.prepare("DELETE FROM settings WHERE key LIKE 'home_about_%'").run();
console.log(`Cleared ${info.changes} About override(s). The page now shows the defaults from lib/models.js.`);
