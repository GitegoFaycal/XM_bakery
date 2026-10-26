# XM Bakery

Online shop and stock management for a bakery.

- `backend/` – Node.js, Express 5, SQLite via [libSQL](https://github.com/tursodatabase/libsql-client-ts) (Turso in production)
- `frontend/` – React 19, Vite 7, Tailwind CSS 4

## Run locally

```bash
# backend (uses backend/local.db, no database server needed)
cd backend
npm install
cp .env.example .env
npm run seed          # optional: adds sample products
npm run dev           # http://localhost:5000

# frontend
cd ../frontend
npm install
npm run dev           # http://localhost:5173, proxies /api -> :5000
```

## Deploy to Vercel

Both apps deploy as separate Vercel projects from this one repository.

### 1. Create the production database (Turso, free tier)

```bash
npm i -g @tursodatabase/cli   # or: curl -sSfL https://get.tur.so/install.sh | bash
turso auth signup
turso db create xm-bakery
turso db show --url xm-bakery          # -> TURSO_DATABASE_URL (libsql://...)
turso db tokens create xm-bakery       # -> TURSO_AUTH_TOKEN
```

Seed it from your machine once:

```bash
cd backend
TURSO_DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=... npm run seed
```

Tables are created automatically on the first request, so seeding is optional.

### 2. Deploy the backend

1. In Vercel, **Add New Project**, import this repo, set **Root Directory** to `backend`.
2. Framework preset: *Other*. Leave build and output settings empty.
3. Environment variables: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `JWT_SECRET`.
4. Deploy. Note the URL, e.g. `https://xm-bakery-api.vercel.app`.
   `vercel.json` routes every request to `api/index.js`, which serves the Express app.

### 3. Deploy the frontend

1. **Add New Project** again from the same repo, **Root Directory** `frontend`.
2. Framework preset: *Vite* (build `npm run build`, output `dist`).
3. Environment variable: `VITE_API_URL=https://xm-bakery-api.vercel.app/api`.
4. Deploy. `vercel.json` rewrites all paths to `index.html` so client-side routes work on refresh.

### Why Turso

The backend started on MySQL, which needs a running server and is not a good
fit for serverless hosting. Turso is hosted SQLite: the same SQL, one small
driver, a generous free tier, and for local development a plain file on disk.

## API

| Method | Path                  | Body                                 | Response                                   |
| ------ | --------------------- | ------------------------------------ | ------------------------------------------ |
| POST   | `/api/auth/register`  | `{ name, email, password }`          | `201 { message, userId }`                  |
| POST   | `/api/auth/login`     | `{ email, password }`                | `200 { message, user: { id, name, email } }` |
| GET    | `/api/products`       |                                      | `200 [ { id, name, category, price, quantity } ]` |
| GET    | `/api/products/:id`   |                                      | `200 product` or `404`                     |
| POST   | `/api/products`       | `{ name, category, price, quantity }`| `201 { message, productId }`               |
| PUT    | `/api/products/:id`   | `{ name, category, price, quantity }`| `200 { message }` or `404`                 |
| DELETE | `/api/products/:id`   |                                      | `200 { message }` or `404`                 |
| POST   | `/api/orders`         | `{ user_id?, customer_name?, phone?, email?, note?, items: [{ product_id, quantity }] }` | `201 { message, orderId, order }`, `409` if stock is short |
| GET    | `/api/orders?user_id=`| (or `?email=`)                       | `200 [ order ]`                            |
| GET    | `/api/orders/:id`     |                                      | `200 order` with `items`, or `404`         |

Orders work for guests (name + phone) and members (`user_id`). Prices are
taken from the products table on the server and stock is reduced in the same
transaction. Payment is "pay at counter"; `payment_method` and
`payment_status` columns are ready for an online gateway (MTN MoMo / Airtel
Money via Flutterwave or Paypack, or Stripe) once a merchant account exists.
