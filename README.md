# PushNest

Web push notifications as a service. Register browsers, send via API or dashboard, schedule campaigns, track every delivery. No push server to run.

![Build](https://github.com/ivucicev/PushNest/actions/workflows/docker.yml/badge.svg)

---

## What it does

- **Subscribe** — two lines of JS registers any browser (Chrome, Firefox, Edge, Safari 16+, iOS PWA)
- **Send** — one POST delivers to all subscribers or targets by user ID
- **Schedule** — pass `scheduledAt` to fire at a specific time
- **Track** — delivery logs per subscriber, click tracking, webhook events
- **Dashboard** — full UI to manage apps, send campaigns, view logs

---

## Run locally

### Requirements

- Node.js 22+

### 1. Clone and install

```bash
git clone https://github.com/ivucicev/force.git
cd force
npm install
```

### 2. Configure

```bash
echo 'DATABASE_URL="file:./prisma/dev.db"' > .env
echo 'NEXT_PUBLIC_APP_URL="http://localhost:3000"' >> .env
```

### 3. Set up database

```bash
npx prisma migrate deploy
npx prisma generate
```

### 4. Start

```bash
# Terminal 1 — web app
npm run dev

# Terminal 2 — notification worker (required for delivery)
npm run worker
```

Open [http://localhost:3000](http://localhost:3000), register, create an app.

---

## Docker

```bash
docker pull ghcr.io/ivucicev/force:main

docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL="file:./data/pushnest.db" \
  -e NEXT_PUBLIC_APP_URL="https://yourdomain.com" \
  -v $(pwd)/data:/app/data \
  ghcr.io/ivucicev/force:main
```

Worker (run alongside):

```bash
docker run -d \
  -e DATABASE_URL="file:./data/pushnest.db" \
  -v $(pwd)/data:/app/data \
  ghcr.io/ivucicev/force:main \
  node src/worker/index.js
```

**docker-compose:**

```yaml
version: "3.9"
services:
  web:
    image: ghcr.io/ivucicev/force:main
    ports: ["3000:3000"]
    environment:
      DATABASE_URL: file:./data/pushnest.db
      NEXT_PUBLIC_APP_URL: https://yourdomain.com
    volumes: ["./data:/app/data"]

  worker:
    image: ghcr.io/ivucicev/force:main
    command: node src/worker/index.js
    environment:
      DATABASE_URL: file:./data/pushnest.db
    volumes: ["./data:/app/data"]
    depends_on: [web]
```

---

## Integration tutorial

### Step 1 — Add the service worker

Copy [`public/push-sw.js`](public/push-sw.js) to your web app's public root.

### Step 2 — Subscribe the browser

```js
async function subscribeToPush() {
  const reg = await navigator.serviceWorker.register('/push-sw.js');
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return;

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: 'YOUR_VAPID_PUBLIC_KEY', // from Dashboard → App → Integration
  });

  const { endpoint, keys } = sub.toJSON();
  await fetch('https://your-pushnest.com/api/v1/apps/APP_ID/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint, p256dh: keys.p256dh, auth: keys.auth }),
  });
}
```

### Step 3 — Send

```bash
# Send to all subscribers
curl -X POST https://your-pushnest.com/api/v1/send \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "title": "Hello!", "body": "Your order shipped.", "url": "https://yourapp.com" }'

# Schedule for later
curl -X POST https://your-pushnest.com/api/v1/send \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "title": "Weekly digest", "scheduledAt": "2025-01-15T09:00:00Z" }'

# Target specific users
curl -X POST https://your-pushnest.com/api/v1/send \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "title": "Your order shipped", "audience": { "externalUserIds": ["user_123"] } }'
```

---

## API

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/v1/apps/:id/subscribe` | none | Register browser |
| `DELETE` | `/api/v1/apps/:id/unsubscribe` | none | Unsubscribe browser |
| `POST` | `/api/v1/send` | API key | Send notification |
| `POST` | `/api/v1/apps/:id/notifications/:id/cancel` | API key | Cancel scheduled |
| `POST` | `/api/v1/apps/:id/notifications/:id/retry` | API key | Retry failed |
| `POST` | `/api/v1/track/click` | none | Track click |
| `GET/POST` | `/api/v1/apps/:id/webhooks` | session | Manage webhooks |

**Send payload:**

```json
{
  "title": "string (required)",
  "body": "string",
  "url": "string",
  "icon": "string",
  "tag": "string",
  "scheduledAt": "ISO 8601",
  "audience": {
    "all": true,
    "externalUserIds": ["user_123"],
    "subscriptionIds": ["sub_abc"]
  }
}
```

---

## Webhooks

PushNest POSTs signed requests to your URL on:

`notification.sent` · `notification.failed` · `notification.expired` · `notification.scheduled` · `notification.cancelled` · `subscription.new` · `subscription.expired`

Verify with `X-PushNest-Signature` (HMAC-SHA256):

```js
const crypto = require('crypto');
const sig = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
if (sig !== req.headers['x-pushnest-signature']) throw new Error('Invalid signature');
```

---

## Stack

- [Next.js 16](https://nextjs.org) — app + API routes
- [Prisma 7](https://prisma.io) + SQLite via libsql — zero-dependency database
- [web-push](https://github.com/web-push-libs/web-push) — VAPID + push delivery
- [jose](https://github.com/panva/jose) — Edge-compatible JWT

---

## License

MIT
