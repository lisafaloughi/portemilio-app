import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

function getApiBaseUrl() {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    return `http://${host}:4000/api`;
  }
  return 'http://localhost:4000/api';
}

export const API_BASE_URL = getApiBaseUrl();

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
  services: () => request('/services'),
  service: (key) => request(`/services/${key}`),
  landmarks: () => request('/landmarks'),
  landmark: (keyOrId) => request(`/landmarks/${keyOrId}`),
  platDuJour: () => request('/menu/plat-du-jour'),
  rentals: () => request('/rentals'),
  events: () => request('/events'),
  setting: (key) => request(`/settings/${key}`),

  // Bookings
  createBooking: (payload) => request('/bookings', { method: 'POST', body: payload }),
  myBookings: () => request('/bookings/mine'),
  cancelBooking: (id) => request(`/bookings/${id}`, { method: 'DELETE' }),
  availability: (resource, from, to) =>
    request(`/availability/${resource}?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`),

  // Deliveries
  createDelivery: (payload) => request('/deliveries', { method: 'POST', body: payload }),
  myDeliveries: () => request('/deliveries/mine'),
  clearDeliveryHistory: () => request('/deliveries/mine/history', { method: 'DELETE' }),
  clearBookingHistory: () => request('/bookings/mine/history', { method: 'DELETE' }),

  // Notifications
  myNotifications: () => request('/notifications/mine'),
  markNotificationRead: (id) => request(`/notifications/read/${id}`, { method: 'POST' }),
};
