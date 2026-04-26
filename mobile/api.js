import AsyncStorage from '@react-native-async-storage/async-storage';

// IMPORTANT: set this to your LAN IP (e.g. 192.168.1.20) so your phone can reach the backend.
// For iOS simulator / web, localhost is fine. For Android emulator, use 10.0.2.2.
export const API_BASE_URL = 'http://localhost:4000/api';
// export const API_BASE_URL = 'http://10.29.129.98:4000/api';

let authToken = null;

export async function loadToken() {
  authToken = await AsyncStorage.getItem('pt_token');
  return authToken;
}
export async function setToken(token) {
  authToken = token;
  if (token) await AsyncStorage.setItem('pt_token', token);
  else await AsyncStorage.removeItem('pt_token');
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && authToken) headers.Authorization = `Bearer ${authToken}`;
  let res;
  try {
    res = await fetch(API_BASE_URL + path, {
      method, headers, body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    throw new Error('Network error — make sure the API is running and API_BASE_URL in mobile/api.js is correct.');
  }
  let data = {};
  try { data = await res.json(); } catch {}
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  // Auth
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password }, auth: false }),
  register: (payload) => request('/auth/register', { method: 'POST', body: payload, auth: false }),
  me: () => request('/auth/me'),
  updateMe: (payload) => request('/auth/me', { method: 'PUT', body: payload }),

  // Catalog
  facilities: () => request('/facilities'),
  facility: (key) => request(`/facilities/${key}`),
  restaurants: () => request('/restaurants'),
  restaurant: (id) => request(`/restaurants/${id}`),
  platDuJour: () => request('/menu/plat-du-jour'),
  rentals: () => request('/rentals'),
  events: () => request('/events'),
  setting: (key) => request(`/settings/${key}`),

  // Bookings
  createBooking: (payload) => request('/bookings', { method: 'POST', body: payload }),
  myBookings: () => request('/bookings/mine'),
  cancelBooking: (id) => request(`/bookings/${id}`, { method: 'DELETE' }),

  // Deliveries
  createDelivery: (payload) => request('/deliveries', { method: 'POST', body: payload }),
  myDeliveries: () => request('/deliveries/mine'),

  // Notifications
  myNotifications: () => request('/notifications/mine'),
  markNotificationRead: (id) => request(`/notifications/read/${id}`, { method: 'POST' }),
};
