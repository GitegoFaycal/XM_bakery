# XM Bakery – Frontend

React 19 + Vite 7 + Tailwind CSS 4 storefront and management UI for the
Express/MySQL backend in `../backend`.

## Run it

```bash
# 1. start the backend (needs MySQL running with the xm_bakery database)
cd backend && npm install && npm run dev        # http://localhost:5000

# 2. start the frontend
cd frontend && npm install && npm run dev       # http://localhost:5173
```

The dev server proxies every `/api/*` request to `http://localhost:5000`, so
no CORS or base-URL configuration is needed in development. For a production
build (`npm run build`) set `VITE_API_URL` to the backend's full URL
(see `.env.example`).

## What is in the UI

| Route                  | Page              | Backend calls                                  |
| ---------------------- | ----------------- | ---------------------------------------------- |
| `/`                    | Home              | `GET /api/products` (featured items)           |
| `/products`            | Shop              | `GET /api/products` + client-side search/filter/sort |
| `/products/:id`        | Product detail    | `GET /api/products/:id`                        |
| `/cart`                | Cart              | none (localStorage)                            |
| `/login`, `/register`  | Auth              | `POST /api/auth/login`, `POST /api/auth/register` |
| `/checkout` *          | Checkout          | `POST /api/orders` (not yet on the backend)    |
| `/orders` *            | Order history     | `GET /api/orders` (not yet on the backend)     |
| `/dashboard` *         | Overview          | `GET /api/products` (stats, low stock)         |
| `/dashboard/products` *| Manage products   | `POST/PUT/DELETE /api/products`                |

`*` = requires login.

## How the frontend adapts to the current backend

- **No JWT yet.** `POST /api/auth/login` returns only `{ user }`, so the session
  is the user object stored in localStorage (`src/context/AuthContext.jsx`).
  When the backend issues a token, store it there and attach it in
  `src/api/client.js`.
- **No roles yet.** Every logged-in user can reach the dashboard. Gate the
  `/dashboard/*` routes on `user.role === 'admin'` once the backend returns a role.
- **Orders not implemented.** `src/api/orders.js` targets the endpoints described
  in `backend/routes/README.md`. Until they exist, Checkout shows a clear
  "not switched on yet" message and keeps the cart; the Orders page shows a
  "coming soon" state. No other code needs to change when the routes land.
- **Stock-aware cart.** Quantities are capped at the product's `quantity`.

## Structure

```
src/
├── api/          fetch wrapper + one module per backend resource
├── context/      Auth, Cart, Toast providers
├── hooks/        useProducts (load/refresh product list)
├── components/   ui primitives, layout, product card/form
├── pages/        one component per route
└── utils/        price/date formatting (currency via VITE_CURRENCY)
```
