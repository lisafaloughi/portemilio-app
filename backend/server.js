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
const USER_COLS = 'id, name, email, phone, room_number, chalet_number, birthday, is_admin, status';

api.post('/auth/register', (req, res) => {
  const { name, email, phone, password, room_number, chalet_number, birthday } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: 'name, email, password required' });
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing) return res.status(400).json({ error: 'Email already registered' });
  // Any registration that claims a unit number requires admin verification.
  const needsApproval = !!(room_number || chalet_number);
  const status = needsApproval ? 'pending' : 'approved';
  const result = db.prepare(`
    INSERT INTO users (name, email, phone, password_hash, room_number, chalet_number, birthday, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, email.toLowerCase(), phone || null, hashPassword(password), room_number || null, chalet_number || null, birthday || null, status);
  if (needsApproval) {
    return res.json({
      pending: true,
      message: 'Your account is awaiting verification by reception. You will be able to sign in once approved.',
    });
  }
  const user = db.prepare(`SELECT ${USER_COLS} FROM users WHERE id = ?`).get(result.lastInsertRowid);
  res.json({ token: signToken(user), user });
});

api.post('/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  if (!row || !verifyPassword(password, row.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  if (row.status === 'pending') {
    return res.status(403).json({ error: 'Your account is awaiting verification by reception.', pending: true });
  }
  if (row.status === 'rejected') {
    return res.status(403).json({ error: 'Your account could not be verified. Please contact reception.' });
  }
  const user = { id: row.id, name: row.name, email: row.email, phone: row.phone, room_number: row.room_number, chalet_number: row.chalet_number, birthday: row.birthday, is_admin: !!row.is_admin, status: row.status };
  res.json({ token: signToken(row), user });
});

api.get('/auth/me', authRequired, (req, res) => {
  const row = db.prepare(`SELECT ${USER_COLS} FROM users WHERE id = ?`).get(req.user.id);
  res.json({ user: row });
});

api.put('/auth/me', authRequired, (req, res) => {
  // birthday is intentionally excluded — set at registration only
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
  const row = db.prepare(`SELECT ${USER_COLS} FROM users WHERE id = ?`).get(req.user.id);
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
  res.json(db.prepare('SELECT * FROM restaurants ORDER BY sort_order, name').all());
});
api.get('/restaurants/:id', (req, res) => {
  // Accept either numeric id or slug.
  const r = /^\d+$/.test(req.params.id)
    ? db.prepare('SELECT * FROM restaurants WHERE id = ?').get(req.params.id)
    : db.prepare('SELECT * FROM restaurants WHERE slug = ?').get(req.params.id);
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
  // Bookings are auto-confirmed — once it's booked, it's booked.
  const r = db.prepare(`
    INSERT INTO bookings (user_id, resource_type, resource_id, resource_name, start_time, end_time, party_size, notes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')
  `).run(req.user.id, resource_type, resource_id || null, resource_name || null, start_time, end_time || null, party_size || 1, notes || null);
  maybeSendImmediateReminder(r.lastInsertRowid);
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

// Public availability for a resource (tennis). Returns booked slots only — no PII.
// Auth is optional: if a token is present we set `is_mine` for the user's own slots,
// so the timetable also works for guests who used "Continue as guest" (no token).
api.get('/availability/:resource', (req, res) => {
  let myId = null;
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    try { myId = require('jsonwebtoken').verify(token, require('./auth').JWT_SECRET).id; }
    catch {}
  }
  const { from, to } = req.query;
  const where = ['resource_type = ?', "status != 'cancelled'"];
  const params = [req.params.resource];
  if (from) { where.push('datetime(start_time) >= datetime(?)'); params.push(from); }
  if (to) { where.push('datetime(start_time) < datetime(?)'); params.push(to); }
  const rows = db.prepare(`
    SELECT id, user_id, start_time, end_time, status, resource_name
    FROM bookings WHERE ${where.join(' AND ')}
    ORDER BY start_time
  `).all(...params);
  res.json(rows.map(r => ({
    id: r.id,
    start_time: r.start_time,
    end_time: r.end_time,
    status: r.status,
    resource_name: r.resource_name,
    is_mine: myId != null && r.user_id === myId,
  })));
});

// ---------- Deliveries ----------
api.post('/deliveries', authRequired, (req, res) => {
  const { restaurant_id, items, notes, scheduled_for, room_number, chalet_number } = req.body || {};
  if (!Array.isArray(items) || !items.length) return res.status(400).json({ error: 'items required' });
  const restaurant = restaurant_id ? db.prepare('SELECT name FROM restaurants WHERE id = ?').get(restaurant_id) : null;
  let total = 0;
  for (const it of items) total += (Number(it.price) || 0) * (Number(it.qty) || 1);
  const me = db.prepare('SELECT room_number, chalet_number FROM users WHERE id = ?').get(req.user.id);
  // Use override if provided, otherwise fall back to user's profile unit.
  const finalRoom = room_number || me.room_number || null;
  const finalChalet = chalet_number || me.chalet_number || null;
  const dest = finalChalet ? `Chalet ${finalChalet}` : finalRoom ? `Room ${finalRoom}` : 'Front desk';
  const r = db.prepare(`
    INSERT INTO deliveries (user_id, restaurant_id, restaurant_name, items_json, total, status, room_or_chalet, notes, scheduled_for, room_number, chalet_number)
    VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?)
  `).run(req.user.id, restaurant_id || null, restaurant?.name || null, JSON.stringify(items), total, dest, notes || null, scheduled_for || null, room_number || null, chalet_number || null);
  res.json({ id: r.lastInsertRowid, total, destination: dest });
});

api.get('/deliveries/mine', authRequired, (req, res) => {
  const rows = db.prepare('SELECT * FROM deliveries WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  res.json(rows.map(r => ({ ...r, items: JSON.parse(r.items_json) })));
});

// ---------- Notifications ----------
api.get('/notifications/mine', authRequired, (req, res) => {
  // Three sources of notifications for a user:
  //   1. user_id = me (direct sends — always show)
  //   2. broadcasts (user_id NULL, audience all/registered) — only those sent on/after the user joined
  //   3. targeted single-row sends with my id in recipient_ids — always show (they were explicitly named)
  const me = req.user.id;
  const joined = db.prepare('SELECT created_at FROM users WHERE id = ?').get(me)?.created_at || '1970-01-01';
  res.json(db.prepare(`
    SELECT * FROM notifications
    WHERE user_id = ?
       OR (user_id IS NULL
           AND (audience IS NULL OR audience IN ('all', 'registered'))
           AND datetime(created_at) >= datetime(?))
       OR (recipient_ids IS NOT NULL AND recipient_ids LIKE ?)
    ORDER BY created_at DESC LIMIT 100
  `).all(me, joined, `%,${me},%`));
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
admin.get('/restaurants', (_, res) => res.json(db.prepare('SELECT * FROM restaurants ORDER BY sort_order, name').all()));
admin.post('/restaurants', (req, res) => {
  const r = db.prepare(`
    INSERT INTO restaurants (slug, name, cuisine, description, hours, location, phone, image_url, delivery,
                             specialty, categories, address, highlights, map_pin_id, upcoming, sort_order)
    VALUES (@slug, @name, @cuisine, @description, @hours, @location, @phone, @image_url, @delivery,
            @specialty, @categories, @address, @highlights, @map_pin_id, @upcoming, @sort_order)
  `).run({
    delivery: 0, slug: null, specialty: null, categories: null, address: null,
    highlights: null, map_pin_id: null, upcoming: 0, sort_order: 0,
    description: null, hours: null, location: null, phone: null, image_url: null,
    cuisine: null,
    ...req.body,
  });
  res.json({ id: r.lastInsertRowid });
});
admin.put('/restaurants/:id', (req, res) => {
  const b = req.body;
  db.prepare(`
    UPDATE restaurants SET
      slug=COALESCE(@slug,slug),
      name=COALESCE(@name,name), cuisine=COALESCE(@cuisine,cuisine),
      description=COALESCE(@description,description), hours=COALESCE(@hours,hours),
      location=COALESCE(@location,location), phone=COALESCE(@phone,phone),
      image_url=COALESCE(@image_url,image_url), delivery=COALESCE(@delivery,delivery),
      specialty=COALESCE(@specialty,specialty),
      categories=COALESCE(@categories,categories),
      address=COALESCE(@address,address),
      highlights=COALESCE(@highlights,highlights),
      map_pin_id=COALESCE(@map_pin_id,map_pin_id),
      upcoming=COALESCE(@upcoming,upcoming),
      sort_order=COALESCE(@sort_order,sort_order)
    WHERE id=@id
  `).run({
    id: Number(req.params.id),
    slug: null, name: null, cuisine: null, description: null, hours: null,
    location: null, phone: null, image_url: null, delivery: null,
    specialty: null, categories: null, address: null, highlights: null,
    map_pin_id: null, upcoming: null, sort_order: null,
    ...b,
  });
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
admin.get('/bookings', (req, res) => {
  // Optional filters: ?resource_type=tennis&from=ISO&to=ISO
  const where = [];
  const params = [];
  if (req.query.resource_type) {
    where.push('b.resource_type = ?');
    params.push(req.query.resource_type);
  }
  if (req.query.from) {
    where.push("datetime(b.start_time) >= datetime(?)");
    params.push(req.query.from);
  }
  if (req.query.to) {
    where.push("datetime(b.start_time) < datetime(?)");
    params.push(req.query.to);
  }
  const sql = `
    SELECT b.*, u.name as user_name, u.email as user_email, u.room_number, u.chalet_number
    FROM bookings b JOIN users u ON u.id = b.user_id
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY b.start_time DESC
  `;
  res.json(db.prepare(sql).all(...params));
});
admin.post('/bookings', (req, res) => {
  // Admin creates a booking on behalf of a user.
  const { user_id, resource_type, resource_id, resource_name, start_time, end_time, party_size, notes, status } = req.body || {};
  if (!user_id || !resource_type || !start_time) {
    return res.status(400).json({ error: 'user_id, resource_type, start_time required' });
  }
  const r = db.prepare(`
    INSERT INTO bookings (user_id, resource_type, resource_id, resource_name, start_time, end_time, party_size, notes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(user_id, resource_type, resource_id || null, resource_name || null, start_time, end_time || null, party_size || 1, notes || null, status || 'confirmed');
  res.json({ id: r.lastInsertRowid });
});
admin.put('/bookings/:id/status', (req, res) => {
  const { status } = req.body || {};
  db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ ok: true });
});
admin.delete('/bookings/:id', (req, res) => {
  db.prepare('DELETE FROM bookings WHERE id = ?').run(req.params.id);
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
admin.post('/deliveries', (req, res) => {
  // Admin creates a delivery on behalf of a user.
  const { user_id, restaurant_id, items, notes, scheduled_for, room_number, chalet_number } = req.body || {};
  if (!user_id || !Array.isArray(items) || !items.length) {
    return res.status(400).json({ error: 'user_id and items required' });
  }
  const restaurant = restaurant_id ? db.prepare('SELECT name FROM restaurants WHERE id = ?').get(restaurant_id) : null;
  let total = 0;
  for (const it of items) total += (Number(it.price) || 0) * (Number(it.qty) || 1);
  const u = db.prepare('SELECT room_number, chalet_number FROM users WHERE id = ?').get(user_id);
  const finalRoom = room_number || u?.room_number || null;
  const finalChalet = chalet_number || u?.chalet_number || null;
  const dest = finalChalet ? `Chalet ${finalChalet}` : finalRoom ? `Room ${finalRoom}` : 'Front desk';
  const r = db.prepare(`
    INSERT INTO deliveries (user_id, restaurant_id, restaurant_name, items_json, total, status, room_or_chalet, notes, scheduled_for, room_number, chalet_number)
    VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?)
  `).run(user_id, restaurant_id || null, restaurant?.name || null, JSON.stringify(items), total, dest, notes || null, scheduled_for || null, room_number || null, chalet_number || null);
  res.json({ id: r.lastInsertRowid, total, destination: dest });
});
admin.put('/deliveries/:id/status', (req, res) => {
  const { status } = req.body || {};
  db.prepare('UPDATE deliveries SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ ok: true });
});
admin.delete('/deliveries/:id', (req, res) => {
  db.prepare('DELETE FROM deliveries WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// --- Users admin ---
admin.get('/users', (req, res) => {
  // Optional filters: ?status=pending|approved|rejected, ?room=12, ?chalet=42, ?q=search
  const where = [];
  const params = [];
  if (req.query.status) {
    where.push('status = ?');
    params.push(req.query.status);
  }
  if (req.query.room) {
    where.push('room_number = ? COLLATE NOCASE');
    params.push(req.query.room);
  }
  if (req.query.chalet) {
    where.push('chalet_number = ? COLLATE NOCASE');
    params.push(req.query.chalet);
  }
  if (req.query.q) {
    where.push('(name LIKE ? COLLATE NOCASE OR email LIKE ? COLLATE NOCASE OR phone LIKE ? COLLATE NOCASE)');
    const like = `%${req.query.q}%`;
    params.push(like, like, like);
  }
  const sql = `
    SELECT id, name, email, phone, room_number, chalet_number, birthday, is_admin, status, created_at
    FROM users
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY created_at DESC
  `;
  res.json(db.prepare(sql).all(...params));
});
admin.get('/users/:id', (req, res) => {
  const u = db.prepare(`
    SELECT id, name, email, phone, room_number, chalet_number, birthday, is_admin, status, created_at
    FROM users WHERE id = ?
  `).get(req.params.id);
  if (!u) return res.status(404).json({ error: 'Not found' });
  // Roommates: anyone else who shares the same chalet or room number.
  let roommates = [];
  if (u.chalet_number) {
    roommates = db.prepare(`
      SELECT id, name, email, phone, status FROM users
      WHERE chalet_number = ? AND id != ?
    `).all(u.chalet_number, u.id);
  } else if (u.room_number) {
    roommates = db.prepare(`
      SELECT id, name, email, phone, status FROM users
      WHERE room_number = ? AND id != ?
    `).all(u.room_number, u.id);
  }
  res.json({ user: u, roommates });
});
admin.post('/users', (req, res) => {
  const { name, email, password, phone, room_number, chalet_number, is_admin } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: 'name, email, password required' });
  const r = db.prepare(`
    INSERT INTO users (name, email, phone, password_hash, room_number, chalet_number, is_admin, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'approved')
  `).run(name, email.toLowerCase(), phone || null, hashPassword(password), room_number || null, chalet_number || null, is_admin ? 1 : 0);
  res.json({ id: r.lastInsertRowid });
});
admin.put('/users/:id', (req, res) => {
  const { name, email, phone, room_number, chalet_number, is_admin, status } = req.body || {};
  db.prepare(`
    UPDATE users SET
      name = COALESCE(?, name),
      email = COALESCE(?, email),
      phone = COALESCE(?, phone),
      room_number = COALESCE(?, room_number),
      chalet_number = COALESCE(?, chalet_number),
      is_admin = COALESCE(?, is_admin),
      status = COALESCE(?, status)
    WHERE id = ?
  `).run(
    name || null,
    email ? email.toLowerCase() : null,
    phone || null,
    room_number !== undefined ? room_number : null,
    chalet_number !== undefined ? chalet_number : null,
    typeof is_admin === 'boolean' ? (is_admin ? 1 : 0) : null,
    status || null,
    req.params.id,
  );
  res.json({ ok: true });
});
admin.put('/users/:id/approve', (req, res) => {
  db.prepare("UPDATE users SET status = 'approved' WHERE id = ?").run(req.params.id);
  // Notify the user that their account is now active.
  const u = db.prepare('SELECT name, push_token FROM users WHERE id = ?').get(req.params.id);
  db.prepare(`INSERT INTO notifications (title, body, user_id, audience) VALUES (?, ?, ?, 'targeted')`)
    .run('Welcome to Portemilio', `Your account has been verified. Enjoy your stay${u?.name ? ', ' + u.name.split(' ')[0] : ''}!`, req.params.id);
  if (u?.push_token) {
    sendExpoPushToTokens([u.push_token], 'Welcome to Portemilio', 'Your account has been verified.').catch(() => {});
  }
  res.json({ ok: true });
});
admin.put('/users/:id/reject', (req, res) => {
  db.prepare("UPDATE users SET status = 'rejected' WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});
admin.delete('/users/:id', (req, res) => {
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// --- Notifications (audience-aware) ---
admin.post('/notifications', async (req, res) => {
  // audience: 'all' | 'registered' | 'targeted'
  // user_ids: array (only used for 'targeted')
  // Body is required so guests don't get blank pings.
  const { title, body, audience = 'all', user_ids, user_id } = req.body || {};
  if (!title || !title.trim()) return res.status(400).json({ error: 'Title required' });
  if (!body || !body.trim()) return res.status(400).json({ error: 'Message body required' });

  if (audience === 'targeted') {
    const ids = Array.isArray(user_ids) && user_ids.length ? user_ids : (user_id ? [user_id] : []);
    if (!ids.length) return res.status(400).json({ error: 'Pick at least one recipient' });
    // Build a single history row tagged with the recipient ids and a friendly name list.
    const placeholders = ids.map(() => '?').join(',');
    const recipients = db.prepare(`SELECT id, name, push_token FROM users WHERE id IN (${placeholders})`).all(...ids);
    const recipientIds = ',' + recipients.map(r => r.id).join(',') + ',';
    const recipientNames = recipients.map(r => r.name).join(', ');
    db.prepare(
      `INSERT INTO notifications (title, body, user_id, audience, recipient_ids, recipient_names)
       VALUES (?, ?, NULL, 'targeted', ?, ?)`
    ).run(title, body, recipientIds, recipientNames);
    const tokens = recipients.map(r => r.push_token).filter(Boolean);
    if (tokens.length) sendExpoPushToTokens(tokens, title, body).catch(() => {});
    return res.json({ ok: true, sent_to: recipients.length });
  }

  // Broadcast row (visible in feeds based on audience).
  db.prepare(
    `INSERT INTO notifications (title, body, user_id, audience) VALUES (?, ?, NULL, ?)`
  ).run(title, body, audience);

  let rows;
  if (audience === 'registered') {
    rows = db.prepare("SELECT push_token FROM users WHERE status = 'approved' AND is_admin = 0 AND push_token IS NOT NULL").all();
  } else {
    // 'all'
    rows = db.prepare('SELECT push_token FROM users WHERE push_token IS NOT NULL').all();
  }
  const tokens = rows.map(r => r.push_token).filter(Boolean);
  if (tokens.length) sendExpoPushToTokens(tokens, title, body).catch(() => {});
  res.json({ ok: true, sent_to: tokens.length });
});
admin.get('/notifications', (_, res) => {
  res.json(db.prepare('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 200').all());
});
admin.delete('/notifications/:id', (req, res) => {
  db.prepare('DELETE FROM notifications WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
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

// --- Dashboard / Stats ---
admin.get('/dashboard', (_, res) => {
  const count = (sql) => db.prepare(sql).get().c;
  res.json({
    users_total: count('SELECT COUNT(*) c FROM users'),
    users_pending: count(`SELECT COUNT(*) c FROM users WHERE status='pending'`),
    bookings_pending: count(`SELECT COUNT(*) c FROM bookings WHERE status='pending'`),
    bookings_today: count(`SELECT COUNT(*) c FROM bookings WHERE date(start_time) = date('now') AND status != 'cancelled'`),
    deliveries_pending: count(`SELECT COUNT(*) c FROM deliveries WHERE status='pending'`),
    deliveries_in_progress: count(`SELECT COUNT(*) c FROM deliveries WHERE status='processing' OR status='out_for_delivery'`),
    restaurants: count('SELECT COUNT(*) c FROM restaurants'),
    facilities: count('SELECT COUNT(*) c FROM facilities'),
    events_upcoming: count(`SELECT COUNT(*) c FROM events WHERE datetime(start_time) >= datetime('now')`),
  });
});
admin.get('/stats', (_, res) => {
  // Legacy alias
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

// Expo push helpers (best-effort).
async function sendExpoPushToTokens(tokens, title, body) {
  if (!tokens || !tokens.length) return;
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
async function sendExpoPush(title, body, user_id) {
  const rows = user_id
    ? db.prepare('SELECT push_token FROM users WHERE id = ? AND push_token IS NOT NULL').all(user_id)
    : db.prepare('SELECT push_token FROM users WHERE push_token IS NOT NULL').all();
  await sendExpoPushToTokens(rows.map(r => r.push_token).filter(Boolean), title, body);
}

app.use('/api', api);
app.use('/admin-api', admin);

app.get('/', (_, res) => res.redirect('/admin'));
app.get('/health', (_, res) => res.json({ ok: true }));

// Reminder helpers
function fmtReminderTime(iso) {
  try {
    const d = new Date(iso.includes('T') ? iso : iso.replace(' ', 'T') + 'Z');
    return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  } catch { return iso; }
}

function sendReminder(b, minutesLeft = 30) {
  const what = b.resource_name || b.resource_type || 'booking';
  const when = fmtReminderTime(b.start_time);
  const mins = Math.max(1, Math.round(minutesLeft));
  const timePhrase = `${mins} minute${mins === 1 ? '' : 's'}`;
  let title, body;
  if (b.resource_type === 'tennis') {
    title = `Court reminder — ${when}`;
    body = `Get your tennis racquet and balls ready — ${what} is yours in ${timePhrase}. See you on the court!`;
  } else {
    title = `Reminder: ${what} at ${when}`;
    body = `Your ${what.toLowerCase()} is yours in ${timePhrase}.`;
  }
  db.prepare(`INSERT INTO notifications (title, body, user_id, audience) VALUES (?, ?, ?, 'targeted')`)
    .run(title, body, b.user_id);
  db.prepare(`UPDATE bookings SET reminder_sent = 1 WHERE id = ?`).run(b.id);
  if (b.push_token) sendExpoPushToTokens([b.push_token], title, body).catch(() => {});
}

// Called right after a new booking is created — fires the reminder immediately only
// if the slot is already 30 minutes away or less (the periodic scan would miss it).
function maybeSendImmediateReminder(bookingId) {
  try {
    const b = db.prepare(`
      SELECT b.id, b.user_id, b.resource_type, b.resource_name, b.start_time, u.push_token
      FROM bookings b JOIN users u ON u.id = b.user_id
      WHERE b.id = ?
        AND b.status = 'confirmed'
        AND b.reminder_sent = 0
        AND datetime(b.start_time) BETWEEN datetime('now') AND datetime('now', '+30 minutes')
    `).get(bookingId);
    if (b) {
      const startMs = new Date(b.start_time.includes('T') ? b.start_time : b.start_time.replace(' ', 'T') + 'Z').getTime();
      const minutesLeft = (startMs - Date.now()) / 60000;
      sendReminder(b, minutesLeft);
    }
  } catch (e) {
    console.warn('Immediate reminder check failed:', e.message);
  }
}

// Periodic loop: every 60 s, catch bookings entering the 25–35 minute window.
function scanForReminders() {
  try {
    const due = db.prepare(`
      SELECT b.id, b.user_id, b.resource_type, b.resource_name, b.start_time, u.push_token
      FROM bookings b JOIN users u ON u.id = b.user_id
      WHERE b.status = 'confirmed'
        AND b.reminder_sent = 0
        AND datetime(b.start_time) BETWEEN datetime('now', '+25 minutes') AND datetime('now', '+35 minutes')
    `).all();
    for (const b of due) sendReminder(b);
  } catch (e) {
    console.warn('Reminder scan failed:', e.message);
  }
}
setInterval(scanForReminders, 60 * 1000);
setTimeout(scanForReminders, 5000);

const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Portemilio API running on http://localhost:${PORT}`);
  console.log(`Admin portal: http://localhost:${PORT}/admin`);
});
