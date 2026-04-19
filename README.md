# Portemilio Resort App

A complete mobile app + admin portal for Portemilio Resort (Kaslik, Lebanon).

- **Mobile** (`/mobile`) — Expo / React Native app for iOS & Android used by guests.
- **Backend** (`/backend`) — Node.js + Express + SQLite API. Serves the admin portal at `/admin`.

## Features

Guest app:
- Login / sign up (by room or chalet number)
- Pool timings (outdoor & indoor)
- Restaurants, menus, plat du jour
- Chalet/room delivery orders
- Tennis court booking
- Spa, gym, hair salon, shooting range info & booking
- Water-sports rentals
- Event-space booking
- Push notifications
- Profile & booking history

Admin portal (`/admin`):
- Log in as admin
- Edit every facility / restaurant / menu item / activity / rental / event
- Set plat du jour
- View and manage all bookings, deliveries
- Broadcast push notifications
- Create staff/admin users

## Run the backend

```bash
cd backend
npm install
npm run seed     # one-time: creates DB and seeds demo data
npm start        # starts API on http://localhost:4000
```

- API base: `http://localhost:4000/api`
- Admin portal: `http://localhost:4000/admin` (default admin: `admin@portemilio.com` / `admin123`)
- Demo guest: `guest@portemilio.com` / `guest123`

## Run the mobile app

```bash
cd mobile
npm install
npx expo start
```

Scan the QR with the Expo Go app on iOS/Android. In `mobile/api.js`, set `API_BASE_URL` to your backend's LAN IP (e.g. `http://192.168.1.20:4000/api`) so your phone can reach it.

## Notes

- All images are placeholders (solid-color banners + emoji). Replace them by updating `image_url` fields from the admin portal.
- SQLite DB lives at `backend/portemilio.db` — delete it and re-run `npm run seed` to reset.
