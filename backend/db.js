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

    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      subtitle TEXT,
      description TEXT,
      phone TEXT,
      email TEXT,
      hours TEXT,
      location TEXT,
      extra_info TEXT,
      image_urls TEXT,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS marina_boats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guest_name TEXT NOT NULL,
      boat_name TEXT,
      slip_number TEXT,
      status TEXT DEFAULT 'docked',  -- 'docked' | 'at_sea'
      phone TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS landmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL DEFAULT 'sightseeing',  -- 'sightseeing' | 'relevant_services'
      name TEXT NOT NULL,
      subtitle TEXT,
      description TEXT,
      distance TEXT,
      address TEXT,
      phone TEXT,
      website TEXT,
      image_urls TEXT,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS landmark_locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      landmark_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      address TEXT,
      phone TEXT,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY(landmark_id) REFERENCES landmarks(id) ON DELETE CASCADE
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
if (!hasColumn('notifications', 'is_system')) {
  // 1 = inserted by an automated flow (booking reminders, approval welcome, booking
  // confirmations). 0 = sent manually by an admin. The admin "Recent" table filters
  // on this so automatic system messages don't clutter the manual-send history.
  db.exec(`ALTER TABLE notifications ADD COLUMN is_system INTEGER DEFAULT 0`);
}
// Idempotent backfill: any rows whose title matches a known auto pattern get tagged
// as system. Runs every startup so legacy rows from older code paths are caught too.
db.prepare(`
  UPDATE notifications SET is_system = 1
  WHERE (is_system IS NULL OR is_system = 0)
    AND (
      title LIKE 'Reminder:%'
      OR title LIKE 'Court reminder%'
      OR title LIKE 'Booking confirmed%'
      OR title LIKE 'Booking cancelled%'
      OR title = 'Your court is ready'
      OR title = 'Your booking is ready'
      OR title = 'Welcome to Portemilio'
    )
`).run();
if (!hasColumn('bookings', 'reminder_sent')) {
  db.exec(`ALTER TABLE bookings ADD COLUMN reminder_sent INTEGER DEFAULT 0`);
}
if (!hasColumn('restaurants', 'image_urls')) {
  db.exec(`ALTER TABLE restaurants ADD COLUMN image_urls TEXT`);
}
if (!hasColumn('facilities', 'instagram_url')) {
  db.exec(`ALTER TABLE facilities ADD COLUMN instagram_url TEXT`);
}
if (!hasColumn('facilities', 'whatsapp_url')) {
  db.exec(`ALTER TABLE facilities ADD COLUMN whatsapp_url TEXT`);
}
if (!hasColumn('facilities', 'app_store_url')) {
  db.exec(`ALTER TABLE facilities ADD COLUMN app_store_url TEXT`);
}
if (!hasColumn('facilities', 'warning_message')) {
  db.exec(`ALTER TABLE facilities ADD COLUMN warning_message TEXT`);
}
if (!hasColumn('facilities', 'indoor_pool_name')) {
  db.exec(`ALTER TABLE facilities ADD COLUMN indoor_pool_name TEXT`);
}
if (!hasColumn('facilities', 'indoor_pool_subtitle')) {
  db.exec(`ALTER TABLE facilities ADD COLUMN indoor_pool_subtitle TEXT`);
}
if (!hasColumn('facilities', 'indoor_pool_image_url')) {
  db.exec(`ALTER TABLE facilities ADD COLUMN indoor_pool_image_url TEXT`);
}
if (!hasColumn('facilities', 'coach_hint')) {
  db.exec(`ALTER TABLE facilities ADD COLUMN coach_hint TEXT`);
}
if (!hasColumn('services', 'website')) {
  db.exec(`ALTER TABLE services ADD COLUMN website TEXT`);
}
if (!hasColumn('services', 'instagram_url')) {
  db.exec(`ALTER TABLE services ADD COLUMN instagram_url TEXT`);
}

// Child item tables for facility and service sub-lists (coaches, sports,
// service plans, pools, etc). Each row's `kind` distinguishes the use case.
db.exec(`
  CREATE TABLE IF NOT EXISTS facility_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    facility_id INTEGER NOT NULL,
    kind TEXT NOT NULL,
    name TEXT NOT NULL,
    subtitle TEXT,
    description TEXT,
    phone TEXT,
    image_url TEXT,
    sub_items TEXT,
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY(facility_id) REFERENCES facilities(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS service_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_id INTEGER NOT NULL,
    kind TEXT NOT NULL,
    name TEXT NOT NULL,
    subtitle TEXT,
    image_url TEXT,
    extra TEXT,
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY(service_id) REFERENCES services(id) ON DELETE CASCADE
  );
`);
if (!hasColumn('restaurants', 'menu_pdf_url')) {
  db.exec(`ALTER TABLE restaurants ADD COLUMN menu_pdf_url TEXT`);
}
if (!hasColumn('facilities', 'image_urls')) {
  db.exec(`ALTER TABLE facilities ADD COLUMN image_urls TEXT`);
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

// Same idea for facilities — seed image_urls from the originally-bundled
// mobile assets so the admin sees what's currently displayed in the app.
const FACILITY_SEED_IMAGES = {
  'outdoor_pool': ['/uploads/seeds/facilities/pools.png'],
  'indoor_pool':  ['/uploads/seeds/facilities/pools.png'],
  'gym':          ['/uploads/seeds/facilities/wellness-area.jpg'],
  'spa':          ['/uploads/seeds/facilities/wellness-area.jpg'],
  'hair_salon':   ['/uploads/seeds/facilities/wellness-area.jpg'],
  'tennis':       ['/uploads/seeds/facilities/tennis.jpg'],
  'kids_club':    ['/uploads/seeds/facilities/kidsclub1.jpg', '/uploads/seeds/facilities/kids-activities.jpg'],
  'beach':        ['/uploads/seeds/facilities/seaside-access.png'],
  'concierge':    ['/uploads/seeds/facilities/front-desk.jpg'],
};
const setFacilityImgs = db.prepare(`UPDATE facilities SET image_urls = ? WHERE key = ? AND (image_urls IS NULL OR image_urls = '')`);
for (const [key, urls] of Object.entries(FACILITY_SEED_IMAGES)) {
  setFacilityImgs.run(JSON.stringify(urls), key);
}

// --- Facilities realignment (one-time migration) ---
// Replace the placeholder facility set with the actual facility pages the
// client sees in the app. Tracked via a settings flag so it runs once.
const FACILITY_REALIGN_KEY = 'facilities_realigned_v1';
const realignDone = db.prepare(`SELECT value FROM settings WHERE key = ?`).get(FACILITY_REALIGN_KEY);
if (!realignDone) {
  // Remove the records that don't correspond to a dedicated facility screen
  // in the mobile app. Their content lives in services pages instead.
  db.prepare(`DELETE FROM facilities WHERE key IN ('concierge', 'gym', 'hair_salon', 'indoor_pool', 'outdoor_pool', 'spa', 'shooting', 'beach')`).run();

  // Insert / refresh the 9 client-visible facilities. The OR IGNORE means
  // if 'tennis' or 'kids_club' already exist from prior seeds, they're kept
  // as-is (admin edits preserved); only their image_urls + missing fields
  // get topped up below.
  const NEW_FACILITIES = [
    { key: 'salon_antoinette', name: 'Salon Antoinette',  category: 'wellness',
      description: 'Hair, nails, and makeup — book in for a special occasion or a relaxed afternoon.',
      phone: '+9619123469', hours: null, location: null, price: null, extra_info: null,
      image_urls: ['/uploads/seeds/facilities/wellness-area.jpg'] },
    { key: 'le_rodin_spa', name: 'Le Rodin Spa', category: 'wellness',
      description: 'Massages and body-sculpting treatments in a quiet spa setting. Take an hour for yourself.',
      phone: '+9619123470', hours: null, location: null, price: null, extra_info: null,
      image_urls: ['/uploads/seeds/facilities/wellness-area.jpg'] },
    { key: 'searenity_club', name: 'SEArenity Club', category: 'wellness',
      description: 'Gym, classes, scuba, swimming, and personal training. Train with the team however you move.',
      phone: '+9619635356', hours: null, location: null, price: null, extra_info: null,
      image_urls: ['/uploads/seeds/facilities/wellness-area.jpg'] },
    { key: 'rove_pilates', name: 'Rove Pilates', category: 'wellness',
      description: 'Group reformer classes — Abs & Core, Legs & Glutes, Power, and Foundations — plus private 1-on-1 and duo sessions. Book everything through the Rove app.',
      phone: '+96181152433', hours: null, location: null, price: null, extra_info: null,
      image_urls: ['/uploads/seeds/facilities/wellness-area.jpg'] },
    { key: 'tennis', name: 'Tennis Courts', category: 'sports',
      description: 'Two outdoor courts available daily. Sessions and coaching available — book through the app.',
      phone: null, hours: 'Daily 7:00 AM – 9:00 PM', location: 'Sports area, east side',
      price: '$15 per hour', extra_info: null,
      image_urls: ['/uploads/seeds/facilities/tennis.jpg'] },
    { key: 'water_sports', name: 'Water Sports', category: 'sports',
      description: 'Kayak, paddleboard, jet-ski, scuba diving and more — right from the Marina.',
      phone: null, hours: null, location: null, price: null, extra_info: null,
      image_urls: ['/uploads/seeds/facilities/water-sports.jpg'] },
    { key: 'kids_club', name: 'Kids Club', category: 'family',
      description: 'Supervised activities for children ages 4–12. Arts, games, and pool time.',
      phone: null, hours: null, location: null, price: null, extra_info: null,
      image_urls: ['/uploads/seeds/facilities/kidsclub1.jpg', '/uploads/seeds/facilities/kids-activities.jpg'] },
    { key: 'nursery', name: 'Nursery', category: 'family',
      description: 'A supervised space for kids under 6. Drop them off in good hands and enjoy the resort with peace of mind.',
      phone: '+9619123472', hours: '9:00 AM – 6:00 PM', location: 'Activities zone · Ground level',
      price: null, extra_info: 'Babies & children under 6',
      image_urls: ['/uploads/seeds/facilities/kids-activities.jpg'] },
    { key: 'kaslik_gun_club', name: 'Kaslik Gun Club', category: 'sports',
      description: 'Indoor shooting range with guided sessions for beginners and experienced shooters alike. Safety briefing always included.',
      phone: '+9619123474', hours: '9:00 AM – 6:00 PM', location: 'Activities zone · Outdoor range',
      price: null, extra_info: 'Briefing and supervision included with every session',
      image_urls: ['/uploads/seeds/facilities/todays-act-1.jpg'] },
  ];
  const insertNewFacility = db.prepare(`
    INSERT OR IGNORE INTO facilities (key, name, category, description, hours, location, phone, image_url, bookable, price, extra_info, image_urls)
    VALUES (@key, @name, @category, @description, @hours, @location, @phone, NULL, @bookable, @price, @extra_info, @image_urls)
  `);
  const updateNewFacility = db.prepare(`
    UPDATE facilities SET
      name=@name,
      category=@category,
      description=COALESCE(description, @description),
      hours=COALESCE(hours, @hours),
      location=COALESCE(location, @location),
      phone=COALESCE(phone, @phone),
      price=COALESCE(price, @price),
      extra_info=COALESCE(extra_info, @extra_info),
      image_urls=COALESCE(NULLIF(image_urls, ''), @image_urls)
    WHERE key=@key
  `);
  for (const f of NEW_FACILITIES) {
    const bookable = ['tennis', 'rove_pilates', 'le_rodin_spa', 'salon_antoinette', 'kaslik_gun_club'].includes(f.key) ? 1 : 0;
    const payload = { ...f, bookable, image_urls: JSON.stringify(f.image_urls) };
    insertNewFacility.run(payload);
    // For records that already existed (e.g. 'tennis', 'kids_club'), refresh
    // name/category and fill in any missing fields without overwriting edits.
    updateNewFacility.run(payload);
  }

  db.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, '1')`).run(FACILITY_REALIGN_KEY);
}

// --- Seed facility/service sub-items (coaches, sports, services, pools) ---
const ITEMS_SEED_KEY = 'facility_items_seed_v1';
const itemsSeedDone = db.prepare(`SELECT value FROM settings WHERE key = ?`).get(ITEMS_SEED_KEY);
if (!itemsSeedDone) {
  const findFacility = db.prepare('SELECT id FROM facilities WHERE key = ?');
  const findService = db.prepare('SELECT id FROM services WHERE key = ?');
  const insertFacItem = db.prepare(`
    INSERT INTO facility_items (facility_id, kind, name, subtitle, description, phone, image_url, sub_items, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertSvcItem = db.prepare(`
    INSERT INTO service_items (service_id, kind, name, subtitle, image_url, extra, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const seedFacility = (key, items) => {
    const f = findFacility.get(key);
    if (!f) return;
    items.forEach((it, i) => insertFacItem.run(
      f.id, it.kind, it.name, it.subtitle || null, it.description || null,
      it.phone || null, it.image_url || null,
      it.sub_items ? JSON.stringify(it.sub_items) : null,
      (i + 1) * 10,
    ));
  };
  const seedService = (key, items) => {
    const s = findService.get(key);
    if (!s) return;
    items.forEach((it, i) => insertSvcItem.run(
      s.id, it.kind, it.name, it.subtitle || null,
      it.image_url || null, it.extra || null, (i + 1) * 10,
    ));
  };

  // --- Tennis coaches ---
  seedFacility('tennis', [
    { kind: 'coach', name: 'Oksana Belonenko',
      subtitle: 'Bill Adams International Tennis Academy · Florida, USA',
      description: 'Mon · Wed · Fri · Sat',
      phone: '+96171488488' },
    { kind: 'coach', name: 'Fabrice Hilaire',
      subtitle: 'ITF Level II certified · Istanbul, Dubai, Tunis, Abidjan',
      description: 'Tue · Thu · Sat · Sun',
      phone: '+2250707177702' },
  ]);

  // --- Water Sports rates ---
  seedFacility('water_sports', [
    { kind: 'sport', name: 'Jet ski',       subtitle: '$50 / 15 min',  image_url: '/uploads/seeds/facilities/water-sports.jpg' },
    { kind: 'sport', name: 'Kayak',         subtitle: '$20 / hr' },
    { kind: 'sport', name: 'Rowboat',       subtitle: '$15 / hr' },
    { kind: 'sport', name: 'Pedalo',        subtitle: '$20 / hr' },
    { kind: 'sport', name: 'Water skiing',  subtitle: '$40 / 15 min' },
    { kind: 'sport', name: 'Scuba diving',  subtitle: '$80 / dive' },
  ]);

  // --- Salon Antoinette services with nested items ---
  seedFacility('salon_antoinette', [
    { kind: 'service', name: 'Hair Atelier',       subtitle: 'from $30',
      sub_items: ['Blowout & Styling', 'Haircut & Trim', 'Coloring', 'Hair Treatments', 'Event & Bridal Styling'] },
    { kind: 'service', name: 'Nail Care',          subtitle: 'from $20',
      sub_items: ['Classic Manicure', 'Gel / Shellac Manicure', 'Pedicure (Classic & Spa)', 'Nail Extensions & Refills', 'Nail Art & Design'] },
    { kind: 'service', name: 'Makeup Artistry',    subtitle: 'from $40',
      sub_items: ['Natural / Day Makeup', 'Evening / Glam Makeup', 'Bridal Makeup', 'Event & Photoshoot Makeup'] },
    { kind: 'service', name: 'Beauty Treatments',  subtitle: 'from $35',
      sub_items: ['Facials (Hydrating, Deep Clean, Anti-Aging)', 'Eyebrow Shaping & Tinting', 'Lash Lifting & Extensions', 'Skin Treatments'] },
  ]);

  // --- Le Rodin Spa services ---
  seedFacility('le_rodin_spa', [
    { kind: 'service', name: 'Massage',        subtitle: 'from $60' },
    { kind: 'service', name: 'Body sculpting', subtitle: 'from $80' },
  ]);

  // --- SEArenity Club services (no prices) ---
  seedFacility('searenity_club', [
    { kind: 'service', name: 'Personal Training' },
    { kind: 'service', name: 'Gym Membership' },
    { kind: 'service', name: 'Pool Membership' },
    { kind: 'service', name: 'Scuba Diving' },
    { kind: 'service', name: 'Kangoo Jumps Class' },
    { kind: 'service', name: 'Kung-Fu Class' },
    { kind: 'service', name: 'Self Defence Class' },
    { kind: 'service', name: 'Zumba Class' },
    { kind: 'service', name: 'Oriental Class' },
    { kind: 'service', name: 'Swimming' },
    { kind: 'service', name: 'Dietitian Consultation' },
  ]);

  // --- Rove Pilates plans ---
  seedFacility('rove_pilates', [
    { kind: 'plan', name: '1 Session',             subtitle: '$20' },
    { kind: 'plan', name: '4 Sessions',            subtitle: '$75' },
    { kind: 'plan', name: '8 Sessions',            subtitle: '$140' },
    { kind: 'plan', name: '12 Sessions',           subtitle: '$195' },
    { kind: 'plan', name: 'Private · Solo Session', subtitle: '$50' },
    { kind: 'plan', name: 'Private · Duo Session',  subtitle: '$80' },
  ]);

  // Pools moved to Facilities — its outdoor pool list lives in facility_items
  // and is seeded after the move below.

  // --- Seed the wellness facility URLs ---
  const setFacilityUrl = db.prepare(`UPDATE facilities SET instagram_url = COALESCE(instagram_url, ?), whatsapp_url = COALESCE(whatsapp_url, ?), app_store_url = COALESCE(app_store_url, ?), warning_message = COALESCE(warning_message, ?) WHERE key = ?`);
  setFacilityUrl.run('https://www.instagram.com/salon_antoinette/', null, null, null, 'salon_antoinette');
  setFacilityUrl.run('https://www.instagram.com/lerodin/', null, null, null, 'le_rodin_spa');
  setFacilityUrl.run('https://www.instagram.com/searenityclub/', null, null, null, 'searenity_club');
  setFacilityUrl.run(
    'https://www.instagram.com/rovepilatesstudio/',
    'https://api.whatsapp.com/send/?phone=96181152433&text&type=phone_number&app_absent=0',
    'https://apps.apple.com/us/app/rove-pilates-studio/id6743739472',
    null,
    'rove_pilates',
  );
  setFacilityUrl.run(null, null, null,
    'When you book with a coach, they handle the court reservation — no need to book the court separately.',
    'tennis',
  );

  db.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, '1')`).run(ITEMS_SEED_KEY);
}

// Pools is managed in the Facilities tab — make sure no lingering service
// record exists (idempotent: runs every startup, NOOP once cleaned).
{
  const poolsService = db.prepare(`SELECT * FROM services WHERE key = 'pools'`).get();
  if (poolsService) {
    const existingPoolsFacility = db.prepare(`SELECT id FROM facilities WHERE key = 'pools'`).get();
    if (!existingPoolsFacility) {
      // First time: copy the service into a facility with default indoor pool
      const firstImage = (() => {
        try { const u = JSON.parse(poolsService.image_urls || '[]'); return u[0] || null; } catch { return null; }
      })();
      const r = db.prepare(`
        INSERT INTO facilities
          (key, name, category, description, hours, location, phone, image_url, bookable, price, extra_info, image_urls,
           indoor_pool_name, indoor_pool_subtitle, indoor_pool_image_url)
        VALUES
          ('pools', @name, 'pool', @description, @hours, @location, NULL, NULL, 0, NULL, @extra_info, @image_urls,
           'Indoor Pool', 'At SEArenity Club · Swimming cap is mandatory', @first_image)
      `).run({
        name: poolsService.name || 'Pools',
        description: poolsService.description || null,
        hours: poolsService.hours || null,
        location: poolsService.location || null,
        extra_info: poolsService.extra_info || null,
        image_urls: poolsService.image_urls || null,
        first_image: firstImage,
      });
      const newFacilityId = r.lastInsertRowid;
      const items = db.prepare(`SELECT * FROM service_items WHERE service_id = ?`).all(poolsService.id);
      const insertFacItem = db.prepare(`
        INSERT INTO facility_items (facility_id, kind, name, subtitle, description, image_url, sort_order)
        VALUES (?, 'pool', ?, ?, ?, ?, ?)
      `);
      for (const it of items) {
        insertFacItem.run(newFacilityId, it.name, it.subtitle || null, it.extra || null, it.image_url || null, it.sort_order || 0);
      }
    }
    // Always remove the orphaned service-side records
    db.prepare(`DELETE FROM service_items WHERE service_id = ?`).run(poolsService.id);
    db.prepare(`DELETE FROM services WHERE id = ?`).run(poolsService.id);
  }

  // Fresh-install fallback: ensure a Pools facility exists with sensible
  // defaults even when there was never a pools service to migrate from.
  const existing = db.prepare(`SELECT id FROM facilities WHERE key = 'pools'`).get();
  if (!existing) {
    const r = db.prepare(`
      INSERT INTO facilities
        (key, name, category, description, hours, location, extra_info, image_urls, bookable,
         indoor_pool_name, indoor_pool_subtitle, indoor_pool_image_url)
      VALUES
        ('pools', 'Pools', 'pool',
         'Three outdoor pools right on the seafront — one Olympic-size — plus a heated indoor pool at SEArenity Club.',
         'Outdoor pools · 7:00 AM – 7:00 PM', NULL,
         'Towel rentals available near the Pool Bar',
         '["/uploads/seeds/services/pools.png"]', 0,
         'Indoor Pool', 'At SEArenity Club · Swimming cap is mandatory',
         '/uploads/seeds/services/pools.png')
    `).run();
    const insertFacItem = db.prepare(`
      INSERT INTO facility_items (facility_id, kind, name, subtitle, description, sort_order)
      VALUES (?, 'pool', ?, ?, ?, ?)
    `);
    insertFacItem.run(r.lastInsertRowid, 'Olympic Pool',   'No pool floats allowed', 'olympic-pool', 10);
    insertFacItem.run(r.lastInsertRowid, 'Children Pool',  'Pool floats allowed',    'children-pool', 20);
    insertFacItem.run(r.lastInsertRowid, "Kids' Fountain", 'Supervised by parents',  'fountain-pool', 30);
  }
}

// --- Tennis cleanup (idempotent): correct location, clear hours, seed coach hint ---
db.prepare(`
  UPDATE facilities SET
    location = 'Two outdoor courts, Activities Zone',
    hours = NULL,
    price = NULL,
    coach_hint = COALESCE(coach_hint, 'Book a session with one of our coaches · $15 per session, court included')
  WHERE key = 'tennis'
`).run();

// --- Seed Marina activities (idempotent: only inserts if marina has none) ---
{
  const marina = db.prepare(`SELECT id FROM services WHERE key = 'marina'`).get();
  if (marina) {
    const existing = db.prepare(`SELECT COUNT(*) c FROM service_items WHERE service_id = ? AND kind = 'activity'`).get(marina.id);
    if (existing.c === 0) {
      const ins = db.prepare(`
        INSERT INTO service_items (service_id, kind, name, subtitle, sort_order)
        VALUES (?, 'activity', ?, ?, ?)
      `);
      ins.run(marina.id, 'Boat docking',            'Private and visitor slips', 10);
      ins.run(marina.id, 'Coastal tours',           'For couples & groups',      20);
      ins.run(marina.id, 'Boat dining experiences', 'Onboard meals at sea',      30);
      ins.run(marina.id, 'Taxi boat service',       'To coastal restaurants',    40);
    }
  }
}

// --- Maritime Academy as a service (admin-editable) ---
{
  const existing = db.prepare(`SELECT id FROM services WHERE key = 'maritime_academy'`).get();
  if (!existing) {
    db.prepare(`
      INSERT INTO services
        (key, name, subtitle, description, phone, email, hours, location, extra_info, image_urls, sort_order, website, instagram_url)
      VALUES
        ('maritime_academy', 'Maritime Academy', 'Professional Maritime Education & Training',
         'Professional Maritime Education & Training. Boat cruise certifications, safety courses, and crew training — taught by experienced instructors.',
         '+961 81 273 239', 'admissions@imaritime.academy', NULL, NULL, NULL,
         '["/uploads/seeds/services/maritime_academy.png"]', 1000,
         'https://www.imaritimeacademy.com/',
         'https://www.instagram.com/maritimeacademyleb/')
    `).run();
  }
}

// --- Services (Marina + Other Services) ---
// Mirror what each service screen currently displays so admins can edit it.
const SERVICE_SEEDS = [
  {
    key: 'front_desk', sort_order: 10, name: 'Front Desk', subtitle: null,
    description: 'Our team is here for you around the clock. Concierge, requests, late check-out, anything you need — just ask.',
    phone: '+9619123456', email: 'frontdesk@portemilio.com',
    hours: '24 hours, every day', location: 'Lobby · Ground floor', extra_info: null,
    image_urls: ['/uploads/seeds/services/front-desk.jpg'],
  },
  {
    key: 'heritage', sort_order: 20, name: 'Portemilio Heritage', subtitle: 'Since 1996',
    description: "Portemilio Hotel and Resort opened three decades ago with a simple intention: to create a place where people feel at home, not just for a stay, but across moments and generations. Set across more than 50,000m² by the sea, it offers the space to slow down, settle in, and feel part of something lasting. As both a hotel and a resort, it has become a place where some come for a visit, and others choose to stay, finding their own rhythm of life here.\n\nAt the heart of this is the people behind Portemilio. The team is not just staff, but a close knit group that cares, remembers, and welcomes with sincerity. Many have been here for years, building real relationships with guests and residents alike. This continuity creates a sense of trust and warmth that is felt in every interaction, and in every detail.\n\nOver the years, Portemilio has also had the privilege of welcoming distinguished guests, including members of royalty and international figures. This has always been approached with quiet humility. It reflects values that remain central to Portemilio: discretion, respect, and a genuine commitment to making every guest feel comfortable and cared for.\n\nToday, Portemilio continues to grow while staying true to what defines it. It is a place shaped by people, where lives unfold naturally, where memories are created over time, and where the intention remains simple: to be here for you, in the moments that matter most.",
    phone: null, email: null, hours: null, location: null, extra_info: null,
    image_urls: ['/uploads/seeds/services/portemilio_vintage.jpg'],
  },
  {
    key: 'seaside_access', sort_order: 30, name: 'Seaside Access', subtitle: null,
    description: "A complimentary shuttle takes you from the hotel to the seaside and La Réserve in just a few minutes. Call when you're ready and we'll come pick you up.",
    phone: '+9619123457', email: null,
    hours: '7:00 AM – 7:00 PM', location: 'Hotel lobby → Seaside / La Réserve',
    extra_info: 'Complimentary for hotel guests',
    image_urls: ['/uploads/seeds/services/seaside-access.png'],
  },
  {
    key: 'celebrate', sort_order: 40, name: 'Celebrate Together', subtitle: 'Two venues. Endless reasons.',
    description: "Whatever you're celebrating, we have a place for it.",
    phone: '+9619123466', email: null, hours: null, location: null, extra_info: null,
    image_urls: [
      '/uploads/seeds/services/celebrate1.jpg', '/uploads/seeds/services/celebrate2.jpg',
      '/uploads/seeds/services/celebrate3.jpg', '/uploads/seeds/services/celebrate4.jpg',
      '/uploads/seeds/services/celebrate5.jpg', '/uploads/seeds/services/celebrate6.jpg',
    ],
  },
  {
    key: 'housekeeping', sort_order: 50, name: 'Housekeeping', subtitle: null,
    description: 'Fresh towels, extra pillows, turn-down service — anything to make your room feel just right.',
    phone: '+9619123458', email: null,
    hours: '24 hours', location: null,
    extra_info: 'Daily room cleaning: 9:00 AM – 3:00 PM',
    image_urls: ['/uploads/seeds/services/housekeeping.jpg'],
  },
  {
    key: 'room_service', sort_order: 60, name: 'Room Service', subtitle: null,
    description: 'Anything from the kitchen, delivered to your door. From a midnight snack to a full dinner — just call.',
    phone: '+9619123460', email: null,
    hours: '6:00 AM – 11:00 PM', location: null,
    extra_info: 'About 30 min delivery, charged to your room',
    image_urls: ['/uploads/seeds/services/room-service.jpg'],
  },
  // Pools is managed in the Facilities tab — not seeded as a service.
  {
    key: 'landmarks', sort_order: 80, name: 'Explore Landmarks', subtitle: 'Destination Guide',
    description: 'Discover sights and services nearby — from historic landmarks to coastal services we recommend.',
    phone: null, email: null, hours: null, location: null, extra_info: null,
    image_urls: ['/uploads/seeds/services/jounieh-guide.jpg'],
  },
  {
    key: 'get_to_city', sort_order: 90, name: 'Get to the City', subtitle: null,
    description: 'Heading into Beirut, Byblos, or beyond? We arrange a private car or a group van — daily, 7 AM – 11 PM. Call us to book.',
    phone: '+9619123475', email: null,
    hours: '7 AM – 11 PM', location: null,
    extra_info: 'Private car (up to 4 passengers) · Van (up to 8 passengers)',
    image_urls: ['/uploads/seeds/services/transport-to-the-city.png'],
  },
  {
    // Marina lives in its own admin tab but uses the same services table.
    key: 'marina', sort_order: 0, name: 'Marina', subtitle: null,
    description: 'Explore the marina — docking, coastal tours, dining at sea, and certified cruise training.',
    phone: '+961 9 123 470', email: null, hours: null, location: null, extra_info: null,
    image_urls: ['/uploads/seeds/services/marina.png'],
  },
];

const insertService = db.prepare(`
  INSERT OR IGNORE INTO services
    (key, name, subtitle, description, phone, email, hours, location, extra_info, image_urls, sort_order)
  VALUES (@key, @name, @subtitle, @description, @phone, @email, @hours, @location, @extra_info, @image_urls, @sort_order)
`);
for (const s of SERVICE_SEEDS) {
  insertService.run({ ...s, image_urls: s.image_urls ? JSON.stringify(s.image_urls) : null });
}

// --- Landmarks (Sightseeing + Relevant Services) ---
const LANDMARK_SEEDS = [
  // Sightseeing
  { key: 'jeita-grotto', type: 'sightseeing', sort_order: 10, name: 'Jeita Grotto',
    subtitle: 'Limestone caves & underground river', distance: '5 km',
    address: 'Jeita, Mount Lebanon', phone: null, website: 'https://www.jeitagrotto.com/',
    description: 'Two magnificent grottoes burrow deep into the earth within a beautiful green valley. A river flows between the rocks inside the mountain, with stunning stone draperies and natural wonders that have been forming for thousands of years.',
    image_urls: ['/uploads/seeds/landmarks/jeita_grotto.jpg'], locations: [] },
  { key: 'casino-du-liban', type: 'sightseeing', sort_order: 20, name: 'Casino Du Liban',
    subtitle: 'The most famous Casino in the Middle East', distance: '5 km',
    address: 'Maameltein, Jounieh', phone: null, website: 'https://www.cdl.com.lb/',
    description: 'The most famous Casino in the Middle East, in Maameltein, Jounieh. 35,000 m² of gaming space, around 400 slot machines and 60 gaming tables, and a rich history of hosting heads of state, royalty, and Hollywood legends.',
    image_urls: ['/uploads/seeds/landmarks/casino_du_liban.jpg'], locations: [] },
  { key: 'jounieh-district', type: 'sightseeing', sort_order: 30, name: 'Jounieh District',
    subtitle: 'Coastal town · Resorts, cafes & nightlife', distance: 'Walking distance',
    address: 'Jounieh, Mount Lebanon', phone: null, website: null,
    description: 'Between Beirut and Byblos, the coastal town of Jounieh has a spectacular bay with mountains rising behind it. Seaside resorts, cafes, bustling nightlife, an old stone souk, ferry port, and the famous cable car (Téléphérique) up the mountain to Harissa.',
    image_urls: ['/uploads/seeds/landmarks/jounieh.jpg'], locations: [] },
  { key: 'harissa', type: 'sightseeing', sort_order: 40, name: 'Harissa',
    subtitle: 'Our Lady of Lebanon · Virgin Mary statue', distance: '10 km',
    address: 'Harissa, Mount Lebanon', phone: null, website: null,
    description: "A 15-ton bronze statue of the Virgin Mary, known as Our Lady of Lebanon (Notre Dame du Liban), arms outstretched, adorns the bluff high above Jounieh. Inside the statue's base there is a small chapel.",
    image_urls: ['/uploads/seeds/landmarks/harissa.jpg'], locations: [] },
  { key: 'beirut-downtown', type: 'sightseeing', sort_order: 50, name: 'Beirut Downtown',
    subtitle: 'Beirut Central District · Shopping & cafes', distance: '18 km',
    address: 'Downtown Beirut', phone: null, website: null,
    description: "Beirut's most prestigious shopping district. Home to high-end local boutiques and international luxury brands, car-free streets, cafes, restaurants, and the Beirut Souks.",
    image_urls: ['/uploads/seeds/landmarks/beirut_downtown.jpg'], locations: [] },
  { key: 'byblos', type: 'sightseeing', sort_order: 60, name: 'Byblos (Jbeil)',
    subtitle: 'One of the oldest continuously inhabited cities', distance: '22 km',
    address: 'Jbeil (Byblos), Lebanon', phone: null, website: null,
    description: "Byblos competes for the title of oldest continuously inhabited city. The Greeks named it Byblos, meaning 'Papyrus', for its papyrus trade. A charming city with an ancient harbor, seaside fish restaurants, ancient souks, and historic neighborhoods.",
    image_urls: ['/uploads/seeds/landmarks/byblos.jpg'], locations: [] },
  { key: 'st-charbel', type: 'sightseeing', sort_order: 70, name: 'St Charbel',
    subtitle: 'Saint Charbel Monastery · Annaya', distance: '25 km',
    address: 'Annaya, Lebanon', phone: null, website: null,
    description: "Nestled in the serene mountains of Annaya, the St. Charbel Monastery is one of Lebanon's most revered pilgrimage sites. Home to the tomb of Saint Charbel Makhlouf, surrounded by breathtaking landscapes — a unique blend of spiritual heritage and natural beauty.",
    image_urls: ['/uploads/seeds/landmarks/st_charbel.jpg'], locations: [] },
  { key: 'mzaar-ski', type: 'sightseeing', sort_order: 80, name: 'Mzaar Ski Resort',
    subtitle: 'Largest ski resort in the Middle East', distance: '30 km',
    address: 'Kfardebian, Mount Lebanon', phone: null, website: null,
    description: "The Middle East's largest ski resort. 20 chairlifts, 50 runs, and 8,000 acres of terrain, plus an entertainment scene of restaurants and bars at the base.",
    image_urls: ['/uploads/seeds/landmarks/mzaar-ski.jpg'], locations: [] },
  { key: 'batroun', type: 'sightseeing', sort_order: 90, name: 'Batroun',
    subtitle: 'Coastal tourist town · Beach & nightlife', distance: '30 km',
    address: 'Batroun, North Lebanon', phone: null, website: null,
    description: 'A major tourist destination in North Lebanon. Historic Maronite and Greek Orthodox churches, vibrant nightlife, fresh lemonade at the cafés on the main street, and the annual Batroun International Festival.',
    image_urls: ['/uploads/seeds/landmarks/batroun.jpg'], locations: [] },
  { key: 'saida', type: 'sightseeing', sort_order: 100, name: 'Saida (Sidon)',
    subtitle: 'Ancient Phoenician city · Crusader castle', distance: '60 km',
    address: 'Saida, South Lebanon', phone: null, website: null,
    description: 'Saida (Sidon) has a fascinating Phoenician history — once a major city-state, famous for its glass manufacturing and the invention of purple dye. Today known for its Roman ruins, Crusader castle, and Mamluk and Ottoman heritage.',
    image_urls: ['/uploads/seeds/landmarks/saida.jpg'], locations: [] },
  { key: 'tripoli', type: 'sightseeing', sort_order: 110, name: 'Tripoli',
    subtitle: "Lebanon's second-largest city · Northern coast", distance: '65 km',
    address: 'Tripoli, North Lebanon', phone: null, website: null,
    description: 'The largest city in northern Lebanon. Holds the Oscar Niemeyer International Fair and the Palm Islands — a protected area for endangered loggerhead turtles, monk seals, and migratory birds.',
    image_urls: ['/uploads/seeds/landmarks/tripoli.jpg'], locations: [] },
  { key: 'baalbeck', type: 'sightseeing', sort_order: 120, name: 'Baalbeck',
    subtitle: 'Ancient Phoenician city · Roman temples', distance: '85 km',
    address: 'Baalbek, Beqaa Valley', phone: null, website: null,
    description: 'An ancient Phoenician city in the Beqaa Valley. Inhabited as early as 9000 BCE and once a major pilgrimage site for the worship of the Phoenician sky-god Baal. The ruins of the early temple remain today beneath the later Roman Temple of Jupiter.',
    image_urls: ['/uploads/seeds/landmarks/baalbeck.jpg'], locations: [] },
  // Relevant Services — each has its own list of locations
  { key: 'pharmacies', type: 'relevant_services', sort_order: 200, name: 'Pharmacies',
    subtitle: 'Nearby pharmacies', distance: 'Various',
    address: null, phone: null, website: null,
    description: 'Pharmacies near Portemilio in Kaslik and Jounieh.',
    image_urls: ['/uploads/seeds/landmarks/pharmacies.jpg'],
    locations: [
      { name: 'Placeholder Pharmacy 1', address: 'Address goes here', phone: null },
      { name: 'Placeholder Pharmacy 2', address: 'Address goes here', phone: null },
      { name: 'Placeholder Pharmacy 3', address: 'Address goes here', phone: null },
    ],
  },
  { key: 'hospitals', type: 'relevant_services', sort_order: 210, name: 'Hospitals',
    subtitle: 'Hospitals and clinics', distance: 'Various',
    address: null, phone: null, website: null,
    description: 'Nearby hospitals and clinics for emergencies and care.',
    image_urls: ['/uploads/seeds/landmarks/hospitals.jpg'],
    locations: [
      { name: 'Placeholder Hospital 1', address: 'Address goes here', phone: null },
      { name: 'Placeholder Hospital 2', address: 'Address goes here', phone: null },
    ],
  },
];

const insertLandmark = db.prepare(`
  INSERT OR IGNORE INTO landmarks
    (key, type, name, subtitle, description, distance, address, phone, website, image_urls, sort_order)
  VALUES (@key, @type, @name, @subtitle, @description, @distance, @address, @phone, @website, @image_urls, @sort_order)
`);
const insertLandmarkLocation = db.prepare(`
  INSERT INTO landmark_locations (landmark_id, name, address, phone, sort_order)
  VALUES (?, ?, ?, ?, ?)
`);
const findLandmarkByKey = db.prepare('SELECT id FROM landmarks WHERE key = ?');
const countChildLocations = db.prepare('SELECT COUNT(*) c FROM landmark_locations WHERE landmark_id = ?');

for (const l of LANDMARK_SEEDS) {
  insertLandmark.run({
    ...l,
    image_urls: l.image_urls ? JSON.stringify(l.image_urls) : null,
  });
  // Only seed child locations once (when there are none)
  const row = findLandmarkByKey.get(l.key);
  if (row && l.locations && l.locations.length) {
    const c = countChildLocations.get(row.id).c;
    if (c === 0) {
      l.locations.forEach((loc, i) => {
        insertLandmarkLocation.run(row.id, loc.name, loc.address || null, loc.phone || null, (i + 1) * 10);
      });
    }
  }
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
