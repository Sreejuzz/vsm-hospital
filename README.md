# VSM Hospital

A responsive hospital website and administration portal with a zero-dependency Node.js backend.

## Run locally

```powershell
node server.js
```

Open `http://localhost:3000`.

## Admin access

- Email: `admin@vsmhospital.in`
- Demo password: `VSM@2026`

Set secure credentials before deployment:

```powershell
$env:ADMIN_EMAIL="admin@your-domain.com"
$env:ADMIN_PASSWORD="a-long-unique-password"
$env:NODE_ENV="production"
node server.js
```

## Data and deployment

Appointments, feedback, doctor profiles and announcements are persisted in `data/store.json`, which is created automatically on first run. The server uses secure, HTTP-only admin session cookies, strict same-site policy, constant-time credential comparison, origin checking, payload limits and output escaping.

For horizontal or multi-instance deployment, replace the JSON store functions in `server.js` with a managed database and shared session store. Put the app behind HTTPS and set `NODE_ENV=production` so cookies are marked `Secure`.

## Checks

```powershell
node --check server.js
node --check public/app.js
```
