const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'portemilio.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function init() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password_hash TEXT NOT NULL,
      room_number TEXT,
      chalet_number TEXT,
      birthday TEXT,
      is_admin INTEGER DEFAULT 0,
      push_token TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS facilities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT,
      description TEXT,
      hours TEXT,
      location TEXT,
      phone TEXT,
      image_url TEXT,
      bookable INTEGER DEFAULT 0,
      price TEXT,
      extra_info TEXT
    );

    CREATE TABLE IF NOT EXISTS restaurants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      cuisine TEXT,
      description TEXT,
      hours TEXT,
      location TEXT,
      phone TEXT,
      image_url TEXT,
      delivery INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT,
      price REAL NOT NULL,
      image_url TEXT,
      plat_du_jour INTEGER DEFAULT 0,
      available INTEGER DEFAULT 1,
      FOREIGN KEY(restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS rentals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT,
      description TEXT,
      price_per_hour REAL NOT NULL,
      image_url TEXT,
      available INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      location TEXT,
      start_time TEXT NOT NULL,
      end_time TEXT,
      image_url TEXT,
      capacity INTEGER,
      bookable INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id INTEGER,
      resource_name TEXT,
      start_time TEXT NOT NULL,
      end_time TEXT,
      party_size INTEGER DEFAULT 1,
      status TEXT DEFAULT 'pending',
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS deliveries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      restaurant_id INTEGER,
      restaurant_name TEXT,
      items_json TEXT NOT NULL,
      total REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      room_or_chalet TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      body TEXT,
      user_id INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      read INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);
}

init();

// Migrations for existing databases
function hasColumn(table, column) {
  return db.prepare(`PRAGMA table_info(${table})`).all().some(c => c.name === column);
}
if (!hasColumn('users', 'birthday')) {
  db.exec(`ALTER TABLE users ADD COLUMN birthday TEXT`);
}
if (!hasColumn('users', 'status')) {
  // 'approved' default keeps existing accounts working; new registrations with a unit number
  // will be inserted as 'pending' by the register endpoint.
  db.exec(`ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'approved'`);
  db.exec(`UPDATE users SET status = 'approved' WHERE status IS NULL`);
}
if (!hasColumn('deliveries', 'scheduled_for')) {
  db.exec(`ALTER TABLE deliveries ADD COLUMN scheduled_for TEXT`);
}
if (!hasColumn('deliveries', 'room_number')) {
  db.exec(`ALTER TABLE deliveries ADD COLUMN room_number TEXT`);
}
if (!hasColumn('deliveries', 'chalet_number')) {
  db.exec(`ALTER TABLE deliveries ADD COLUMN chalet_number TEXT`);
}
if (!hasColumn('notifications', 'audience')) {
  // 'all' | 'registered' | 'targeted'
  db.exec(`ALTER TABLE notifications ADD COLUMN audience TEXT DEFAULT 'all'`);
}
if (!hasColumn('notifications', 'recipient_ids')) {
  // For targeted sends: comma-separated user ids surrounded by commas (e.g. ",1,5,8,")
  // so the per-user feed query can do a cheap LIKE match.
  db.exec(`ALTER TABLE notifications ADD COLUMN recipient_ids TEXT`);
}
if (!hasColumn('notifications', 'recipient_names')) {
  db.exec(`ALTER TABLE notifications ADD COLUMN recipient_names TEXT`);
}
if (!hasColumn('bookings', 'reminder_sent')) {
  db.exec(`ALTER TABLE bookings ADD COLUMN reminder_sent INTEGER DEFAULT 0`);
}

// Restaurants — additional fields so admin can edit the same content the app shows.
for (const [col, type] of [
  ['slug', 'TEXT'],
  ['specialty', 'TEXT'],
  ['categories', 'TEXT'],     // comma-separated: 'restaurants,bars'
  ['address', 'TEXT'],
  ['highlights', 'TEXT'],     // JSON array of strings
  ['map_pin_id', 'TEXT'],
  ['upcoming', 'INTEGER DEFAULT 0'],
  ['sort_order', 'INTEGER DEFAULT 0'],
]) {
  if (!hasColumn('restaurants', col)) {
    db.exec(`ALTER TABLE restaurants ADD COLUMN ${col} ${type}`);
  }
}

module.exports = db;
