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

    CREATE TABLE IF NOT EXISTS plat_du_jour_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      subtitle TEXT,
      description TEXT,
      price REAL,
      image_url TEXT,
      is_today INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      subtitle TEXT,
      description TEXT,
      location TEXT,
      time_label TEXT,
      price REAL,
      image_url TEXT,
      is_today INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

init();

// Default plat du jour dish
const hasMloukhiyeh = db.prepare(`SELECT id FROM plat_du_jour_items WHERE title = 'Mloukhiyeh' LIMIT 1`).get();
if (!hasMloukhiyeh) {
  db.prepare(`
    INSERT INTO plat_du_jour_items (title, subtitle, description, price, is_today)
    VALUES (?, ?, ?, ?, 1)
  `).run(
    'Mloukhiyeh',
    "Today's Lebanese specialty",
    'A traditional Lebanese stew of jute leaves, slow cooked with tender chicken, served with rice and a side of lemon.',
    18,
  );
}

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
if (!hasColumn('restaurants', 'image_urls')) {
  db.exec(`ALTER TABLE restaurants ADD COLUMN image_urls TEXT`);
}
if (!hasColumn('restaurants', 'menu_pdf_url')) {
  db.exec(`ALTER TABLE restaurants ADD COLUMN menu_pdf_url TEXT`);
}

// Seed image_urls from the originally-bundled mobile assets so admins can see
// (and manage) what's currently displayed in the app. Only fills empty rows.
const SEED_IMAGES = {
  'la-reserve':  ['/uploads/seeds/la_reserve.jpeg', '/uploads/seeds/lareserve1.png', '/uploads/seeds/lareserve2.png'],
  'pool-bar':    ['/uploads/seeds/poolbar1.jpg', '/uploads/seeds/poolbar2.jpg'],
  'la-terrasse': ['/uploads/seeds/laterrasse1.jpg', '/uploads/seeds/laterrasse2.jpg'],
  'fellinis':    ['/uploads/seeds/felinis1.jpg', '/uploads/seeds/felinis2.jpg', '/uploads/seeds/felinis3.jpg'],
  'khuans-bar':  ['/uploads/seeds/khuans1.jpg', '/uploads/seeds/khuans2.jpg', '/uploads/seeds/khuans3.jpeg', '/uploads/seeds/khuans4.jpg', '/uploads/seeds/khuans5.png'],
  'sunset-bar':  ['/uploads/seeds/sunsetbar.jpg'],
};
const setImgs = db.prepare(`UPDATE restaurants SET image_urls = ? WHERE slug = ? AND (image_urls IS NULL OR image_urls = '')`);
for (const [slug, urls] of Object.entries(SEED_IMAGES)) {
  setImgs.run(JSON.stringify(urls), slug);
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
