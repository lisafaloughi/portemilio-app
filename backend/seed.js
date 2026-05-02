// Seeds the SQLite DB with demo data for Portemilio.
// Run:  node seed.js   (safe to re-run — wipes & reseeds content tables; preserves users except resets demo accounts)

const db = require('./db');
const { hashPassword } = require('./auth');

console.log('Seeding Portemilio database...');

db.exec(`
  DELETE FROM menu_items;
  DELETE FROM restaurants;
  DELETE FROM facilities;
  DELETE FROM rentals;
  DELETE FROM events;
  DELETE FROM settings;
`);

// Demo users — wipe then recreate demo accounts
db.prepare(`DELETE FROM users WHERE email IN ('admin@portemilio.com','guest@portemilio.com')`).run();

db.prepare(`
  INSERT INTO users (name, email, password_hash, is_admin)
  VALUES ('Portemilio Admin', 'admin@portemilio.com', ?, 1)
`).run(hashPassword('admin123'));

db.prepare(`
  INSERT INTO users (name, email, password_hash, room_number, chalet_number, birthday)
  VALUES ('Demo Guest', 'guest@portemilio.com', ?, NULL, '42', '2003-05-30')
`).run(hashPassword('guest123'));

// Settings
const settings = [
  ['welcome_message', 'Welcome to Portemilio Resort — Kaslik, Lebanon. Enjoy your stay!'],
  ['front_desk_phone', '+961 9 640 666'],
  ['emergency_phone', '+961 9 640 000'],
  ['wifi_name', 'Portemilio-Guest'],
  ['wifi_password', 'portemilio2026'],
  ['address', 'Kaslik Seaside, Jounieh, Lebanon'],
];
const insSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
for (const [k, v] of settings) insSetting.run(k, v);

// Facilities
const facilities = [
  {
    key: 'outdoor_pool',
    name: 'Outdoor Swimming Pool',
    category: 'pool',
    description: 'Large seawater outdoor pool overlooking the bay of Jounieh. Lifeguards on duty during opening hours.',
    hours: 'Daily 8:00 AM – 7:00 PM (Summer season)',
    location: 'Main resort deck, sea level',
    phone: '+961 9 640 666',
    image_url: 'placeholder:outdoor_pool',
    bookable: 0,
    price: 'Free for guests',
    extra_info: 'Towels provided. Children must be accompanied by an adult.'
  },
  {
    key: 'indoor_pool',
    name: 'Indoor Heated Pool',
    category: 'pool',
    description: 'Heated indoor swimming pool open year-round, part of the spa wing.',
    hours: 'Daily 7:00 AM – 9:00 PM',
    location: 'Spa wing, Level -1',
    phone: '+961 9 640 666',
    image_url: 'placeholder:indoor_pool',
    bookable: 0,
    price: 'Free for guests',
    extra_info: 'Swim caps required.'
  },
  {
    key: 'gym',
    name: 'Fitness Center',
    category: 'wellness',
    description: 'Fully-equipped gym with cardio machines, free weights, and weekly group classes.',
    hours: 'Daily 6:00 AM – 10:00 PM',
    location: 'Spa wing, Level -1',
    phone: '+961 9 640 666',
    image_url: 'placeholder:gym',
    bookable: 0,
    price: 'Free for guests',
    extra_info: 'Personal trainer available on request.'
  },
  {
    key: 'spa',
    name: 'Portemilio Spa',
    category: 'wellness',
    description: 'Full-service spa offering massages, facials, sauna, steam room, and hammam.',
    hours: 'Daily 10:00 AM – 8:00 PM',
    location: 'Spa wing, Level -1',
    phone: '+961 9 640 600',
    image_url: 'placeholder:spa',
    bookable: 1,
    price: 'From $50 per treatment',
    extra_info: 'Reservations recommended at least 4 hours in advance.'
  },
  {
    key: 'hair_salon',
    name: 'Hair Salon & Beauty',
    category: 'wellness',
    description: 'On-site hair and beauty salon offering cuts, color, styling, manicure and pedicure.',
    hours: 'Tue – Sun, 10:00 AM – 7:00 PM',
    location: 'Ground floor, lobby wing',
    phone: '+961 9 640 610',
    image_url: 'placeholder:salon',
    bookable: 1,
    price: 'From $25',
    extra_info: 'Closed Mondays.'
  },
  {
    key: 'tennis',
    name: 'Tennis Courts',
    category: 'sports',
    description: 'Two outdoor clay tennis courts. Racquet rental and coaching available.',
    hours: 'Daily 7:00 AM – 9:00 PM',
    location: 'Sports area, east side',
    phone: '+961 9 640 620',
    image_url: 'placeholder:tennis',
    bookable: 1,
    price: '$15 per hour',
    extra_info: 'Please wear non-marking shoes.'
  },
  {
    key: 'shooting',
    name: 'Shooting Range',
    category: 'sports',
    description: 'Supervised shooting activity for guests 18+. Safety briefing provided.',
    hours: 'Fri – Sun, 10:00 AM – 5:00 PM',
    location: 'Lower terrace, west side',
    phone: '+961 9 640 630',
    image_url: 'placeholder:shooting',
    bookable: 1,
    price: '$20 per session',
    extra_info: 'Valid ID required. Minors not admitted.'
  },
  {
    key: 'kids_club',
    name: 'Kids Club',
    category: 'family',
    description: 'Supervised activities for children ages 4–12. Arts, games, and pool time.',
    hours: 'Daily 10:00 AM – 6:00 PM',
    location: 'Ground floor, family wing',
    phone: '+961 9 640 640',
    image_url: 'placeholder:kids',
    bookable: 0,
    price: 'Free for guests',
    extra_info: ''
  },
  {
    key: 'beach',
    name: 'Private Beach',
    category: 'outdoor',
    description: 'Private sandy beach with sun loungers, umbrellas and waiter service.',
    hours: 'Daily 8:00 AM – 7:00 PM',
    location: 'Sea level',
    phone: '+961 9 640 666',
    image_url: 'placeholder:beach',
    bookable: 0,
    price: 'Free for guests',
    extra_info: ''
  },
  {
    key: 'concierge',
    name: 'Concierge & Front Desk',
    category: 'services',
    description: '24/7 concierge for transportation, excursions, and special requests.',
    hours: '24/7',
    location: 'Main lobby',
    phone: '+961 9 640 666',
    image_url: 'placeholder:concierge',
    bookable: 0,
    price: '',
    extra_info: ''
  },
];

const insF = db.prepare(`
  INSERT INTO facilities (key, name, category, description, hours, location, phone, image_url, bookable, price, extra_info)
  VALUES (@key, @name, @category, @description, @hours, @location, @phone, @image_url, @bookable, @price, @extra_info)
`);
for (const f of facilities) insF.run(f);

// Restaurants & menus — these mirror what the mobile app shows in mobile/data/venues.js.
// `slug` is the stable id; the mobile keeps a local image map keyed by slug.
const insR = db.prepare(`
  INSERT INTO restaurants (slug, name, cuisine, description, hours, location, phone, image_url, delivery,
                           specialty, categories, address, highlights, map_pin_id, upcoming, sort_order)
  VALUES (@slug, @name, @cuisine, @description, @hours, @location, @phone, @image_url, @delivery,
          @specialty, @categories, @address, @highlights, @map_pin_id, @upcoming, @sort_order)
`);
const insMI = db.prepare(`
  INSERT INTO menu_items (restaurant_id, name, description, category, price, image_url, plat_du_jour, available)
  VALUES (@restaurant_id, @name, @description, @category, @price, @image_url, @plat_du_jour, @available)
`);

const restaurants = [
  {
    slug: 'la-reserve',
    name: 'La Réserve',
    cuisine: 'Lebanese & Mediterranean',
    specialty: 'Brunch on Sundays',
    categories: 'restaurants',
    description:
      'A refined buffet experience for our most memorable Sunday brunches — the kind that runs into the afternoon.',
    hours: 'Sundays 1 PM – 6 PM',
    location: 'Seaside terrace',
    address: 'Portemilio · Seaside terrace',
    phone: '+9619123461',
    highlights: JSON.stringify(['Sunday brunch · 1 PM – 6 PM', 'Buffet for $35/adult · $25/child', 'Reservations recommended']),
    map_pin_id: 'la-reserve',
    upcoming: 0,
    delivery: 0,
    sort_order: 1,
    menu: [
      { category: 'Plat du jour', name: 'Mloukhiyeh', description: 'Slow-cooked greens, chicken, vermicelli rice, lemon', price: 18, plat_du_jour: 1 },
      { category: 'Buffet', name: 'Sunday Brunch (Adult)', description: 'Full buffet · 1 PM – 6 PM', price: 35, plat_du_jour: 0 },
      { category: 'Buffet', name: 'Sunday Brunch (Child)', description: 'Children up to 12', price: 25, plat_du_jour: 0 },
    ],
  },
  {
    slug: 'pool-bar',
    name: 'Pool Bar',
    cuisine: 'Snacks & Drinks',
    specialty: 'Eat & drink by the pool',
    categories: 'restaurants,bars',
    description: 'Simple lunches, fresh lemonade, and our signature Merry Cream.',
    hours: 'Daily · 9 AM – sunset',
    location: 'Olympic pool deck',
    address: 'Olympic pool deck',
    phone: '+9619123462',
    highlights: JSON.stringify(['Daily · 9 AM – sunset']),
    map_pin_id: 'pool-bar',
    upcoming: 0,
    delivery: 1,
    sort_order: 2,
    menu: [
      { category: 'Drinks', name: 'Fresh Lemonade', description: 'With mint', price: 5, plat_du_jour: 0 },
      { category: 'Drinks', name: 'Merry Cream', description: 'Our signature creamy refresher', price: 7, plat_du_jour: 0 },
      { category: 'Drinks', name: 'Mojito', description: 'Rum, lime, mint, soda', price: 10, plat_du_jour: 0 },
      { category: 'Bites', name: 'Club Sandwich', description: 'Chicken, bacon, egg, fries', price: 14, plat_du_jour: 0 },
      { category: 'Bites', name: 'Cheeseburger', description: 'Beef patty, cheddar, fries', price: 16, plat_du_jour: 0 },
      { category: 'Bites', name: 'Caesar Salad', description: 'Romaine, grilled chicken, parmesan', price: 13, plat_du_jour: 0 },
    ],
  },
  {
    slug: 'la-terrasse',
    name: 'La Terrasse',
    cuisine: 'Lebanese & Mediterranean',
    specialty: 'Eat & drink with a view of the sea',
    categories: 'restaurants',
    description: 'Open-air dining suspended above the Mediterranean. The breeze, the horizon, and your plate.',
    hours: 'Lunch & dinner',
    location: 'Seafront terrace',
    address: 'Seafront terrace',
    phone: '+9619123463',
    highlights: JSON.stringify(['Lunch & dinner']),
    map_pin_id: 'la-terrasse',
    upcoming: 0,
    delivery: 1,
    sort_order: 3,
    menu: [
      { category: 'Mezze', name: 'Hummus', description: 'Chickpea purée with tahini and olive oil', price: 8, plat_du_jour: 0 },
      { category: 'Mezze', name: 'Tabbouleh', description: 'Parsley, tomato, bulgur, lemon', price: 9, plat_du_jour: 0 },
      { category: 'Mezze', name: 'Moutabal', description: 'Smoked eggplant with tahini', price: 9, plat_du_jour: 0 },
      { category: 'Grill', name: 'Mixed Grill', description: 'Shish taouk, kafta, lamb chops', price: 28, plat_du_jour: 0 },
      { category: 'Seafood', name: 'Grilled Sea Bass', description: 'Fresh local catch, lemon, herbs', price: 34, plat_du_jour: 0 },
      { category: 'Dessert', name: 'Baklava', description: 'Pistachio, honey syrup', price: 7, plat_du_jour: 0 },
    ],
  },
  {
    slug: 'fellinis',
    name: "Fellini's",
    cuisine: 'Lebanese · Breakfast',
    specialty: 'Breakfast buffet',
    categories: 'restaurants',
    description:
      'Where mornings begin — a generous Lebanese buffet, fresh pastries, eggs to order, and anything worth waking up for.',
    hours: 'Breakfast 7 – 11 AM',
    location: '1st floor · Lobby level',
    address: '1st floor · Lobby level',
    phone: '+9619123464',
    highlights: JSON.stringify([
      'Breakfast Buffet · 7 – 11 AM',
      '$25 per person — pay at reception',
      'A la carte options also available',
    ]),
    map_pin_id: 'fellini',
    upcoming: 0,
    delivery: 0,
    sort_order: 4,
    menu: [],
  },
  {
    slug: 'khuans-bar',
    name: "Khuan's Bar",
    cuisine: 'Bar · Live music',
    specialty: 'Piano nights · pool table',
    categories: 'bars',
    description:
      'A classic piano bar for slow nights. Sink into the leather, rack up a game, listen to the music.',
    hours: 'Evenings · 6 PM – late',
    location: 'Lobby level',
    address: 'Lobby level',
    phone: '+9619123465',
    highlights: JSON.stringify(['Evenings · 6 PM – late', 'Live piano · Late-night drinks & games']),
    map_pin_id: 'khuans-bar',
    upcoming: 0,
    delivery: 0,
    sort_order: 5,
    menu: [],
  },
  {
    slug: 'sunset-bar',
    name: 'Sunset Bar',
    cuisine: 'Bar',
    specialty: 'Coming soon · Sunsets & cocktails',
    categories: 'bars',
    description: 'Light bites and fresh drinks, with front-row sunset views.',
    hours: 'Opening soon',
    location: 'Sea deck near the tennis courts',
    address: 'Sea deck near the tennis courts',
    phone: null,
    highlights: JSON.stringify(['Opening soon']),
    map_pin_id: 'sunset-bar',
    upcoming: 1,
    delivery: 0,
    sort_order: 6,
    menu: [],
  },
];

for (const r of restaurants) {
  const { menu, ...rest } = r;
  const restaurantRow = { image_url: null, ...rest };
  const info = insR.run(restaurantRow);
  for (const m of menu || []) {
    insMI.run({
      restaurant_id: info.lastInsertRowid,
      name: m.name,
      description: m.description || '',
      category: m.category || null,
      price: m.price,
      image_url: null,
      plat_du_jour: m.plat_du_jour ? 1 : 0,
      available: 1,
    });
  }
}

// Rentals (water sports + sports equipment)
const rentals = [
  { name: 'Jet Ski', category: 'water_sports', description: 'Single-seat jet ski. Life vest included.', price_per_hour: 80, image_url: 'placeholder:jetski', available: 1 },
  { name: 'Paddle Board', category: 'water_sports', description: 'Stand-up paddle board.', price_per_hour: 15, image_url: 'placeholder:sup', available: 1 },
  { name: 'Kayak (Single)', category: 'water_sports', description: 'Single-person kayak.', price_per_hour: 12, image_url: 'placeholder:kayak', available: 1 },
  { name: 'Kayak (Double)', category: 'water_sports', description: 'Two-person kayak.', price_per_hour: 18, image_url: 'placeholder:kayak2', available: 1 },
  { name: 'Banana Boat (per person)', category: 'water_sports', description: 'Towed inflatable — 10 min ride.', price_per_hour: 15, image_url: 'placeholder:banana', available: 1 },
  { name: 'Parasailing', category: 'water_sports', description: 'Tandem parasailing — 15 min flight.', price_per_hour: 70, image_url: 'placeholder:parasail', available: 1 },
  { name: 'Snorkeling Set', category: 'water_sports', description: 'Mask, snorkel, fins.', price_per_hour: 10, image_url: 'placeholder:snorkel', available: 1 },
  { name: 'Tennis Racquet', category: 'sports', description: 'Adult racquet with balls.', price_per_hour: 5, image_url: 'placeholder:racquet', available: 1 },
  { name: 'Beach Cabana', category: 'beach', description: 'Private shaded cabana for the day.', price_per_hour: 25, image_url: 'placeholder:cabana', available: 1 },
];
const insRent = db.prepare(`
  INSERT INTO rentals (name, category, description, price_per_hour, image_url, available)
  VALUES (@name, @category, @description, @price_per_hour, @image_url, @available)
`);
for (const r of rentals) insRent.run(r);

// Events
const now = new Date();
function d(daysFromNow, hour, min = 0) {
  const x = new Date(now.getTime());
  x.setDate(x.getDate() + daysFromNow);
  x.setHours(hour, min, 0, 0);
  return x.toISOString();
}
const events = [
  { title: 'Live Jazz Night', description: 'Trio performing at La Terrasse.', location: 'La Terrasse', start_time: d(2, 21), end_time: d(2, 23, 30), image_url: 'placeholder:jazz', capacity: 80, bookable: 1 },
  { title: 'Pool Side BBQ', description: 'All-you-can-eat BBQ buffet by the pool.', location: 'Outdoor Pool Deck', start_time: d(5, 19), end_time: d(5, 23), image_url: 'placeholder:bbq', capacity: 150, bookable: 1 },
  { title: 'Kids Sunday Workshop', description: 'Arts & crafts for children 4–12.', location: 'Kids Club', start_time: d(6, 11), end_time: d(6, 13), image_url: 'placeholder:kidsworkshop', capacity: 30, bookable: 1 },
  { title: 'Wine Tasting', description: 'Lebanese winemakers tasting evening.', location: 'Sakura Rooftop', start_time: d(9, 20), end_time: d(9, 22), image_url: 'placeholder:wine', capacity: 40, bookable: 1 },
];
const insE = db.prepare(`
  INSERT INTO events (title, description, location, start_time, end_time, image_url, capacity, bookable)
  VALUES (@title, @description, @location, @start_time, @end_time, @image_url, @capacity, @bookable)
`);
for (const e of events) insE.run(e);

// A welcome notification for everyone
db.prepare('DELETE FROM notifications').run();
db.prepare('INSERT INTO notifications (title, body, user_id) VALUES (?, ?, NULL)')
  .run('Welcome to Portemilio', 'Explore the app to book services, order to your chalet, and discover all our activities.');

console.log('Seed complete.');
console.log('Admin login: admin@portemilio.com / admin123');
console.log('Guest login: guest@portemilio.com / guest123');
