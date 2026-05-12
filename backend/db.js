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
if (!hasColumn('bookings', 'reminder_sent')) {
  db.exec(`ALTER TABLE bookings ADD COLUMN reminder_sent INTEGER DEFAULT 0`);
}
if (!hasColumn('restaurants', 'image_urls')) {
  db.exec(`ALTER TABLE restaurants ADD COLUMN image_urls TEXT`);
}
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
  {
    key: 'pools', sort_order: 70, name: 'Pools', subtitle: null,
    description: 'Three outdoor pools right on the seafront — one Olympic-size — plus a heated indoor pool at SEArenity Club.',
    phone: null, email: null,
    hours: 'Outdoor pools · 7:00 AM – 7:00 PM', location: null,
    extra_info: 'Towel rentals available near the Pool Bar',
    image_urls: ['/uploads/seeds/services/pools.png'],
  },
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
