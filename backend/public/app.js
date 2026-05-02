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
  { id: 'content', label: 'Content' },
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

  const tile = (label, value, hint, alert) =>
    h('div', { class: 'stat-tile' + (alert ? ' alert' : '') },
      h('div', { class: 'label' }, label),
      h('div', { class: 'value' }, String(value || 0)),
      hint ? h('div', { class: 'hint' }, hint) : null,
    );

  body.appendChild(h('div', { class: 'stat-grid' },
    tile('Pending approvals', d.users_pending, 'Awaiting verification', d.users_pending > 0),
    tile('Pending deliveries', d.deliveries_pending, 'New orders', d.deliveries_pending > 0),
    tile('In progress', d.deliveries_in_progress, 'Processing or out for delivery'),
    tile('Bookings today', d.bookings_today, 'Confirmed activity'),
    tile('Pending bookings', d.bookings_pending, ''),
    tile('Total guests', d.users_total, ''),
    tile('Upcoming events', d.events_upcoming, ''),
    tile('Restaurants', d.restaurants, ''),
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

  const t = h('table', { class: 'table' });
  t.append(h('thead', {}, h('tr', {},
    h('th', {}, 'Placed'), h('th', {}, 'Guest'), h('th', {}, 'Restaurant'),
    h('th', {}, 'Items'), h('th', {}, 'Destination'), h('th', {}, 'Total'),
    h('th', {}, 'Scheduled'), h('th', {}, 'Status'), h('th', { class: 'right' }, ''),
  )));
  const tb = h('tbody');

  const STATUSES = ['pending', 'processing', 'out_for_delivery', 'delivered', 'cancelled'];

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
    const sel = h('select', {
      onchange: async (e) => {
        try { await api.setDeliveryStatus(d.id, e.target.value); toast('Updated'); }
        catch (err) { toast(err.message, 'error'); }
      },
    });
    for (const s of STATUSES) {
      const o = h('option', { value: s }, s.replace(/_/g, ' '));
      if (d.status === s) o.selected = true;
      sel.appendChild(o);
    }
    tb.append(h('tr', {},
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
    ));
  }
  t.appendChild(tb);
  body.appendChild(h('div', { class: 'card', style: 'padding: 0; overflow: hidden;' }, t));
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
  $('#page-subtitle').textContent = 'Edit the information shown in the guest app — restaurants, menus, facilities and events.';

  const tabs = h('div', { class: 'subtabs' });
  const TS = [
    { id: 'restaurants', label: 'Restaurants' },
    { id: 'menu', label: 'Menus' },
    { id: 'facilities', label: 'Facilities' },
    { id: 'events', label: 'Events' },
  ];
  for (const t of TS) {
    tabs.append(h('button', {
      class: 'subtab' + (state.contentTab === t.id ? ' active' : ''),
      onclick: () => { state.contentTab = t.id; setTab('content'); },
    }, t.label));
  }
  body.appendChild(tabs);

  if (state.contentTab === 'restaurants') await renderRestaurants(body);
  else if (state.contentTab === 'menu') await renderMenuItems(body);
  else if (state.contentTab === 'facilities') await renderFacilities(body);
  else if (state.contentTab === 'events') await renderEvents(body);
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
    h('th', {}, 'Location'), h('th', {}, 'Phone'), h('th', {}, 'Delivery'),
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
      h('td', {}, r.delivery ? 'Yes' : 'No'),
    ));
  }
  t.appendChild(tb);
  body.appendChild(h('div', { class: 'card', style: 'padding: 0; overflow: hidden;' }, t));
}

function openRestaurantModal(r) {
  const isEdit = !!r;
  // Highlights are stored as a JSON-encoded array. Show as one-per-line in the form.
  let initialHighlights = '';
  if (r?.highlights) {
    try { initialHighlights = JSON.parse(r.highlights).join('\n'); }
    catch { initialHighlights = r.highlights; }
  }
  const form = h('form', { onsubmit: async (e) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.target).entries());
    fd.delivery = e.target.delivery.checked ? 1 : 0;
    fd.upcoming = e.target.upcoming.checked ? 1 : 0;
    fd.sort_order = fd.sort_order ? Number(fd.sort_order) : 0;
    // Highlights: split lines, drop blanks, encode.
    const lines = (fd.highlights || '').split('\n').map(s => s.trim()).filter(Boolean);
    fd.highlights = lines.length ? JSON.stringify(lines) : null;
    try {
      if (isEdit) await api.updateRestaurant(r.id, fd);
      else await api.createRestaurant(fd);
      toast('Saved'); m.close(); setTab('content');
    } catch (err) { toast(err.message, 'error'); }
  } },
    h('div', { class: 'field-row' },
      h('div', { class: 'field' },
        h('label', { class: 'field-label' }, 'Slug (stable id)'),
        h('input', { name: 'slug', value: r?.slug || '', placeholder: 'e.g. la-reserve' }),
      ),
      h('div', { class: 'field' },
        h('label', { class: 'field-label' }, 'Sort order'),
        h('input', { type: 'number', name: 'sort_order', value: r?.sort_order || 0 }),
      ),
    ),
    h('div', { class: 'field' }, h('label', { class: 'field-label' }, 'Name'), h('input', { name: 'name', value: r?.name || '', required: true })),
    h('div', { class: 'field-row' },
      h('div', { class: 'field' },
        h('label', { class: 'field-label' }, 'Specialty (one-line tagline)'),
        h('input', { name: 'specialty', value: r?.specialty || '', placeholder: 'e.g. Brunch on Sundays' }),
      ),
      h('div', { class: 'field' },
        h('label', { class: 'field-label' }, 'Categories (comma-separated)'),
        h('input', { name: 'categories', value: r?.categories || '', placeholder: 'restaurants, bars' }),
      ),
    ),
    h('div', { class: 'field-row' },
      h('div', { class: 'field' }, h('label', { class: 'field-label' }, 'Cuisine'), h('input', { name: 'cuisine', value: r?.cuisine || '' })),
      h('div', { class: 'field' }, h('label', { class: 'field-label' }, 'Hours'), h('input', { name: 'hours', value: r?.hours || '', placeholder: 'e.g. 12:00 – 23:00' })),
    ),
    h('div', { class: 'field-row' },
      h('div', { class: 'field' }, h('label', { class: 'field-label' }, 'Address / location'), h('input', { name: 'address', value: r?.address || '' })),
      h('div', { class: 'field' }, h('label', { class: 'field-label' }, 'Phone'), h('input', { name: 'phone', value: r?.phone || '' })),
    ),
    h('div', { class: 'field' }, h('label', { class: 'field-label' }, 'Description'), h('textarea', { name: 'description' }, r?.description || '')),
    h('div', { class: 'field' },
      h('label', { class: 'field-label' }, 'Highlights (one per line — shown as bullet points)'),
      h('textarea', { name: 'highlights', placeholder: 'Sunday brunch · 1 PM – 6 PM\nBuffet for $35/adult' }, initialHighlights),
    ),
    h('div', { class: 'field' },
      h('label', { class: 'field-label' }, 'Map pin id'),
      h('input', { name: 'map_pin_id', value: r?.map_pin_id || '' }),
    ),
    h('div', { class: 'field row-flex' },
      h('label', { class: 'checkbox-row' },
        (() => { const c = h('input', { type: 'checkbox', name: 'delivery' }); c.checked = !!r?.delivery; return c; })(),
        'Offers delivery',
      ),
      h('label', { class: 'checkbox-row' },
        (() => { const c = h('input', { type: 'checkbox', name: 'upcoming' }); c.checked = !!r?.upcoming; return c; })(),
        'Coming soon',
      ),
    ),
    h('div', { class: 'modal-actions' },
      h('button', { type: 'button', class: 'btn ghost', onclick: () => m.close() }, 'Cancel'),
      h('button', { type: 'submit', class: 'btn primary' }, isEdit ? 'Save' : 'Create'),
    ),
  );
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

  const t = h('table', { class: 'table' });
  t.append(h('thead', {}, h('tr', {},
    h('th', {}, 'Name'), h('th', {}, 'Category'), h('th', {}, 'Hours'),
    h('th', {}, 'Location'), h('th', {}, 'Phone'),
    h('th', { class: 'right' }, ''),
  )));
  const tb = h('tbody');
  for (const f of list) {
    tb.append(h('tr', { style: 'cursor: pointer;', onclick: () => openFacilityModal(f) },
      h('td', {}, h('div', { style: 'font-weight: 600;' }, f.name), h('div', { class: 'muted-text' }, f.key)),
      h('td', {}, f.category || '—'),
      h('td', {}, f.hours || '—'),
      h('td', {}, f.location || '—'),
      h('td', {}, f.phone || '—'),
      h('td', { class: 'right' },
        h('button', { class: 'icon-btn danger', onclick: async (e) => {
          e.stopPropagation();
          if (!confirm(`Delete ${f.name}?`)) return;
          try { await api.deleteFacility(f.id); toast('Deleted'); setTab('content'); } catch (e) { toast(e.message, 'error'); }
        } }, 'Delete'),
      ),
    ));
  }
  t.appendChild(tb);
  body.appendChild(h('div', { class: 'card', style: 'padding: 0; overflow: hidden;' }, t));
}

function openFacilityModal(f) {
  const isEdit = !!f;
  const form = h('form', { onsubmit: async (e) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.target).entries());
    fd.bookable = e.target.bookable.checked ? 1 : 0;
    try {
      if (isEdit) await api.updateFacility(f.id, fd);
      else await api.createFacility(fd);
      toast('Saved'); m.close(); setTab('content');
    } catch (err) { toast(err.message, 'error'); }
  } },
    h('div', { class: 'field-row' },
      h('div', { class: 'field' }, h('label', { class: 'field-label' }, 'Key'), h('input', { name: 'key', value: f?.key || '', required: true })),
      h('div', { class: 'field' }, h('label', { class: 'field-label' }, 'Name'), h('input', { name: 'name', value: f?.name || '', required: true })),
    ),
    h('div', { class: 'field-row' },
      h('div', { class: 'field' }, h('label', { class: 'field-label' }, 'Category'), h('input', { name: 'category', value: f?.category || '' })),
      h('div', { class: 'field' }, h('label', { class: 'field-label' }, 'Hours'), h('input', { name: 'hours', value: f?.hours || '' })),
    ),
    h('div', { class: 'field-row' },
      h('div', { class: 'field' }, h('label', { class: 'field-label' }, 'Location'), h('input', { name: 'location', value: f?.location || '' })),
      h('div', { class: 'field' }, h('label', { class: 'field-label' }, 'Phone'), h('input', { name: 'phone', value: f?.phone || '' })),
    ),
    h('div', { class: 'field-row' },
      h('div', { class: 'field' }, h('label', { class: 'field-label' }, 'Price'), h('input', { name: 'price', value: f?.price || '' })),
      h('div', { class: 'field' },
        h('label', { class: 'field-label' }, 'Extra info'),
        h('input', { name: 'extra_info', value: f?.extra_info || '' }),
      ),
    ),
    h('div', { class: 'field' }, h('label', { class: 'field-label' }, 'Description'), h('textarea', { name: 'description' }, f?.description || '')),
    h('div', { class: 'field' },
      h('label', { class: 'checkbox-row' },
        (() => { const c = h('input', { type: 'checkbox', name: 'bookable' }); c.checked = !!f?.bookable; return c; })(),
        'Bookable',
      ),
    ),
    h('div', { class: 'modal-actions' },
      h('button', { type: 'button', class: 'btn ghost', onclick: () => m.close() }, 'Cancel'),
      h('button', { type: 'submit', class: 'btn primary' }, isEdit ? 'Save' : 'Create'),
    ),
  );
  const m = openModal(h('div', {}, h('h3', {}, isEdit ? 'Edit facility' : 'New facility'), form));
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
