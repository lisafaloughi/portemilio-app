const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const multer = require('multer');
const db = require('./db');
const { hashPassword, verifyPassword, signToken, authRequired, adminRequired } = require('./auth');

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

// Serve admin portal static files
app.use('/admin', express.static(path.join(__dirname, 'public')));
// Serve uploaded images / PDFs publicly
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

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
  const rows = db.prepare('SELECT * FROM facilities ORDER BY name').all();
  const getItems = db.prepare('SELECT id, kind, name, subtitle, description, phone, image_url, sub_items, sort_order FROM facility_items WHERE facility_id = ? ORDER BY sort_order, id');
  res.json(rows.map(r => ({ ...r, items: getItems.all(r.id) })));
});
api.get('/facilities/:key', (req, res) => {
  const row = db.prepare('SELECT * FROM facilities WHERE key = ? OR id = ?').get(req.params.key, req.params.key);
  if (!row) return res.status(404).json({ error: 'Not found' });
  const items = db.prepare('SELECT id, kind, name, subtitle, description, phone, image_url, sub_items, sort_order FROM facility_items WHERE facility_id = ? ORDER BY sort_order, id').all(row.id);
  res.json({ ...row, items });
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

// Other Services (Front Desk, Heritage, Marina, etc) — admin-editable content.
api.get('/services', (_, res) => {
  const rows = db.prepare('SELECT * FROM services ORDER BY sort_order, name').all();
  const getItems = db.prepare('SELECT id, kind, name, subtitle, image_url, extra, sort_order FROM service_items WHERE service_id = ? ORDER BY sort_order, id');
  res.json(rows.map(r => ({ ...r, items: getItems.all(r.id) })));
});
api.get('/services/:key', (req, res) => {
  const r = /^\d+$/.test(req.params.key)
    ? db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.key)
    : db.prepare('SELECT * FROM services WHERE key = ?').get(req.params.key);
  if (!r) return res.status(404).json({ error: 'Not found' });
  const items = db.prepare('SELECT id, kind, name, subtitle, image_url, extra, sort_order FROM service_items WHERE service_id = ? ORDER BY sort_order, id').all(r.id);
  res.json({ ...r, items });
});

// Landmarks — sightseeing destinations and relevant services (pharmacies,
// hospitals, etc) with nested locations.
api.get('/landmarks', (_, res) => {
  const rows = db.prepare('SELECT * FROM landmarks ORDER BY sort_order, name').all();
  const getLocs = db.prepare('SELECT id, name, address, phone, sort_order FROM landmark_locations WHERE landmark_id = ? ORDER BY sort_order, name');
  res.json(rows.map(r => ({ ...r, locations: getLocs.all(r.id) })));
});
api.get('/landmarks/:key', (req, res) => {
  const r = /^\d+$/.test(req.params.key)
    ? db.prepare('SELECT * FROM landmarks WHERE id = ?').get(req.params.key)
    : db.prepare('SELECT * FROM landmarks WHERE key = ?').get(req.params.key);
  if (!r) return res.status(404).json({ error: 'Not found' });
  const locations = db.prepare('SELECT id, name, address, phone, sort_order FROM landmark_locations WHERE landmark_id = ? ORDER BY sort_order, name').all(r.id);
  res.json({ ...r, locations });
});

api.get('/menu/plat-du-jour', (_, res) => {
  resetPlatDuJourIfNewDay();
  res.json(db.prepare(`
    SELECT * FROM plat_du_jour_items WHERE is_today = 1 ORDER BY title
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
  handleNewBookingNotifications(r.lastInsertRowid, { resource_type, resource_name, start_time, end_time, user_id: req.user.id });
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

api.delete('/deliveries/mine/history', authRequired, (req, res) => {
  db.prepare(`DELETE FROM deliveries WHERE user_id = ? AND status IN ('delivered','cancelled')`).run(req.user.id);
  res.json({ ok: true });
});

api.delete('/bookings/mine/history', authRequired, (req, res) => {
  db.prepare(`DELETE FROM bookings WHERE user_id = ? AND status IN ('completed','cancelled')`).run(req.user.id);
  res.json({ ok: true });
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

// --- File upload ---
const upload = multer({
  storage: multer.diskStorage({
    destination: path.join(__dirname, 'public', 'uploads'),
    filename: (_, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    },
  }),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const ok = /^image\/(jpeg|png|webp|gif)|application\/pdf$/.test(file.mimetype);
    cb(ok ? null : new Error('Only images and PDFs allowed'), ok);
  },
});
admin.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

// --- Facilities CRUD ---
admin.get('/facilities', (_, res) => {
  const rows = db.prepare('SELECT * FROM facilities ORDER BY name').all();
  const getItems = db.prepare('SELECT id, kind, name, subtitle, description, phone, image_url, sub_items, sort_order FROM facility_items WHERE facility_id = ? ORDER BY sort_order, id');
  res.json(rows.map(r => ({ ...r, items: getItems.all(r.id) })));
});
admin.post('/facilities', (req, res) => {
  const f = req.body;
  const r = db.prepare(`
    INSERT INTO facilities (key, name, category, description, hours, location, phone, image_url, bookable, price, extra_info, image_urls)
    VALUES (@key, @name, @category, @description, @hours, @location, @phone, @image_url, @bookable, @price, @extra_info, @image_urls)
  `).run({
    bookable: 0, key: null, category: null, description: null,
    hours: null, location: null, phone: null, image_url: null,
    price: null, extra_info: null, image_urls: null,
    ...f,
  });
  res.json({ id: r.lastInsertRowid });
});
admin.put('/facilities/:id', (req, res) => {
  const f = req.body;
  db.prepare(`
    UPDATE facilities SET
      key=COALESCE(@key,key), name=COALESCE(@name,name), category=COALESCE(@category,category),
      description=@description, hours=@hours,
      location=@location, phone=@phone,
      image_url=COALESCE(@image_url,image_url), bookable=COALESCE(@bookable,bookable),
      price=@price, extra_info=@extra_info,
      image_urls=@image_urls,
      instagram_url=@instagram_url,
      whatsapp_url=@whatsapp_url,
      app_store_url=@app_store_url,
      warning_message=@warning_message,
      coach_hint=@coach_hint,
      indoor_pool_name=@indoor_pool_name,
      indoor_pool_subtitle=@indoor_pool_subtitle,
      indoor_pool_image_url=@indoor_pool_image_url
    WHERE id=@id
  `).run({
    id: Number(req.params.id),
    key: null, name: null, category: null, description: null, hours: null,
    location: null, phone: null, image_url: null, bookable: null, price: null,
    extra_info: null, image_urls: null,
    instagram_url: null, whatsapp_url: null, app_store_url: null, warning_message: null,
    coach_hint: null,
    indoor_pool_name: null, indoor_pool_subtitle: null, indoor_pool_image_url: null,
    ...f,
  });
  res.json({ ok: true });
});
admin.delete('/facilities/:id', (req, res) => {
  db.prepare('DELETE FROM facilities WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// --- Facility & Service items (coaches, sports, services, pools, etc) ---
admin.get('/facility-items/:facility_id', (req, res) => {
  res.json(db.prepare('SELECT * FROM facility_items WHERE facility_id = ? ORDER BY sort_order, id').all(Number(req.params.facility_id)));
});
admin.post('/facility-items', (req, res) => {
  const b = req.body || {};
  if (!b.facility_id || !b.name || !b.kind) return res.status(400).json({ error: 'facility_id, kind, name required' });
  const r = db.prepare(`
    INSERT INTO facility_items (facility_id, kind, name, subtitle, description, phone, image_url, sub_items, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    Number(b.facility_id), b.kind, b.name,
    b.subtitle || null, b.description || null,
    b.phone || null, b.image_url || null,
    b.sub_items || null,
    b.sort_order || 0,
  );
  res.json({ id: r.lastInsertRowid });
});
admin.put('/facility-items/:id', (req, res) => {
  const b = req.body || {};
  db.prepare(`
    UPDATE facility_items SET
      name=COALESCE(@name, name),
      subtitle=@subtitle,
      description=@description,
      phone=@phone,
      image_url=@image_url,
      sub_items=@sub_items,
      sort_order=COALESCE(@sort_order, sort_order)
    WHERE id=@id
  `).run({
    id: Number(req.params.id),
    name: b.name || null,
    subtitle: b.subtitle == null ? null : b.subtitle,
    description: b.description == null ? null : b.description,
    phone: b.phone == null ? null : b.phone,
    image_url: b.image_url == null ? null : b.image_url,
    sub_items: b.sub_items == null ? null : b.sub_items,
    sort_order: b.sort_order == null ? null : b.sort_order,
  });
  res.json({ ok: true });
});
admin.delete('/facility-items/:id', (req, res) => {
  db.prepare('DELETE FROM facility_items WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

admin.get('/service-items/:service_id', (req, res) => {
  res.json(db.prepare('SELECT * FROM service_items WHERE service_id = ? ORDER BY sort_order, id').all(Number(req.params.service_id)));
});
admin.post('/service-items', (req, res) => {
  const b = req.body || {};
  if (!b.service_id || !b.name || !b.kind) return res.status(400).json({ error: 'service_id, kind, name required' });
  const r = db.prepare(`
    INSERT INTO service_items (service_id, kind, name, subtitle, image_url, extra, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    Number(b.service_id), b.kind, b.name,
    b.subtitle || null, b.image_url || null, b.extra || null,
    b.sort_order || 0,
  );
  res.json({ id: r.lastInsertRowid });
});
admin.put('/service-items/:id', (req, res) => {
  const b = req.body || {};
  db.prepare(`
    UPDATE service_items SET
      name=COALESCE(@name, name),
      subtitle=@subtitle,
      image_url=@image_url,
      extra=@extra,
      sort_order=COALESCE(@sort_order, sort_order)
    WHERE id=@id
  `).run({
    id: Number(req.params.id),
    name: b.name || null,
    subtitle: b.subtitle == null ? null : b.subtitle,
    image_url: b.image_url == null ? null : b.image_url,
    extra: b.extra == null ? null : b.extra,
    sort_order: b.sort_order == null ? null : b.sort_order,
  });
  res.json({ ok: true });
});
admin.delete('/service-items/:id', (req, res) => {
  db.prepare('DELETE FROM service_items WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// --- Marina boats (guests with boats parked at the marina) ---
admin.get('/marina-boats', (_, res) => {
  res.json(db.prepare(`SELECT * FROM marina_boats ORDER BY slip_number IS NULL OR slip_number = '', slip_number, guest_name`).all());
});
admin.post('/marina-boats', (req, res) => {
  const b = req.body || {};
  if (!b.guest_name) return res.status(400).json({ error: 'Guest name is required' });
  const r = db.prepare(`
    INSERT INTO marina_boats (guest_name, boat_name, slip_number, status, phone, notes)
    VALUES (@guest_name, @boat_name, @slip_number, @status, @phone, @notes)
  `).run({
    guest_name: b.guest_name,
    boat_name: b.boat_name || null,
    slip_number: b.slip_number || null,
    status: b.status === 'at_sea' ? 'at_sea' : 'docked',
    phone: b.phone || null,
    notes: b.notes || null,
  });
  res.json({ id: r.lastInsertRowid });
});
admin.put('/marina-boats/:id', (req, res) => {
  const b = req.body || {};
  db.prepare(`
    UPDATE marina_boats SET
      guest_name=COALESCE(@guest_name, guest_name),
      boat_name=@boat_name,
      slip_number=@slip_number,
      status=COALESCE(@status, status),
      phone=@phone,
      notes=@notes
    WHERE id=@id
  `).run({
    id: Number(req.params.id),
    guest_name: b.guest_name || null,
    boat_name: b.boat_name == null ? null : b.boat_name,
    slip_number: b.slip_number == null ? null : b.slip_number,
    status: b.status === 'docked' || b.status === 'at_sea' ? b.status : null,
    phone: b.phone == null ? null : b.phone,
    notes: b.notes == null ? null : b.notes,
  });
  res.json({ ok: true });
});
admin.delete('/marina-boats/:id', (req, res) => {
  db.prepare('DELETE FROM marina_boats WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// --- Landmarks CRUD (admin) ---
admin.get('/landmarks', (_, res) => {
  const rows = db.prepare('SELECT * FROM landmarks ORDER BY sort_order, name').all();
  const getLocs = db.prepare('SELECT id, name, address, phone, sort_order FROM landmark_locations WHERE landmark_id = ? ORDER BY sort_order, name');
  res.json(rows.map(r => ({ ...r, locations: getLocs.all(r.id) })));
});
admin.post('/landmarks', (req, res) => {
  const b = req.body || {};
  if (!b.name) return res.status(400).json({ error: 'Name is required' });
  const type = b.type === 'relevant_services' ? 'relevant_services' : 'sightseeing';
  const key = b.key && b.key.trim()
    ? b.key.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    : (b.name || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') + '-' + Date.now();
  try {
    const r = db.prepare(`
      INSERT INTO landmarks (key, type, name, subtitle, description, distance, address, phone, website, image_urls, sort_order)
      VALUES (@key, @type, @name, @subtitle, @description, @distance, @address, @phone, @website, @image_urls, @sort_order)
    `).run({
      key, type, name: b.name,
      subtitle: b.subtitle || null,
      description: b.description || null,
      distance: b.distance || null,
      address: b.address || null,
      phone: b.phone || null,
      website: b.website || null,
      image_urls: b.image_urls || null,
      sort_order: b.sort_order || 0,
    });
    res.json({ id: r.lastInsertRowid });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
admin.put('/landmarks/:id', (req, res) => {
  const b = req.body || {};
  db.prepare(`
    UPDATE landmarks SET
      type=COALESCE(@type, type),
      name=COALESCE(@name, name),
      subtitle=@subtitle,
      description=@description,
      distance=@distance,
      address=@address,
      phone=@phone,
      website=@website,
      image_urls=@image_urls,
      sort_order=COALESCE(@sort_order, sort_order)
    WHERE id=@id
  `).run({
    id: Number(req.params.id),
    type: b.type === 'sightseeing' || b.type === 'relevant_services' ? b.type : null,
    name: b.name || null,
    subtitle: b.subtitle == null ? null : b.subtitle,
    description: b.description == null ? null : b.description,
    distance: b.distance == null ? null : b.distance,
    address: b.address == null ? null : b.address,
    phone: b.phone == null ? null : b.phone,
    website: b.website == null ? null : b.website,
    image_urls: b.image_urls == null ? null : b.image_urls,
    sort_order: b.sort_order == null ? null : b.sort_order,
  });
  res.json({ ok: true });
});
admin.delete('/landmarks/:id', (req, res) => {
  db.prepare('DELETE FROM landmarks WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// Locations within a landmark (only used by relevant_services landmarks)
admin.post('/landmark-locations', (req, res) => {
  const b = req.body || {};
  if (!b.landmark_id || !b.name) return res.status(400).json({ error: 'landmark_id and name are required' });
  const r = db.prepare(`
    INSERT INTO landmark_locations (landmark_id, name, address, phone, sort_order)
    VALUES (?, ?, ?, ?, ?)
  `).run(Number(b.landmark_id), b.name, b.address || null, b.phone || null, b.sort_order || 0);
  res.json({ id: r.lastInsertRowid });
});
admin.put('/landmark-locations/:id', (req, res) => {
  const b = req.body || {};
  db.prepare(`
    UPDATE landmark_locations SET
      name=COALESCE(@name, name),
      address=@address,
      phone=@phone,
      sort_order=COALESCE(@sort_order, sort_order)
    WHERE id=@id
  `).run({
    id: Number(req.params.id),
    name: b.name || null,
    address: b.address == null ? null : b.address,
    phone: b.phone == null ? null : b.phone,
    sort_order: b.sort_order == null ? null : b.sort_order,
  });
  res.json({ ok: true });
});
admin.delete('/landmark-locations/:id', (req, res) => {
  db.prepare('DELETE FROM landmark_locations WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// --- Services CRUD (Marina + Other Services) ---
admin.get('/services', (_, res) => {
  const rows = db.prepare('SELECT * FROM services ORDER BY sort_order, name').all();
  const getItems = db.prepare('SELECT id, kind, name, subtitle, image_url, extra, sort_order FROM service_items WHERE service_id = ? ORDER BY sort_order, id');
  res.json(rows.map(r => ({ ...r, items: getItems.all(r.id) })));
});
admin.put('/services/:id', (req, res) => {
  const b = req.body;
  db.prepare(`
    UPDATE services SET
      name=COALESCE(@name,name),
      subtitle=@subtitle,
      description=@description,
      phone=@phone,
      email=@email,
      hours=@hours,
      location=@location,
      extra_info=@extra_info,
      image_urls=@image_urls,
      website=@website,
      instagram_url=@instagram_url
    WHERE id=@id
  `).run({
    id: Number(req.params.id),
    name: null, subtitle: null, description: null, phone: null, email: null,
    hours: null, location: null, extra_info: null, image_urls: null,
    website: null, instagram_url: null,
    ...b,
  });
  res.json({ ok: true });
});

// --- Restaurants CRUD ---
admin.get('/restaurants', (_, res) => res.json(db.prepare('SELECT * FROM restaurants ORDER BY sort_order, name').all()));
admin.post('/restaurants', (req, res) => {
  const r = db.prepare(`
    INSERT INTO restaurants (slug, name, cuisine, description, hours, location, phone, image_url, delivery,
                             specialty, categories, address, highlights, map_pin_id, upcoming, sort_order,
                             image_urls, menu_pdf_url)
    VALUES (@slug, @name, @cuisine, @description, @hours, @location, @phone, @image_url, @delivery,
            @specialty, @categories, @address, @highlights, @map_pin_id, @upcoming, @sort_order,
            @image_urls, @menu_pdf_url)
  `).run({
    delivery: 0, slug: null, specialty: null, categories: null, address: null,
    highlights: null, map_pin_id: null, upcoming: 0, sort_order: 0,
    description: null, hours: null, location: null, phone: null, image_url: null,
    cuisine: null, image_urls: null, menu_pdf_url: null,
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
      sort_order=COALESCE(@sort_order,sort_order),
      image_urls=@image_urls,
      menu_pdf_url=@menu_pdf_url
    WHERE id=@id
  `).run({
    id: Number(req.params.id),
    slug: null, name: null, cuisine: null, description: null, hours: null,
    location: null, phone: null, image_url: null, delivery: null,
    specialty: null, categories: null, address: null, highlights: null,
    map_pin_id: null, upcoming: null, sort_order: null,
    image_urls: null, menu_pdf_url: null,
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

// --- Plat du Jour items ---
admin.get('/plat-du-jour', (_, res) => {
  resetPlatDuJourIfNewDay();
  res.json(db.prepare('SELECT * FROM plat_du_jour_items ORDER BY title').all());
});
admin.post('/plat-du-jour', (req, res) => {
  const { title, subtitle, description, price, image_url } = req.body || {};
  if (!title) return res.status(400).json({ error: 'title required' });
  const r = db.prepare(`
    INSERT INTO plat_du_jour_items (title, subtitle, description, price, image_url)
    VALUES (?, ?, ?, ?, ?)
  `).run(title, subtitle || null, description || null, price || null, image_url || null);
  res.json({ id: r.lastInsertRowid });
});
admin.put('/plat-du-jour/:id', (req, res) => {
  const { title, subtitle, description, price, image_url, is_today } = req.body || {};
  if (is_today !== undefined) {
    db.prepare('UPDATE plat_du_jour_items SET is_today = ? WHERE id = ?').run(is_today, Number(req.params.id));
  } else {
    db.prepare(`
      UPDATE plat_du_jour_items SET title=?, subtitle=?, description=?, price=?, image_url=? WHERE id=?
    `).run(title || null, subtitle || null, description || null, price ?? null, image_url || null, Number(req.params.id));
  }
  res.json({ ok: true });
});
admin.delete('/plat-du-jour/:id', (req, res) => {
  db.prepare('DELETE FROM plat_du_jour_items WHERE id = ?').run(Number(req.params.id));
  res.json({ ok: true });
});

// --- Activities (Today's Activities & Events) ---
admin.get('/activities', (_, res) => {
  res.json(db.prepare('SELECT * FROM activities ORDER BY title').all());
});
admin.post('/activities', (req, res) => {
  const { title, subtitle, description, location, time_label, price, image_url } = req.body || {};
  if (!title) return res.status(400).json({ error: 'title required' });
  const r = db.prepare(`
    INSERT INTO activities (title, subtitle, description, location, time_label, price, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(title, subtitle || null, description || null, location || null, time_label || null, price ?? null, image_url || null);
  res.json({ id: r.lastInsertRowid });
});
admin.put('/activities/:id', (req, res) => {
  const { title, subtitle, description, location, time_label, price, image_url, is_today } = req.body || {};
  if (is_today !== undefined) {
    db.prepare('UPDATE activities SET is_today = ? WHERE id = ?').run(is_today, Number(req.params.id));
  } else {
    db.prepare(`
      UPDATE activities SET title=?, subtitle=?, description=?, location=?, time_label=?, price=?, image_url=? WHERE id=?
    `).run(title || null, subtitle || null, description || null, location || null, time_label || null, price ?? null, image_url || null, Number(req.params.id));
  }
  res.json({ ok: true });
});
admin.delete('/activities/:id', (req, res) => {
  db.prepare('DELETE FROM activities WHERE id = ?').run(Number(req.params.id));
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
  const effectiveStatus = status || 'confirmed';
  const r = db.prepare(`
    INSERT INTO bookings (user_id, resource_type, resource_id, resource_name, start_time, end_time, party_size, notes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(user_id, resource_type, resource_id || null, resource_name || null, start_time, end_time || null, party_size || 1, notes || null, effectiveStatus);
  if (effectiveStatus === 'confirmed') {
    handleNewBookingNotifications(r.lastInsertRowid, { resource_type, resource_name, start_time, end_time, user_id }, { alwaysConfirm: true });
  }
  res.json({ id: r.lastInsertRowid });
});
admin.put('/bookings/:id/status', (req, res) => {
  const { status } = req.body || {};
  const before = db.prepare('SELECT user_id, resource_type, resource_name, start_time, status FROM bookings WHERE id = ?').get(req.params.id);
  db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run(status, req.params.id);
  if (before && status === 'cancelled' && before.status !== 'cancelled') {
    notifyBookingCancellation(before);
  }
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
  db.prepare(`INSERT INTO notifications (title, body, user_id, audience, is_system) VALUES (?, ?, ?, 'targeted', 1)`)
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
  // Only manual admin sends — automated system messages (reminders, approval welcomes)
  // are tagged is_system=1 and excluded from this history view.
  res.json(db.prepare(`
    SELECT * FROM notifications
    WHERE (is_system IS NULL OR is_system = 0)
      AND datetime(created_at) >= datetime('now', '-7 days')
    ORDER BY created_at DESC
    LIMIT 200
  `).all());
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
  resetPlatDuJourIfNewDay();
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
    plat_du_jour_count: count(`SELECT COUNT(*) c FROM plat_du_jour_items WHERE is_today = 1`),
    events_today: count(`SELECT COUNT(*) c FROM activities WHERE is_today = 1`),
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

// Friendly date+time string for booking confirmation messages.
function fmtBookingWhen(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso.includes('T') ? iso : iso.replace(' ', 'T') + 'Z');
    if (isNaN(d)) return iso;
    return d.toLocaleString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit',
    });
  } catch { return iso; }
}

// Sent when a booking is created with a start time already in the past but end still
// in the future — the guest's slot is live right now. Replaces the standard 30-min
// reminder for that booking. is_system=1 keeps it out of the admin history.
function notifyCourtReady({ user_id, resource_type, resource_name, end_time }) {
  try {
    const u = db.prepare('SELECT name, push_token FROM users WHERE id = ?').get(user_id);
    if (!u) return;
    const what = resource_name || (resource_type === 'tennis' ? 'court' : 'booking');
    const endLabel = end_time ? fmtBookingWhen(end_time) : null;
    const title = resource_type === 'tennis' ? 'Your court is ready' : 'Your booking is ready';
    const trailing = endLabel ? ` Your slot runs until ${endLabel}.` : '';
    const body = `Please head to ${what} now and enjoy every minute of your booking.${trailing}`;
    db.prepare(`INSERT INTO notifications (title, body, user_id, audience, is_system) VALUES (?, ?, ?, 'targeted', 1)`)
      .run(title, body, user_id);
    if (u.push_token) sendExpoPushToTokens([u.push_token], title, body).catch(() => {});
  } catch (e) {
    console.warn('Court ready notification failed:', e.message);
  }
}

// Drive all post-creation guest notifications for a booking. Called by both the
// user-side and admin-side booking endpoints.
//   - alwaysConfirm: admin bookings always send a confirmation. Self-bookings only
//     send a confirmation when the slot is already live (the guest just clicked
//     "book", so a future-slot confirmation would just be noise).
//   - Live slot (start ≤ now < end): fire "Your court is ready" right away and
//     suppress the periodic reminder via reminder_sent = 1.
//   - Future slot: schedule the 1-min-later reminder check.
function handleNewBookingNotifications(bookingId, payload, opts = {}) {
  const { resource_type, resource_name, start_time, end_time, user_id } = payload;
  const startMs = parseUtcStamp(start_time);
  const endMs = end_time ? parseUtcStamp(end_time) : null;
  const nowMs = Date.now();
  const liveAtCreation = startMs != null && startMs <= nowMs && (endMs == null || endMs > nowMs);

  if (opts.alwaysConfirm || liveAtCreation) {
    notifyBookingConfirmation({ user_id, resource_type, resource_name, start_time });
  }

  if (liveAtCreation) {
    notifyCourtReady({ user_id, resource_type, resource_name, end_time });
    db.prepare(`UPDATE bookings SET reminder_sent = 1 WHERE id = ?`).run(bookingId);
  } else {
    setTimeout(() => maybeSendImmediateReminder(bookingId), REMINDER_MIN_DELAY_MS).unref?.();
  }
}

// Sent when an admin cancels a booking. is_system=1 keeps it out of the admin history.
function notifyBookingCancellation({ user_id, resource_type, resource_name, start_time }) {
  try {
    const u = db.prepare('SELECT name, push_token FROM users WHERE id = ?').get(user_id);
    if (!u) return;
    const what = resource_name || resource_type || 'your booking';
    const when = fmtBookingWhen(start_time);
    const title = `Booking cancelled — ${what}`;
    const body = when ? `Your booking for ${when} has been cancelled. Contact reception if this was unexpected.` : 'Your booking has been cancelled. Contact reception if this was unexpected.';
    db.prepare(`INSERT INTO notifications (title, body, user_id, audience, is_system) VALUES (?, ?, ?, 'targeted', 1)`)
      .run(title, body, user_id);
    if (u.push_token) sendExpoPushToTokens([u.push_token], title, body).catch(() => {});
  } catch (e) {
    console.warn('Booking cancellation notification failed:', e.message);
  }
}

// Sent when an admin books on behalf of a guest. Tagged is_system=1 so it stays
// out of the admin "Recent notifications" history — it's automated, not a manual send.
function notifyBookingConfirmation({ user_id, resource_type, resource_name, start_time }) {
  try {
    const u = db.prepare('SELECT name, push_token FROM users WHERE id = ?').get(user_id);
    if (!u) return;
    const what = resource_name || resource_type || 'your booking';
    const when = fmtBookingWhen(start_time);
    const title = `Booking confirmed — ${what}`;
    const body = when ? `Your booking is confirmed for ${when}.` : 'Your booking is confirmed.';
    db.prepare(`INSERT INTO notifications (title, body, user_id, audience, is_system) VALUES (?, ?, ?, 'targeted', 1)`)
      .run(title, body, user_id);
    if (u.push_token) sendExpoPushToTokens([u.push_token], title, body).catch(() => {});
  } catch (e) {
    console.warn('Booking confirmation notification failed:', e.message);
  }
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
  db.prepare(`INSERT INTO notifications (title, body, user_id, audience, is_system) VALUES (?, ?, ?, 'targeted', 1)`)
    .run(title, body, b.user_id);
  db.prepare(`UPDATE bookings SET reminder_sent = 1 WHERE id = ?`).run(b.id);
  if (b.push_token) sendExpoPushToTokens([b.push_token], title, body).catch(() => {});
}

// Parse a SQLite UTC datetime string ("YYYY-MM-DD HH:MM:SS" or ISO with Z) into epoch ms.
function parseUtcStamp(s) {
  if (!s) return null;
  const d = new Date(s.includes('T') ? s : s.replace(' ', 'T') + 'Z');
  return isNaN(d) ? null : d.getTime();
}

// Spacing between a booking's confirmation notification and its reminder. Ensures the
// guest receives the confirmation first, then the reminder a moment later.
const REMINDER_MIN_DELAY_MS = 60 * 1000;

// Called right after a new booking is created — fires the reminder if the slot is
// 35 min away or closer. Always waits at least REMINDER_MIN_DELAY_MS after the
// booking was created so the reminder lands after the confirmation notification.
// Time math is in JS to sidestep SQLite TZ quirks on naive datetime strings.
function maybeSendImmediateReminder(bookingId) {
  try {
    const b = db.prepare(`
      SELECT b.id, b.user_id, b.resource_type, b.resource_name, b.start_time,
             b.status, b.reminder_sent, b.created_at, u.push_token
      FROM bookings b JOIN users u ON u.id = b.user_id
      WHERE b.id = ?
    `).get(bookingId);
    if (!b) return;
    if (b.status !== 'confirmed') return;
    if (b.reminder_sent) return;
    const createdMs = parseUtcStamp(b.created_at);
    if (createdMs != null && (Date.now() - createdMs) < REMINDER_MIN_DELAY_MS) return;
    const startMs = parseUtcStamp(b.start_time);
    if (startMs == null) return;
    const minutesLeft = (startMs - Date.now()) / 60000;
    if (minutesLeft >= 0 && minutesLeft <= 35) {
      sendReminder(b, minutesLeft);
    }
  } catch (e) {
    console.warn('Immediate reminder check failed:', e.message);
  }
}

// Daily reset: clear plat du jour `is_today` flags so the admin re-selects each day.
// Tracked via settings so a server restart on the same day doesn't wipe the admin's choice.
function localDateString() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function resetPlatDuJourIfNewDay() {
  try {
    const today = localDateString();
    const row = db.prepare(`SELECT value FROM settings WHERE key = 'plat_du_jour_reset_date'`).get();
    if (row && row.value === today) return;
    db.prepare(`UPDATE plat_du_jour_items SET is_today = 0`).run();
    db.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES ('plat_du_jour_reset_date', ?)`).run(today);
  } catch (e) {
    console.warn('Plat du jour reset failed:', e.message);
  }
}
resetPlatDuJourIfNewDay();
setInterval(resetPlatDuJourIfNewDay, 5 * 60 * 1000);

// Periodic loop: every 60 s, fire reminders for any unfired booking that is
// upcoming within the next 35 minutes. The 0–35 window also acts as a safety
// net if maybeSendImmediateReminder missed a fresh same-window booking.
// Time math is done in JS to avoid SQLite TZ pitfalls with naive datetime strings.
function scanForReminders() {
  try {
    const candidates = db.prepare(`
      SELECT b.id, b.user_id, b.resource_type, b.resource_name, b.start_time, b.created_at, u.push_token
      FROM bookings b JOIN users u ON u.id = b.user_id
      WHERE b.status = 'confirmed' AND b.reminder_sent = 0
    `).all();
    const nowMs = Date.now();
    for (const b of candidates) {
      const createdMs = parseUtcStamp(b.created_at);
      if (createdMs != null && (nowMs - createdMs) < REMINDER_MIN_DELAY_MS) continue;
      const startMs = parseUtcStamp(b.start_time);
      if (startMs == null) continue;
      const minutesLeft = (startMs - nowMs) / 60000;
      if (minutesLeft >= 0 && minutesLeft <= 35) {
        sendReminder(b, minutesLeft);
      }
    }
  } catch (e) {
    console.warn('Reminder scan failed:', e.message);
  }
}
setInterval(scanForReminders, 60 * 1000);
setTimeout(scanForReminders, 5000);

// Auto-complete bookings whose end_time has passed. JS time math (not SQLite) so
// stored ISO strings with timezone offsets are interpreted consistently.
function completePastBookings() {
  try {
    const rows = db.prepare(`
      SELECT id, end_time FROM bookings
      WHERE status = 'confirmed' AND end_time IS NOT NULL
    `).all();
    const nowMs = Date.now();
    const upd = db.prepare(`UPDATE bookings SET status = 'completed' WHERE id = ?`);
    for (const r of rows) {
      const endMs = parseUtcStamp(r.end_time);
      if (endMs != null && endMs <= nowMs) upd.run(r.id);
    }
  } catch (e) {
    console.warn('Auto-complete bookings failed:', e.message);
  }
}
completePastBookings();
setInterval(completePastBookings, 60 * 1000);

const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Portemilio API running on http://localhost:${PORT}`);
  console.log(`Admin portal: http://localhost:${PORT}/admin`);
});
