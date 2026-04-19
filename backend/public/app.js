// Portemilio Admin Portal — vanilla JS single-page app
const API = '/api';
const ADMIN = '/admin-api';

const state = {
  token: localStorage.getItem('pt_admin_token') || null,
  user: JSON.parse(localStorage.getItem('pt_admin_user') || 'null'),
  tab: 'dashboard',
};

const h = (tag, attrs = {}, ...children) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === 'class') el.className = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (v !== null && v !== undefined && v !== false) el.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    el.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(c) : c);
  }
  return el;
};

async function req(path, { method = 'GET', body, admin = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  const r = await fetch((admin ? ADMIN : API) + path, {
    method, headers, body: body ? JSON.stringify(body) : undefined
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// -------------------------- Login --------------------------
function renderLogin() {
  const app = document.getElementById('app');
  app.innerHTML = '';
  const email = h('input', { type: 'email', placeholder: 'admin@portemilio.com' });
  const password = h('input', { type: 'password', placeholder: '••••••••' });
  const err = h('div', { class: 'error' });
  const submit = async (e) => {
    e && e.preventDefault();
    err.textContent = '';
    try {
      const { token, user } = await req('/auth/login', { method: 'POST', body: { email: email.value, password: password.value } });
      if (!user.is_admin) throw new Error('This account is not an admin.');
      state.token = token; state.user = user;
      localStorage.setItem('pt_admin_token', token);
      localStorage.setItem('pt_admin_user', JSON.stringify(user));
      render();
    } catch (e) { err.textContent = e.message; }
  };
  app.append(
    h('div', { class: 'login-wrap' },
      h('form', { class: 'login-card', onsubmit: submit },
        h('h1', {}, 'Portemilio Admin'),
        h('p', {}, 'Resort management portal'),
        h('div', {}, h('label', {}, 'Email'), email),
        h('div', { style: 'margin-top:12px' }, h('label', {}, 'Password'), password),
        err,
        h('button', { class: 'btn btn-primary', style: 'width:100%;margin-top:20px', type: 'submit' }, 'Log in'),
      )
    )
  );
}

// -------------------------- Shell --------------------------
function renderShell(content) {
  const app = document.getElementById('app');
  app.innerHTML = '';

  const tabs = [
    ['dashboard', 'Dashboard'],
    ['facilities', 'Facilities'],
    ['restaurants', 'Restaurants'],
    ['menu', 'Menu Items'],
    ['rentals', 'Rentals'],
    ['events', 'Events'],
    ['bookings', 'Bookings'],
    ['deliveries', 'Delivery Orders'],
    ['users', 'Users'],
    ['notifications', 'Notifications'],
    ['settings', 'Settings'],
  ];

  const sidebar = h('aside', { class: 'sidebar' },
    h('div', { class: 'brand' },
      h('h2', {}, 'Portemilio'),
      h('small', {}, 'Admin Portal')
    ),
    ...tabs.map(([key, label]) =>
      h('button', {
        class: 'nav-btn' + (state.tab === key ? ' active' : ''),
        onclick: () => { state.tab = key; render(); }
      }, label)
    ),
    h('div', { class: 'logout' },
      h('div', { style: 'color:rgba(255,255,255,0.8);font-size:12px;margin-bottom:8px' }, state.user?.email || ''),
      h('button', {
        onclick: () => {
          localStorage.removeItem('pt_admin_token');
          localStorage.removeItem('pt_admin_user');
          state.token = null; state.user = null; render();
        }
      }, 'Log out')
    ),
  );

  app.append(h('div', { class: 'layout' }, sidebar, h('main', { class: 'main' }, content)));
}

// -------------------------- Dashboard --------------------------
async function renderDashboard() {
  const content = h('div', {}, h('h1', {}, 'Dashboard'), h('div', {}, 'Loading...'));
  renderShell(content);
  try {
    const s = await req('/stats', { admin: true });
    content.innerHTML = '';
    content.append(
      h('h1', {}, 'Dashboard'),
      h('div', { class: 'stats' },
        statCard(s.users, 'Registered users'),
        statCard(s.bookings_pending, 'Pending bookings'),
        statCard(s.deliveries_pending, 'Pending deliveries'),
        statCard(s.restaurants, 'Restaurants'),
        statCard(s.facilities, 'Facilities'),
        statCard(s.events_upcoming, 'Upcoming events'),
      ),
      h('p', { style: 'color:var(--muted);margin-top:20px' },
        'Use the sidebar to manage every part of the app. Changes are live for mobile users immediately.'
      )
    );
  } catch (e) {
    content.innerHTML = `<div class="error">${e.message}</div>`;
  }
}
function statCard(n, l) {
  return h('div', { class: 'stat' },
    h('div', { class: 'n' }, String(n ?? 0)),
    h('div', { class: 'l' }, l)
  );
}

// -------------------------- Generic CRUD table --------------------------
function textInput(id, label, value = '', type = 'text') {
  return h('div', {},
    h('label', { for: id }, label),
    h('input', { type, id, value: value ?? '' })
  );
}
function textarea(id, label, value = '') {
  return h('div', { class: 'full' },
    h('label', { for: id }, label),
    h('textarea', { id }, value ?? '')
  );
}
function selectInput(id, label, options, value) {
  const el = h('select', { id }, ...options.map(([v, t]) => h('option', { value: v }, t)));
  if (value !== undefined && value !== null) el.value = String(value);
  return h('div', {}, h('label', { for: id }, label), el);
}

function modal(title, body, onSave, saveLabel = 'Save') {
  const bg = h('div', { class: 'modal-bg' });
  const close = () => bg.remove();
  const saveBtn = h('button', { class: 'btn btn-primary', onclick: async () => {
    try { await onSave(); close(); }
    catch (e) { alert(e.message); }
  }}, saveLabel);
  bg.append(
    h('div', { class: 'modal' },
      h('h3', {}, title),
      body,
      h('div', { class: 'modal-footer' },
        h('button', { class: 'btn', onclick: close }, 'Cancel'),
        saveBtn,
      )
    )
  );
  document.body.append(bg);
  return close;
}

// -------------------------- Facilities --------------------------
async function renderFacilities() {
  const content = h('div', {}, h('h1', {}, 'Facilities'));
  renderShell(content);
  const items = await req('/facilities', { admin: true });
  const table = h('table', {},
    h('thead', {}, h('tr', {},
      ['Key','Name','Category','Hours','Location','Bookable','Actions'].map(x => h('th', {}, x))
    )),
    h('tbody', {}, ...items.map(f => h('tr', {},
      h('td', {}, f.key),
      h('td', {}, f.name),
      h('td', {}, f.category || '-'),
      h('td', {}, f.hours || '-'),
      h('td', {}, f.location || '-'),
      h('td', {}, f.bookable ? 'Yes' : 'No'),
      h('td', {},
        h('button', { class: 'btn btn-small', onclick: () => editFacility(f) }, 'Edit'),
        ' ',
        h('button', { class: 'btn btn-small btn-danger', onclick: async () => {
          if (!confirm('Delete this facility?')) return;
          await req(`/facilities/${f.id}`, { method: 'DELETE', admin: true });
          render();
        }}, 'Delete')
      )
    )))
  );
  content.append(
    h('div', { class: 'toolbar' },
      h('div', { style: 'color:var(--muted);font-size:13px' }, `${items.length} facilities`),
      h('button', { class: 'btn btn-primary', onclick: () => editFacility() }, '+ New facility')
    ),
    items.length ? table : h('div', { class: 'empty' }, 'No facilities yet.')
  );
}
function editFacility(f = {}) {
  const form = h('div', { class: 'form-grid' },
    textInput('f_key', 'Key (unique, e.g. "spa")', f.key),
    textInput('f_name', 'Name', f.name),
    textInput('f_category', 'Category', f.category),
    textInput('f_hours', 'Hours', f.hours),
    textInput('f_location', 'Location', f.location),
    textInput('f_phone', 'Phone', f.phone),
    textInput('f_price', 'Price', f.price),
    selectInput('f_bookable', 'Bookable?', [['0','No'],['1','Yes']], f.bookable ?? 0),
    textInput('f_image_url', 'Image URL (or placeholder key)', f.image_url),
    textarea('f_description', 'Description', f.description),
    textarea('f_extra_info', 'Extra info', f.extra_info),
  );
  modal(f.id ? 'Edit facility' : 'New facility', form, async () => {
    const payload = {
      key: val('f_key'), name: val('f_name'), category: val('f_category'),
      hours: val('f_hours'), location: val('f_location'), phone: val('f_phone'),
      price: val('f_price'), bookable: Number(val('f_bookable')), image_url: val('f_image_url'),
      description: val('f_description'), extra_info: val('f_extra_info')
    };
    if (f.id) await req(`/facilities/${f.id}`, { method: 'PUT', body: payload, admin: true });
    else await req('/facilities', { method: 'POST', body: payload, admin: true });
    render();
  });
}
const val = id => document.getElementById(id).value;

// -------------------------- Restaurants --------------------------
async function renderRestaurants() {
  const content = h('div', {}, h('h1', {}, 'Restaurants'));
  renderShell(content);
  const items = await req('/restaurants', { admin: true });
  const table = h('table', {},
    h('thead', {}, h('tr', {}, ['Name','Cuisine','Hours','Delivery','Actions'].map(x => h('th', {}, x)))),
    h('tbody', {}, ...items.map(r => h('tr', {},
      h('td', {}, r.name),
      h('td', {}, r.cuisine || '-'),
      h('td', {}, r.hours || '-'),
      h('td', {}, r.delivery ? 'Yes' : 'No'),
      h('td', {},
        h('button', { class: 'btn btn-small', onclick: () => editRestaurant(r) }, 'Edit'),
        ' ',
        h('button', { class: 'btn btn-small btn-danger', onclick: async () => {
          if (!confirm('Delete this restaurant and all its menu items?')) return;
          await req(`/restaurants/${r.id}`, { method: 'DELETE', admin: true });
          render();
        }}, 'Delete')
      )
    )))
  );
  content.append(
    h('div', { class: 'toolbar' },
      h('div', { style: 'color:var(--muted);font-size:13px' }, `${items.length} restaurants`),
      h('button', { class: 'btn btn-primary', onclick: () => editRestaurant() }, '+ New restaurant')
    ),
    items.length ? table : h('div', { class: 'empty' }, 'No restaurants yet.')
  );
}
function editRestaurant(r = {}) {
  const form = h('div', { class: 'form-grid' },
    textInput('r_name', 'Name', r.name),
    textInput('r_cuisine', 'Cuisine', r.cuisine),
    textInput('r_hours', 'Hours', r.hours),
    textInput('r_location', 'Location', r.location),
    textInput('r_phone', 'Phone', r.phone),
    selectInput('r_delivery', 'Delivery?', [['0','No'],['1','Yes']], r.delivery ?? 0),
    textInput('r_image_url', 'Image URL', r.image_url),
    textarea('r_description', 'Description', r.description),
  );
  modal(r.id ? 'Edit restaurant' : 'New restaurant', form, async () => {
    const payload = {
      name: val('r_name'), cuisine: val('r_cuisine'), hours: val('r_hours'),
      location: val('r_location'), phone: val('r_phone'),
      delivery: Number(val('r_delivery')), image_url: val('r_image_url'),
      description: val('r_description')
    };
    if (r.id) await req(`/restaurants/${r.id}`, { method: 'PUT', body: payload, admin: true });
    else await req('/restaurants', { method: 'POST', body: payload, admin: true });
    render();
  });
}

// -------------------------- Menu Items --------------------------
async function renderMenu() {
  const content = h('div', {}, h('h1', {}, 'Menu Items'));
  renderShell(content);
  const [items, restaurants] = await Promise.all([
    req('/menu-items', { admin: true }),
    req('/restaurants', { admin: true }),
  ]);
  const rmap = Object.fromEntries(restaurants.map(r => [r.id, r.name]));
  const table = h('table', {},
    h('thead', {}, h('tr', {}, ['Restaurant','Name','Category','Price','Plat du jour','Available','Actions'].map(x => h('th', {}, x)))),
    h('tbody', {}, ...items.map(m => h('tr', {},
      h('td', {}, rmap[m.restaurant_id] || '?'),
      h('td', {}, m.name),
      h('td', {}, m.category || '-'),
      h('td', {}, `$${Number(m.price).toFixed(2)}`),
      h('td', {}, m.plat_du_jour ? 'YES' : ''),
      h('td', {}, m.available ? 'Yes' : 'No'),
      h('td', {},
        h('button', { class: 'btn btn-small', onclick: () => editMenuItem(m, restaurants) }, 'Edit'),
        ' ',
        h('button', { class: 'btn btn-small btn-danger', onclick: async () => {
          if (!confirm('Delete this menu item?')) return;
          await req(`/menu-items/${m.id}`, { method: 'DELETE', admin: true });
          render();
        }}, 'Delete')
      )
    )))
  );
  content.append(
    h('div', { class: 'toolbar' },
      h('div', { style: 'color:var(--muted);font-size:13px' }, `${items.length} menu items`),
      h('button', { class: 'btn btn-primary', onclick: () => editMenuItem({}, restaurants) }, '+ New item')
    ),
    items.length ? table : h('div', { class: 'empty' }, 'No menu items yet.')
  );
}
function editMenuItem(m = {}, restaurants) {
  const form = h('div', { class: 'form-grid' },
    selectInput('m_restaurant_id', 'Restaurant', restaurants.map(r => [r.id, r.name]), m.restaurant_id),
    textInput('m_name', 'Name', m.name),
    textInput('m_category', 'Category', m.category),
    textInput('m_price', 'Price', m.price, 'number'),
    selectInput('m_plat_du_jour', 'Plat du jour?', [['0','No'],['1','Yes']], m.plat_du_jour ?? 0),
    selectInput('m_available', 'Available?', [['1','Yes'],['0','No']], m.available ?? 1),
    textInput('m_image_url', 'Image URL', m.image_url),
    textarea('m_description', 'Description', m.description),
  );
  modal(m.id ? 'Edit menu item' : 'New menu item', form, async () => {
    const payload = {
      restaurant_id: Number(val('m_restaurant_id')),
      name: val('m_name'), category: val('m_category'),
      price: Number(val('m_price')),
      plat_du_jour: Number(val('m_plat_du_jour')),
      available: Number(val('m_available')),
      image_url: val('m_image_url'), description: val('m_description')
    };
    if (m.id) await req(`/menu-items/${m.id}`, { method: 'PUT', body: payload, admin: true });
    else await req('/menu-items', { method: 'POST', body: payload, admin: true });
    render();
  });
}

// -------------------------- Rentals --------------------------
async function renderRentals() {
  const content = h('div', {}, h('h1', {}, 'Rentals'));
  renderShell(content);
  const items = await req('/rentals', { admin: true });
  const table = h('table', {},
    h('thead', {}, h('tr', {}, ['Name','Category','Price/hour','Available','Actions'].map(x => h('th', {}, x)))),
    h('tbody', {}, ...items.map(r => h('tr', {},
      h('td', {}, r.name),
      h('td', {}, r.category || '-'),
      h('td', {}, `$${Number(r.price_per_hour).toFixed(2)}`),
      h('td', {}, r.available ? 'Yes' : 'No'),
      h('td', {},
        h('button', { class: 'btn btn-small', onclick: () => editRental(r) }, 'Edit'),
        ' ',
        h('button', { class: 'btn btn-small btn-danger', onclick: async () => {
          if (!confirm('Delete this rental?')) return;
          await req(`/rentals/${r.id}`, { method: 'DELETE', admin: true });
          render();
        }}, 'Delete')
      )
    )))
  );
  content.append(
    h('div', { class: 'toolbar' },
      h('div', { style: 'color:var(--muted);font-size:13px' }, `${items.length} rentals`),
      h('button', { class: 'btn btn-primary', onclick: () => editRental() }, '+ New rental')
    ),
    items.length ? table : h('div', { class: 'empty' }, 'No rentals yet.')
  );
}
function editRental(r = {}) {
  const form = h('div', { class: 'form-grid' },
    textInput('rt_name', 'Name', r.name),
    textInput('rt_category', 'Category', r.category),
    textInput('rt_price_per_hour', 'Price per hour', r.price_per_hour, 'number'),
    selectInput('rt_available', 'Available?', [['1','Yes'],['0','No']], r.available ?? 1),
    textInput('rt_image_url', 'Image URL', r.image_url),
    textarea('rt_description', 'Description', r.description),
  );
  modal(r.id ? 'Edit rental' : 'New rental', form, async () => {
    const payload = {
      name: val('rt_name'), category: val('rt_category'),
      price_per_hour: Number(val('rt_price_per_hour')),
      available: Number(val('rt_available')),
      image_url: val('rt_image_url'), description: val('rt_description')
    };
    if (r.id) await req(`/rentals/${r.id}`, { method: 'PUT', body: payload, admin: true });
    else await req('/rentals', { method: 'POST', body: payload, admin: true });
    render();
  });
}

// -------------------------- Events --------------------------
async function renderEvents() {
  const content = h('div', {}, h('h1', {}, 'Events'));
  renderShell(content);
  const items = await req('/events', { admin: true });
  const table = h('table', {},
    h('thead', {}, h('tr', {}, ['Title','Location','Start','End','Capacity','Actions'].map(x => h('th', {}, x)))),
    h('tbody', {}, ...items.map(e => h('tr', {},
      h('td', {}, e.title),
      h('td', {}, e.location || '-'),
      h('td', {}, formatDT(e.start_time)),
      h('td', {}, formatDT(e.end_time)),
      h('td', {}, e.capacity || '-'),
      h('td', {},
        h('button', { class: 'btn btn-small', onclick: () => editEvent(e) }, 'Edit'),
        ' ',
        h('button', { class: 'btn btn-small btn-danger', onclick: async () => {
          if (!confirm('Delete this event?')) return;
          await req(`/events/${e.id}`, { method: 'DELETE', admin: true });
          render();
        }}, 'Delete')
      )
    )))
  );
  content.append(
    h('div', { class: 'toolbar' },
      h('div', { style: 'color:var(--muted);font-size:13px' }, `${items.length} events`),
      h('button', { class: 'btn btn-primary', onclick: () => editEvent() }, '+ New event')
    ),
    items.length ? table : h('div', { class: 'empty' }, 'No events yet.')
  );
}
function editEvent(e = {}) {
  const form = h('div', { class: 'form-grid' },
    textInput('e_title', 'Title', e.title),
    textInput('e_location', 'Location', e.location),
    textInput('e_start_time', 'Start (YYYY-MM-DDTHH:MM)', dtLocalValue(e.start_time), 'datetime-local'),
    textInput('e_end_time', 'End (YYYY-MM-DDTHH:MM)', dtLocalValue(e.end_time), 'datetime-local'),
    textInput('e_capacity', 'Capacity', e.capacity, 'number'),
    selectInput('e_bookable', 'Bookable?', [['1','Yes'],['0','No']], e.bookable ?? 1),
    textInput('e_image_url', 'Image URL', e.image_url),
    textarea('e_description', 'Description', e.description),
  );
  modal(e.id ? 'Edit event' : 'New event', form, async () => {
    const payload = {
      title: val('e_title'), location: val('e_location'),
      start_time: val('e_start_time'), end_time: val('e_end_time') || null,
      capacity: val('e_capacity') ? Number(val('e_capacity')) : null,
      bookable: Number(val('e_bookable')),
      image_url: val('e_image_url'), description: val('e_description')
    };
    if (e.id) await req(`/events/${e.id}`, { method: 'PUT', body: payload, admin: true });
    else await req('/events', { method: 'POST', body: payload, admin: true });
    render();
  });
}
function dtLocalValue(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
function formatDT(iso) {
  if (!iso) return '-';
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
}

// -------------------------- Bookings --------------------------
async function renderBookings() {
  const content = h('div', {}, h('h1', {}, 'Bookings'));
  renderShell(content);
  const items = await req('/bookings', { admin: true });
  const row = (b) => h('tr', {},
    h('td', {}, b.user_name || b.user_email),
    h('td', {}, (b.resource_type || '') + (b.resource_name ? ` — ${b.resource_name}` : '')),
    h('td', {}, formatDT(b.start_time)),
    h('td', {}, b.party_size ?? 1),
    h('td', {}, b.room_number || b.chalet_number || '-'),
    h('td', {}, h('span', { class: `badge badge-${b.status}` }, b.status)),
    h('td', {}, b.notes || ''),
    h('td', {},
      h('button', { class: 'btn btn-small', onclick: async () => {
        await req(`/bookings/${b.id}/status`, { method: 'PUT', body: { status: 'confirmed' }, admin: true });
        render();
      }}, 'Confirm'),
      ' ',
      h('button', { class: 'btn btn-small btn-danger', onclick: async () => {
        await req(`/bookings/${b.id}/status`, { method: 'PUT', body: { status: 'cancelled' }, admin: true });
        render();
      }}, 'Cancel'),
    )
  );
  content.append(
    h('div', { class: 'toolbar' }, h('div', { style: 'color:var(--muted);font-size:13px' }, `${items.length} bookings`)),
    items.length
      ? h('table', {},
          h('thead', {}, h('tr', {}, ['Guest','Resource','Start','Party','Room/Chalet','Status','Notes','Actions'].map(x => h('th', {}, x)))),
          h('tbody', {}, ...items.map(row))
        )
      : h('div', { class: 'empty' }, 'No bookings yet.')
  );
}

// -------------------------- Deliveries --------------------------
async function renderDeliveries() {
  const content = h('div', {}, h('h1', {}, 'Delivery Orders'));
  renderShell(content);
  const items = await req('/deliveries', { admin: true });
  const row = (d) => h('tr', {},
    h('td', {}, d.user_name || d.user_email),
    h('td', {}, d.restaurant_name || '-'),
    h('td', {}, d.room_or_chalet || '-'),
    h('td', {}, (d.items || []).map(i => `${i.qty}× ${i.name}`).join(', ')),
    h('td', {}, `$${Number(d.total).toFixed(2)}`),
    h('td', {}, formatDT(d.created_at)),
    h('td', {}, h('span', { class: `badge badge-${d.status}` }, d.status)),
    h('td', {},
      h('button', { class: 'btn btn-small', onclick: async () => {
        await req(`/deliveries/${d.id}/status`, { method: 'PUT', body: { status: 'delivered' }, admin: true });
        render();
      }}, 'Delivered'),
      ' ',
      h('button', { class: 'btn btn-small btn-danger', onclick: async () => {
        await req(`/deliveries/${d.id}/status`, { method: 'PUT', body: { status: 'cancelled' }, admin: true });
        render();
      }}, 'Cancel'),
    )
  );
  content.append(
    h('div', { class: 'toolbar' }, h('div', { style: 'color:var(--muted);font-size:13px' }, `${items.length} deliveries`)),
    items.length
      ? h('table', {},
          h('thead', {}, h('tr', {}, ['Guest','Restaurant','Destination','Items','Total','Ordered','Status','Actions'].map(x => h('th', {}, x)))),
          h('tbody', {}, ...items.map(row))
        )
      : h('div', { class: 'empty' }, 'No delivery orders yet.')
  );
}

// -------------------------- Users --------------------------
async function renderUsers() {
  const content = h('div', {}, h('h1', {}, 'Users'));
  renderShell(content);
  const items = await req('/users', { admin: true });
  const table = h('table', {},
    h('thead', {}, h('tr', {}, ['Name','Email','Phone','Room','Chalet','Admin','Joined','Actions'].map(x => h('th', {}, x)))),
    h('tbody', {}, ...items.map(u => h('tr', {},
      h('td', {}, u.name),
      h('td', {}, u.email),
      h('td', {}, u.phone || '-'),
      h('td', {}, u.room_number || '-'),
      h('td', {}, u.chalet_number || '-'),
      h('td', {}, u.is_admin ? 'YES' : ''),
      h('td', {}, formatDT(u.created_at)),
      h('td', {},
        h('button', { class: 'btn btn-small btn-danger', onclick: async () => {
          if (!confirm(`Delete user ${u.email}?`)) return;
          await req(`/users/${u.id}`, { method: 'DELETE', admin: true });
          render();
        }}, 'Delete')
      )
    )))
  );
  content.append(
    h('div', { class: 'toolbar' },
      h('div', { style: 'color:var(--muted);font-size:13px' }, `${items.length} users`),
      h('button', { class: 'btn btn-primary', onclick: () => newUserModal() }, '+ New staff/admin')
    ),
    items.length ? table : h('div', { class: 'empty' }, 'No users yet.')
  );
}
function newUserModal() {
  const form = h('div', { class: 'form-grid' },
    textInput('u_name', 'Name'),
    textInput('u_email', 'Email', '', 'email'),
    textInput('u_password', 'Temporary password', '', 'password'),
    textInput('u_phone', 'Phone'),
    textInput('u_room_number', 'Room #'),
    textInput('u_chalet_number', 'Chalet #'),
    selectInput('u_is_admin', 'Admin?', [['0','No'],['1','Yes']], 0),
  );
  modal('New user', form, async () => {
    const payload = {
      name: val('u_name'), email: val('u_email'),
      password: val('u_password'), phone: val('u_phone'),
      room_number: val('u_room_number'), chalet_number: val('u_chalet_number'),
      is_admin: Number(val('u_is_admin')),
    };
    await req('/users', { method: 'POST', body: payload, admin: true });
    render();
  });
}

// -------------------------- Notifications --------------------------
async function renderNotifications() {
  const content = h('div', {}, h('h1', {}, 'Notifications'));
  renderShell(content);
  const items = await req('/notifications', { admin: true });
  const table = h('table', {},
    h('thead', {}, h('tr', {}, ['Title','Body','Audience','Sent'].map(x => h('th', {}, x)))),
    h('tbody', {}, ...items.map(n => h('tr', {},
      h('td', {}, n.title),
      h('td', {}, n.body || ''),
      h('td', {}, n.user_id ? `User #${n.user_id}` : 'Broadcast (all guests)'),
      h('td', {}, formatDT(n.created_at)),
    )))
  );
  const compose = h('div', { class: 'stat', style: 'margin-bottom:20px' },
    h('h3', { style: 'margin:0 0 12px' }, 'Send broadcast notification'),
    h('div', { class: 'form-grid' },
      textInput('n_title', 'Title'),
      h('div', {}),
      textarea('n_body', 'Body'),
    ),
    h('div', { style: 'margin-top:12px' },
      h('button', { class: 'btn btn-primary', onclick: async () => {
        const title = val('n_title').trim();
        if (!title) return alert('Title required');
        await req('/notifications', { method: 'POST', body: { title, body: val('n_body') }, admin: true });
        render();
      }}, 'Send to all guests')
    )
  );
  content.append(compose, items.length ? table : h('div', { class: 'empty' }, 'No notifications sent yet.'));
}

// -------------------------- Settings --------------------------
async function renderSettings() {
  const content = h('div', {}, h('h1', {}, 'Settings'));
  renderShell(content);
  const items = await req('/settings', { admin: true });
  const rows = items.map(s => {
    const input = h('input', { type: 'text', value: s.value || '' });
    return h('tr', {},
      h('td', { style: 'font-family:monospace' }, s.key),
      h('td', {}, input),
      h('td', {},
        h('button', { class: 'btn btn-small btn-primary', onclick: async () => {
          await req(`/settings/${s.key}`, { method: 'PUT', body: { value: input.value }, admin: true });
          alert('Saved');
        }}, 'Save')
      )
    );
  });
  content.append(
    h('p', { style: 'color:var(--muted)' }, 'These settings appear in the guest app (welcome message, phone numbers, Wi-Fi, etc).'),
    h('table', {}, h('thead', {}, h('tr', {}, ['Key','Value','Action'].map(x => h('th', {}, x)))), h('tbody', {}, ...rows))
  );
}

// -------------------------- Router --------------------------
function render() {
  if (!state.token || !state.user?.is_admin) return renderLogin();
  const map = {
    dashboard: renderDashboard,
    facilities: renderFacilities,
    restaurants: renderRestaurants,
    menu: renderMenu,
    rentals: renderRentals,
    events: renderEvents,
    bookings: renderBookings,
    deliveries: renderDeliveries,
    users: renderUsers,
    notifications: renderNotifications,
    settings: renderSettings,
  };
  (map[state.tab] || renderDashboard)().catch(e => {
    document.getElementById('app').innerHTML = `<div class="error" style="padding:20px">${e.message}</div>`;
  });
}

render();
