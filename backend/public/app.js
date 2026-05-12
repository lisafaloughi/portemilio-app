// Portemilio Admin Portal — vanilla JS SPA. No frameworks; ~1 file by design.

const PUBLIC = '/api';
const ADMIN = '/admin-api';
const TOKEN_KEY = 'pt_admin_token';

const root = document.getElementById('app');

const state = {
  token: localStorage.getItem(TOKEN_KEY) || null,
  me: null,
  active: 'dashboard',
  // caches
  dashboard: null,
  users: [],
  pendingUsers: [],
  bookings: [],
  deliveries: [],
  restaurants: [],
  menuItems: [],
  facilities: [],
  events: [],
  notifications: [],
  settings: [],
  // bookings calendar
  weekStart: null, // Date (Monday 00:00)
  // ui filters
  userFilter: { status: 'all', q: '', room: '', chalet: '' },
  bookingsTab: 'tennis', // 'tennis' | 'all'
  contentTab: 'restaurants', // 'restaurants' | 'menu' | 'facilities' | 'events'
  notifAudience: 'all',
  notifTargets: new Set(),
};

// =========================== HTTP ===========================
async function call(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  let res;
  try {
    res = await fetch(path, {
      method: opts.method || 'GET',
      headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
  } catch (e) {
    throw new Error('Network error');
  }
  if (res.status === 401 || res.status === 403) {
    if (state.token) {
      localStorage.removeItem(TOKEN_KEY);
      state.token = null;
      state.me = null;
      mountLogin();
    }
    throw new Error('Not authorized');
  }
  let data = {};
  try { data = await res.json(); } catch {}
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}
const api = {
  login: (email, password) => call(`${PUBLIC}/auth/login`, { method: 'POST', body: { email, password } }),
  me: () => call(`${PUBLIC}/auth/me`),
  // dashboard
  dashboard: () => call(`${ADMIN}/dashboard`),
  // users
  users: (q = {}) => call(`${ADMIN}/users?` + new URLSearchParams(q)),
  user: (id) => call(`${ADMIN}/users/${id}`),
  createUser: (b) => call(`${ADMIN}/users`, { method: 'POST', body: b }),
  updateUser: (id, b) => call(`${ADMIN}/users/${id}`, { method: 'PUT', body: b }),
  approveUser: (id) => call(`${ADMIN}/users/${id}/approve`, { method: 'PUT' }),
  rejectUser: (id) => call(`${ADMIN}/users/${id}/reject`, { method: 'PUT' }),
  deleteUser: (id) => call(`${ADMIN}/users/${id}`, { method: 'DELETE' }),
  // bookings
  bookings: (q = {}) => call(`${ADMIN}/bookings?` + new URLSearchParams(q)),
  createBooking: (b) => call(`${ADMIN}/bookings`, { method: 'POST', body: b }),
  setBookingStatus: (id, status) => call(`${ADMIN}/bookings/${id}/status`, { method: 'PUT', body: { status } }),
  deleteBooking: (id) => call(`${ADMIN}/bookings/${id}`, { method: 'DELETE' }),
  // deliveries
  deliveries: () => call(`${ADMIN}/deliveries`),
  createDelivery: (b) => call(`${ADMIN}/deliveries`, { method: 'POST', body: b }),
  setDeliveryStatus: (id, status) => call(`${ADMIN}/deliveries/${id}/status`, { method: 'PUT', body: { status } }),
  deleteDelivery: (id) => call(`${ADMIN}/deliveries/${id}`, { method: 'DELETE' }),
  // content
  restaurants: () => call(`${ADMIN}/restaurants`),
  createRestaurant: (b) => call(`${ADMIN}/restaurants`, { method: 'POST', body: b }),
  updateRestaurant: (id, b) => call(`${ADMIN}/restaurants/${id}`, { method: 'PUT', body: b }),
  deleteRestaurant: (id) => call(`${ADMIN}/restaurants/${id}`, { method: 'DELETE' }),
  menuItems: (rid) => call(`${ADMIN}/menu-items` + (rid ? `?restaurant_id=${rid}` : '')),
  createMenuItem: (b) => call(`${ADMIN}/menu-items`, { method: 'POST', body: b }),
  updateMenuItem: (id, b) => call(`${ADMIN}/menu-items/${id}`, { method: 'PUT', body: b }),
  deleteMenuItem: (id) => call(`${ADMIN}/menu-items/${id}`, { method: 'DELETE' }),
  facilities: () => call(`${ADMIN}/facilities`),
  createFacility: (b) => call(`${ADMIN}/facilities`, { method: 'POST', body: b }),
  updateFacility: (id, b) => call(`${ADMIN}/facilities/${id}`, { method: 'PUT', body: b }),
  deleteFacility: (id) => call(`${ADMIN}/facilities/${id}`, { method: 'DELETE' }),
  facilityItems: (facilityId) => call(`${ADMIN}/facility-items/${facilityId}`),
  createFacilityItem: (b) => call(`${ADMIN}/facility-items`, { method: 'POST', body: b }),
  updateFacilityItem: (id, b) => call(`${ADMIN}/facility-items/${id}`, { method: 'PUT', body: b }),
  deleteFacilityItem: (id) => call(`${ADMIN}/facility-items/${id}`, { method: 'DELETE' }),
  serviceItems: (serviceId) => call(`${ADMIN}/service-items/${serviceId}`),
  createServiceItem: (b) => call(`${ADMIN}/service-items`, { method: 'POST', body: b }),
  updateServiceItem: (id, b) => call(`${ADMIN}/service-items/${id}`, { method: 'PUT', body: b }),
  deleteServiceItem: (id) => call(`${ADMIN}/service-items/${id}`, { method: 'DELETE' }),
  services: () => call(`${ADMIN}/services`),
  updateService: (id, b) => call(`${ADMIN}/services/${id}`, { method: 'PUT', body: b }),
  marinaBoats: () => call(`${ADMIN}/marina-boats`),
  createMarinaBoat: (b) => call(`${ADMIN}/marina-boats`, { method: 'POST', body: b }),
  updateMarinaBoat: (id, b) => call(`${ADMIN}/marina-boats/${id}`, { method: 'PUT', body: b }),
  deleteMarinaBoat: (id) => call(`${ADMIN}/marina-boats/${id}`, { method: 'DELETE' }),
  landmarks: () => call(`${ADMIN}/landmarks`),
  createLandmark: (b) => call(`${ADMIN}/landmarks`, { method: 'POST', body: b }),
  updateLandmark: (id, b) => call(`${ADMIN}/landmarks/${id}`, { method: 'PUT', body: b }),
  deleteLandmark: (id) => call(`${ADMIN}/landmarks/${id}`, { method: 'DELETE' }),
  createLandmarkLocation: (b) => call(`${ADMIN}/landmark-locations`, { method: 'POST', body: b }),
  updateLandmarkLocation: (id, b) => call(`${ADMIN}/landmark-locations/${id}`, { method: 'PUT', body: b }),
  deleteLandmarkLocation: (id) => call(`${ADMIN}/landmark-locations/${id}`, { method: 'DELETE' }),
  events: () => call(`${ADMIN}/events`),
  createEvent: (b) => call(`${ADMIN}/events`, { method: 'POST', body: b }),
  updateEvent: (id, b) => call(`${ADMIN}/events/${id}`, { method: 'PUT', body: b }),
  deleteEvent: (id) => call(`${ADMIN}/events/${id}`, { method: 'DELETE' }),
  // notifications
  notifications: () => call(`${ADMIN}/notifications`),
  sendNotification: (b) => call(`${ADMIN}/notifications`, { method: 'POST', body: b }),
  deleteNotification: (id) => call(`${ADMIN}/notifications/${id}`, { method: 'DELETE' }),
  // settings
  settings: () => call(`${ADMIN}/settings`),
  updateSetting: (key, value) => call(`${ADMIN}/settings/${key}`, { method: 'PUT', body: { value } }),
  // plat du jour
  platDuJourItems: () => call(`${ADMIN}/plat-du-jour`),
  createPlatDuJourItem: (b) => call(`${ADMIN}/plat-du-jour`, { method: 'POST', body: b }),
  updatePlatDuJourItem: (id, b) => call(`${ADMIN}/plat-du-jour/${id}`, { method: 'PUT', body: b }),
  deletePlatDuJourItem: (id) => call(`${ADMIN}/plat-du-jour/${id}`, { method: 'DELETE' }),
  // activities
  activities: () => call(`${ADMIN}/activities`),
  createActivity: (b) => call(`${ADMIN}/activities`, { method: 'POST', body: b }),
  updateActivity: (id, b) => call(`${ADMIN}/activities/${id}`, { method: 'PUT', body: b }),
  deleteActivity: (id) => call(`${ADMIN}/activities/${id}`, { method: 'DELETE' }),
};

// =========================== UTILS ===========================
const h = (tag, attrs = {}, ...children) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'value') el.value = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return el;
};
const $ = (sel, scope = document) => scope.querySelector(sel);
const escapeHtml = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function toast(msg, kind = 'ok') {
  const t = h('div', { class: `toast ${kind === 'error' ? 'error' : ''}` }, msg);
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2400);
}

function fmtDateTime(s) {
  if (!s) return '—';
  const d = new Date(s.includes('T') ? s : s.replace(' ', 'T') + 'Z');
  if (isNaN(d)) return s;
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}
function fmtDate(s) {
  if (!s) return '—';
  const d = new Date(s.includes('T') ? s : s.replace(' ', 'T') + 'Z');
  if (isNaN(d)) return s;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
function fmtTime(s) {
  if (!s) return '—';
  const d = new Date(s.includes('T') ? s : s.replace(' ', 'T') + 'Z');
  if (isNaN(d)) return s;
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}
function pill(status) {
  const cls = (status || 'pending').toLowerCase().replace(/\s+/g, '_');
  const label = (status || '—').replace(/_/g, ' ');
  return h('span', { class: `pill ${cls}` }, label);
}
function unitLabel(u) {
  if (u.chalet_number) return `Chalet ${u.chalet_number}`;
  if (u.room_number) return `Room ${u.room_number}`;
  return 'Guest';
}

// =========================== MODAL ===========================
function openModal(content, opts = {}) {
  const backdrop = h('div', { class: 'modal-backdrop' });
  const modal = h('div', { class: 'modal' + (opts.large ? ' lg' : '') });
  modal.appendChild(content);
  backdrop.appendChild(modal);
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) backdrop.remove(); });
  document.body.appendChild(backdrop);
  return { backdrop, close: () => backdrop.remove() };
}

// =========================== BOOT ===========================
async function boot() {
  if (!state.token) return mountLogin();
  try {
    const me = await api.me();
    state.me = me.user;
    if (!state.me?.is_admin) {
      localStorage.removeItem(TOKEN_KEY);
      state.token = null;
      return mountLogin('Admin access required.');
    }
    mountApp();
  } catch {
    localStorage.removeItem(TOKEN_KEY);
    state.token = null;
    mountLogin();
  }
}

// =========================== LOGIN ===========================
function mountLogin(errorMsg = '') {
  root.innerHTML = '';
  const errEl = h('div', { class: 'error-text', style: 'margin-bottom: 12px;' }, errorMsg || '');
  const form = h('form', {
    onsubmit: async (e) => {
      e.preventDefault();
      const email = $('#email', form).value.trim();
      const password = $('#password', form).value;
      try {
        const { token, user } = await api.login(email, password);
        if (!user.is_admin) {
          errEl.textContent = 'This account is not an admin.';
          return;
        }
        state.token = token;
        state.me = user;
        localStorage.setItem(TOKEN_KEY, token);
        mountApp();
      } catch (e) {
        errEl.textContent = e.message || 'Login failed';
      }
    },
  },
    h('div', { class: 'field' },
      h('label', { class: 'field-label' }, 'Email'),
      h('input', { type: 'email', id: 'email', placeholder: 'admin@portemilio.com', required: true }),
    ),
    h('div', { class: 'field' },
      h('label', { class: 'field-label' }, 'Password'),
      h('input', { type: 'password', id: 'password', required: true }),
    ),
    errEl,
    h('button', { class: 'btn primary', type: 'submit', style: 'width: 100%; margin-top: 8px;' }, 'Sign in'),
  );
  const card = h('div', { class: 'login-card' },
    h('h1', {}, 'Portemilio Admin'),
    h('p', { class: 'subtitle' }, 'Sign in to manage the resort.'),
    form,
  );
  root.appendChild(h('div', { class: 'login-shell' }, card));
}

// =========================== APP SHELL ===========================
const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'approvals', label: 'Approvals' },
  { id: 'users', label: 'Guests' },
  { id: 'bookings', label: 'Bookings' },
  { id: 'deliveries', label: 'Deliveries' },
  { id: 'content', label: 'Property Details' },
  { id: 'platdujour', label: 'Plat du Jour' },
  { id: 'today', label: "Activities & Events" },
  { id: 'notifications', label: 'Notifications' },
];

function mountApp() {
  root.innerHTML = '';

  const sidebar = h('aside', { class: 'sidebar' },
    h('div', { class: 'brand' },
      h('div', { class: 'name' }, 'Portemilio'),
      h('div', { class: 'role' }, 'Admin Portal'),
    ),
    h('nav', { id: 'nav' }),
    h('div', { class: 'footer' },
      h('div', { class: 'who' }, state.me?.name || 'Admin'),
      h('button', {
        class: 'signout',
        onclick: () => {
          localStorage.removeItem(TOKEN_KEY);
          state.token = null;
          state.me = null;
          mountLogin();
        },
      }, 'Sign out'),
    ),
  );

  const main = h('main', { class: 'main', id: 'main' });
  root.appendChild(h('div', { class: 'app-shell' }, sidebar, main));

  renderNav();
  // Fetch dashboard counts so the sidebar badges populate before Dashboard is opened.
  api.dashboard().then(d => { state.dashboard = d; renderNav(); }).catch(() => {});
  setTab('dashboard');
}

function renderNav() {
  const nav = $('#nav');
  nav.innerHTML = '';
  const d = state.dashboard || {};
  // Map of tab → count of pending things that need admin attention.
  const pending = {
    approvals: d.users_pending || 0,
    deliveries: d.deliveries_pending || 0,
    bookings: d.bookings_pending || 0,
  };
  for (const t of TABS) {
    const btn = h('button', {
      class: 'nav-item' + (state.active === t.id ? ' active' : ''),
      onclick: () => setTab(t.id),
    }, t.label);
    if (pending[t.id]) {
      btn.appendChild(h('span', { class: 'badge urgent' }, String(pending[t.id])));
    }
    nav.appendChild(btn);
  }
}

async function setTab(id) {
  state.active = id;
  renderNav();
  const main = $('#main');
  main.innerHTML = '';
  main.appendChild(h('div', { class: 'page-header' },
    h('div', {},
      h('h2', {}, TABS.find(t => t.id === id)?.label || ''),
      h('p', { class: 'subtitle', id: 'page-subtitle' }, ''),
    ),
    h('div', { class: 'actions', id: 'page-actions' }),
  ));
  main.appendChild(h('div', { id: 'page-body' }));
  try {
    if (id === 'dashboard') await renderDashboard();
    else if (id === 'approvals') await renderApprovals();
    else if (id === 'users') await renderUsers();
    else if (id === 'bookings') await renderBookings();
    else if (id === 'deliveries') await renderDeliveries();
    else if (id === 'content') await renderContent();
    else if (id === 'platdujour') await renderPlatDuJour();
    else if (id === 'today') await renderTodayActivities();
    else if (id === 'notifications') await renderNotifications();
  } catch (e) {
    $('#page-body').appendChild(h('div', { class: 'empty' }, e.message || 'Failed to load'));
  }
}

// =========================== DASHBOARD ===========================
async function renderDashboard() {
  const body = $('#page-body');
  $('#page-subtitle').textContent = 'Live overview of pending requests and resort activity.';
  const d = await api.dashboard();
  state.dashboard = d;
  renderNav();

  const tile = (label, value, hint, alert, tabId) => {
    const attrs = { class: 'stat-tile' + (alert ? ' alert' : '') + (tabId ? ' linkable' : '') };
    if (tabId) attrs.onclick = () => setTab(tabId);
    return h('div', attrs,
      h('div', { class: 'label' }, label),
      h('div', { class: 'value' }, String(value || 0)),
      hint ? h('div', { class: 'hint' }, hint) : null,
    );
  };

  body.appendChild(h('div', { class: 'stat-grid' },
    tile('Pending approvals', d.users_pending, 'Awaiting verification', d.users_pending > 0, 'approvals'),
    tile('Pending deliveries', d.deliveries_pending, 'New orders', d.deliveries_pending > 0, 'deliveries'),
    tile('Pending bookings', d.bookings_pending, '', d.bookings_pending > 0, 'bookings'),
    tile('Bookings today', d.bookings_today, 'Confirmed activity', false, 'bookings'),
    tile('Total guests', d.users_total, '', false, 'users'),
    tile('Plat du Jour', d.plat_du_jour_count, 'Items featured today', false, 'platdujour'),
    tile("Today's Activities & Events", d.events_today, 'Scheduled today', false, 'today'),
    tile('Send Notifications', d.notifications_total, 'Total sent', false, 'notifications'),
  ));
}

// =========================== APPROVALS ===========================
async function renderApprovals() {
  const body = $('#page-body');
  $('#page-subtitle').textContent = 'Verify each guest before granting access. Match the unit number to the booking record.';
  const users = await api.users({ status: 'pending' });
  state.pendingUsers = users;

  if (!users.length) {
    body.appendChild(h('div', { class: 'card' }, h('div', { class: 'empty' }, 'No pending registrations. Everyone is verified.')));
    return;
  }

  const table = h('table', { class: 'table' });
  table.appendChild(h('thead', {}, h('tr', {},
    h('th', {}, 'Name'),
    h('th', {}, 'Contact'),
    h('th', {}, 'Unit'),
    h('th', {}, 'Submitted'),
    h('th', { class: 'right' }, 'Action'),
  )));
  const tbody = h('tbody');
  for (const u of users) {
    tbody.appendChild(h('tr', {},
      h('td', {}, h('div', { style: 'font-weight: 600;' }, u.name)),
      h('td', {},
        h('div', {}, u.email),
        h('div', { class: 'muted-text' }, u.phone || '—'),
      ),
      h('td', {}, h('strong', { style: 'color: var(--navy);' }, unitLabel(u))),
      h('td', { class: 'muted-text' }, fmtDate(u.created_at)),
      h('td', { class: 'right' },
        h('div', { class: 'row-actions', style: 'justify-content: flex-end;' },
          h('button', { class: 'btn success sm', onclick: async () => {
            try { await api.approveUser(u.id); toast('Approved'); setTab('approvals'); }
            catch (e) { toast(e.message, 'error'); }
          } }, 'Approve'),
          h('button', { class: 'btn danger sm', onclick: async () => {
            if (!confirm(`Reject ${u.name}? They will be told to contact reception.`)) return;
            try { await api.rejectUser(u.id); toast('Rejected'); setTab('approvals'); }
            catch (e) { toast(e.message, 'error'); }
          } }, 'Reject'),
        ),
      ),
    ));
  }
  table.appendChild(tbody);
  body.appendChild(h('div', { class: 'card' }, table));
}

// =========================== USERS ===========================
async function renderUsers() {
  const body = $('#page-body');
  $('#page-subtitle').textContent = 'Browse, search, and edit guest accounts. Filter by chalet or hotel room.';
  $('#page-actions').appendChild(h('button', { class: 'btn primary', onclick: openCreateUserModal }, '+ Add account'));

  const toolbar = h('div', { class: 'toolbar' });
  const search = h('input', {
    type: 'search',
    placeholder: 'Search by name, email or phone',
    value: state.userFilter.q,
    oninput: (e) => { state.userFilter.q = e.target.value; reload(); },
  });
  const chipGroup = h('div', { class: 'chip-group' });
  const chip = (val, label) => {
    const btn = h('button', {
      class: 'chip' + (state.userFilter.status === val ? ' active' : ''),
      onclick: () => {
        state.userFilter.status = val;
        // Update active state on all sibling chips so the visual reflects the filter.
        chipGroup.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        reload();
      },
    }, label);
    return btn;
  };
  chipGroup.append(chip('all', 'All'), chip('approved', 'Approved'), chip('pending', 'Pending'), chip('rejected', 'Rejected'));

  const roomInput = h('input', {
    type: 'text',
    placeholder: 'Room #',
    value: state.userFilter.room,
    style: 'width: 100px;',
    oninput: (e) => { state.userFilter.room = e.target.value; },
    onkeydown: (e) => { if (e.key === 'Enter') reload(); },
  });
  const chaletInput = h('input', {
    type: 'text',
    placeholder: 'Chalet #',
    value: state.userFilter.chalet,
    style: 'width: 100px;',
    oninput: (e) => { state.userFilter.chalet = e.target.value; },
    onkeydown: (e) => { if (e.key === 'Enter') reload(); },
  });
  const filterBtn = h('button', { class: 'btn ghost sm', onclick: () => reload() }, 'Filter');
  const clearBtn = h('button', { class: 'btn ghost sm', onclick: () => {
    state.userFilter = { status: 'all', q: '', room: '', chalet: '' };
    setTab('users');
  } }, 'Clear');
  toolbar.append(search, chipGroup, roomInput, chaletInput, filterBtn, clearBtn);
  body.appendChild(toolbar);

  const tableHost = h('div', { class: 'card', style: 'padding: 0; overflow: hidden;' });
  body.appendChild(tableHost);

  async function reload() {
    const q = {};
    if (state.userFilter.status !== 'all') q.status = state.userFilter.status;
    if (state.userFilter.q) q.q = state.userFilter.q;
    if (state.userFilter.room) q.room = state.userFilter.room;
    if (state.userFilter.chalet) q.chalet = state.userFilter.chalet;
    const users = await api.users(q);
    state.users = users;
    renderUserTable(tableHost, users);
  }
  await reload();
}

function renderUserTable(host, users) {
  host.innerHTML = '';
  if (!users.length) {
    host.appendChild(h('div', { class: 'empty' }, 'No accounts match your filters.'));
    return;
  }
  const t = h('table', { class: 'table' });
  t.appendChild(h('thead', {}, h('tr', {},
    h('th', {}, 'Name'),
    h('th', {}, 'Contact'),
    h('th', {}, 'Unit'),
    h('th', {}, 'Status'),
    h('th', {}, 'Joined'),
    h('th', { class: 'right' }, ''),
  )));
  const tb = h('tbody');
  for (const u of users) {
    tb.appendChild(h('tr', { style: 'cursor: pointer;', onclick: () => openUserDetail(u.id) },
      h('td', {}, h('div', { style: 'font-weight: 600;' }, u.name + (u.is_admin ? ' (admin)' : ''))),
      h('td', {}, h('div', {}, u.email), h('div', { class: 'muted-text' }, u.phone || '—')),
      h('td', {}, unitLabel(u)),
      h('td', {}, pill(u.status || 'approved')),
      h('td', { class: 'muted-text' }, fmtDate(u.created_at)),
      h('td', { class: 'right' },
        h('div', { class: 'row-actions', style: 'justify-content: flex-end;' },
          h('button', { class: 'icon-btn', onclick: (e) => { e.stopPropagation(); openUserDetail(u.id); } }, 'View'),
        ),
      ),
    ));
  }
  t.appendChild(tb);
  host.appendChild(t);
}

async function openUserDetail(id) {
  let data;
  try { data = await api.user(id); }
  catch (e) { toast(e.message, 'error'); return; }
  const u = data.user;

  const dl = h('dl', { class: 'detail' });
  const row = (label, value) => { dl.append(h('dt', {}, label), h('dd', {}, value || '—')); };
  row('Name', u.name);
  row('Email', u.email);
  row('Phone', u.phone);
  row('Unit', unitLabel(u));
  row('Birthday', u.birthday || '—');
  row('Status', pill(u.status || 'approved'));
  row('Joined', fmtDate(u.created_at));
  row('Role', u.is_admin ? 'Admin' : 'Guest');

  const roomMates = h('div', { class: 'card', style: 'margin-top: 18px;' },
    h('h3', {}, `Sharing the same ${u.chalet_number ? 'chalet' : u.room_number ? 'room' : 'unit'}`),
    data.roommates.length
      ? (() => {
          const t = h('table', { class: 'table' });
          t.append(h('thead', {}, h('tr', {}, h('th', {}, 'Name'), h('th', {}, 'Email'), h('th', {}, 'Status'))));
          const tb = h('tbody');
          for (const r of data.roommates) {
            tb.append(h('tr', { style: 'cursor: pointer;', onclick: () => { closeAll(); openUserDetail(r.id); } },
              h('td', {}, r.name),
              h('td', {}, r.email),
              h('td', {}, pill(r.status || 'approved')),
            ));
          }
          t.appendChild(tb);
          return t;
        })()
      : h('div', { class: 'empty' }, 'No-one else is registered to this unit yet.'),
  );

  const card = h('div', {},
    h('h3', {}, u.name),
    h('div', { class: 'card', style: 'background: var(--bg-soft);' }, dl),
    roomMates,
    h('div', { class: 'modal-actions' },
      h('button', { class: 'btn ghost', onclick: () => closeAll() }, 'Close'),
      u.status === 'pending' ? h('button', {
        class: 'btn success', onclick: async () => {
          try { await api.approveUser(u.id); toast('Approved'); closeAll(); setTab('users'); } catch (e) { toast(e.message, 'error'); }
        },
      }, 'Approve') : null,
      h('button', { class: 'btn ghost', onclick: () => { closeAll(); openEditUserModal(u); } }, 'Edit'),
      h('button', {
        class: 'btn danger', onclick: async () => {
          if (!confirm(`Delete ${u.name}? This cannot be undone.`)) return;
          try { await api.deleteUser(u.id); toast('Deleted'); closeAll(); setTab('users'); } catch (e) { toast(e.message, 'error'); }
        },
      }, 'Delete'),
    ),
  );
  const m = openModal(card, { large: true });
  function closeAll() { m.close(); }
}

function openCreateUserModal() {
  const form = h('form', { onsubmit: async (e) => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.target).entries());
    body.is_admin = e.target.is_admin.checked;
    try { await api.createUser(body); toast('Account created'); m.close(); setTab('users'); }
    catch (err) { toast(err.message, 'error'); }
  } },
    h('div', { class: 'field' }, h('label', { class: 'field-label' }, 'Name'), h('input', { name: 'name', required: true })),
    h('div', { class: 'field-row' },
      h('div', { class: 'field' }, h('label', { class: 'field-label' }, 'Email'), h('input', { type: 'email', name: 'email', required: true })),
      h('div', { class: 'field' }, h('label', { class: 'field-label' }, 'Phone'), h('input', { name: 'phone' })),
    ),
    h('div', { class: 'field' }, h('label', { class: 'field-label' }, 'Password'), h('input', { type: 'password', name: 'password', required: true })),
    h('div', { class: 'field-row' },
      h('div', { class: 'field' }, h('label', { class: 'field-label' }, 'Room number'), h('input', { name: 'room_number' })),
      h('div', { class: 'field' }, h('label', { class: 'field-label' }, 'Chalet number'), h('input', { name: 'chalet_number' })),
    ),
    h('div', { class: 'field' },
      h('label', { class: 'checkbox-row' }, h('input', { type: 'checkbox', name: 'is_admin' }), 'Admin user'),
    ),
    h('div', { class: 'modal-actions' },
      h('button', { type: 'button', class: 'btn ghost', onclick: () => m.close() }, 'Cancel'),
      h('button', { type: 'submit', class: 'btn primary' }, 'Create'),
    ),
  );
  const m = openModal(h('div', {}, h('h3', {}, 'New account'), form));
}

function openEditUserModal(u) {
  const form = h('form', { onsubmit: async (e) => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.target).entries());
    body.is_admin = e.target.is_admin.checked;
    try { await api.updateUser(u.id, body); toast('Saved'); m.close(); setTab('users'); }
    catch (err) { toast(err.message, 'error'); }
  } },
    h('div', { class: 'field' }, h('label', { class: 'field-label' }, 'Name'), h('input', { name: 'name', value: u.name, required: true })),
    h('div', { class: 'field-row' },
      h('div', { class: 'field' }, h('label', { class: 'field-label' }, 'Email'), h('input', { type: 'email', name: 'email', value: u.email })),
      h('div', { class: 'field' }, h('label', { class: 'field-label' }, 'Phone'), h('input', { name: 'phone', value: u.phone || '' })),
    ),
    h('div', { class: 'field-row' },
      h('div', { class: 'field' }, h('label', { class: 'field-label' }, 'Room number'), h('input', { name: 'room_number', value: u.room_number || '' })),
      h('div', { class: 'field' }, h('label', { class: 'field-label' }, 'Chalet number'), h('input', { name: 'chalet_number', value: u.chalet_number || '' })),
    ),
    h('div', { class: 'field' },
      h('label', { class: 'field-label' }, 'Status'),
      (() => {
        const sel = h('select', { name: 'status' });
        for (const s of ['approved', 'pending', 'rejected']) {
          const o = h('option', { value: s }, s);
          if ((u.status || 'approved') === s) o.selected = true;
          sel.appendChild(o);
        }
        return sel;
      })(),
    ),
    h('div', { class: 'field' },
      h('label', { class: 'checkbox-row' },
        (() => { const c = h('input', { type: 'checkbox', name: 'is_admin' }); c.checked = !!u.is_admin; return c; })(),
        'Admin user',
      ),
    ),
    h('div', { class: 'modal-actions' },
      h('button', { type: 'button', class: 'btn ghost', onclick: () => m.close() }, 'Cancel'),
      h('button', { type: 'submit', class: 'btn primary' }, 'Save'),
    ),
  );
  const m = openModal(h('div', {}, h('h3', {}, 'Edit account'), form));
}

// =========================== BOOKINGS ===========================
async function renderBookings() {
  const body = $('#page-body');
  $('#page-subtitle').textContent = 'Tennis calendar shows the week at a glance — click a free slot to book it for a guest.';

  const tabBar = h('div', { class: 'subtabs' },
    h('button', { class: 'subtab' + (state.bookingsTab === 'tennis' ? ' active' : ''), onclick: () => { state.bookingsTab = 'tennis'; setTab('bookings'); } }, 'Tennis calendar'),
    h('button', { class: 'subtab' + (state.bookingsTab === 'all' ? ' active' : ''), onclick: () => { state.bookingsTab = 'all'; setTab('bookings'); } }, 'All bookings'),
  );
  body.appendChild(tabBar);

  if (state.bookingsTab === 'tennis') {
    await renderTennisCalendar(body);
  } else {
    await renderAllBookings(body);
  }
}

function startOfWeek(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const dow = (x.getDay() + 6) % 7; // Monday = 0
  x.setDate(x.getDate() - dow);
  return x;
}

async function renderTennisCalendar(body) {
  if (!state.weekStart) state.weekStart = startOfWeek(new Date());

  const weekStart = new Date(state.weekStart);
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 7);
  const fromIso = weekStart.toISOString();
  const toIso = weekEnd.toISOString();
  const bookings = await api.bookings({ resource_type: 'tennis', from: fromIso, to: toIso });

  const monthLabel = `${weekStart.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })} – ${(() => { const e = new Date(weekStart); e.setDate(weekStart.getDate() + 6); return e.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }); })()}`;

  const toolbar = h('div', { class: 'calendar-toolbar' },
    h('div', { class: 'row-flex' },
      h('button', { class: 'btn ghost sm', onclick: () => { state.weekStart = new Date(state.weekStart); state.weekStart.setDate(state.weekStart.getDate() - 7); setTab('bookings'); } }, '←'),
      h('button', { class: 'btn ghost sm', onclick: () => { state.weekStart = startOfWeek(new Date()); setTab('bookings'); } }, 'This week'),
      h('button', { class: 'btn ghost sm', onclick: () => { state.weekStart = new Date(state.weekStart); state.weekStart.setDate(state.weekStart.getDate() + 7); setTab('bookings'); } }, '→'),
      h('div', { class: 'week-label', style: 'margin-left: 8px;' }, monthLabel),
    ),
    h('div', { class: 'muted-text' }, `${bookings.length} booking${bookings.length === 1 ? '' : 's'} this week`),
  );
  body.appendChild(toolbar);

  // Build grid: 7 days × hours 8..21
  const HOURS = [];
  for (let hh = 8; hh <= 21; hh++) HOURS.push(hh);

  // Index bookings by day-hour key
  const indexed = {};
  for (const b of bookings) {
    if (b.status === 'cancelled') continue;
    const d = new Date(b.start_time.includes('T') ? b.start_time : b.start_time.replace(' ', 'T') + 'Z');
    const key = `${d.toDateString()}|${d.getHours()}`;
    (indexed[key] = indexed[key] || []).push(b);
  }

  const grid = h('div', { class: 'cal-grid' });
  // Header row
  grid.append(h('div', { class: 'cal-head' }, ''));
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart); d.setDate(weekStart.getDate() + i);
    days.push(d);
    const isToday = d.getTime() === today.getTime();
    grid.append(h('div', { class: 'cal-head' + (isToday ? '' : '') },
      h('div', {}, d.toLocaleDateString(undefined, { weekday: 'short' })),
      h('div', { class: 'dow-num' }, String(d.getDate())),
    ));
  }
  // Hour rows
  for (const hh of HOURS) {
    grid.append(h('div', { class: 'cal-time' }, `${hh}:00`));
    for (const d of days) {
      const slot = new Date(d); slot.setHours(hh, 0, 0, 0);
      const key = `${d.toDateString()}|${hh}`;
      const list = indexed[key] || [];
      const isToday = d.toDateString() === today.toDateString();
      if (list.length) {
        const b = list[0];
        const cls = `cal-cell booked ${b.status === 'pending' ? 'pending' : ''} ${isToday ? 'today' : ''}`;
        grid.append(h('div', {
          class: cls,
          onclick: () => openBookingDetail(b),
        },
          h('div', { class: 'b-name' }, b.user_name),
          h('div', { class: 'b-meta' }, b.resource_name || 'Tennis'),
        ));
      } else {
        grid.append(h('div', {
          class: 'cal-cell' + (isToday ? ' today' : ''),
          onclick: () => openCreateTennisModal(slot),
        }));
      }
    }
  }
  body.appendChild(grid);

  body.appendChild(h('div', { style: 'margin-top: 12px; font-size: 12px; color: var(--subtle);' },
    'Click any empty slot to book it on behalf of a guest. Click a booking to manage it.',
  ));
}

async function openCreateTennisModal(start) {
  const users = state.users.length ? state.users : await api.users();
  state.users = users;
  const end = new Date(start); end.setHours(start.getHours() + 1);

  const form = h('form', { onsubmit: async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = {
      user_id: Number(fd.get('user_id')),
      resource_type: 'tennis',
      resource_name: fd.get('resource_name') || 'Tennis court',
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      party_size: Number(fd.get('party_size')) || 1,
      notes: fd.get('notes') || null,
      status: 'confirmed',
    };
    try { await api.createBooking(body); toast('Booked'); m.close(); setTab('bookings'); }
    catch (err) { toast(err.message, 'error'); }
  } },
    h('div', { class: 'field' },
      h('label', { class: 'field-label' }, 'Guest'),
      (() => {
        const sel = h('select', { name: 'user_id', required: true });
        sel.append(h('option', { value: '' }, 'Choose a guest…'));
        for (const u of users) {
          if (u.status && u.status !== 'approved') continue;
          sel.append(h('option', { value: u.id }, `${u.name} — ${unitLabel(u)}`));
        }
        return sel;
      })(),
    ),
    h('div', { class: 'field' }, h('label', { class: 'field-label' }, 'Court'), h('input', { name: 'resource_name', placeholder: 'Tennis court', value: 'Tennis court' })),
    h('div', { class: 'field' }, h('label', { class: 'field-label' }, 'Players'), h('input', { type: 'number', name: 'party_size', min: 1, max: 4, value: 2 })),
    h('div', { class: 'field' }, h('label', { class: 'field-label' }, 'Notes'), h('textarea', { name: 'notes' })),
    h('div', { class: 'modal-actions' },
      h('button', { type: 'button', class: 'btn ghost', onclick: () => m.close() }, 'Cancel'),
      h('button', { type: 'submit', class: 'btn primary' }, 'Confirm booking'),
    ),
  );
  const m = openModal(h('div', {},
    h('h3', {}, 'Book a court'),
    h('p', { class: 'muted-text', style: 'margin: -8px 0 14px;' },
      `${start.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })} · ${start.getHours()}:00 – ${end.getHours()}:00`),
    form,
  ));
}

function openBookingDetail(b) {
  const dl = h('dl', { class: 'detail' });
  const row = (l, v) => { dl.append(h('dt', {}, l), h('dd', {}, v || '—')); };
  row('Guest', b.user_name);
  row('Email', b.user_email);
  row('Unit', b.chalet_number ? `Chalet ${b.chalet_number}` : b.room_number ? `Room ${b.room_number}` : '—');
  row('Resource', b.resource_name || b.resource_type);
  row('When', `${fmtDateTime(b.start_time)}${b.end_time ? ' – ' + fmtTime(b.end_time) : ''}`);
  row('Party size', String(b.party_size || 1));
  row('Status', pill(b.status));
  row('Notes', b.notes);

  const m = openModal(h('div', {},
    h('h3', {}, 'Booking'),
    h('div', { class: 'card', style: 'background: var(--bg-soft);' }, dl),
    h('div', { class: 'modal-actions' },
      h('button', { class: 'btn ghost', onclick: () => m.close() }, 'Close'),
      b.status !== 'confirmed' ? h('button', {
        class: 'btn success', onclick: async () => {
          try { await api.setBookingStatus(b.id, 'confirmed'); toast('Confirmed'); m.close(); setTab('bookings'); } catch (e) { toast(e.message, 'error'); }
        },
      }, 'Confirm') : null,
      b.status !== 'cancelled' ? h('button', {
        class: 'btn danger', onclick: async () => {
          if (!confirm('Cancel this booking?')) return;
          try { await api.setBookingStatus(b.id, 'cancelled'); toast('Cancelled'); m.close(); setTab('bookings'); } catch (e) { toast(e.message, 'error'); }
        },
      }, 'Cancel') : null,
    ),
  ), { large: true });
}

async function renderAllBookings(body) {
  const bookings = await api.bookings();
  state.bookings = bookings;
  if (!bookings.length) {
    body.appendChild(h('div', { class: 'card' }, h('div', { class: 'empty' }, 'No bookings yet.')));
    return;
  }
  const t = h('table', { class: 'table' });
  t.append(h('thead', {}, h('tr', {},
    h('th', {}, 'When'), h('th', {}, 'Resource'), h('th', {}, 'Guest'), h('th', {}, 'Unit'),
    h('th', {}, 'Status'), h('th', { class: 'right' }, ''),
  )));
  const tb = h('tbody');
  for (const b of bookings) {
    tb.append(h('tr', {},
      h('td', {}, fmtDateTime(b.start_time)),
      h('td', {}, b.resource_name || b.resource_type),
      h('td', {}, b.user_name),
      h('td', {}, b.chalet_number ? `Chalet ${b.chalet_number}` : b.room_number ? `Room ${b.room_number}` : '—'),
      h('td', {}, pill(b.status)),
      h('td', { class: 'right' },
        h('div', { class: 'row-actions', style: 'justify-content: flex-end;' },
          h('button', { class: 'icon-btn', onclick: () => openBookingDetail(b) }, 'View'),
          b.status !== 'cancelled' ? h('button', {
            class: 'icon-btn danger',
            onclick: async () => {
              if (!confirm('Cancel this booking?')) return;
              try { await api.setBookingStatus(b.id, 'cancelled'); toast('Cancelled'); setTab('bookings'); } catch (e) { toast(e.message, 'error'); }
            },
          }, 'Cancel') : null,
        ),
      ),
    ));
  }
  t.appendChild(tb);
  body.appendChild(h('div', { class: 'card', style: 'padding: 0; overflow: hidden;' }, t));
}

// =========================== DELIVERIES ===========================
async function renderDeliveries() {
  const body = $('#page-body');
  $('#page-subtitle').textContent = 'Track every order. Move it through the workflow as it progresses.';
  $('#page-actions').appendChild(h('button', { class: 'btn primary', onclick: openCreateDeliveryModal }, '+ New delivery'));

  const list = await api.deliveries();
  state.deliveries = list;
  if (!list.length) {
    body.appendChild(h('div', { class: 'card' }, h('div', { class: 'empty' }, 'No deliveries yet.')));
    return;
  }

  const STATUSES = ['pending', 'processing', 'out_for_delivery', 'delivered', 'cancelled'];
  const isActive = (s) => ['pending', 'processing', 'out_for_delivery'].includes(s);
  const rowClass = (s) => s === 'delivered' ? 'row-delivered' : s === 'cancelled' ? 'row-cancelled' : isActive(s) ? 'row-active' : '';

  const makethead = () => h('thead', {}, h('tr', {},
    h('th', {}, 'Placed'), h('th', {}, 'Guest'), h('th', {}, 'Restaurant'),
    h('th', {}, 'Items'), h('th', {}, 'Destination'), h('th', {}, 'Total'),
    h('th', {}, 'Scheduled'), h('th', {}, 'Status'), h('th', { class: 'right' }, ''),
  ));

  // Pull destination + scheduled time from explicit columns first; for older rows, parse the
  // notes string the mobile app writes (e.g. "Deliver to: Chalet 42. Scheduled for 3:00 PM today.").
  const destFromNotes = (notes) => {
    if (!notes) return null;
    const m = notes.match(/Deliver to:\s*([^.]+)\./i);
    return m ? m[1].trim() : null;
  };
  const scheduledFromNotes = (notes) => {
    if (!notes) return null;
    const m = notes.match(/Scheduled for\s+([^.]+?)(?:\s+today)?\./i);
    return m ? m[1].trim() : null;
  };

  const activeTbody = h('tbody');
  const doneTbody = h('tbody');

  for (const d of list) {
    const itemsLabel = d.items.map(it => `${it.qty || 1}× ${it.name}`).join(', ');
    const dest = d.chalet_number
      ? `Chalet ${d.chalet_number}`
      : d.room_number
        ? `Room ${d.room_number}`
        : destFromNotes(d.notes) || d.room_or_chalet || '—';
    const scheduledLabel = d.scheduled_for
      ? fmtDateTime(d.scheduled_for)
      : (scheduledFromNotes(d.notes) || 'ASAP');
    const sel = h('select', {});
    for (const s of STATUSES) {
      const o = h('option', { value: s }, s.replace(/_/g, ' '));
      if (d.status === s) o.selected = true;
      sel.appendChild(o);
    }
    const tr = h('tr', { class: rowClass(d.status) },
      h('td', { class: 'muted-text' }, fmtDateTime(d.created_at)),
      h('td', {}, h('div', { style: 'font-weight: 600;' }, d.user_name), h('div', { class: 'muted-text' }, d.user_email)),
      h('td', {}, d.restaurant_name || '—'),
      h('td', {}, h('div', { style: 'max-width: 220px; white-space: normal;' }, itemsLabel)),
      h('td', {}, dest),
      h('td', { class: 'num' }, '$' + (d.total || 0).toFixed(2)),
      h('td', { class: scheduledLabel === 'ASAP' ? 'muted-text' : '' }, scheduledLabel),
      h('td', {}, sel),
      h('td', { class: 'right' },
        h('button', { class: 'icon-btn danger', onclick: async () => {
          if (!confirm('Delete this delivery?')) return;
          try { await api.deleteDelivery(d.id); toast('Deleted'); setTab('deliveries'); } catch (e) { toast(e.message, 'error'); }
        } }, 'Delete'),
      ),
    );
    sel.addEventListener('change', async (e) => {
      const newStatus = e.target.value;
      const wasActive = isActive(d.status);
      const nowActive = isActive(newStatus);
      try {
        await api.setDeliveryStatus(d.id, newStatus);
        toast('Updated');
        d.status = newStatus;
        tr.className = rowClass(newStatus);
        if (wasActive && !nowActive) doneTbody.prepend(tr);
        else if (!wasActive && nowActive) activeTbody.append(tr);
      } catch (err) {
        toast(err.message, 'error');
        e.target.value = d.status;
      }
    });
    if (isActive(d.status)) activeTbody.append(tr);
    else doneTbody.append(tr);
  }

  const sectionLabel = (text) => h('div', { class: 'deliveries-section-label' }, text);

  const activeTable = h('table', { class: 'table' });
  activeTable.append(makethead());
  activeTable.appendChild(activeTbody);

  const doneTable = h('table', { class: 'table' });
  doneTable.append(makethead());
  doneTable.appendChild(doneTbody);

  body.appendChild(h('div', {},
    sectionLabel('In progress'),
    h('div', { class: 'card', style: 'padding: 0; overflow: hidden; margin-bottom: 28px;' }, activeTable),
    sectionLabel('History'),
    h('div', { class: 'card', style: 'padding: 0; overflow: hidden;' }, doneTable),
  ));
}

async function openCreateDeliveryModal() {
  const [users, restaurants] = await Promise.all([api.users(), api.restaurants()]);
  let menu = [];

  const itemsBox = h('div');
  let itemRows = [{ name: '', qty: 1, price: 0 }];
  function renderItems() {
    itemsBox.innerHTML = '';
    itemRows.forEach((row, idx) => {
      itemsBox.append(h('div', { class: 'row-flex', style: 'margin-bottom: 8px;' },
        h('input', { placeholder: 'Item name', value: row.name, oninput: (e) => itemRows[idx].name = e.target.value, style: 'flex: 2;' }),
        h('input', { type: 'number', min: '1', value: row.qty, oninput: (e) => itemRows[idx].qty = Number(e.target.value), style: 'width: 70px;' }),
        h('input', { type: 'number', step: '0.01', min: '0', value: row.price, oninput: (e) => itemRows[idx].price = Number(e.target.value), style: 'width: 100px;' }),
        h('button', { type: 'button', class: 'icon-btn danger', onclick: () => { itemRows.splice(idx, 1); renderItems(); } }, '✕'),
      ));
    });
    itemsBox.append(h('button', { type: 'button', class: 'btn ghost sm', onclick: () => { itemRows.push({ name: '', qty: 1, price: 0 }); renderItems(); } }, '+ Add item'));
  }
  renderItems();

  const restSel = h('select', { name: 'restaurant_id', onchange: async (e) => {
    const id = e.target.value;
    if (!id) { menu = []; return; }
    try {
      menu = await api.menuItems(id);
      // Auto-fill items: keep blank if user wants custom
    } catch {}
  } });
  restSel.append(h('option', { value: '' }, '— No restaurant —'));
  for (const r of restaurants) restSel.append(h('option', { value: r.id }, r.name));

  const userSel = h('select', { name: 'user_id', required: true });
  userSel.append(h('option', { value: '' }, 'Choose a guest…'));
  for (const u of users) {
    if (u.status && u.status !== 'approved') continue;
    userSel.append(h('option', { value: u.id }, `${u.name} — ${unitLabel(u)}`));
  }

  const form = h('form', { onsubmit: async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const items = itemRows.filter(r => r.name && r.qty > 0);
    if (!items.length) { toast('Add at least one item', 'error'); return; }
    const body = {
      user_id: Number(fd.get('user_id')),
      restaurant_id: fd.get('restaurant_id') ? Number(fd.get('restaurant_id')) : null,
      items,
      notes: fd.get('notes') || null,
      scheduled_for: fd.get('scheduled_for') || null,
      room_number: fd.get('room_number') || null,
      chalet_number: fd.get('chalet_number') || null,
    };
    try { await api.createDelivery(body); toast('Delivery created'); m.close(); setTab('deliveries'); }
    catch (err) { toast(err.message, 'error'); }
  } },
    h('div', { class: 'field' }, h('label', { class: 'field-label' }, 'Guest'), userSel),
    h('div', { class: 'field' }, h('label', { class: 'field-label' }, 'Restaurant'), restSel),
    h('div', { class: 'field' }, h('label', { class: 'field-label' }, 'Items (name · qty · price)'), itemsBox),
    h('div', { class: 'field-row' },
      h('div', { class: 'field' }, h('label', { class: 'field-label' }, 'Room override'), h('input', { name: 'room_number' })),
      h('div', { class: 'field' }, h('label', { class: 'field-label' }, 'Chalet override'), h('input', { name: 'chalet_number' })),
    ),
    h('div', { class: 'field' }, h('label', { class: 'field-label' }, 'Schedule for (optional)'), h('input', { type: 'datetime-local', name: 'scheduled_for' })),
    h('div', { class: 'field' }, h('label', { class: 'field-label' }, 'Notes'), h('textarea', { name: 'notes' })),
    h('div', { class: 'modal-actions' },
      h('button', { type: 'button', class: 'btn ghost', onclick: () => m.close() }, 'Cancel'),
      h('button', { type: 'submit', class: 'btn primary' }, 'Create delivery'),
    ),
  );
  const m = openModal(h('div', {}, h('h3', {}, 'New delivery on behalf of a guest'), form), { large: true });
}

// =========================== CONTENT (restaurants/menu/facilities/events) ===========================
async function renderContent() {
  const body = $('#page-body');
  $('#page-subtitle').textContent = 'Edit the information shown in the guest app — restaurants, bars, facilities and services.';

  const tabs = h('div', { class: 'subtabs' });
  const TS = [
    { id: 'restaurants', label: 'Restaurants & Bars' },
    { id: 'facilities', label: 'Facilities' },
    { id: 'marina', label: 'La Marina' },
    { id: 'services', label: 'Other Services' },
  ];
  if (!['restaurants', 'facilities', 'marina', 'services'].includes(state.contentTab)) state.contentTab = 'restaurants';
  for (const t of TS) {
    tabs.append(h('button', {
      class: 'subtab' + (state.contentTab === t.id ? ' active' : ''),
      onclick: () => { state.contentTab = t.id; setTab('content'); },
    }, t.label));
  }
  body.appendChild(tabs);

  if (state.contentTab === 'restaurants') await renderRestaurants(body);
  else if (state.contentTab === 'facilities') await renderFacilities(body);
  else if (state.contentTab === 'marina') await renderMarina(body);
  else if (state.contentTab === 'services') await renderServices(body);
}

// --- Restaurants
async function renderRestaurants(body) {
  $('#page-actions').innerHTML = '';

  const list = await api.restaurants();
  state.restaurants = list;

  if (!list.length) { body.appendChild(h('div', { class: 'card' }, h('div', { class: 'empty' }, 'No restaurants yet.'))); return; }

  const t = h('table', { class: 'table' });
  t.append(h('thead', {}, h('tr', {},
    h('th', {}, 'Name'), h('th', {}, 'Categories'), h('th', {}, 'Hours'),
    h('th', {}, 'Location'), h('th', {}, 'Phone'),
  )));
  const tb = h('tbody');
  for (const r of list) {
    tb.append(h('tr', { style: 'cursor: pointer;', onclick: () => openRestaurantModal(r) },
      h('td', {},
        h('div', { style: 'font-weight: 600;' }, r.name + (r.upcoming ? ' (coming soon)' : '')),
        h('div', { class: 'muted-text' }, r.specialty || r.cuisine || ''),
      ),
      h('td', {}, r.categories || '—'),
      h('td', {}, r.hours || '—'),
      h('td', {}, r.address || r.location || '—'),
      h('td', {}, r.phone || '—'),
    ));
  }
  t.appendChild(tb);
  body.appendChild(h('div', { class: 'card', style: 'padding: 0; overflow: hidden;' }, t));
}

function openRestaurantModal(r) {
  const isEdit = !!r;

  // Parse existing image_urls
  let imageUrls = [];
  if (r?.image_urls) {
    try { imageUrls = JSON.parse(r.image_urls); } catch { imageUrls = []; }
  }
  // Fall back to single image_url for old records
  if (!imageUrls.length && r?.image_url) imageUrls = [r.image_url];

  let menuPdfUrl = r?.menu_pdf_url || null;

  // Highlights
  let initialHighlights = '';
  if (r?.highlights) {
    try { initialHighlights = JSON.parse(r.highlights).join('\n'); }
    catch { initialHighlights = r.highlights; }
  }

  // --- Image grid (reactive, outside the form) ---
  function openImagePreview(src) {
    const overlay = h('div', {
      style: 'position:fixed;inset:0;background:rgba(0,0,0,0.88);z-index:9999;display:flex;align-items:center;justify-content:center;cursor:zoom-out;',
      onclick: () => overlay.remove(),
    });
    const img = document.createElement('img');
    img.src = src;
    img.style.cssText = 'max-width:88vw;max-height:88vh;border-radius:12px;object-fit:contain;box-shadow:0 8px 40px rgba(0,0,0,0.6);';
    overlay.appendChild(img);
    document.body.appendChild(overlay);
  }

  let dragEl = null;
  function syncImagesFromDom() {
    imageUrls.splice(0, imageUrls.length,
      ...Array.from(imgGrid.children).map(c => c._url).filter(Boolean));
  }
  // FLIP: animate non-dragged thumbs smoothly when their position changes
  function flipReorder(perform) {
    const items = Array.from(imgGrid.children);
    const beforeRects = items.map(el => el.getBoundingClientRect());
    perform();
    items.forEach((el, i) => {
      if (el === dragEl) return;
      const before = beforeRects[i];
      const after = el.getBoundingClientRect();
      const dx = before.left - after.left;
      const dy = before.top - after.top;
      if (dx === 0 && dy === 0) return;
      el.style.transition = 'none';
      el.style.transform = `translate(${dx}px, ${dy}px)`;
      requestAnimationFrame(() => {
        el.style.transition = 'transform 180ms ease';
        el.style.transform = '';
        // Strip the transition style as soon as the animation completes so
        // we don't leave thumbs in a "has active transition" state — which
        // is the exact condition under which WebKit defers drag detection
        // and falls through to a text-selection gesture on the next drag.
        const onEnd = (ev) => {
          if (ev.propertyName && ev.propertyName !== 'transform') return;
          el.style.transition = '';
          el.removeEventListener('transitionend', onEnd);
        };
        el.addEventListener('transitionend', onEnd);
      });
    });
  }

  function renderImageGrid() {
    imgGrid.innerHTML = '';
    imageUrls.forEach((url) => {
      const thumb = document.createElement('div');
      thumb.draggable = true;
      thumb._url = url;
      thumb.title = 'Click to preview · drag to reorder';
      // -webkit-user-drag: element explicitly tells WebKit "this element is
      // THE drag source." Combined with draggable=true, it makes drag-source
      // detection stable even when the thumb has an active CSS transition
      // from a prior FLIP animation.
      thumb.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:6px;padding:4px;border-radius:10px;cursor:grab;background:transparent;user-select:none;-webkit-user-select:none;-webkit-user-drag:element;';
      // Click (not drag) opens the lightbox. Browsers don't fire `click`
      // after a successful HTML5 drag, so this only triggers for real taps.
      thumb.addEventListener('click', (e) => {
        // Don't open preview when the user is actually clicking the delete
        // button (the click bubbles up to the thumb).
        if (e.target.closest && e.target.closest('button')) return;
        openImagePreview(url);
      });

      // On mousedown, defuse competing drag sources WITHOUT calling
      // preventDefault — that would block the drag itself on WebKit.
      //  1. Blur any focused INPUT/TEXTAREA — its internal selection isn't
      //     covered by window.getSelection() and the browser can drag it.
      //  2. Clear any document-level text selection.
      thumb.addEventListener('mousedown', () => {
        const active = document.activeElement;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
          active.blur();
        }
        const sel = window.getSelection && window.getSelection();
        if (sel && !sel.isCollapsed) sel.removeAllRanges();
      });
      // Cancel selectstart — the event that fires the instant a selection
      // gesture would begin. This blocks the text-selection-from-image
      // gesture without blocking the HTML5 drag, which uses a separate
      // event dispatch path.
      thumb.addEventListener('selectstart', (e) => e.preventDefault());

      thumb.addEventListener('dragstart', (e) => {
        // Cancel any FLIP residue left over from a prior reorder. The dragend
        // handler only cleans up the thumb that was dragged — every OTHER
        // thumb that moved still has `transition: transform 180ms ease` (and
        // sometimes a stale transform) inline. That residue creates a stacking
        // context and a live transition on a grid sibling, which can confuse
        // the browser's drag-source resolution on the next drag.
        for (const child of imgGrid.children) {
          child.style.transition = '';
          child.style.transform = '';
        }
        dragEl = thumb;
        e.dataTransfer.effectAllowed = 'move';
        // Use a custom MIME type — NOT text/plain — so textareas and inputs
        // can't accept this drop and insert the URL as text.
        try { e.dataTransfer.setData('application/x-img-reorder', '1'); } catch (_) {}
        // Use the opaque <img> as the drag preview so transparent padding
        // doesn't leak underlying page content into the dragged image.
        const imgEl = thumb.querySelector('img');
        if (imgEl) {
          const rect = imgEl.getBoundingClientRect();
          e.dataTransfer.setDragImage(
            imgEl,
            Math.max(0, e.clientX - rect.left),
            Math.max(0, e.clientY - rect.top),
          );
        }
        setTimeout(() => { thumb.style.opacity = '0.4'; }, 0);
      });
      thumb.addEventListener('dragend', () => {
        thumb.style.opacity = '1';
        thumb.style.transform = '';
        thumb.style.transition = '';
        dragEl = null;
        syncImagesFromDom();
      });
      thumb.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (!dragEl || dragEl === thumb) return;
        const rect = thumb.getBoundingClientRect();
        const isAfter = e.clientX > rect.left + rect.width / 2;
        const target = isAfter ? thumb.nextSibling : thumb;
        // No-op if already in position
        if (dragEl === target || dragEl.nextSibling === target) return;
        flipReorder(() => { imgGrid.insertBefore(dragEl, target); });
      });
      thumb.addEventListener('drop', (e) => { e.preventDefault(); });

      const img = document.createElement('img');
      img.src = url;
      img.alt = '';
      img.draggable = false;
      img.setAttribute('draggable', 'false');
      // pointer-events:none is the critical fix: it removes the <img> from
      // hit-testing entirely, so mousedown can NEVER land on the img element
      // — regardless of whether the image is mid-decode (large files like
      // khuans4.jpg / lareserve1.png trigger this) or whether WebKit's
      // drag-source resolution would have aborted on it. The mousedown lands
      // on the thumb wrapper directly, the thumb is draggable, and the
      // HTML5 drag always starts cleanly. setDragImage can still use this
      // <img> for the visual preview because that uses rendering, not events.
      img.style.cssText = 'width:88px;height:88px;object-fit:cover;border-radius:8px;display:block;-webkit-user-drag:none;user-drag:none;-webkit-user-select:none;user-select:none;pointer-events:none;';

      const delBtn = h('button', {
        type: 'button',
        title: 'Delete image',
        style: 'background:none;border:none;cursor:pointer;color:#c0392b;padding:4px 6px;display:flex;align-items:center;justify-content:center;-webkit-user-drag:none;user-drag:none;',
        onclick: () => {
          if (!confirm('Are you sure you want to delete this image?')) return;
          const idx = imageUrls.indexOf(url);
          if (idx >= 0) {
            imageUrls.splice(idx, 1);
            renderImageGrid();
          }
        },
      });
      delBtn.draggable = false;
      delBtn.setAttribute('draggable', 'false');
      delBtn.addEventListener('dragstart', (e) => { e.preventDefault(); });
      delBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="display:block;pointer-events:none;"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`;

      thumb.appendChild(img);
      thumb.appendChild(delBtn);
      imgGrid.appendChild(thumb);
    });
  }

  function renderPdfRow() {
    pdfRow.innerHTML = '';
    if (menuPdfUrl) {
      const name = menuPdfUrl.split('/').pop();
      pdfRow.appendChild(h('span', { style: 'font-size:13px;color:#555;margin-right:8px;' }, '📄 ' + name));
      pdfRow.appendChild(h('button', {
        type: 'button', class: 'btn ghost', style: 'padding:4px 10px;font-size:12px;',
        onclick: () => { menuPdfUrl = null; renderPdfRow(); },
      }, 'Remove'));
    } else {
      pdfRow.appendChild(h('span', { style: 'font-size:13px;color:#999;' }, 'No menu PDF uploaded'));
    }
  }

  const imgGrid = h('div', { style: 'display:flex;flex-wrap:wrap;gap:8px;margin-top:6px;min-height:20px;user-select:none;-webkit-user-select:none;' });
  const pdfRow = h('div', { style: 'display:flex;align-items:center;gap:8px;margin-top:6px;' });
  renderImageGrid();
  renderPdfRow();

  async function uploadFile(file) {
    const fd = new FormData();
    fd.append('file', file);
    const headers = {};
    if (state.token) headers.Authorization = 'Bearer ' + state.token;
    const res = await fetch(ADMIN + '/upload', { method: 'POST', headers, body: fd });
    if (!res.ok) {
      let msg = 'Upload failed';
      try { const j = await res.json(); if (j.error) msg = j.error; } catch {}
      throw new Error(msg);
    }
    return res.json();
  }

  // Hidden file inputs
  const imgInput = (() => {
    const el = document.createElement('input');
    el.type = 'file'; el.accept = 'image/*'; el.multiple = true; el.style.display = 'none';
    el.onchange = async () => {
      const files = Array.from(el.files);
      el.value = '';
      for (const file of files) {
        try {
          const data = await uploadFile(file);
          if (data.url) {
            imageUrls.push(data.url); // append to end
            renderImageGrid();
          }
        } catch (err) { toast(err.message || 'Upload failed', 'error'); }
      }
    };
    return el;
  })();

  const pdfInput = (() => {
    const el = document.createElement('input');
    el.type = 'file'; el.accept = 'application/pdf'; el.style.display = 'none';
    el.onchange = async () => {
      const file = el.files[0];
      el.value = '';
      if (!file) return;
      try {
        const data = await uploadFile(file);
        if (data.url) { menuPdfUrl = data.url; renderPdfRow(); }
      } catch (err) { toast(err.message || 'Upload failed', 'error'); }
    };
    return el;
  })();

  // Parse current categories
  const currentCats = (r?.categories || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  const cbRestaurant = (() => { const c = h('input', { type: 'checkbox', name: 'cat_restaurant' }); c.checked = currentCats.includes('restaurants'); return c; })();
  const cbBar = (() => { const c = h('input', { type: 'checkbox', name: 'cat_bar' }); c.checked = currentCats.includes('bars'); return c; })();

  const form = h('form', { onsubmit: async (e) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.target).entries());
    // Categories from checkboxes
    const cats = [];
    if (cbRestaurant.checked) cats.push('restaurants');
    if (cbBar.checked) cats.push('bars');
    fd.categories = cats.join(', ') || null;
    // Highlights
    const lines = (fd.highlights || '').split('\n').map(s => s.trim()).filter(Boolean);
    fd.highlights = lines.length ? JSON.stringify(lines) : null;
    // Images + PDF from reactive state
    fd.image_urls = imageUrls.length ? JSON.stringify(imageUrls) : null;
    fd.menu_pdf_url = menuPdfUrl || null;
    // Preserve slug from existing record (never touch it from the form)
    if (isEdit && r.slug) fd.slug = r.slug;
    try {
      if (isEdit) await api.updateRestaurant(r.id, fd);
      else await api.createRestaurant(fd);
      toast('Saved'); m.close(); setTab('content');
    } catch (err) { toast(err.message, 'error'); }
  } },
    h('div', { class: 'field' },
      h('label', { class: 'field-label' }, 'Name *'),
      h('input', { name: 'name', value: r?.name || '', required: true, placeholder: 'e.g. La Réserve' }),
    ),
    h('div', { class: 'field' },
      h('label', { class: 'field-label' }, 'Subtitle'),
      h('input', { name: 'specialty', value: r?.specialty || '', placeholder: 'e.g. Rooftop dining with sea views' }),
    ),
    h('div', { class: 'field' },
      h('label', { class: 'field-label' }, 'Category'),
      h('div', { style: 'display:flex;gap:20px;margin-top:6px;' },
        h('label', { style: 'display:flex;align-items:center;gap:6px;cursor:pointer;' }, cbRestaurant, 'Restaurant'),
        h('label', { style: 'display:flex;align-items:center;gap:6px;cursor:pointer;' }, cbBar, 'Bar'),
      ),
    ),
    h('div', { class: 'field-row' },
      h('div', { class: 'field' },
        h('label', { class: 'field-label' }, 'Location'),
        h('input', { name: 'address', value: r?.address || '', placeholder: 'e.g. Pool level, Building B' }),
      ),
      h('div', { class: 'field' },
        h('label', { class: 'field-label' }, 'Hours'),
        h('input', { name: 'hours', value: r?.hours || '', placeholder: 'e.g. 12:00 – 23:00' }),
      ),
    ),
    h('div', { class: 'field' },
      h('label', { class: 'field-label' }, 'Phone'),
      h('input', { name: 'phone', value: r?.phone || '', placeholder: 'e.g. +961 9 636 000' }),
    ),
    h('div', { class: 'field' },
      h('label', { class: 'field-label' }, 'Description'),
      h('textarea', { name: 'description', rows: 3 }, r?.description || ''),
    ),
    h('div', { class: 'field' },
      h('label', { class: 'field-label' }, 'Highlights (one per line)'),
      h('textarea', { name: 'highlights', rows: 3, placeholder: 'Sunday brunch · 1 PM – 6 PM\nBuffet for $35/adult' }, initialHighlights),
    ),
    h('div', { class: 'field' },
      h('label', { class: 'field-label' }, 'Images'),
      imgGrid,
      imgInput,
      h('button', {
        type: 'button', class: 'btn ghost', style: 'margin-top:8px;',
        onclick: () => imgInput.click(),
      }, '+ Add image'),
    ),
    h('div', { class: 'field' },
      h('label', { class: 'field-label' }, 'Menu (PDF)'),
      pdfRow,
      pdfInput,
      h('button', {
        type: 'button', class: 'btn ghost', style: 'margin-top:8px;',
        onclick: () => pdfInput.click(),
      }, menuPdfUrl ? 'Replace PDF' : 'Upload PDF'),
    ),
    h('div', { class: 'modal-actions' },
      h('button', { type: 'button', class: 'btn ghost', onclick: () => m.close() }, 'Cancel'),
      h('button', { type: 'submit', class: 'btn primary' }, isEdit ? 'Save' : 'Create'),
    ),
  );

  // Safety net: while reordering images, cancel any drop that lands outside
  // the image grid (e.g. on a textarea or input). Without this, the browser's
  // default would let the URL be inserted into focused text fields.
  form.addEventListener('dragover', (e) => {
    const types = e.dataTransfer && e.dataTransfer.types;
    if (!types || !Array.from(types).includes('application/x-img-reorder')) return;
    if (!imgGrid.contains(e.target)) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'none';
    }
  });
  form.addEventListener('drop', (e) => {
    const types = e.dataTransfer && e.dataTransfer.types;
    if (!types || !Array.from(types).includes('application/x-img-reorder')) return;
    if (!imgGrid.contains(e.target)) {
      e.preventDefault();
      e.stopPropagation();
    }
  });

  const m = openModal(h('div', {}, h('h3', {}, isEdit ? 'Edit restaurant' : 'New restaurant'), form), { large: true });
}

// --- Menu items (per restaurant)
async function renderMenuItems(body) {
  $('#page-actions').innerHTML = '';
  const restaurants = await api.restaurants();
  state.restaurants = restaurants;
  if (!restaurants.length) { body.appendChild(h('div', { class: 'card' }, h('div', { class: 'empty' }, 'Create a restaurant first.'))); return; }

  if (!state._selectedRestaurantId) state._selectedRestaurantId = restaurants[0].id;
  const sel = h('select', {
    onchange: (e) => { state._selectedRestaurantId = Number(e.target.value); setTab('content'); },
    style: 'max-width: 280px;',
  });
  for (const r of restaurants) {
    const o = h('option', { value: r.id }, r.name);
    if (r.id === state._selectedRestaurantId) o.selected = true;
    sel.appendChild(o);
  }
  $('#page-actions').appendChild(sel);
  $('#page-actions').appendChild(h('button', {
    class: 'btn primary',
    onclick: () => openMenuItemModal(null, state._selectedRestaurantId),
  }, '+ New item'));

  const items = await api.menuItems(state._selectedRestaurantId);
  state.menuItems = items;

  if (!items.length) {
    body.appendChild(h('div', { class: 'card' }, h('div', { class: 'empty' }, 'No menu items for this restaurant.')));
    return;
  }
  const t = h('table', { class: 'table' });
  t.append(h('thead', {}, h('tr', {},
    h('th', {}, 'Name'), h('th', {}, 'Category'), h('th', {}, 'Price'),
    h('th', {}, 'Plat du jour'), h('th', {}, 'Available'),
    h('th', { class: 'right' }, ''),
  )));
  const tb = h('tbody');
  for (const m of items) {
    tb.append(h('tr', { style: 'cursor: pointer;', onclick: () => openMenuItemModal(m, state._selectedRestaurantId) },
      h('td', {}, h('div', { style: 'font-weight: 600;' }, m.name), h('div', { class: 'muted-text' }, m.description || '')),
      h('td', {}, m.category || '—'),
      h('td', { class: 'num' }, '$' + (m.price || 0).toFixed(2)),
      h('td', {}, m.plat_du_jour ? 'Yes' : '—'),
      h('td', {}, m.available ? 'Yes' : 'No'),
      h('td', { class: 'right' },
        h('button', { class: 'icon-btn danger', onclick: async (e) => {
          e.stopPropagation();
          if (!confirm(`Delete ${m.name}?`)) return;
          try { await api.deleteMenuItem(m.id); toast('Deleted'); setTab('content'); } catch (e) { toast(e.message, 'error'); }
        } }, 'Delete'),
      ),
    ));
  }
  t.appendChild(tb);
  body.appendChild(h('div', { class: 'card', style: 'padding: 0; overflow: hidden;' }, t));
}

function openMenuItemModal(item, restaurantId) {
  const isEdit = !!item;
  const form = h('form', { onsubmit: async (e) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.target).entries());
    fd.price = Number(fd.price);
    fd.plat_du_jour = e.target.plat_du_jour.checked ? 1 : 0;
    fd.available = e.target.available.checked ? 1 : 0;
    fd.restaurant_id = restaurantId;
    try {
      if (isEdit) await api.updateMenuItem(item.id, fd);
      else await api.createMenuItem(fd);
      toast('Saved'); m.close(); setTab('content');
    } catch (err) { toast(err.message, 'error'); }
  } },
    h('div', { class: 'field' }, h('label', { class: 'field-label' }, 'Name'), h('input', { name: 'name', value: item?.name || '', required: true })),
    h('div', { class: 'field-row' },
      h('div', { class: 'field' }, h('label', { class: 'field-label' }, 'Category'), h('input', { name: 'category', value: item?.category || '' })),
      h('div', { class: 'field' }, h('label', { class: 'field-label' }, 'Price'), h('input', { type: 'number', step: '0.01', name: 'price', value: item?.price || '0', required: true })),
    ),
    h('div', { class: 'field' }, h('label', { class: 'field-label' }, 'Description'), h('textarea', { name: 'description' }, item?.description || '')),
    h('div', { class: 'field row-flex' },
      h('label', { class: 'checkbox-row' },
        (() => { const c = h('input', { type: 'checkbox', name: 'plat_du_jour' }); c.checked = !!item?.plat_du_jour; return c; })(),
        'Plat du jour',
      ),
      h('label', { class: 'checkbox-row' },
        (() => { const c = h('input', { type: 'checkbox', name: 'available' }); c.checked = item ? !!item.available : true; return c; })(),
        'Available',
      ),
    ),
    h('div', { class: 'modal-actions' },
      h('button', { type: 'button', class: 'btn ghost', onclick: () => m.close() }, 'Cancel'),
      h('button', { type: 'submit', class: 'btn primary' }, isEdit ? 'Save' : 'Create'),
    ),
  );
  const m = openModal(h('div', {}, h('h3', {}, isEdit ? 'Edit menu item' : 'New menu item'), form));
}

// --- Facilities
async function renderFacilities(body) {
  $('#page-actions').innerHTML = '';
  $('#page-actions').appendChild(h('button', { class: 'btn primary', onclick: () => openFacilityModal() }, '+ New facility'));
  const list = await api.facilities();
  state.facilities = list;
  if (!list.length) { body.appendChild(h('div', { class: 'card' }, h('div', { class: 'empty' }, 'No facilities yet.'))); return; }

  // Nursery is edited from inside the Kids Club page (mirrors the Pools /
  // Indoor Pool flow), so it doesn't get its own row in this table.
  const visibleList = list.filter(f => f.key !== 'nursery');

  const t = h('table', { class: 'table' });
  t.append(h('thead', {}, h('tr', {},
    h('th', {}, 'Name'), h('th', {}, 'Hours'),
    h('th', {}, 'Location'), h('th', {}, 'Phone'),
  )));
  const tb = h('tbody');
  for (const f of visibleList) {
    tb.append(h('tr', { style: 'cursor: pointer;', onclick: () => openFacilityModal(f) },
      h('td', {}, h('div', { style: 'font-weight: 600;' }, f.name)),
      h('td', {}, f.hours || '—'),
      h('td', {}, f.location || '—'),
      h('td', {}, f.phone || '—'),
    ));
  }
  t.appendChild(tb);
  body.appendChild(h('div', { class: 'card', style: 'padding: 0; overflow: hidden;' }, t));
}

// Self-contained image manager: thumbnails with drag-to-reorder (live FLIP
// reorder), click-to-preview lightbox, per-image delete (with confirm), and
// an "Add image" button that uploads to /admin-api/upload.
//
// Returns:
//   block:    the entire field block (label + grid + add button) ready to
//             append to a form.
//   grid:     the inner grid element — used by the form to attach a drop
//             guard so the URL can't be dropped into adjacent text fields.
//   getUrls:  () => string[]  the current ordered list of image URLs.
function createImageManager(initialUrls = [], label = 'Images') {
  const imageUrls = [...initialUrls];
  let dragEl = null;

  function openImagePreview(src) {
    const overlay = h('div', {
      style: 'position:fixed;inset:0;background:rgba(0,0,0,0.88);z-index:9999;display:flex;align-items:center;justify-content:center;cursor:zoom-out;',
      onclick: () => overlay.remove(),
    });
    const img = document.createElement('img');
    img.src = src;
    img.style.cssText = 'max-width:88vw;max-height:88vh;border-radius:12px;object-fit:contain;box-shadow:0 8px 40px rgba(0,0,0,0.6);';
    overlay.appendChild(img);
    document.body.appendChild(overlay);
  }

  function syncFromDom() {
    imageUrls.splice(0, imageUrls.length,
      ...Array.from(grid.children).map(c => c._url).filter(Boolean));
  }

  function flipReorder(perform) {
    const items = Array.from(grid.children);
    const before = items.map(el => el.getBoundingClientRect());
    perform();
    items.forEach((el, i) => {
      if (el === dragEl) return;
      const dx = before[i].left - el.getBoundingClientRect().left;
      const dy = before[i].top - el.getBoundingClientRect().top;
      if (dx === 0 && dy === 0) return;
      el.style.transition = 'none';
      el.style.transform = `translate(${dx}px, ${dy}px)`;
      requestAnimationFrame(() => {
        el.style.transition = 'transform 180ms ease';
        el.style.transform = '';
        const onEnd = (ev) => {
          if (ev.propertyName && ev.propertyName !== 'transform') return;
          el.style.transition = '';
          el.removeEventListener('transitionend', onEnd);
        };
        el.addEventListener('transitionend', onEnd);
      });
    });
  }

  async function uploadFile(file) {
    const fd = new FormData();
    fd.append('file', file);
    const headers = {};
    if (state.token) headers.Authorization = 'Bearer ' + state.token;
    const res = await fetch(ADMIN + '/upload', { method: 'POST', headers, body: fd });
    if (!res.ok) {
      let msg = 'Upload failed';
      try { const j = await res.json(); if (j.error) msg = j.error; } catch (_) {}
      throw new Error(msg);
    }
    return res.json();
  }

  function render() {
    grid.innerHTML = '';
    imageUrls.forEach((url) => {
      const thumb = document.createElement('div');
      thumb.draggable = true;
      thumb._url = url;
      thumb.title = 'Click to preview · drag to reorder';
      thumb.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:6px;padding:4px;border-radius:10px;cursor:grab;background:transparent;user-select:none;-webkit-user-select:none;-webkit-user-drag:element;';

      thumb.addEventListener('click', (e) => {
        if (e.target.closest && e.target.closest('button')) return;
        openImagePreview(url);
      });
      thumb.addEventListener('mousedown', () => {
        const active = document.activeElement;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) active.blur();
        const sel = window.getSelection && window.getSelection();
        if (sel && !sel.isCollapsed) sel.removeAllRanges();
      });
      thumb.addEventListener('selectstart', (e) => e.preventDefault());

      thumb.addEventListener('dragstart', (e) => {
        for (const child of grid.children) {
          child.style.transition = '';
          child.style.transform = '';
        }
        dragEl = thumb;
        e.dataTransfer.effectAllowed = 'move';
        try { e.dataTransfer.setData('application/x-img-reorder', '1'); } catch (_) {}
        const imgEl = thumb.querySelector('img');
        if (imgEl) {
          const r = imgEl.getBoundingClientRect();
          e.dataTransfer.setDragImage(imgEl, Math.max(0, e.clientX - r.left), Math.max(0, e.clientY - r.top));
        }
        setTimeout(() => { thumb.style.opacity = '0.4'; }, 0);
      });
      thumb.addEventListener('dragend', () => {
        thumb.style.opacity = '1';
        thumb.style.transform = '';
        thumb.style.transition = '';
        dragEl = null;
        syncFromDom();
      });
      thumb.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (!dragEl || dragEl === thumb) return;
        const r = thumb.getBoundingClientRect();
        const isAfter = e.clientX > r.left + r.width / 2;
        const target = isAfter ? thumb.nextSibling : thumb;
        if (dragEl === target || dragEl.nextSibling === target) return;
        flipReorder(() => { grid.insertBefore(dragEl, target); });
      });
      thumb.addEventListener('drop', (e) => { e.preventDefault(); });

      const img = document.createElement('img');
      img.src = url;
      img.alt = '';
      img.draggable = false;
      img.setAttribute('draggable', 'false');
      img.style.cssText = 'width:88px;height:88px;object-fit:cover;border-radius:8px;display:block;-webkit-user-drag:none;user-drag:none;-webkit-user-select:none;user-select:none;pointer-events:none;';

      const delBtn = h('button', {
        type: 'button',
        title: 'Delete image',
        style: 'background:none;border:none;cursor:pointer;color:#c0392b;padding:4px 6px;display:flex;align-items:center;justify-content:center;-webkit-user-drag:none;user-drag:none;',
        onclick: () => {
          if (!confirm('Are you sure you want to delete this image?')) return;
          const idx = imageUrls.indexOf(url);
          if (idx >= 0) { imageUrls.splice(idx, 1); render(); }
        },
      });
      delBtn.draggable = false;
      delBtn.setAttribute('draggable', 'false');
      delBtn.addEventListener('dragstart', (e) => { e.preventDefault(); });
      delBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="display:block;pointer-events:none;"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`;

      thumb.appendChild(img);
      thumb.appendChild(delBtn);
      grid.appendChild(thumb);
    });
  }

  const grid = h('div', { style: 'display:flex;flex-wrap:wrap;gap:8px;margin-top:6px;min-height:20px;user-select:none;-webkit-user-select:none;' });

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.multiple = true;
  fileInput.style.display = 'none';
  fileInput.onchange = async () => {
    const files = Array.from(fileInput.files);
    fileInput.value = '';
    for (const file of files) {
      try {
        const data = await uploadFile(file);
        if (data.url) { imageUrls.push(data.url); render(); }
      } catch (err) { toast(err.message || 'Upload failed', 'error'); }
    }
  };

  const addBtn = h('button', {
    type: 'button', class: 'btn ghost', style: 'margin-top:8px;',
    onclick: () => fileInput.click(),
  }, '+ Add image');

  render();

  const block = h('div', { class: 'field' },
    h('label', { class: 'field-label' }, label),
    grid,
    fileInput,
    addBtn,
  );

  return { block, grid, getUrls: () => imageUrls.slice() };
}

// Per-facility config — fields actually shown on each facility's screen +
// the URL fields and child-items sections that apply.
//
// `items` describes the sub-list (coaches / sports / services / plans) and
// which sub-fields are editable per row.
const FACILITY_FIELDS = {
  salon_antoinette: {
    phone: true, hours: false, location: false, price: false, extra_info: false,
    instagram: true,
    items: { kind: 'service', label: 'Service categories', addLabel: '+ Add service',
      fields: { subtitle: 'Price (e.g. from $30)', image: true, sub_items: 'Items in this category (one per line)' } },
  },
  le_rodin_spa: {
    phone: true, hours: false, location: false, price: false, extra_info: false,
    instagram: true,
    items: { kind: 'service', label: 'Services', addLabel: '+ Add service',
      fields: { subtitle: 'Price (e.g. from $60)', image: true } },
  },
  searenity_club: {
    phone: true, hours: false, location: false, price: false, extra_info: false,
    instagram: true,
    items: { kind: 'service', label: 'Classes & memberships', addLabel: '+ Add item',
      fields: { image: true } },
  },
  rove_pilates: {
    phone: true, hours: false, location: false, price: false, extra_info: false,
    instagram: true, whatsapp: true, app_store: true,
    items: { kind: 'plan', label: 'Services & Rates', addLabel: '+ Add service',
      fields: { subtitle: 'Price (e.g. $20)' } },
  },
  tennis: {
    phone: false, hours: false, location: true, price: false, extra_info: false,
    coach_section: true,
    items: { kind: 'coach', label: 'Need a coach? · Coaches', addLabel: '+ Add coach',
      fields: { subtitle: 'Background / certification', description: 'Availability (e.g. Mon · Wed · Fri)', phone: true, image: true } },
  },
  water_sports: {
    phone: true, hours: false, location: false, price: false, extra_info: false,
    items: { kind: 'sport', label: 'Sports & rates', addLabel: '+ Add sport',
      fields: { subtitle: 'Price (e.g. $50 / 15 min)', image: true } },
  },
  kids_club: {
    phone: true, hours: true, location: true, price: false, extra_info: false,
  },
  nursery: {
    phone: true, hours: true, location: true, price: false, extra_info: true,
  },
  kaslik_gun_club: {
    phone: true, hours: true, location: true, price: false, extra_info: true,
  },
  pools: {
    phone: false, hours: true, location: false, price: false, extra_info: true,
    indoor_pool: true,
    items: { kind: 'pool', label: 'Outdoor pools', addLabel: '+ Add pool',
      fields: { subtitle: 'Subtitle (e.g. No pool floats allowed)', image: true, description: 'Map pin id (e.g. olympic-pool)' } },
  },
};
const FACILITY_FIELDS_DEFAULT = { phone: true, hours: true, location: true, price: true, extra_info: true };

// Upload a single file (image) via the admin upload endpoint and return the
// stored URL. Used by per-item single-image inputs (coach photos, sport
// images, etc).
async function uploadSingleFile(file) {
  const fd = new FormData();
  fd.append('file', file);
  const headers = {};
  if (state.token) headers.Authorization = 'Bearer ' + state.token;
  const res = await fetch(ADMIN + '/upload', { method: 'POST', headers, body: fd });
  if (!res.ok) {
    let msg = 'Upload failed';
    try { const j = await res.json(); if (j.error) msg = j.error; } catch (_) {}
    throw new Error(msg);
  }
  return res.json();
}

// One-image picker — used for per-item images (coach photos, sport tiles,
// service tiles). Returns { block, getUrl, setUrl }.
function createSingleImagePicker(initialUrl) {
  let url = initialUrl || null;
  const preview = h('div', { style: 'width:64px;height:64px;border-radius:8px;background:var(--bg);border:1px solid var(--border);overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:11px;' });

  function render() {
    preview.innerHTML = '';
    if (url) {
      const img = document.createElement('img');
      img.src = url;
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
      preview.appendChild(img);
    } else {
      preview.appendChild(document.createTextNode('No image'));
    }
  }
  render();

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.style.display = 'none';
  fileInput.onchange = async () => {
    const file = fileInput.files[0];
    fileInput.value = '';
    if (!file) return;
    try {
      const data = await uploadSingleFile(file);
      if (data.url) { url = data.url; render(); }
    } catch (err) { toast(err.message || 'Upload failed', 'error'); }
  };

  const uploadBtn = h('button', { type: 'button', class: 'btn ghost sm', style: 'padding:5px 12px;font-size:12px;', onclick: () => fileInput.click() }, url ? 'Replace' : 'Upload');
  const clearBtn = h('button', { type: 'button', class: 'btn ghost sm', style: 'padding:5px 12px;font-size:12px;color:#c0392b;',
    onclick: () => { url = null; render(); } }, 'Remove');

  const block = h('div', { style: 'display:flex;align-items:center;gap:10px;' }, preview, uploadBtn, clearBtn, fileInput);
  return { block, getUrl: () => url };
}

// Sub-list manager (coaches / sports / services / plans). Each row is
// editable; new rows can be added, existing ones removed. Persists via the
// facility-items / service-items endpoints.
function createItemListManager({ entity, ownerId, items, kind, label, addLabel, fields }) {
  // entity = 'facility' or 'service'
  const apiBase = entity === 'facility' ? {
    create: api.createFacilityItem, update: api.updateFacilityItem, delete: api.deleteFacilityItem,
    ownerKey: 'facility_id',
  } : {
    create: api.createServiceItem, update: api.updateServiceItem, delete: api.deleteServiceItem,
    ownerKey: 'service_id',
  };

  const list = [...(items || [])];

  const container = h('div', { style: 'margin-top:6px;' });

  function render() {
    container.innerHTML = '';
    if (!list.length) {
      container.appendChild(h('div', { class: 'muted-text', style: 'font-size:13px;padding:8px 0;' }, 'None yet.'));
    } else {
      const card = h('div', { class: 'card', style: 'padding:0;overflow:hidden;' });
      list.forEach((it, i) => {
        card.appendChild(h('div', {
          style: `display:flex;align-items:center;gap:12px;padding:10px 14px;cursor:pointer;${i > 0 ? 'border-top:1px solid var(--border);' : ''}`,
          onclick: () => openItemEditor(it),
        },
          (() => {
            if (!fields.image) return null;
            const ph = h('div', { style: 'width:48px;height:48px;border-radius:8px;background:var(--bg);flex-shrink:0;' });
            if (it.image_url) {
              const img = document.createElement('img');
              img.src = it.image_url;
              img.style.cssText = 'width:48px;height:48px;object-fit:cover;border-radius:8px;display:block;flex-shrink:0;';
              return img;
            }
            return ph;
          })(),
          (() => {
            // For service_items the secondary field is `extra` instead of `description`
            const secondary = entity === 'service' ? it.extra : it.description;
            return h('div', { style: 'flex:1;min-width:0;' },
              h('div', { style: 'font-weight:600;font-size:14px;' }, it.name),
              it.subtitle ? h('div', { class: 'muted-text', style: 'font-size:12px;margin-top:2px;' }, it.subtitle) : null,
              secondary ? h('div', { class: 'muted-text', style: 'font-size:12px;margin-top:2px;' }, secondary) : null,
              it.phone ? h('div', { class: 'muted-text', style: 'font-size:12px;margin-top:2px;' }, '📞 ' + it.phone) : null,
              it.sub_items ? h('div', { class: 'muted-text', style: 'font-size:11px;margin-top:2px;' },
                (() => { try { return JSON.parse(it.sub_items).join(' · '); } catch { return ''; } })(),
              ) : null,
            );
          })(),
          h('button', {
            type: 'button', class: 'icon-btn danger', style: 'font-size:12px;padding:4px 10px;',
            onclick: async (e) => {
              e.stopPropagation();
              if (!confirm(`Remove "${it.name}"?`)) return;
              try {
                if (it.id) await apiBase.delete(it.id);
                const idx = list.indexOf(it);
                if (idx >= 0) list.splice(idx, 1);
                render();
                toast('Removed');
              } catch (err) { toast(err.message, 'error'); }
            },
          }, 'Delete'),
        ));
      });
      container.appendChild(card);
    }
    container.appendChild(h('div', { style: 'margin-top:8px;' },
      h('button', { type: 'button', class: 'btn ghost sm',
        onclick: () => openItemEditor(null) }, addLabel),
    ));
  }

  function openItemEditor(existing) {
    const isExisting = !!existing;
    const imgPicker = fields.image ? createSingleImagePicker(existing?.image_url || null) : null;

    const form = h('form', { onsubmit: async (e) => {
      e.preventDefault();
      const fd = Object.fromEntries(new FormData(e.target).entries());
      let payload;
      if (entity === 'service') {
        // service_items columns: name, subtitle, image_url, extra
        payload = {
          kind,
          name: fd.name || '',
          subtitle: fields.subtitle ? (fd.subtitle || null) : null,
          image_url: imgPicker ? imgPicker.getUrl() : null,
          extra: fields.description ? (fd.description || null) : null,
        };
      } else {
        payload = {
          kind,
          name: fd.name || '',
          subtitle: fields.subtitle ? (fd.subtitle || null) : null,
          description: fields.description ? (fd.description || null) : null,
          phone: fields.phone ? (fd.phone || null) : null,
          image_url: imgPicker ? imgPicker.getUrl() : null,
          sub_items: fields.sub_items
            ? (() => {
                const lines = (fd.sub_items || '').split('\n').map(s => s.trim()).filter(Boolean);
                return lines.length ? JSON.stringify(lines) : null;
              })()
            : null,
        };
      }
      if (!payload.name) { toast('Name is required', 'error'); return; }
      try {
        if (isExisting) {
          await apiBase.update(existing.id, payload);
          Object.assign(existing, payload);
        } else {
          const r = await apiBase.create({ [apiBase.ownerKey]: ownerId, ...payload });
          list.push({ id: r.id, ...payload });
        }
        toast('Saved');
        render();
        m.close();
      } catch (err) { toast(err.message, 'error'); }
    } },
      h('div', { class: 'field' },
        h('label', { class: 'field-label' }, 'Name *'),
        h('input', { name: 'name', value: existing?.name || '', required: true }),
      ),
      fields.subtitle ? h('div', { class: 'field' },
        h('label', { class: 'field-label' }, typeof fields.subtitle === 'string' ? fields.subtitle : 'Subtitle'),
        h('input', { name: 'subtitle', value: existing?.subtitle || '' }),
      ) : null,
      fields.description ? h('div', { class: 'field' },
        h('label', { class: 'field-label' }, typeof fields.description === 'string' ? fields.description : 'Description'),
        h('input', { name: 'description', value: (entity === 'service' ? existing?.extra : existing?.description) || '' }),
      ) : null,
      fields.phone ? h('div', { class: 'field' },
        h('label', { class: 'field-label' }, 'Phone'),
        h('input', { name: 'phone', value: existing?.phone || '' }),
      ) : null,
      fields.sub_items ? h('div', { class: 'field' },
        h('label', { class: 'field-label' }, typeof fields.sub_items === 'string' ? fields.sub_items : 'Sub-items (one per line)'),
        h('textarea', { name: 'sub_items', rows: 5 },
          existing?.sub_items
            ? (() => { try { return JSON.parse(existing.sub_items).join('\n'); } catch { return ''; } })()
            : '',
        ),
      ) : null,
      imgPicker ? h('div', { class: 'field' },
        h('label', { class: 'field-label' }, 'Image'),
        imgPicker.block,
      ) : null,
      h('div', { class: 'modal-actions' },
        h('button', { type: 'button', class: 'btn ghost', onclick: () => m.close() }, 'Cancel'),
        h('button', { type: 'submit', class: 'btn primary' }, isExisting ? 'Save' : 'Add'),
      ),
    );
    const m = openModal(h('div', {}, h('h3', {}, (isExisting ? 'Edit' : 'Add') + ' · ' + label), form));
  }

  render();

  return {
    block: h('div', { style: 'margin-top:18px;' },
      h('div', { style: 'font-size:13px;font-weight:700;letter-spacing:0.8px;color:var(--accent);text-transform:uppercase;margin-bottom:6px;' }, label),
      container,
    ),
  };
}

async function openFacilityModal(f) {
  const isEdit = !!f;

  // Parse existing image_urls (and old single image_url as fallback)
  let initialImages = [];
  if (f?.image_urls) {
    try { initialImages = JSON.parse(f.image_urls); } catch (_) { initialImages = []; }
  }
  if (!initialImages.length && f?.image_url && !f.image_url.startsWith('placeholder:')) {
    initialImages = [f.image_url];
  }

  const imageManager = createImageManager(initialImages);

  // If this is Kids Club, also load the Nursery facility so we can edit it
  // inline (mirrors the Pools / Indoor Pool flow — related sub-page edited
  // from the parent facility).
  let nursery = null;
  let nurseryImageManager = null;
  if (f?.key === 'kids_club') {
    try {
      const allFacilities = await api.facilities();
      nursery = allFacilities.find(x => x.key === 'nursery') || null;
    } catch (_) { /* keep nursery null; admin sees the section as empty */ }
    let nImgs = [];
    if (nursery?.image_urls) {
      try { nImgs = JSON.parse(nursery.image_urls); } catch (_) {}
    }
    nurseryImageManager = createImageManager(nImgs, 'Nursery images');
  }

  // Field config — show only the fields the client actually sees for this facility
  const cfg = (f?.key && FACILITY_FIELDS[f.key]) || FACILITY_FIELDS_DEFAULT;

  const pair = (a, b) => {
    if (cfg[a.key] && cfg[b.key]) return h('div', { class: 'field-row' }, a.el, b.el);
    if (cfg[a.key]) return a.el;
    if (cfg[b.key]) return b.el;
    return null;
  };

  const phoneField = { key: 'phone', el: h('div', { class: 'field' },
    h('label', { class: 'field-label' }, 'Phone'),
    h('input', { name: 'phone', value: f?.phone || '', placeholder: 'e.g. +961 9 640 666' }),
  )};
  const hoursField = { key: 'hours', el: h('div', { class: 'field' },
    h('label', { class: 'field-label' }, 'Hours'),
    h('input', { name: 'hours', value: f?.hours || '', placeholder: 'e.g. Daily 8:00 AM – 7:00 PM' }),
  )};
  const locationField = { key: 'location', el: h('div', { class: 'field' },
    h('label', { class: 'field-label' }, 'Location'),
    h('input', { name: 'location', value: f?.location || '', placeholder: 'e.g. Sports area, east side' }),
  )};
  const priceField = { key: 'price', el: h('div', { class: 'field' },
    h('label', { class: 'field-label' }, 'Price'),
    h('input', { name: 'price', value: f?.price || '', placeholder: 'e.g. Free for guests · $15 per hour' }),
  )};
  const extraField = cfg.extra_info ? h('div', { class: 'field' },
    h('label', { class: 'field-label' }, 'Extra info (shown as "Information")'),
    h('input', { name: 'extra_info', value: f?.extra_info || '', placeholder: 'e.g. Briefing included · Children must be supervised.' }),
  ) : null;

  const urlPair = [];
  if (cfg.instagram) urlPair.push(h('div', { class: 'field' },
    h('label', { class: 'field-label' }, 'Instagram URL'),
    h('input', { name: 'instagram_url', value: f?.instagram_url || '', placeholder: 'https://www.instagram.com/...' }),
  ));
  if (cfg.whatsapp) urlPair.push(h('div', { class: 'field' },
    h('label', { class: 'field-label' }, 'WhatsApp URL'),
    h('input', { name: 'whatsapp_url', value: f?.whatsapp_url || '', placeholder: 'https://api.whatsapp.com/send/?phone=...' }),
  ));
  if (cfg.app_store) urlPair.push(h('div', { class: 'field' },
    h('label', { class: 'field-label' }, 'App Store URL'),
    h('input', { name: 'app_store_url', value: f?.app_store_url || '', placeholder: 'https://apps.apple.com/...' }),
  ));
  const urlSection = urlPair.length ? h('div', { class: 'field-row', style: 'flex-wrap:wrap;' }, ...urlPair) : null;

  // "Need a coach?" section editor (Tennis only) — covers the hint line
  // (with the session price) and the info-note below it.
  const coachSection = cfg.coach_section ? h('div', { style: 'margin-top:18px;border-top:1px solid var(--border);padding-top:18px;' },
    h('div', { style: 'font-size:13px;font-weight:700;letter-spacing:0.8px;color:var(--accent);text-transform:uppercase;margin-bottom:10px;' }, '"Need a coach?" section'),
    h('div', { class: 'field' },
      h('label', { class: 'field-label' }, 'Section hint (includes the session price)'),
      h('input', { name: 'coach_hint', value: f?.coach_hint || '', placeholder: 'e.g. Book a session with one of our coaches · $15 per session, court included' }),
    ),
    h('div', { class: 'field' },
      h('label', { class: 'field-label' }, 'Info note (shown above the coach cards)'),
      h('textarea', { name: 'warning_message', rows: 2 }, f?.warning_message || ''),
    ),
  ) : null;

  // Indoor pool section (only for the Pools facility)
  let indoorPoolImagePicker = null;
  let indoorPoolBlock = null;
  if (cfg.indoor_pool) {
    indoorPoolImagePicker = createSingleImagePicker(f?.indoor_pool_image_url || null);
    indoorPoolBlock = h('div', { style: 'margin-top:18px;border-top:1px solid var(--border);padding-top:18px;' },
      h('div', { style: 'font-size:13px;font-weight:700;letter-spacing:0.8px;color:var(--accent);text-transform:uppercase;margin-bottom:10px;' }, 'Indoor pool'),
      h('div', { class: 'field-row' },
        h('div', { class: 'field' },
          h('label', { class: 'field-label' }, 'Indoor pool title'),
          h('input', { name: 'indoor_pool_name', value: f?.indoor_pool_name || '', placeholder: 'e.g. Indoor Pool' }),
        ),
        h('div', { class: 'field' },
          h('label', { class: 'field-label' }, 'Subtitle'),
          h('input', { name: 'indoor_pool_subtitle', value: f?.indoor_pool_subtitle || '', placeholder: 'e.g. At SEArenity Club · Swimming cap is mandatory' }),
        ),
      ),
      h('div', { class: 'field' },
        h('label', { class: 'field-label' }, 'Indoor pool image'),
        indoorPoolImagePicker.block,
      ),
    );
  }

  // Nursery sub-section (Kids Club only) — full inline editor for the
  // Nursery facility, since it appears as the "For younger ones" card on
  // the Kids Club page in the client app.
  let nurseryBlock = null;
  if (f?.key === 'kids_club' && nursery) {
    nurseryBlock = h('div', { style: 'margin-top:18px;border-top:1px solid var(--border);padding-top:18px;' },
      h('div', { style: 'font-size:13px;font-weight:700;letter-spacing:0.8px;color:var(--accent);text-transform:uppercase;margin-bottom:10px;' }, 'Nursery (shown as "For younger ones")'),
      h('div', { class: 'field' },
        h('label', { class: 'field-label' }, 'Name'),
        h('input', { name: 'nursery_name', value: nursery.name || '', placeholder: 'e.g. Nursery' }),
      ),
      h('div', { class: 'field' },
        h('label', { class: 'field-label' }, 'Description'),
        h('textarea', { name: 'nursery_description', rows: 3 }, nursery.description || ''),
      ),
      h('div', { class: 'field-row' },
        h('div', { class: 'field' },
          h('label', { class: 'field-label' }, 'Phone'),
          h('input', { name: 'nursery_phone', value: nursery.phone || '' }),
        ),
        h('div', { class: 'field' },
          h('label', { class: 'field-label' }, 'Hours'),
          h('input', { name: 'nursery_hours', value: nursery.hours || '' }),
        ),
      ),
      h('div', { class: 'field-row' },
        h('div', { class: 'field' },
          h('label', { class: 'field-label' }, 'Location'),
          h('input', { name: 'nursery_location', value: nursery.location || '' }),
        ),
        h('div', { class: 'field' },
          h('label', { class: 'field-label' }, 'Age range'),
          h('input', { name: 'nursery_extra_info', value: nursery.extra_info || '', placeholder: 'e.g. Babies & children under 6' }),
        ),
      ),
      nurseryImageManager.block,
    );
  }

  // Items section (coaches, sports, services, plans)
  const itemsManager = (cfg.items && isEdit)
    ? createItemListManager({
        entity: 'facility',
        ownerId: f.id,
        items: f.items || [],
        kind: cfg.items.kind,
        label: cfg.items.label,
        addLabel: cfg.items.addLabel,
        fields: cfg.items.fields,
      })
    : null;

  // Hidden inputs ensure removed fields get cleared on save
  const hidden = ['phone', 'hours', 'location', 'price', 'extra_info']
    .filter(k => !cfg[k])
    .map(k => h('input', { type: 'hidden', name: k, value: '' }));
  if (!cfg.instagram) hidden.push(h('input', { type: 'hidden', name: 'instagram_url', value: '' }));
  if (!cfg.whatsapp) hidden.push(h('input', { type: 'hidden', name: 'whatsapp_url', value: '' }));
  if (!cfg.app_store) hidden.push(h('input', { type: 'hidden', name: 'app_store_url', value: '' }));
  if (!cfg.coach_section) {
    hidden.push(h('input', { type: 'hidden', name: 'warning_message', value: '' }));
    hidden.push(h('input', { type: 'hidden', name: 'coach_hint', value: '' }));
  }
  if (!cfg.indoor_pool) {
    hidden.push(h('input', { type: 'hidden', name: 'indoor_pool_name', value: '' }));
    hidden.push(h('input', { type: 'hidden', name: 'indoor_pool_subtitle', value: '' }));
  }

  const form = h('form', { onsubmit: async (e) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.target).entries());
    for (const k of ['phone', 'hours', 'location', 'price', 'extra_info', 'description', 'instagram_url', 'whatsapp_url', 'app_store_url', 'warning_message', 'coach_hint', 'indoor_pool_name', 'indoor_pool_subtitle']) {
      if (fd[k] === '') fd[k] = null;
    }
    // Indoor pool image — comes from the single-image picker, not a form field
    fd.indoor_pool_image_url = indoorPoolImagePicker ? indoorPoolImagePicker.getUrl() : null;
    if (isEdit) {
      if (f.key) fd.key = f.key;
      fd.bookable = f.bookable ? 1 : 0;
      fd.category = f.category || null;
    } else {
      fd.key = (fd.name || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || `facility_${Date.now()}`;
      fd.bookable = 0;
      fd.category = null;
    }
    const urls = imageManager.getUrls();
    fd.image_urls = urls.length ? JSON.stringify(urls) : null;

    // Strip the nursery_* form fields out of the main payload — they get
    // saved against the Nursery facility separately.
    const nurseryPayload = nursery ? {
      name: fd.nursery_name || null,
      description: fd.nursery_description || null,
      phone: fd.nursery_phone || null,
      hours: fd.nursery_hours || null,
      location: fd.nursery_location || null,
      extra_info: fd.nursery_extra_info || null,
    } : null;
    for (const k of Object.keys(fd)) {
      if (k.startsWith('nursery_')) delete fd[k];
    }

    try {
      if (isEdit) await api.updateFacility(f.id, fd);
      else await api.createFacility(fd);
      if (nursery && nurseryPayload) {
        const nUrls = nurseryImageManager ? nurseryImageManager.getUrls() : [];
        await api.updateFacility(nursery.id, {
          ...nurseryPayload,
          image_urls: nUrls.length ? JSON.stringify(nUrls) : null,
        });
      }
      toast('Saved'); m.close(); setTab('content');
    } catch (err) { toast(err.message, 'error'); }
  } },
    h('div', { class: 'field' },
      h('label', { class: 'field-label' }, 'Name *'),
      h('input', { name: 'name', value: f?.name || '', required: true, placeholder: 'e.g. Salon Antoinette' }),
    ),
    h('div', { class: 'field' },
      h('label', { class: 'field-label' }, 'Description'),
      h('textarea', { name: 'description', rows: 3 }, f?.description || ''),
    ),
    pair(phoneField, hoursField),
    pair(locationField, priceField),
    extraField,
    urlSection,
    imageManager.block,
    coachSection,
    itemsManager ? itemsManager.block : null,
    indoorPoolBlock,
    nurseryBlock,
    ...hidden,
    h('div', { class: 'modal-actions' },
      h('button', { type: 'button', class: 'btn ghost', onclick: () => m.close() }, 'Cancel'),
      h('button', { type: 'submit', class: 'btn primary' }, isEdit ? 'Save' : 'Create'),
    ),
  );

  const allowedGrids = [imageManager.grid];
  if (nurseryImageManager) allowedGrids.push(nurseryImageManager.grid);
  const inAllowedGrid = (target) => allowedGrids.some(g => g.contains(target));
  form.addEventListener('dragover', (e) => {
    const types = e.dataTransfer && e.dataTransfer.types;
    if (!types || !Array.from(types).includes('application/x-img-reorder')) return;
    if (!inAllowedGrid(e.target)) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'none';
    }
  });
  form.addEventListener('drop', (e) => {
    const types = e.dataTransfer && e.dataTransfer.types;
    if (!types || !Array.from(types).includes('application/x-img-reorder')) return;
    if (!inAllowedGrid(e.target)) {
      e.preventDefault();
      e.stopPropagation();
    }
  });

  const m = openModal(h('div', {}, h('h3', {}, isEdit ? 'Edit facility' : 'New facility'), form), { large: true });
}

// --- La Marina (single record stored in `services` table with key='marina')
async function renderMarina(body) {
  $('#page-actions').innerHTML = '';
  $('#page-actions').appendChild(h('button', { class: 'btn primary', onclick: () => openBoatModal() }, '+ Add boat'));

  const [services, boats] = await Promise.all([api.services(), api.marinaBoats()]);
  const marina = services.find(s => s.key === 'marina');

  if (marina) {
    // First image (if any) is shown alongside the description
    let firstImage = null;
    if (marina.image_urls) {
      try {
        const urls = JSON.parse(marina.image_urls);
        if (urls.length) firstImage = urls[0];
      } catch (_) { /* ignore */ }
    }

    const imgEl = firstImage
      ? (() => {
          const i = document.createElement('img');
          i.src = firstImage;
          i.style.cssText = 'width:140px;height:140px;object-fit:cover;border-radius:12px;flex-shrink:0;';
          return i;
        })()
      : null;

    body.appendChild(
      h('div', {
        class: 'card',
        style: 'padding:20px;cursor:pointer;margin-bottom:20px;display:flex;gap:20px;align-items:center;',
        onclick: () => openServiceModal(marina),
      },
        imgEl,
        h('div', { style: 'flex:1;min-width:0;' },
          h('div', { style: 'font-size:18px;font-weight:700;color:var(--text);' }, marina.name),
          marina.description ? h('div', { class: 'muted-text', style: 'margin-top:8px;font-size:14px;line-height:1.5;' }, marina.description) : null,
          h('div', { style: 'margin-top:16px;color:var(--accent);font-weight:600;font-size:13px;' }, 'Click to edit La Marina page (title, description, phone, images, activities)'),
        ),
      ),
    );
  }

  // ---- Maritime Academy edit card ----
  const academy = services.find(s => s.key === 'maritime_academy');
  if (academy) {
    let academyImage = null;
    if (academy.image_urls) {
      try { const u = JSON.parse(academy.image_urls); academyImage = u[0] || null; } catch (_) {}
    }
    const aImgEl = academyImage
      ? (() => {
          const i = document.createElement('img');
          i.src = academyImage;
          i.style.cssText = 'width:140px;height:140px;object-fit:cover;border-radius:12px;flex-shrink:0;';
          return i;
        })()
      : null;
    body.appendChild(
      h('div', {
        class: 'card',
        style: 'padding:20px;cursor:pointer;margin-bottom:20px;display:flex;gap:20px;align-items:center;',
        onclick: () => openServiceModal(academy),
      },
        aImgEl,
        h('div', { style: 'flex:1;min-width:0;' },
          h('div', { style: 'font-size:11px;letter-spacing:1px;color:var(--accent);font-weight:700;text-transform:uppercase;margin-bottom:4px;' }, 'Maritime Academy'),
          h('div', { style: 'font-size:18px;font-weight:700;color:var(--text);' }, academy.name),
          academy.subtitle ? h('div', { class: 'muted-text', style: 'margin-top:4px;font-size:14px;' }, academy.subtitle) : null,
          academy.description ? h('div', { class: 'muted-text', style: 'margin-top:8px;font-size:14px;line-height:1.5;' }, academy.description.slice(0, 140) + (academy.description.length > 140 ? '…' : '')) : null,
          h('div', { style: 'margin-top:16px;color:var(--accent);font-weight:600;font-size:13px;' }, 'Click to edit Maritime Academy page (call, email, website, Instagram, images)'),
        ),
      ),
    );
  }

  // ---- Boats roster section ----
  const computeLabel = (list) => list.length
    ? `${list.filter(x => x.status === 'docked').length} docked · ${list.filter(x => x.status === 'at_sea').length} at sea`
    : 'No boats yet';

  const countsLabel = h('div', { class: 'muted-text', style: 'font-size:13px;' }, computeLabel(boats));

  body.appendChild(h('div', { style: 'display:flex;align-items:baseline;justify-content:space-between;margin-bottom:12px;' },
    h('h3', { style: 'margin:0;font-size:16px;font-weight:700;' }, 'Boats parked at the marina'),
    countsLabel,
  ));

  if (!boats.length) {
    body.appendChild(h('div', { class: 'card' }, h('div', { class: 'empty' }, 'No boats registered yet. Click "+ Add boat" to add one.')));
    return;
  }

  const pillStyle = (status) => {
    const docked = status === 'docked';
    return `padding:4px 12px;font-size:12px;font-weight:700;letter-spacing:0.3px;border-radius:999px;${
      docked
        ? 'background:#e7f6ec;color:#1f7a3e;border-color:#cdebd6;'
        : 'background:#fff3e6;color:#a25a1a;border-color:#f3dab8;'
    }`;
  };

  const t = h('table', { class: 'table' });
  t.append(h('thead', {}, h('tr', {},
    h('th', {}, 'Guest'),
    h('th', {}, 'Boat'),
    h('th', {}, 'Phone'),
    h('th', {}, 'Slip #'),
    h('th', {}, 'Status'),
    h('th', { class: 'right' }, ''),
  )));
  const tb = h('tbody');
  for (const b of boats) {
    // Pill button — click toggles in place, no full re-render so the row
    // stays visible the whole time.
    const pillBtn = h('button', {
      class: 'btn ghost sm',
      style: pillStyle(b.status),
      onclick: async (e) => {
        e.stopPropagation();
        const previous = b.status;
        const next = previous === 'docked' ? 'at_sea' : 'docked';
        // Optimistic update — flip the pill immediately, revert if the API fails
        b.status = next;
        pillBtn.textContent = next === 'docked' ? 'Docked' : 'At sea';
        pillBtn.setAttribute('style', pillStyle(next));
        countsLabel.textContent = computeLabel(boats);
        try {
          await api.updateMarinaBoat(b.id, { status: next });
        } catch (err) {
          b.status = previous;
          pillBtn.textContent = previous === 'docked' ? 'Docked' : 'At sea';
          pillBtn.setAttribute('style', pillStyle(previous));
          countsLabel.textContent = computeLabel(boats);
          toast(err.message || 'Could not update', 'error');
        }
      },
    }, b.status === 'docked' ? 'Docked' : 'At sea');

    tb.append(h('tr', { style: 'cursor: pointer;', onclick: () => openBoatModal(b) },
      h('td', {}, h('div', { style: 'font-weight: 600;' }, b.guest_name)),
      h('td', {}, b.boat_name || '—'),
      h('td', {}, b.phone || '—'),
      h('td', {}, b.slip_number || '—'),
      h('td', {}, pillBtn),
      h('td', { class: 'right' },
        h('button', {
          class: 'icon-btn danger',
          onclick: async (e) => {
            e.stopPropagation();
            if (!confirm(`Remove ${b.guest_name}'s boat from the marina?`)) return;
            try {
              await api.deleteMarinaBoat(b.id);
              toast('Removed');
              setTab('content');
            } catch (err) { toast(err.message, 'error'); }
          },
        }, 'Delete'),
      ),
    ));
  }
  t.appendChild(tb);
  body.appendChild(h('div', { class: 'card', style: 'padding: 0; overflow: hidden;' }, t));
}

function openBoatModal(b) {
  const isEdit = !!b;
  const form = h('form', { onsubmit: async (e) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.target).entries());
    fd.status = e.target.status.checked ? 'at_sea' : 'docked';
    // Empty strings → null
    for (const k of ['boat_name', 'slip_number', 'phone', 'notes']) {
      if (fd[k] === '') fd[k] = null;
    }
    try {
      if (isEdit) await api.updateMarinaBoat(b.id, fd);
      else await api.createMarinaBoat(fd);
      toast('Saved'); m.close(); setTab('content');
    } catch (err) { toast(err.message, 'error'); }
  } },
    h('div', { class: 'field-row' },
      h('div', { class: 'field' },
        h('label', { class: 'field-label' }, 'Guest name *'),
        h('input', { name: 'guest_name', value: b?.guest_name || '', required: true, placeholder: "e.g. John Smith" }),
      ),
      h('div', { class: 'field' },
        h('label', { class: 'field-label' }, 'Slip / parking #'),
        h('input', { name: 'slip_number', value: b?.slip_number || '', placeholder: 'e.g. A-12' }),
      ),
    ),
    h('div', { class: 'field-row' },
      h('div', { class: 'field' },
        h('label', { class: 'field-label' }, 'Boat name'),
        h('input', { name: 'boat_name', value: b?.boat_name || '', placeholder: 'Optional' }),
      ),
      h('div', { class: 'field' },
        h('label', { class: 'field-label' }, 'Phone'),
        h('input', { name: 'phone', value: b?.phone || '', placeholder: 'Optional' }),
      ),
    ),
    h('div', { class: 'field' },
      h('label', { class: 'checkbox-row' },
        (() => { const c = h('input', { type: 'checkbox', name: 'status' }); c.checked = b?.status === 'at_sea'; return c; })(),
        'Currently out at sea',
      ),
    ),
    h('div', { class: 'field' },
      h('label', { class: 'field-label' }, 'Notes'),
      h('textarea', { name: 'notes', rows: 2 }, b?.notes || ''),
    ),
    h('div', { class: 'modal-actions' },
      h('button', { type: 'button', class: 'btn ghost', onclick: () => m.close() }, 'Cancel'),
      h('button', { type: 'submit', class: 'btn primary' }, isEdit ? 'Save' : 'Add boat'),
    ),
  );
  const m = openModal(h('div', {}, h('h3', {}, isEdit ? 'Edit boat' : 'Add boat'), form));
}

// --- Other Services (everything except Marina)
// Per-service field config — only the fields actually shown in the client app
// are surfaced in admin. Always include `name` and `images`.
const SERVICE_FIELDS = {
  front_desk:     { subtitle: false, description: true, phone: true, email: true,  hours: true,  location: true,  extra_info: false },
  heritage:       { subtitle: true,  description: true, phone: false, email: false, hours: false, location: false, extra_info: false },
  seaside_access: { subtitle: false, description: true, phone: true, email: false, hours: true,  location: true,  extra_info: true  },
  housekeeping:   { subtitle: false, description: true, phone: true, email: false, hours: true,  location: false, extra_info: true  },
  room_service:   { subtitle: false, description: true, phone: true, email: false, hours: true,  location: false, extra_info: true  },
  get_to_city:    { subtitle: false, description: true, phone: true, email: false, hours: false, location: false, extra_info: true  },
  celebrate:      { subtitle: true,  description: true, phone: true, email: false, hours: false, location: false, extra_info: false },
  pools:          { subtitle: false, description: true, phone: false, email: false, hours: true,  location: false, extra_info: true  },
  marina: {
    subtitle: false, description: true, phone: true, email: false, hours: false, location: false, extra_info: false,
    items: { kind: 'activity', label: 'Explore the Marina · Activities', addLabel: '+ Add activity',
      fields: { subtitle: 'Short description (e.g. Private and visitor slips)' } },
  },
  maritime_academy: {
    subtitle: true, description: true, phone: true, email: true, hours: false, location: false, extra_info: false,
    website: true, instagram: true,
  },
};
const FIELD_LABELS = {
  subtitle: 'Subtitle', description: 'Description', phone: 'Phone',
  email: 'Email', hours: 'Hours', location: 'Location', extra_info: 'Extra info',
};

async function renderServices(body) {
  $('#page-actions').innerHTML = '';
  // Marina + Maritime Academy live in the La Marina tab — hide them here.
  const list = (await api.services()).filter(s => s.key !== 'marina' && s.key !== 'maritime_academy');
  if (!list.length) { body.appendChild(h('div', { class: 'card' }, h('div', { class: 'empty' }, 'No services configured.'))); return; }

  const t = h('table', { class: 'table' });
  t.append(h('thead', {}, h('tr', {},
    h('th', {}, 'Name'), h('th', {}, 'Hours'),
    h('th', {}, 'Phone'), h('th', {}, 'Location'),
  )));
  const tb = h('tbody');
  for (const s of list) {
    tb.append(h('tr', {
      style: 'cursor: pointer;',
      onclick: () => { s.key === 'landmarks' ? openLandmarksManager(s) : openServiceModal(s); },
    },
      h('td', {},
        h('div', { style: 'font-weight: 600;' }, s.name),
        s.subtitle ? h('div', { class: 'muted-text' }, s.subtitle) : null,
      ),
      h('td', {}, s.hours || '—'),
      h('td', {}, s.phone || '—'),
      h('td', {}, s.location || '—'),
    ));
  }
  t.appendChild(tb);
  body.appendChild(h('div', { class: 'card', style: 'padding: 0; overflow: hidden;' }, t));
}

function openServiceModal(s) {
  // Parse existing image_urls
  let initialImages = [];
  if (s?.image_urls) {
    try { initialImages = JSON.parse(s.image_urls); } catch (_) { initialImages = []; }
  }
  const imageManager = createImageManager(initialImages);

  // Field config — show only the fields the client actually sees for this service
  const cfg = SERVICE_FIELDS[s?.key] || { subtitle: true, description: true, phone: true, email: true, hours: true, location: true, extra_info: true };
  const isLongDescription = s?.key === 'heritage';

  // Build the row of two side-by-side fields, falling back to one full-width
  // field if only one of the pair is enabled (avoids lopsided layout).
  const pair = (a, b) => {
    if (cfg[a.key] && cfg[b.key]) return h('div', { class: 'field-row' }, a.el, b.el);
    if (cfg[a.key]) return a.el;
    if (cfg[b.key]) return b.el;
    return null;
  };

  const nameField = h('div', { class: 'field' },
    h('label', { class: 'field-label' }, 'Name *'),
    h('input', { name: 'name', value: s?.name || '', required: true }),
  );
  const subtitleField = {
    key: 'subtitle',
    el: h('div', { class: 'field' },
      h('label', { class: 'field-label' }, FIELD_LABELS.subtitle),
      h('input', { name: 'subtitle', value: s?.subtitle || '', placeholder: 'Shown under the title' }),
    ),
  };
  const descriptionField = cfg.description ? h('div', { class: 'field' },
    h('label', { class: 'field-label' }, FIELD_LABELS.description),
    h('textarea', { name: 'description', rows: isLongDescription ? 10 : 4 }, s?.description || ''),
  ) : null;
  const phoneField = { key: 'phone', el: h('div', { class: 'field' },
    h('label', { class: 'field-label' }, FIELD_LABELS.phone),
    h('input', { name: 'phone', value: s?.phone || '', placeholder: 'e.g. +961 9 123 456' }),
  )};
  const emailField = { key: 'email', el: h('div', { class: 'field' },
    h('label', { class: 'field-label' }, FIELD_LABELS.email),
    h('input', { name: 'email', value: s?.email || '', placeholder: 'e.g. service@portemilio.com' }),
  )};
  const hoursField = { key: 'hours', el: h('div', { class: 'field' },
    h('label', { class: 'field-label' }, FIELD_LABELS.hours),
    h('input', { name: 'hours', value: s?.hours || '', placeholder: 'e.g. 24 hours · 7 AM – 7 PM' }),
  )};
  const locationField = { key: 'location', el: h('div', { class: 'field' },
    h('label', { class: 'field-label' }, FIELD_LABELS.location),
    h('input', { name: 'location', value: s?.location || '', placeholder: 'e.g. Lobby · Ground floor' }),
  )};
  const extraField = cfg.extra_info ? h('div', { class: 'field' },
    h('label', { class: 'field-label' }, FIELD_LABELS.extra_info),
    h('input', { name: 'extra_info', value: s?.extra_info || '', placeholder: 'Anything else clients should know' }),
  ) : null;

  // Optional URL fields (Maritime Academy)
  const urlPair = [];
  if (cfg.website) urlPair.push(h('div', { class: 'field' },
    h('label', { class: 'field-label' }, 'Website'),
    h('input', { name: 'website', value: s?.website || '', placeholder: 'https://...' }),
  ));
  if (cfg.instagram) urlPair.push(h('div', { class: 'field' },
    h('label', { class: 'field-label' }, 'Instagram URL'),
    h('input', { name: 'instagram_url', value: s?.instagram_url || '', placeholder: 'https://www.instagram.com/...' }),
  ));
  const urlSection = urlPair.length ? h('div', { class: 'field-row', style: 'flex-wrap:wrap;' }, ...urlPair) : null;

  // Items section for services that have a sub-list (e.g. Marina activities)
  const itemsManager = (cfg.items && s?.id)
    ? createItemListManager({
        entity: 'service',
        ownerId: s.id,
        items: s.items || [],
        kind: cfg.items.kind,
        label: cfg.items.label,
        addLabel: cfg.items.addLabel,
        fields: cfg.items.fields,
      })
    : null;

  // Hidden inputs ensure the server receives `null` for fields we removed
  // from the UI (instead of preserving stale values).
  const hidden = ['subtitle', 'phone', 'email', 'hours', 'location', 'extra_info']
    .filter(k => !cfg[k])
    .map(k => h('input', { type: 'hidden', name: k, value: '' }));
  if (!cfg.website) hidden.push(h('input', { type: 'hidden', name: 'website', value: '' }));
  if (!cfg.instagram) hidden.push(h('input', { type: 'hidden', name: 'instagram_url', value: '' }));

  const form = h('form', { onsubmit: async (e) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.target).entries());
    for (const k of ['subtitle', 'description', 'phone', 'email', 'hours', 'location', 'extra_info', 'website', 'instagram_url']) {
      if (fd[k] === '') fd[k] = null;
    }
    const urls = imageManager.getUrls();
    fd.image_urls = urls.length ? JSON.stringify(urls) : null;
    try {
      await api.updateService(s.id, fd);
      toast('Saved'); m.close(); setTab('content');
    } catch (err) { toast(err.message, 'error'); }
  } },
    nameField,
    cfg.subtitle ? subtitleField.el : null,
    descriptionField,
    pair(phoneField, emailField),
    pair(hoursField, locationField),
    extraField,
    urlSection,
    imageManager.block,
    itemsManager ? itemsManager.block : null,
    ...hidden,
    h('div', { class: 'modal-actions' },
      h('button', { type: 'button', class: 'btn ghost', onclick: () => m.close() }, 'Cancel'),
      h('button', { type: 'submit', class: 'btn primary' }, 'Save'),
    ),
  );

  form.addEventListener('dragover', (e) => {
    const types = e.dataTransfer && e.dataTransfer.types;
    if (!types || !Array.from(types).includes('application/x-img-reorder')) return;
    if (!imageManager.grid.contains(e.target)) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'none';
    }
  });
  form.addEventListener('drop', (e) => {
    const types = e.dataTransfer && e.dataTransfer.types;
    if (!types || !Array.from(types).includes('application/x-img-reorder')) return;
    if (!imageManager.grid.contains(e.target)) {
      e.preventDefault();
      e.stopPropagation();
    }
  });

  const m = openModal(h('div', {}, h('h3', {}, 'Edit ' + (s?.name || 'service')), form), { large: true });
}

// ============================ Landmarks manager ============================
// Clicking "Explore Landmarks" in Other Services opens this — combines the
// service page settings (title/description/images) with the management of the
// landmarks list itself.
async function openLandmarksManager(service) {
  const landmarks = await api.landmarks();

  // Two sections inside the modal:
  //  1. Service page settings (the Landmarks page title/description/image)
  //  2. List of landmarks, grouped by type, with edit/add/delete

  let initialImages = [];
  if (service?.image_urls) {
    try { initialImages = JSON.parse(service.image_urls); } catch (_) {}
  }
  const imageManager = createImageManager(initialImages, 'Page header images');

  const renderList = () => {
    const sightseeing = landmarks.filter(l => l.type === 'sightseeing');
    const relevant = landmarks.filter(l => l.type === 'relevant_services');

    const group = (title, items, type) => h('div', { style: 'margin-top:18px;' },
      h('div', { style: 'display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;' },
        h('div', { style: 'font-size:13px;font-weight:700;letter-spacing:0.8px;color:var(--accent);text-transform:uppercase;' }, title),
        h('button', {
          type: 'button', class: 'btn ghost sm',
          onclick: () => openLandmarkItemModal(null, type, async () => {
            const fresh = await api.landmarks();
            landmarks.splice(0, landmarks.length, ...fresh);
            listContainer.innerHTML = '';
            listContainer.appendChild(renderList());
          }),
        }, '+ Add'),
      ),
      items.length
        ? h('div', { class: 'card', style: 'padding:0;overflow:hidden;' },
            ...items.map((l, i) =>
              h('div', {
                style: `display:flex;align-items:center;gap:14px;padding:10px 14px;cursor:pointer;${i > 0 ? 'border-top:1px solid var(--border);' : ''}`,
                onclick: () => openLandmarkItemModal(l, l.type, async () => {
                  const fresh = await api.landmarks();
                  landmarks.splice(0, landmarks.length, ...fresh);
                  listContainer.innerHTML = '';
                  listContainer.appendChild(renderList());
                }),
              },
                (() => {
                  let firstImg = null;
                  if (l.image_urls) {
                    try { const u = JSON.parse(l.image_urls); if (u.length) firstImg = u[0]; } catch (_) {}
                  }
                  if (!firstImg) return h('div', { style: 'width:48px;height:48px;border-radius:8px;background:var(--bg);flex-shrink:0;' });
                  const img = document.createElement('img');
                  img.src = firstImg;
                  img.style.cssText = 'width:48px;height:48px;object-fit:cover;border-radius:8px;flex-shrink:0;';
                  return img;
                })(),
                h('div', { style: 'flex:1;min-width:0;' },
                  h('div', { style: 'font-weight:600;font-size:14px;' }, l.name),
                  h('div', { class: 'muted-text', style: 'font-size:12px;margin-top:2px;' },
                    [l.subtitle, l.distance].filter(Boolean).join(' · ') || '—'),
                  l.type === 'relevant_services'
                    ? h('div', { class: 'muted-text', style: 'font-size:11px;margin-top:2px;' },
                        `${(l.locations || []).length} location(s)`)
                    : null,
                ),
                h('button', {
                  type: 'button', class: 'icon-btn danger',
                  style: 'font-size:12px;',
                  onclick: async (e) => {
                    e.stopPropagation();
                    if (!confirm(`Delete "${l.name}"? This cannot be undone.`)) return;
                    try {
                      await api.deleteLandmark(l.id);
                      const fresh = await api.landmarks();
                      landmarks.splice(0, landmarks.length, ...fresh);
                      listContainer.innerHTML = '';
                      listContainer.appendChild(renderList());
                      toast('Deleted');
                    } catch (err) { toast(err.message, 'error'); }
                  },
                }, 'Delete'),
              ),
            ),
          )
        : h('div', { class: 'muted-text', style: 'padding:12px;font-size:13px;' }, `No ${title.toLowerCase()} yet.`),
    );

    return h('div', {},
      group('Sightseeing', sightseeing, 'sightseeing'),
      group('Relevant services', relevant, 'relevant_services'),
    );
  };

  const listContainer = h('div', {});
  listContainer.appendChild(renderList());

  const pageForm = h('form', { onsubmit: async (e) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.target).entries());
    const urls = imageManager.getUrls();
    fd.image_urls = urls.length ? JSON.stringify(urls) : null;
    fd.subtitle = fd.subtitle || null;
    fd.description = fd.description || null;
    try {
      await api.updateService(service.id, fd);
      toast('Page saved');
    } catch (err) { toast(err.message, 'error'); }
  } },
    h('div', { style: 'font-size:13px;font-weight:700;letter-spacing:0.8px;color:var(--accent);text-transform:uppercase;margin-bottom:10px;' }, 'Landmarks page'),
    h('div', { class: 'field-row' },
      h('div', { class: 'field' },
        h('label', { class: 'field-label' }, 'Page title *'),
        h('input', { name: 'name', value: service?.name || 'Explore Landmarks', required: true }),
      ),
      h('div', { class: 'field' },
        h('label', { class: 'field-label' }, 'Header label'),
        h('input', { name: 'subtitle', value: service?.subtitle || '', placeholder: 'e.g. Destination Guide' }),
      ),
    ),
    h('div', { class: 'field' },
      h('label', { class: 'field-label' }, 'Description'),
      h('textarea', { name: 'description', rows: 3 }, service?.description || ''),
    ),
    imageManager.block,
    h('div', { style: 'display:flex;justify-content:flex-end;margin-top:8px;' },
      h('button', { type: 'submit', class: 'btn ghost sm' }, 'Save page settings'),
    ),
  );

  pageForm.addEventListener('dragover', (e) => {
    const types = e.dataTransfer && e.dataTransfer.types;
    if (!types || !Array.from(types).includes('application/x-img-reorder')) return;
    if (!imageManager.grid.contains(e.target)) { e.preventDefault(); e.dataTransfer.dropEffect = 'none'; }
  });
  pageForm.addEventListener('drop', (e) => {
    const types = e.dataTransfer && e.dataTransfer.types;
    if (!types || !Array.from(types).includes('application/x-img-reorder')) return;
    if (!imageManager.grid.contains(e.target)) { e.preventDefault(); e.stopPropagation(); }
  });

  const m = openModal(
    h('div', {},
      h('h3', {}, 'Manage Landmarks'),
      pageForm,
      h('hr', { style: 'border:none;border-top:1px solid var(--border);margin:20px 0;' }),
      listContainer,
      h('div', { class: 'modal-actions' },
        h('button', { type: 'button', class: 'btn primary', onclick: () => { m.close(); setTab('content'); } }, 'Done'),
      ),
    ),
    { large: true },
  );
}

// Edit / create a single landmark. For relevant_services type, also manage
// the inner list of locations.
function openLandmarkItemModal(landmark, type, onSaved) {
  const isEdit = !!landmark;
  const t = type || landmark?.type || 'sightseeing';
  const isRelevantServices = t === 'relevant_services';

  let initialImages = [];
  if (landmark?.image_urls) {
    try { initialImages = JSON.parse(landmark.image_urls); } catch (_) {}
  }
  const imageManager = createImageManager(initialImages);

  // ---- Locations sub-list (only for relevant_services) ----
  const locations = landmark?.locations ? [...landmark.locations] : [];

  const locContainer = h('div', { style: 'margin-top:8px;' });
  function renderLocations() {
    locContainer.innerHTML = '';
    if (!locations.length) {
      locContainer.appendChild(h('div', { class: 'muted-text', style: 'font-size:13px;padding:8px 0;' }, 'No locations yet.'));
      return;
    }
    const list = h('div', { class: 'card', style: 'padding:0;overflow:hidden;' });
    locations.forEach((loc, i) => {
      list.appendChild(h('div', {
        style: `display:flex;align-items:center;gap:10px;padding:10px 14px;${i > 0 ? 'border-top:1px solid var(--border);' : ''}`,
      },
        h('div', { style: 'flex:1;min-width:0;' },
          h('div', { style: 'font-weight:600;font-size:14px;' }, loc.name),
          h('div', { class: 'muted-text', style: 'font-size:12px;margin-top:2px;' },
            [loc.address, loc.phone].filter(Boolean).join(' · ') || '—'),
        ),
        h('button', {
          type: 'button', class: 'btn ghost sm', style: 'padding:4px 10px;font-size:12px;',
          onclick: () => openLocationModal(loc, (updated) => {
            const idx = locations.findIndex(x => x.id === loc.id);
            if (idx >= 0) locations[idx] = updated;
            renderLocations();
          }),
        }, 'Edit'),
        h('button', {
          type: 'button', class: 'icon-btn danger', style: 'padding:4px 10px;font-size:12px;',
          onclick: async () => {
            if (!confirm(`Remove "${loc.name}"?`)) return;
            try {
              if (loc.id) await api.deleteLandmarkLocation(loc.id);
              const idx = locations.indexOf(loc);
              if (idx >= 0) locations.splice(idx, 1);
              renderLocations();
              toast('Removed');
            } catch (err) { toast(err.message, 'error'); }
          },
        }, 'Delete'),
      ));
    });
    locContainer.appendChild(list);
  }
  renderLocations();

  function openLocationModal(loc, onDone) {
    const isLocEdit = !!loc?.id || (loc && loc.name !== undefined);
    const form = h('form', { onsubmit: async (e) => {
      e.preventDefault();
      const fd = Object.fromEntries(new FormData(e.target).entries());
      fd.address = fd.address || null;
      fd.phone = fd.phone || null;
      try {
        if (loc?.id) {
          await api.updateLandmarkLocation(loc.id, fd);
          onDone({ ...loc, ...fd });
        } else {
          // Need the parent landmark id — only valid when editing an existing landmark
          if (!landmark?.id) {
            toast('Save the landmark first before adding locations.', 'error');
            return;
          }
          fd.landmark_id = landmark.id;
          const r = await api.createLandmarkLocation(fd);
          locations.push({ id: r.id, ...fd });
          renderLocations();
        }
        toast('Saved');
        mLoc.close();
      } catch (err) { toast(err.message, 'error'); }
    } },
      h('div', { class: 'field' },
        h('label', { class: 'field-label' }, 'Name *'),
        h('input', { name: 'name', value: loc?.name || '', required: true }),
      ),
      h('div', { class: 'field' },
        h('label', { class: 'field-label' }, 'Address'),
        h('input', { name: 'address', value: loc?.address || '' }),
      ),
      h('div', { class: 'field' },
        h('label', { class: 'field-label' }, 'Phone'),
        h('input', { name: 'phone', value: loc?.phone || '' }),
      ),
      h('div', { class: 'modal-actions' },
        h('button', { type: 'button', class: 'btn ghost', onclick: () => mLoc.close() }, 'Cancel'),
        h('button', { type: 'submit', class: 'btn primary' }, loc?.id ? 'Save' : 'Add'),
      ),
    );
    const mLoc = openModal(h('div', {}, h('h3', {}, loc?.id ? 'Edit location' : 'Add location'), form));
  }

  // ---- Main landmark form ----
  const form = h('form', { onsubmit: async (e) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.target).entries());
    fd.type = t;
    fd.subtitle = fd.subtitle || null;
    fd.description = fd.description || null;
    fd.distance = fd.distance || null;
    fd.address = fd.address || null;
    fd.phone = fd.phone || null;
    fd.website = fd.website || null;
    const urls = imageManager.getUrls();
    fd.image_urls = urls.length ? JSON.stringify(urls) : null;
    try {
      if (isEdit) {
        await api.updateLandmark(landmark.id, fd);
      } else {
        await api.createLandmark(fd);
      }
      toast('Saved');
      m.close();
      onSaved && onSaved();
    } catch (err) { toast(err.message, 'error'); }
  } },
    h('div', { class: 'field' },
      h('label', { class: 'field-label' }, 'Name *'),
      h('input', { name: 'name', value: landmark?.name || '', required: true, placeholder: isRelevantServices ? 'e.g. Pharmacies' : 'e.g. Jeita Grotto' }),
    ),
    h('div', { class: 'field-row' },
      h('div', { class: 'field' },
        h('label', { class: 'field-label' }, 'Subtitle'),
        h('input', { name: 'subtitle', value: landmark?.subtitle || '', placeholder: 'Short tagline shown under the name' }),
      ),
      h('div', { class: 'field' },
        h('label', { class: 'field-label' }, 'Distance from hotel'),
        h('input', { name: 'distance', value: landmark?.distance || '', placeholder: 'e.g. 5 km · Walking distance' }),
      ),
    ),
    h('div', { class: 'field' },
      h('label', { class: 'field-label' }, 'Description'),
      h('textarea', { name: 'description', rows: 3 }, landmark?.description || ''),
    ),
    isRelevantServices ? null : h('div', { class: 'field-row' },
      h('div', { class: 'field' },
        h('label', { class: 'field-label' }, 'Address'),
        h('input', { name: 'address', value: landmark?.address || '' }),
      ),
      h('div', { class: 'field' },
        h('label', { class: 'field-label' }, 'Phone'),
        h('input', { name: 'phone', value: landmark?.phone || '' }),
      ),
    ),
    isRelevantServices ? null : h('div', { class: 'field' },
      h('label', { class: 'field-label' }, 'Website'),
      h('input', { name: 'website', value: landmark?.website || '', placeholder: 'https://...' }),
    ),
    // For relevant_services, address/phone are per-location instead.
    isRelevantServices ? h('input', { type: 'hidden', name: 'address', value: '' }) : null,
    isRelevantServices ? h('input', { type: 'hidden', name: 'phone', value: '' }) : null,
    isRelevantServices ? h('input', { type: 'hidden', name: 'website', value: '' }) : null,
    imageManager.block,

    // Locations sub-list (only for relevant_services)
    isRelevantServices ? h('div', { style: 'margin-top:18px;' },
      h('div', { style: 'display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;' },
        h('div', { style: 'font-size:13px;font-weight:700;letter-spacing:0.6px;color:var(--text);text-transform:uppercase;' }, 'Locations'),
        h('button', {
          type: 'button', class: 'btn ghost sm',
          onclick: () => {
            if (!landmark?.id) {
              toast('Save the landmark first before adding locations.', 'error');
              return;
            }
            openLocationModal(null, () => {});
          },
        }, '+ Add location'),
      ),
      locContainer,
    ) : null,

    h('div', { class: 'modal-actions' },
      h('button', { type: 'button', class: 'btn ghost', onclick: () => m.close() }, 'Cancel'),
      h('button', { type: 'submit', class: 'btn primary' }, isEdit ? 'Save' : 'Create'),
    ),
  );

  form.addEventListener('dragover', (e) => {
    const types = e.dataTransfer && e.dataTransfer.types;
    if (!types || !Array.from(types).includes('application/x-img-reorder')) return;
    if (!imageManager.grid.contains(e.target)) { e.preventDefault(); e.dataTransfer.dropEffect = 'none'; }
  });
  form.addEventListener('drop', (e) => {
    const types = e.dataTransfer && e.dataTransfer.types;
    if (!types || !Array.from(types).includes('application/x-img-reorder')) return;
    if (!imageManager.grid.contains(e.target)) { e.preventDefault(); e.stopPropagation(); }
  });

  const headerLabel = (isRelevantServices ? 'Relevant service' : 'Sightseeing') + (isEdit ? ' · Edit' : ' · New');
  const m = openModal(h('div', {}, h('h3', {}, headerLabel), form), { large: true });
}

// --- Events
async function renderEvents(body) {
  $('#page-actions').innerHTML = '';
  $('#page-actions').appendChild(h('button', { class: 'btn primary', onclick: () => openEventModal() }, '+ New event'));
  const list = await api.events();
  state.events = list;
  if (!list.length) { body.appendChild(h('div', { class: 'card' }, h('div', { class: 'empty' }, 'No events yet.'))); return; }
  const t = h('table', { class: 'table' });
  t.append(h('thead', {}, h('tr', {},
    h('th', {}, 'Title'), h('th', {}, 'When'), h('th', {}, 'Location'),
    h('th', {}, 'Capacity'), h('th', {}, 'Bookable'),
    h('th', { class: 'right' }, ''),
  )));
  const tb = h('tbody');
  for (const ev of list) {
    tb.append(h('tr', { style: 'cursor: pointer;', onclick: () => openEventModal(ev) },
      h('td', {}, h('div', { style: 'font-weight: 600;' }, ev.title)),
      h('td', {}, fmtDateTime(ev.start_time)),
      h('td', {}, ev.location || '—'),
      h('td', {}, ev.capacity || '—'),
      h('td', {}, ev.bookable ? 'Yes' : 'No'),
      h('td', { class: 'right' },
        h('button', { class: 'icon-btn danger', onclick: async (e) => {
          e.stopPropagation();
          if (!confirm(`Delete ${ev.title}?`)) return;
          try { await api.deleteEvent(ev.id); toast('Deleted'); setTab('content'); } catch (e) { toast(e.message, 'error'); }
        } }, 'Delete'),
      ),
    ));
  }
  t.appendChild(tb);
  body.appendChild(h('div', { class: 'card', style: 'padding: 0; overflow: hidden;' }, t));
}

function openEventModal(ev) {
  const isEdit = !!ev;
  const toLocalInput = (s) => s ? s.replace(' ', 'T').slice(0, 16) : '';
  const form = h('form', { onsubmit: async (e) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.target).entries());
    fd.bookable = e.target.bookable.checked ? 1 : 0;
    fd.capacity = fd.capacity ? Number(fd.capacity) : null;
    try {
      if (isEdit) await api.updateEvent(ev.id, fd);
      else await api.createEvent(fd);
      toast('Saved'); m.close(); setTab('content');
    } catch (err) { toast(err.message, 'error'); }
  } },
    h('div', { class: 'field' }, h('label', { class: 'field-label' }, 'Title'), h('input', { name: 'title', value: ev?.title || '', required: true })),
    h('div', { class: 'field-row' },
      h('div', { class: 'field' }, h('label', { class: 'field-label' }, 'Start'), h('input', { type: 'datetime-local', name: 'start_time', value: toLocalInput(ev?.start_time), required: true })),
      h('div', { class: 'field' }, h('label', { class: 'field-label' }, 'End'), h('input', { type: 'datetime-local', name: 'end_time', value: toLocalInput(ev?.end_time) })),
    ),
    h('div', { class: 'field-row' },
      h('div', { class: 'field' }, h('label', { class: 'field-label' }, 'Location'), h('input', { name: 'location', value: ev?.location || '' })),
      h('div', { class: 'field' }, h('label', { class: 'field-label' }, 'Capacity'), h('input', { type: 'number', name: 'capacity', value: ev?.capacity || '' })),
    ),
    h('div', { class: 'field' }, h('label', { class: 'field-label' }, 'Description'), h('textarea', { name: 'description' }, ev?.description || '')),
    h('div', { class: 'field' },
      h('label', { class: 'checkbox-row' },
        (() => { const c = h('input', { type: 'checkbox', name: 'bookable' }); c.checked = ev ? !!ev.bookable : true; return c; })(),
        'Bookable',
      ),
    ),
    h('div', { class: 'modal-actions' },
      h('button', { type: 'button', class: 'btn ghost', onclick: () => m.close() }, 'Cancel'),
      h('button', { type: 'submit', class: 'btn primary' }, isEdit ? 'Save' : 'Create'),
    ),
  );
  const m = openModal(h('div', {}, h('h3', {}, isEdit ? 'Edit event' : 'New event'), form));
}

// =========================== PLAT DU JOUR ===========================
async function renderPlatDuJour() {
  const body = $('#page-body');
  $('#page-subtitle').textContent = "Check the items to feature as today's plat du jour. Click a dish to view details.";
  $('#page-actions').appendChild(h('button', { class: 'btn primary', onclick: () => openPlatDuJourModal() }, '+ Add dish'));

  const allItems = await api.platDuJourItems();

  // Search bar above the table, full width
  const searchInput = h('input', { type: 'search', placeholder: 'Search dishes…', class: 'pdj-search' });
  body.appendChild(searchInput);

  if (!allItems.length) {
    body.appendChild(h('div', { class: 'card' }, h('div', { class: 'empty' }, 'No dishes yet. Add your first one.')));
    return;
  }

  const table = h('table', { class: 'table fixed' });
  table.append(h('thead', {}, h('tr', {},
    h('th', { style: 'width:80px;' }),
    h('th', {}, 'Dish'),
    h('th', {}, 'Description'),
    h('th', { style: 'width:90px;' }, 'Price'),
    h('th', { style: 'width:70px;' }),
  )));
  const tbody = h('tbody');
  const emptyState = h('div', { class: 'pdj-empty' }, 'No dishes match your search.');
  emptyState.style.display = 'none';

  const renderRows = (q) => {
    tbody.innerHTML = '';
    const query = (q || '').trim().toLowerCase();
    const filtered = query
      ? allItems.filter(it =>
          (it.title || '').toLowerCase().includes(query) ||
          (it.subtitle || '').toLowerCase().includes(query) ||
          (it.description || '').toLowerCase().includes(query))
      : allItems;

    emptyState.style.display = filtered.length ? 'none' : 'block';
    if (!filtered.length) return;

    for (const item of filtered) {
      const toggle = h('input', { type: 'checkbox', style: 'width:18px;height:18px;cursor:pointer;accent-color:var(--navy);' });
      toggle.checked = !!item.is_today;

      const imgEl = item.image_url
        ? h('img', { src: item.image_url, style: 'width:52px;height:52px;object-fit:cover;border-radius:8px;display:block;' })
        : h('div', { style: 'width:52px;height:52px;border-radius:8px;background:var(--bg);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:20px;' }, '🍽');

      const tr = h('tr', { class: item.is_today ? 'row-plat' : '', style: 'cursor:pointer;' },
        h('td', { style: 'width:64px;' }, imgEl),
        h('td', {},
          h('div', { style: 'font-weight:700;font-size:14px;' }, item.title),
          item.subtitle ? h('div', { class: 'muted-text', style: 'font-size:12px;margin-top:2px;' }, item.subtitle) : null,
        ),
        h('td', { style: 'max-width:300px;' },
          item.description
            ? h('div', { class: 'muted-text', style: 'font-size:13px;white-space:normal;' }, item.description)
            : h('span', { class: 'muted-text' }, '—'),
        ),
        h('td', { class: 'num' }, item.price != null ? `$${Number(item.price).toFixed(2)}` : '—'),
        h('td', { class: 'right' }, toggle),
      );

      tr.addEventListener('click', (e) => {
        if (toggle.contains(e.target)) return;
        openPlatDuJourDetail(item);
      });

      toggle.addEventListener('change', async (e) => {
        e.stopPropagation();
        const val = toggle.checked ? 1 : 0;
        try {
          await api.updatePlatDuJourItem(item.id, { is_today: val });
          item.is_today = val;
          tr.className = val ? 'row-plat' : '';
          toast(val ? `${item.title} set as today's special` : `${item.title} removed from today`);
        } catch (err) {
          toggle.checked = !toggle.checked;
          toast(err.message, 'error');
        }
      });

      tbody.append(tr);
    }
  };

  searchInput.addEventListener('input', (e) => renderRows(e.target.value));
  renderRows('');

  table.appendChild(tbody);
  body.appendChild(h('div', { class: 'card pdj-card' }, table, emptyState));
}

async function readImageAsBase64(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 900;
        const scale = img.width > MAX ? MAX / img.width : 1;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function openPlatDuJourModal(item = null) {
  const isEdit = !!item;

  const previewEl = h('div', { class: 'pdj-img-preview' });
  if (item?.image_url) {
    previewEl.appendChild(h('img', { src: item.image_url, style: 'width:100%;height:100%;object-fit:cover;' }));
  } else {
    previewEl.textContent = '🍽';
  }
  const fileInput = h('input', { type: 'file', accept: 'image/*', style: 'font-size:14px;' });
  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      previewEl.innerHTML = '';
      previewEl.appendChild(h('img', { src: e.target.result, style: 'width:100%;height:100%;object-fit:cover;' }));
    };
    reader.readAsDataURL(file);
  });

  const titleInput = h('input', { type: 'text', name: 'title', required: true, placeholder: 'e.g. Mloukhiyeh' });
  if (item?.title) titleInput.value = item.title;
  const subtitleInput = h('input', { type: 'text', name: 'subtitle', required: true, placeholder: "e.g. Today's Lebanese specialty" });
  if (item?.subtitle) subtitleInput.value = item.subtitle;
  const descInput = h('textarea', { name: 'description', rows: '3', placeholder: 'e.g. A traditional Lebanese stew of jute leaves, slow cooked with tender chicken and served with rice.' });
  if (item?.description) descInput.value = item.description;
  const priceInput = h('input', { type: 'number', name: 'price', required: true, step: '0.01', min: '0', placeholder: 'e.g. 18.00' });
  if (item?.price != null) priceInput.value = String(item.price);

  const form = h('form', { onsubmit: async (e) => {
    e.preventDefault();
    let image_url = item?.image_url || null;
    const file = fileInput.files[0];
    if (file) image_url = await readImageAsBase64(file);
    const payload = {
      title: titleInput.value.trim(),
      subtitle: subtitleInput.value.trim() || null,
      description: descInput.value.trim() || null,
      price: priceInput.value ? Number(priceInput.value) : null,
      image_url,
    };
    try {
      if (isEdit) { await api.updatePlatDuJourItem(item.id, payload); toast('Dish updated'); }
      else { await api.createPlatDuJourItem(payload); toast('Dish added'); }
      m.close();
      setTab('platdujour');
    } catch (err) { toast(err.message, 'error'); }
  }},
    h('div', { class: 'field' },
      h('label', { class: 'field-label' }, 'Photo'),
      h('div', { style: 'display:flex;align-items:center;gap:14px;' },
        previewEl,
        h('div', {},
          fileInput,
          h('div', { class: 'muted-text', style: 'font-size:12px;margin-top:4px;' }, 'JPG or PNG · max ~2 MB'),
        ),
      ),
    ),
    h('div', { class: 'field' }, h('label', { class: 'field-label' }, 'Title', h('span', { class: 'req' }, '*')), titleInput),
    h('div', { class: 'field' }, h('label', { class: 'field-label' }, 'Subtitle', h('span', { class: 'req' }, '*')), subtitleInput),
    h('div', { class: 'field' }, h('label', { class: 'field-label' }, 'Description'), descInput),
    h('div', { class: 'field' }, h('label', { class: 'field-label' }, 'Price ($)', h('span', { class: 'req' }, '*')), priceInput),
    h('div', { style: 'display:flex;gap:10px;margin-top:20px;justify-content:space-between;align-items:center;' },
      isEdit
        ? h('button', { type: 'button', class: 'btn danger sm', onclick: async () => {
            if (!confirm(`Delete "${item.title}"?`)) return;
            try { await api.deletePlatDuJourItem(item.id); toast('Dish deleted'); m.close(); setTab('platdujour'); }
            catch (err) { toast(err.message, 'error'); }
          } }, 'Delete dish')
        : h('span'),
      h('div', { style: 'display:flex;gap:10px;' },
        h('button', { type: 'button', class: 'btn', onclick: () => m.close() }, 'Cancel'),
        h('button', { type: 'submit', class: 'btn primary' }, isEdit ? 'Save changes' : 'Add dish'),
      ),
    ),
  );

  const m = openModal(
    h('div', {},
      h('h3', { style: 'margin-bottom:16px;' }, isEdit ? `Edit — ${item.title}` : 'Add dish to Plat du Jour'),
      form,
    ),
    { large: true },
  );
}

function openPlatDuJourDetail(item) {
  const wrap = h('div', { class: 'pdj-detail' });
  if (item.image_url) {
    wrap.appendChild(h('img', { src: item.image_url, class: 'pdj-detail-img' }));
  }
  wrap.appendChild(h('div', { style: 'font-size:22px;font-weight:800;color:var(--navy);margin-top:4px;' }, item.title));
  if (item.subtitle) wrap.appendChild(h('div', { class: 'muted-text', style: 'font-size:14px;margin-top:4px;' }, item.subtitle));
  if (item.description) wrap.appendChild(h('p', { style: 'margin-top:14px;font-size:14px;line-height:1.65;' }, item.description));
  if (item.price != null) wrap.appendChild(h('div', { style: 'margin-top:16px;font-size:20px;font-weight:700;color:var(--navy);' }, `$${Number(item.price).toFixed(2)}`));
  if (item.is_today) wrap.appendChild(h('div', { style: 'margin-top:12px;display:inline-block;background:#fdf6ea;border:1px solid var(--gold);color:#8c6620;font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px;' }, "✓ Today's plat du jour"));
  wrap.appendChild(h('div', { style: 'margin-top:24px;display:flex;justify-content:space-between;align-items:center;gap:10px;' },
    h('button', { class: 'btn', onclick: () => { m.close(); openPlatDuJourModal(item); } }, 'Edit dish'),
    h('button', { class: 'btn primary', onclick: () => m.close() }, 'Close'),
  ));
  const m = openModal(wrap, { large: true });
}

// =========================== TODAY'S ACTIVITIES ===========================
async function renderTodayActivities() {
  const body = $('#page-body');
  $('#page-subtitle').textContent = 'Check the activities and events happening at the resort today. Click any to view details.';
  $('#page-actions').appendChild(h('button', { class: 'btn primary', onclick: () => openActivityModal() }, '+ Add activity'));

  const allItems = await api.activities();

  const searchInput = h('input', { type: 'search', placeholder: 'Search activities…', class: 'pdj-search' });
  body.appendChild(searchInput);

  if (!allItems.length) {
    body.appendChild(h('div', { class: 'card' }, h('div', { class: 'empty' }, 'No activities yet. Add your first one.')));
    return;
  }

  const table = h('table', { class: 'table fixed' });
  table.append(h('thead', {}, h('tr', {},
    h('th', { style: 'width:80px;' }),
    h('th', {}, 'Activity'),
    h('th', {}, 'When'),
    h('th', {}, 'Location'),
    h('th', { style: 'width:70px;' }),
  )));
  const tbody = h('tbody');
  const emptyState = h('div', { class: 'pdj-empty' }, 'No activities match your search.');
  emptyState.style.display = 'none';

  const renderRows = (q) => {
    tbody.innerHTML = '';
    const query = (q || '').trim().toLowerCase();
    const filtered = query
      ? allItems.filter(it =>
          (it.title || '').toLowerCase().includes(query) ||
          (it.subtitle || '').toLowerCase().includes(query) ||
          (it.location || '').toLowerCase().includes(query) ||
          (it.description || '').toLowerCase().includes(query))
      : allItems;

    emptyState.style.display = filtered.length ? 'none' : 'block';
    if (!filtered.length) return;

    for (const item of filtered) {
      const toggle = h('input', { type: 'checkbox', style: 'width:18px;height:18px;cursor:pointer;accent-color:var(--navy);' });
      toggle.checked = !!item.is_today;

      const imgEl = item.image_url
        ? h('img', { src: item.image_url, style: 'width:52px;height:52px;object-fit:cover;border-radius:8px;display:block;' })
        : h('div', { style: 'width:52px;height:52px;border-radius:8px;background:var(--bg);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:20px;' }, '🎉');

      const tr = h('tr', { class: item.is_today ? 'row-plat' : '', style: 'cursor:pointer;' },
        h('td', { style: 'width:80px;' }, imgEl),
        h('td', {},
          h('div', { style: 'font-weight:700;font-size:14px;' }, item.title),
          item.subtitle ? h('div', { class: 'muted-text', style: 'font-size:12px;margin-top:2px;' }, item.subtitle) : null,
        ),
        h('td', {}, item.time_label || h('span', { class: 'muted-text' }, '—')),
        h('td', {}, item.location || h('span', { class: 'muted-text' }, '—')),
        h('td', { class: 'right' }, toggle),
      );

      tr.addEventListener('click', (e) => {
        if (toggle.contains(e.target)) return;
        openActivityDetail(item);
      });

      toggle.addEventListener('change', async (e) => {
        e.stopPropagation();
        const val = toggle.checked ? 1 : 0;
        try {
          await api.updateActivity(item.id, { is_today: val });
          item.is_today = val;
          tr.className = val ? 'row-plat' : '';
          toast(val ? `${item.title} set for today` : `${item.title} removed from today`);
        } catch (err) {
          toggle.checked = !toggle.checked;
          toast(err.message, 'error');
        }
      });

      tbody.append(tr);
    }
  };

  searchInput.addEventListener('input', (e) => renderRows(e.target.value));
  renderRows('');

  table.appendChild(tbody);
  body.appendChild(h('div', { class: 'card pdj-card' }, table, emptyState));
}

function openActivityModal(item = null) {
  const isEdit = !!item;

  const previewEl = h('div', { class: 'pdj-img-preview' });
  if (item?.image_url) {
    previewEl.appendChild(h('img', { src: item.image_url, style: 'width:100%;height:100%;object-fit:cover;' }));
  } else {
    previewEl.textContent = '🎉';
  }
  const fileInput = h('input', { type: 'file', accept: 'image/*', style: 'font-size:14px;' });
  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      previewEl.innerHTML = '';
      previewEl.appendChild(h('img', { src: e.target.result, style: 'width:100%;height:100%;object-fit:cover;' }));
    };
    reader.readAsDataURL(file);
  });

  const titleInput = h('input', { type: 'text', name: 'title', required: true, placeholder: 'e.g. Sunset Yoga' });
  if (item?.title) titleInput.value = item.title;
  const subtitleInput = h('input', { type: 'text', placeholder: 'e.g. Open-air session on the beach' });
  if (item?.subtitle) subtitleInput.value = item.subtitle;
  const timeInput = h('input', { type: 'text', placeholder: 'e.g. 6:00 PM – 7:00 PM' });
  if (item?.time_label) timeInput.value = item.time_label;
  const locationInput = h('input', { type: 'text', placeholder: 'e.g. Beach deck' });
  if (item?.location) locationInput.value = item.location;
  const descInput = h('textarea', { rows: '3', placeholder: 'e.g. A relaxing 60-minute outdoor yoga class led by our wellness coach. All levels welcome.' });
  if (item?.description) descInput.value = item.description;
  const priceInput = h('input', { type: 'number', step: '0.01', min: '0', placeholder: 'e.g. 25.00 (leave blank if free)' });
  if (item?.price != null) priceInput.value = String(item.price);

  const form = h('form', { onsubmit: async (e) => {
    e.preventDefault();
    let image_url = item?.image_url || null;
    const file = fileInput.files[0];
    if (file) image_url = await readImageAsBase64(file);
    const payload = {
      title: titleInput.value.trim(),
      subtitle: subtitleInput.value.trim() || null,
      description: descInput.value.trim() || null,
      location: locationInput.value.trim() || null,
      time_label: timeInput.value.trim() || null,
      price: priceInput.value ? Number(priceInput.value) : null,
      image_url,
    };
    try {
      if (isEdit) { await api.updateActivity(item.id, payload); toast('Activity updated'); }
      else { await api.createActivity(payload); toast('Activity added'); }
      m.close();
      setTab('today');
    } catch (err) { toast(err.message, 'error'); }
  }},
    h('div', { class: 'field' },
      h('label', { class: 'field-label' }, 'Photo'),
      h('div', { style: 'display:flex;align-items:center;gap:14px;' },
        previewEl,
        h('div', {},
          fileInput,
          h('div', { class: 'muted-text', style: 'font-size:12px;margin-top:4px;' }, 'JPG or PNG · max ~2 MB'),
        ),
      ),
    ),
    h('div', { class: 'field' }, h('label', { class: 'field-label' }, 'Title'), titleInput),
    h('div', { class: 'field' }, h('label', { class: 'field-label' }, 'Subtitle'), subtitleInput),
    h('div', { class: 'field-row' },
      h('div', { class: 'field' }, h('label', { class: 'field-label' }, 'When'), timeInput),
      h('div', { class: 'field' }, h('label', { class: 'field-label' }, 'Location'), locationInput),
    ),
    h('div', { class: 'field' }, h('label', { class: 'field-label' }, 'Description'), descInput),
    h('div', { class: 'field' }, h('label', { class: 'field-label' }, 'Price ($)'), priceInput),
    h('div', { style: 'display:flex;gap:10px;margin-top:20px;justify-content:space-between;align-items:center;' },
      isEdit
        ? h('button', { type: 'button', class: 'btn danger sm', onclick: async () => {
            if (!confirm(`Delete "${item.title}"?`)) return;
            try { await api.deleteActivity(item.id); toast('Activity deleted'); m.close(); setTab('today'); }
            catch (err) { toast(err.message, 'error'); }
          } }, 'Delete activity')
        : h('span'),
      h('div', { style: 'display:flex;gap:10px;' },
        h('button', { type: 'button', class: 'btn', onclick: () => m.close() }, 'Cancel'),
        h('button', { type: 'submit', class: 'btn primary' }, isEdit ? 'Save changes' : 'Add activity'),
      ),
    ),
  );

  const m = openModal(
    h('div', {},
      h('h3', { style: 'margin-bottom:16px;' }, isEdit ? `Edit — ${item.title}` : 'Add activity or event'),
      form,
    ),
    { large: true },
  );
}

function openActivityDetail(item) {
  const wrap = h('div', { class: 'pdj-detail' });
  if (item.image_url) {
    wrap.appendChild(h('img', { src: item.image_url, class: 'pdj-detail-img' }));
  }
  wrap.appendChild(h('div', { style: 'font-size:22px;font-weight:800;color:var(--navy);margin-top:4px;' }, item.title));
  if (item.subtitle) wrap.appendChild(h('div', { class: 'muted-text', style: 'font-size:14px;margin-top:4px;' }, item.subtitle));
  if (item.time_label || item.location) {
    wrap.appendChild(h('div', { style: 'margin-top:12px;display:flex;gap:18px;font-size:13px;color:var(--subtle);' },
      item.time_label ? h('div', {}, '⏱ ' + item.time_label) : null,
      item.location ? h('div', {}, '📍 ' + item.location) : null,
    ));
  }
  if (item.description) wrap.appendChild(h('p', { style: 'margin-top:14px;font-size:14px;line-height:1.65;' }, item.description));
  if (item.price != null) wrap.appendChild(h('div', { style: 'margin-top:16px;font-size:20px;font-weight:700;color:var(--navy);' }, `$${Number(item.price).toFixed(2)}`));
  if (item.is_today) wrap.appendChild(h('div', { style: 'margin-top:12px;display:inline-block;background:#fdf6ea;border:1px solid var(--gold);color:#8c6620;font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px;' }, '✓ Happening today'));
  wrap.appendChild(h('div', { style: 'margin-top:24px;display:flex;justify-content:space-between;align-items:center;gap:10px;' },
    h('button', { class: 'btn', onclick: () => { m.close(); openActivityModal(item); } }, 'Edit activity'),
    h('button', { class: 'btn primary', onclick: () => m.close() }, 'Close'),
  ));
  const m = openModal(wrap, { large: true });
}

// =========================== NOTIFICATIONS ===========================
async function renderNotifications() {
  const body = $('#page-body');
  $('#page-subtitle').textContent = 'Send announcements and deals to everyone, registered guests, or specific people.';

  const [history, users] = await Promise.all([api.notifications(), api.users()]);
  state.notifications = history;
  state.users = users;
  if (!(state.notifTargets instanceof Set)) state.notifTargets = new Set();
  if (state.notifAudience === 'guests') state.notifAudience = 'all'; // legacy

  // ----- Audience: compact inline radio strip -----
  const audiences = [
    { id: 'all', t: 'Everyone' },
    { id: 'registered', t: 'Registered guests' },
    { id: 'targeted', t: 'Specific people' },
  ];
  const audStrip = h('div', { class: 'aud-strip' });
  for (const a of audiences) {
    audStrip.append(h('button', {
      type: 'button',
      class: 'aud-btn' + (state.notifAudience === a.id ? ' active' : ''),
      onclick: () => { state.notifAudience = a.id; setTab('notifications'); },
    }, a.t));
  }

  // ----- Targeted picker (autocomplete + chips) -----
  const targetsHost = h('div');
  if (state.notifAudience === 'targeted') {
    const approved = users.filter(u => (u.status || 'approved') === 'approved');

    const chipRow = h('div', { class: 'chip-row' });
    const renderChips = () => {
      chipRow.innerHTML = '';
      if (!state.notifTargets.size) {
        chipRow.append(h('span', { class: 'muted-text' }, 'No recipients yet — use the search below.'));
        return;
      }
      const idToName = new Map(approved.map(u => [u.id, u.name]));
      for (const id of state.notifTargets) {
        const name = idToName.get(id) || `User ${id}`;
        chipRow.append(h('span', { class: 'recipient-chip' },
          name,
          h('button', { type: 'button', class: 'chip-x', title: 'Remove', onclick: () => {
            state.notifTargets.delete(id); renderChips();
          } }, '×'),
        ));
      }
    };
    renderChips();

    const searchInput = h('input', { type: 'search', placeholder: 'Search by name, email, or unit…' });
    const dropdown = h('div', { class: 'autocomplete' });
    dropdown.style.display = 'none';

    const renderResults = (q) => {
      const query = (q || '').trim().toLowerCase();
      const results = approved.filter(u => {
        if (state.notifTargets.has(u.id)) return false;
        if (!query) return true;
        return (u.name || '').toLowerCase().includes(query)
          || (u.email || '').toLowerCase().includes(query)
          || (u.room_number || '').toString().toLowerCase().includes(query)
          || (u.chalet_number || '').toString().toLowerCase().includes(query);
      }).slice(0, 8);

      dropdown.innerHTML = '';
      if (!results.length) {
        dropdown.append(h('div', { class: 'autocomplete-empty' }, query ? 'No matches' : 'Start typing to search'));
      } else {
        for (const u of results) {
          dropdown.append(h('button', {
            type: 'button',
            class: 'autocomplete-item',
            onmousedown: (e) => { e.preventDefault(); }, // keep input focus
            onclick: () => {
              state.notifTargets.add(u.id);
              renderChips();
              searchInput.value = '';
              renderResults('');
            },
          },
            h('div', { class: 'ac-name' }, u.name),
            h('div', { class: 'ac-meta' }, `${u.email} · ${unitLabel(u)}`),
          ));
        }
      }
      // Quick "select all matches"
      const matchPool = approved.filter(u => !state.notifTargets.has(u.id) && (
        !query
          ? true
          : ((u.name || '').toLowerCase().includes(query)
            || (u.email || '').toLowerCase().includes(query)
            || (u.room_number || '').toString().toLowerCase().includes(query)
            || (u.chalet_number || '').toString().toLowerCase().includes(query))
      ));
      if (matchPool.length > 0) {
        dropdown.append(h('button', {
          type: 'button',
          class: 'autocomplete-all',
          onmousedown: (e) => { e.preventDefault(); },
          onclick: () => {
            for (const u of matchPool) state.notifTargets.add(u.id);
            renderChips();
            searchInput.value = '';
            renderResults('');
          },
        }, query ? `Add all ${matchPool.length} matches` : `Add all ${matchPool.length} approved guests`));
      }
    };

    searchInput.addEventListener('focus', () => { dropdown.style.display = 'block'; renderResults(searchInput.value); });
    searchInput.addEventListener('input', (e) => { dropdown.style.display = 'block'; renderResults(e.target.value); });
    searchInput.addEventListener('blur', () => { setTimeout(() => { dropdown.style.display = 'none'; }, 120); });

    targetsHost.append(h('div', { class: 'field' },
      h('label', { class: 'field-label' }, `Recipients (${state.notifTargets.size})`),
      chipRow,
      h('div', { class: 'autocomplete-wrap' }, searchInput, dropdown),
    ));
  }

  // ----- Composer form -----
  const form = h('form', { onsubmit: async (e) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.target).entries());
    if (!fd.title || !fd.title.trim()) { toast('Title is required', 'error'); return; }
    if (!fd.body || !fd.body.trim()) { toast('Message body is required', 'error'); return; }
    const payload = { title: fd.title, body: fd.body, audience: state.notifAudience };
    if (state.notifAudience === 'targeted') {
      if (!state.notifTargets.size) { toast('Pick at least one recipient', 'error'); return; }
      payload.user_ids = Array.from(state.notifTargets);
    }
    try {
      const res = await api.sendNotification(payload);
      toast(`Sent (${res.sent_to || 0} recipient${res.sent_to === 1 ? '' : 's'})`);
      e.target.reset();
      state.notifTargets = new Set();
      setTab('notifications');
    } catch (err) { toast(err.message, 'error'); }
  } },
    h('div', { class: 'compose-row' },
      h('label', { class: 'field-label' }, 'Audience'),
      audStrip,
    ),
    targetsHost,
    h('div', { class: 'field' },
      h('label', { class: 'field-label' }, 'Title'),
      h('input', { name: 'title', class: 'composer-title', placeholder: 'e.g. Wine tasting tonight', required: true }),
    ),
    h('div', { class: 'field' },
      h('label', { class: 'field-label' }, 'Message'),
      h('textarea', { name: 'body', class: 'composer-body', placeholder: 'Details, time, where to meet…', required: true }),
    ),
    h('div', { class: 'modal-actions', style: 'justify-content: flex-start;' },
      h('button', { class: 'btn gold', type: 'submit' }, 'Send notification'),
    ),
  );

  body.appendChild(h('div', { class: 'card' }, form));

  // ----- History -----
  const hist = h('div', { class: 'card' });
  hist.append(h('h3', {}, 'Recent'));
  if (!history.length) {
    hist.append(h('div', { class: 'empty' }, 'No notifications sent yet.'));
  } else {
    const t = h('table', { class: 'table' });
    t.append(h('thead', {}, h('tr', {},
      h('th', {}, 'Sent'), h('th', {}, 'Title'), h('th', {}, 'Body'),
      h('th', {}, 'Audience'), h('th', { class: 'right' }, ''),
    )));
    const tb = h('tbody');
    for (const n of history) {
      // For targeted rows, show "Specific (Name1, Name2, …)" — the names list lives in recipient_names.
      let audienceLabel;
      if (n.audience === 'targeted') {
        const names = n.recipient_names ? ` (${n.recipient_names})` : '';
        audienceLabel = `Specific${names}`;
      } else if (n.audience === 'registered') {
        audienceLabel = 'Registered guests';
      } else if (n.audience === 'all' || !n.audience) {
        audienceLabel = n.user_id ? `User #${n.user_id}` : 'Everyone';
      } else {
        audienceLabel = n.audience;
      }
      tb.append(h('tr', {},
        h('td', { class: 'muted-text', style: 'white-space: nowrap;' }, fmtDateTime(n.created_at)),
        h('td', { style: 'font-weight: 600;' }, n.title),
        h('td', {}, h('div', { style: 'max-width: 360px; white-space: normal;' }, n.body || '—')),
        h('td', {}, h('div', { style: 'max-width: 280px; white-space: normal;' }, audienceLabel)),
        h('td', { class: 'right' },
          h('button', { class: 'icon-btn danger', onclick: async () => {
            if (!confirm('Remove from history?')) return;
            try { await api.deleteNotification(n.id); toast('Removed'); setTab('notifications'); } catch (e) { toast(e.message, 'error'); }
          } }, 'Delete'),
        ),
      ));
    }
    t.appendChild(tb);
    hist.append(t);
  }
  body.appendChild(hist);
}

// Boot.
boot();
