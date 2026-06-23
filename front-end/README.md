# Raithu Sethu — AgriMarket Frontend

React + Vite frontend for the Raithu Sethu (రైతు సేతు) AgriMarket platform — connecting
farmers and buyers for direct crop trade.

## Status

This is a work-in-progress snapshot. Built so far:

- Vite + React scaffold with Tailwind v4 (CSS-first `@theme` tokens in `src/index.css`)
  using a palette and type system drawn from the Raithu Sethu brand (paddy green,
  harvest gold, terracotta, river blue).
- Full API client layer in `src/api/` mirroring every backend route exactly:
  auth, farmer, buyer/marketplace, bookings, chat, notifications, pricing,
  flash sales, admin.
- React contexts: `AuthContext` (login/register/logout, token persistence),
  `SocketContext` (Socket.IO client for live chat, matches backend's
  `connect`/`send_message`/`receive_message`/`typing` events),
  `NotificationContext` (polls the notification bell), `ToastContext`
  (success/error feedback).
- Shared UI primitives in `src/components/common/`: `Button`, `Field`/`Input`/
  `TextArea`/`Select`, `Badge`, `EmptyState`, `Spinner`, `PageLoader`.
- Formatting helpers in `src/utils/format.js` (currency, dates, relative time,
  error message extraction).

Not yet built: router, and the actual pages (login/register, farmer dashboard,
buyer marketplace, bookings, chat UI, flash sales, admin panel). `src/App.jsx`
is currently a placeholder.

## Setup

```bash
npm install
npm run dev
```

The dev server runs on port 5173 and proxies `/api` and `/socket.io` to
`http://localhost:8000` (see `vite.config.js`), where the FastAPI backend
is expected to run.

## Build

```bash
npm run build
```
