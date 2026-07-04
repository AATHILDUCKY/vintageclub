# Vintage Club — Fashion Store

A single Next.js application (frontend **and** backend together) for a small fashion brand.
Black & white, mobile-first storefront + an easy admin portal. Orders are sent straight to
**WhatsApp** — no orders are stored in the database.

## Stack
- **Next.js 14 (App Router)** — pages + API routes in one process
- **SQLite** via `better-sqlite3` (file at `data/vintage.db`)
- **Tailwind CSS** — monochrome design system
- **bcryptjs** + **JWT (httpOnly cookie)** for staff auth
- **zod** for input validation

## Getting started

```bash
# 1. Configure environment
cp .env.example .env        # then edit values (admin user/pass, WhatsApp number…)

# 2. Install dependencies
npm install

# 3. Seed the database (creates admin from .env + sample products)
npm run seed

# 4. Run
npm run dev                 # http://localhost:3000
```

- Storefront: **http://localhost:3000**
- Admin portal: **http://localhost:3000/admin** (login with `ADMIN_USERNAME` / `ADMIN_PASSWORD` from `.env`)

### Test on your phone (same WiFi)
`npm run dev` binds to your whole network and prints the URL to use, e.g.:

```
  Local:    http://localhost:3000
  Network:  http://192.168.1.72:3000
```

Open the **Network** URL on any phone/tablet connected to the same WiFi — the store is
mobile-first, so this is the best way to test it. Run `npm run net` any time to reprint the URL.
Use `npm run dev:local` if you want to bind to localhost only.

> If a device can't connect: make sure it's on the same WiFi, and that your OS firewall allows
> inbound TCP on port 3000 (a typical home network has none).

## Roles
| Role | Can do |
|------|--------|
| **admin** | Everything: products, staff users, store settings, WhatsApp number, own credentials |
| **stock_updater** | Products & stock only |
| **customer** | No login. Browse → add to bag → checkout → WhatsApp |

After first login, change the admin password from **My Account**. You can also create more
staff users under **Staff Users** (admin only).

## How ordering works
1. Customer adds items (with size/colour/qty) to the bag — stored in the browser (localStorage).
2. At checkout they enter name / phone / address.
3. The app re-checks stock, builds a formatted order message, and opens
   `https://wa.me/<number>?text=<order>` — the WhatsApp app (mobile) or WhatsApp Web (desktop).
4. The receiving number is set by the admin in **Settings** (or `WHATSAPP_NUMBER` in `.env`).

## Notes
- Product images can be uploaded in the admin form (stored inline as data-URIs, max 800KB) —
  no external storage needed. If left blank, a monochrome placeholder is generated.
- The database file lives in `data/`. Delete it and re-run `npm run seed` to reset.
- For production: `npm run build && npm start`, and set a strong `JWT_SECRET`.
