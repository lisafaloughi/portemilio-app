const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const db = require('./db');
const { hashPassword, verifyPassword, signToken, authRequired, adminRequired } = require('./auth');

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

// Serve admin portal static files
app.use('/admin', express.static(path.join(__dirname, 'public')));

const api = express.Router();

// ---------- Auth ----------
api.post('/auth/register', (req, res) => {
  const { name, email, phone, password, room_number, chalet_number } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: 'name, email, password required' });
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing) return res.status(400).json({ error: 'Email already registered' });
  const result = db.prepare(`
    INSERT INTO users (name, email, phone, password_hash, room_number, chalet_number)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(name, email.toLowerCase(), phone || null, hashPassword(password), room_number || null, chalet_number || null);
  const user = db.prepare('SELECT id, name, email, phone, room_number, chalet_number, is_admin FROM users WHERE id = ?').get(result.lastInsertRowid);
  res.json({ token: signToken(user), user });
});

api.post('/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  if (!row || !verifyPassword(password, row.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const user = { id: row.id, name: row.name, email: row.email, phone: row.phone, room_number: row.room_number, chalet_number: row.chalet_number, is_admin: !!row.is_admin };
  res.json({ token: signToken(row), user });
});

api.get('/auth/me', authRequired, (req, res) => {
  const row = db.prepare('SELECT id, name, email, phone, room_number, chalet_number, is_admin FROM users WHERE id = ?').get(req.user.id);
  res.json({ user: row });
});

api.put('/auth/me', authRequired, (req, res) => {
  const { name, phone, room_number, chalet_number, push_token } = req.body || {};
  db.prepare(`
    UPDATE users SET
      name = COALESCE(?, name),
      phone = COALESCE(?, phone),
      room_number = COALESCE(?, room_number),
      chalet_number = COALESCE(?, chalet_number),
      push_token = COALESCE(?, push_token)
    WHERE id = ?
  `).run(name || null, phone || null, room_number || null, chalet_number || null, push_token || null, req.user.id);
  const row = db.prepare('SELECT id, name, email, phone, room_number, chalet_number, is_admin FROM users WHERE id = ?').get(req.user.id);
  res.json({ user: row });
});

// ---------- Public catalog ----------
api.get('/facilities', (_, res) => {
  res.json(db.prepare('SELECT * FROM facilities ORDER BY name').all());
});
api.get('/facilities/:key', (req, res) => {
  const row = db.prepare('SELECT * FROM facilities WHERE key = ? OR id = ?').get(req.params.key, req.params.key);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

api.get('/restaurants', (_, res) => {
  res.json(db.prepare('SELECT * FROM restaurants ORDER BY name').all());
});
api.get('/restaurants/:id', (req, res) => {
  const r = db.prepare('SELECT * FROM restaurants WHERE id = ?').get(req.params.id);
  if (!r) return res.status(404).json({ error: 'Not found' });
  const items = db.prepare('SELECT * FROM menu_items WHERE restaurant_id = ? ORDER BY category, name').all(r.id);
  res.json({ ...r, menu: items });
});

api.get('/menu/plat-du-jour', (_, res) => {
  res.json(db.prepare(`
    SELECT mi.*, r.name as restaurant_name
    FROM menu_items mi JOIN restaurants r ON r.id = mi.restaurant_id
    WHERE mi.plat_du_jour = 1 AND mi.available = 1
  `).all());
});

api.get('/rentals', (_, res) => {
  res.json(db.prepare('SELECT * FROM rentals WHERE available = 1 ORDER BY category, name').all());
});

api.get('/events', (_, res) => {
  res.json(db.prepare(`SELECT * FROM events WHERE datetime(start_time) >= datetime('now','-1 day') ORDER BY start_time`).all());
});

// ---------- Bookings ----------
api.post('/bookings', authRequired, (req, res) => {
  const { resource_type, resource_id, resource_name, start_time, end_time, party_size, notes } = req.body || {};
  if (!resource_type || !start_time) return res.status(400).json({ error: 'resource_type and start_time required' });
  const r = db.prepare(`
    INSERT INTO bookings (user_id, resource_type, resource_id, resource_name, start_time, end_time, party_size, notes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `).run(req.user.id, resource_type, resource_id || null, resource_name || null, start_time, end_time || null, party_size || 1, notes || null);
  res.json({ id: r.lastInsertRowid });
});

api.get('/bookings/mine', authRequired, (req, res) => {
  res.json(db.prepare('SELECT * FROM bookings WHERE user_id = ? ORDER BY start_time DESC').all(req.user.id));
});

api.delete('/bookings/:id', authRequired, (req, res) => {
  const b = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
  if (!b) return res.status(404).json({ error: 'Not found' });
  if (b.user_id !== req.user.id && !req.user.is_admin) return res.status(403).json({ error: 'Forbidden' });
  db.prepare(`UPDATE bookings SET status = 'cancelled' WHERE id = ?`).run(req.params.id);
  res.json({ ok: true });
});

// ---------- Deliveries ----------
api.post('/deliveries', authRequired, (req, res) => {
  const { restaurant_id, items, notes } = req.body || {};
  if (!Array.isArray(items) || !items.length) return res.status(400).json({ error: 'items required' });
  const restaurant = restaurant_id ? db.prepare('SELECT name FROM restaurants WHERE id = ?').get(restaurant_id) : null;
  let total = 0;
  for (const it of items) total += (Number(it.price) || 0) * (Number(it.qty) || 1);
  const me = db.prepare('SELECT room_number, chalet_number FROM users WHERE id = ?').get(req.user.id);
  const dest = me.chalet_number ? `Chalet ${me.chalet_number}` : me.room_number ? `Room ${me.room_number}` : 'Front desk';
  const r = db.prepare(`
    INSERT INTO deliveries (user_id, restaurant_id, restaurant_name, items_json, total, status, room_or_chalet, notes)
    VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)
  `).run(req.user.id, restaurant_id || null, restaurant?.name || null, JSON.stringify(items), total, dest, notes || null);
  res.json({ id: r.lastInsertRowid, total, destination: dest });
});

api.get('/deliveries/mine', authRequired, (req, res) => {
  const rows = db.prepare('SELECT * FROM deliveries WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  res.json(rows.map(r => ({ ...r, items: JSON.parse(r.items_json) })));
});

// ---------- Notifications ----------
api.get('/notifications/mine', authRequired, (req, res) => {
  res.json(db.prepare(`
    SELECT * FROM notifications
    WHERE user_id = ? OR user_id IS NULL
    ORDER BY created_at DESC LIMIT 100
  `).all(req.user.id));
});

api.post('/notifications/read/:id', authRequired, (req, res) => {
  db.prepare('UPDATE notifications SET read = 1 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ---------- Settings (public) ----------
api.get('/settings/:key', (req, res) => {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(req.params.key);
  res.json({ key: req.params.key, value: row ? row.value : null });
});

// =================== ADMIN ENDPOINTS ===================
// All /admin-api/* require admin JWT.

const admin = express.Router();
admin.use(adminRequired);

// --- Facilities CRUD ---
admin.get('/facilities', (_, res) => res.json(db.prepare('SELECT * FROM facilities').all()));
admin.post('/facilities', (req, res) => {
  const f = req.body;
  const r = db.prepare(`
    INSERT INTO facilities (key, name, category, description, hours, location, phone, image_url, bookable, price, extra_info)
    VALUES (@key, @name, @category, @description, @hours, @location, @phone, @image_url, @bookable, @price, @extra_info)
  `).run({ bookable: 0, ...f });
  res.json({ id: r.lastInsertRowid });
});
admin.put('/facilities/:id', (req, res) => {
  const f = req.body;
  db.prepare(`
    UPDATE facilities SET
      key=COALESCE(@key,key), name=COALESCE(@name,name), category=COALESCE(@category,category),
      description=COALESCE(@description,description), hours=COALESCE(@hours,hours),
      location=COALESCE(@location,location), phone=COALESCE(@phone,phone),
      image_url=COALESCE(@image_url,image_url), bookable=COALESCE(@bookable,bookable),
      price=COALESCE(@price,price), extra_info=COALESCE(@extra_info,extra_info)
    WHERE id=@id
  `).run({ id: Number(req.params.id), key: null, name: null, category: null, description: null, hours: null, location: null, phone: null, image_url: null, bookable: null, price: null, extra_info: null, ...f });
  res.json({ ok: true });
});
admin.delete('/facilities/:id', (req, res) => {
  db.prepare('DELETE FROM facilities WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// --- Restaurants CRUD ---
admin.get('/restaurants', (_, res) => res.json(db.prepare('SELECT * FROM restaurants').all()));
admin.post('/restaurants', (req, res) => {
  const r = db.prepare(`
    INSERT INTO restaurants (name, cuisine, description, hours, location, phone, image_url, delivery)
    VALUES (@name, @cuisine, @description, @hours, @location, @phone, @image_url, @delivery)
  `).run({ delivery: 0, ...req.body });
  res.json({ id: r.lastInsertRowid });
});
admin.put('/restaurants/:id', (req, res) => {
  const b = req.body;
  db.prepare(`
    UPDATE restaurants SET
      name=COALESCE(@name,name), cuisine=COALESCE(@cuisine,cuisine),
      description=COALESCE(@description,description), hours=COALESCE(@hours,hours),
      location=COALESCE(@location,location), phone=COALESCE(@phone,phone),
      image_url=COALESCE(@image_url,image_url), delivery=COALESCE(@delivery,delivery)
    WHERE id=@id
  `).run({ id: Number(req.params.id), name: null, cuisine: null, description: null, hours: null, location: null, phone: null, image_url: null, delivery: null, ...b });
  res.json({ ok: true });
});
admin.delete('/restaurants/:id', (req, res) => {
  db.prepare('DELETE FROM restaurants WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// --- Menu items CRUD ---
admin.get('/menu-items', (req, res) => {
  const rid = req.query.restaurant_id;
  const rows = rid
    ? db.prepare('SELECT * FROM menu_items WHERE restaurant_id = ?').all(rid)
    : db.prepare('SELECT * FROM menu_items').all();
  res.json(rows);
});
admin.post('/menu-items', (req, res) => {
  const b = req.body;
  const r = db.prepare(`
    INSERT INTO menu_items (restaurant_id, name, description, category, price, image_url, plat_du_jour, available)
    VALUES (@restaurant_id, @name, @description, @category, @price, @image_url, @plat_du_jour, @available)
  `).run({ plat_du_jour: 0, available: 1, description: null, category: null, image_url: null, ...b });
  res.json({ id: r.lastInsertRowid });
});
admin.put('/menu-items/:id', (req, res) => {
  const b = req.body;
  db.prepare(`
    UPDATE menu_items SET
      name=COALESCE(@name,name), description=COALESCE(@description,description),
      category=COALESCE(@category,category), price=COALESCE(@price,price),
      image_url=COALESCE(@image_url,image_url),
      plat_du_jour=COALESCE(@plat_du_jour,plat_du_jour),
      available=COALESCE(@available,available)
    WHERE id=@id
  `).run({ id: Number(req.params.id), name: null, description: null, category: null, price: null, image_url: null, plat_du_jour: null, available: null, ...b });
  res.json({ ok: true });
});
admin.delete('/menu-items/:id', (req, res) => {
  db.prepare('DELETE FROM menu_items WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// --- Rentals CRUD ---
admin.get('/rentals', (_, res) => res.json(db.prepare('SELECT * FROM rentals').all()));
admin.post('/rentals', (req, res) => {
  const r = db.prepare(`
    INSERT INTO rentals (name, category, description, price_per_hour, image_url, available)
    VALUES (@name, @category, @description, @price_per_hour, @image_url, @available)
  `).run({ available: 1, description: null, image_url: null, category: null, ...req.body });
  res.json({ id: r.lastInsertRowid });
});
admin.put('/rentals/:id', (req, res) => {
  const b = req.body;
  db.prepare(`
    UPDATE rentals SET
      name=COALESCE(@name,name), category=COALESCE(@category,category),
      description=COALESCE(@description,description),
      price_per_hour=COALESCE(@price_per_hour,price_per_hour),
      image_url=COALESCE(@image_url,image_url),
      available=COALESCE(@available,available)
    WHERE id=@id
  `).run({ id: Number(req.params.id), name: null, category: null, description: null, price_per_hour: null, image_url: null, available: null, ...b });
  res.json({ ok: true });
});
admin.delete('/rentals/:id', (req, res) => {
  db.prepare('DELETE FROM rentals WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// --- Events CRUD ---
admin.get('/events', (_, res) => res.json(db.prepare('SELECT * FROM events ORDER BY start_time DESC').all()));
admin.post('/events', (req, res) => {
  const r = db.prepare(`
    INSERT INTO events (title, description, location, start_time, end_time, image_url, capacity, bookable)
    VALUES (@title, @description, @location, @start_time, @end_time, @image_url, @capacity, @bookable)
  `).run({ bookable: 1, description: null, location: null, end_time: null, image_url: null, capacity: null, ...req.body });
  res.json({ id: r.lastInsertRowid });
});
admin.put('/events/:id', (req, res) => {
  const b = req.body;
  db.prepare(`
    UPDATE events SET
      title=COALESCE(@title,title), description=COALESCE(@description,description),
      location=COALESCE(@location,location), start_time=COALESCE(@start_time,start_time),
      end_time=COALESCE(@end_time,end_time), image_url=COALESCE(@image_url,image_url),
      capacity=COALESCE(@capacity,capacity), bookable=COALESCE(@bookable,bookable)
    WHERE id=@id
  `).run({ id: Number(req.params.id), title: null, description: null, location: null, start_time: null, end_time: null, image_url: null, capacity: null, bookable: null, ...b });
  res.json({ ok: true });
});
admin.delete('/events/:id', (req, res) => {
  db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// --- Bookings admin ---
admin.get('/bookings', (_, res) => {
  res.json(db.prepare(`
    SELECT b.*, u.name as user_name, u.email as user_email, u.room_number, u.chalet_number
    FROM bookings b JOIN users u ON u.id = b.user_id
    ORDER BY b.start_time DESC
  `).all());
});
admin.put('/bookings/:id/status', (req, res) => {
  const { status } = req.body || {};
  db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ ok: true });
});

// --- Deliveries admin ---
admin.get('/deliveries', (_, res) => {
  const rows = db.prepare(`
    SELECT d.*, u.name as user_name, u.email as user_email
    FROM deliveries d JOIN users u ON u.id = d.user_id
    ORDER BY d.created_at DESC
  `).all();
  res.json(rows.map(r => ({ ...r, items: JSON.parse(r.items_json) })));
});
admin.put('/deliveries/:id/status', (req, res) => {
  const { status } = req.body || {};
  db.prepare('UPDATE deliveries SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ ok: true });
});

// --- Users admin ---
admin.get('/users', (_, res) => {
  res.json(db.prepare('SELECT id, name, email, phone, room_number, chalet_number, is_admin, created_at FROM users ORDER BY created_at DESC').all());
});
admin.post('/users', (req, res) => {
  const { name, email, password, phone, room_number, chalet_number, is_admin } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: 'name, email, password required' });
  const r = db.prepare(`
    INSERT INTO users (name, email, phone, password_hash, room_number, chalet_number, is_admin)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(name, email.toLowerCase(), phone || null, hashPassword(password), room_number || null, chalet_number || null, is_admin ? 1 : 0);
  res.json({ id: r.lastInsertRowid });
});
admin.delete('/users/:id', (req, res) => {
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// --- Notifications (broadcast or targeted) ---
admin.post('/notifications', (req, res) => {
  const { title, body, user_id } = req.body || {};
  if (!title) return res.status(400).json({ error: 'title required' });
  if (user_id) {
    db.prepare('INSERT INTO notifications (title, body, user_id) VALUES (?, ?, ?)').run(title, body || '', user_id);
  } else {
    // broadcast — store one row with user_id NULL (shown to all) + optionally push
    db.prepare('INSERT INTO notifications (title, body, user_id) VALUES (?, ?, NULL)').run(title, body || '');
  }
  // Best-effort push via Expo
  sendExpoPush(title, body, user_id).catch(e => console.warn('Push failed:', e.message));
  res.json({ ok: true });
});
admin.get('/notifications', (_, res) => {
  res.json(db.prepare('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 200').all());
});

// --- Settings ---
admin.get('/settings', (_, res) => res.json(db.prepare('SELECT * FROM settings').all()));
admin.put('/settings/:key', (req, res) => {
  const { value } = req.body || {};
  db.prepare(`
    INSERT INTO settings (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value=excluded.value
  `).run(req.params.key, value);
  res.json({ ok: true });
});

// --- Stats ---
admin.get('/stats', (_, res) => {
  const count = (sql) => db.prepare(sql).get().c;
  res.json({
    users: count('SELECT COUNT(*) c FROM users'),
    bookings_pending: count(`SELECT COUNT(*) c FROM bookings WHERE status='pending'`),
    deliveries_pending: count(`SELECT COUNT(*) c FROM deliveries WHERE status='pending'`),
    restaurants: count('SELECT COUNT(*) c FROM restaurants'),
    facilities: count('SELECT COUNT(*) c FROM facilities'),
    events_upcoming: count(`SELECT COUNT(*) c FROM events WHERE datetime(start_time) >= datetime('now')`),
  });
});

// Expo push helper
async function sendExpoPush(title, body, user_id) {
  const rows = user_id
    ? db.prepare('SELECT push_token FROM users WHERE id = ? AND push_token IS NOT NULL').all(user_id)
    : db.prepare('SELECT push_token FROM users WHERE push_token IS NOT NULL').all();
  const tokens = rows.map(r => r.push_token).filter(Boolean);
  if (!tokens.length) return;
  const messages = tokens.map(to => ({ to, sound: 'default', title, body: body || '' }));
  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept-Encoding': 'gzip, deflate' },
      body: JSON.stringify(messages),
    });
  } catch (e) {
    // Swallow — push is best-effort
  }
}

app.use('/api', api);
app.use('/admin-api', admin);

app.get('/', (_, res) => res.redirect('/admin'));
app.get('/health', (_, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Portemilio API running on http://localhost:${PORT}`);
  console.log(`Admin portal: http://localhost:${PORT}/admin`);
});
