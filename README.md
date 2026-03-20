# Trelio — QR-based Loyalty Card Platform

Trelio lets merchants run a digital loyalty card programme without requiring customers to install an app. Customers scan a QR code, earn points anonymously, and optionally link their account to save points across visits.

---

## Architecture overview

| Layer | Path | Description |
|---|---|---|
| Corporate frontend | `/` | Landing page, how-it-works section |
| Merchant app | `/merchant` | Login, dashboard, QR display, settings |
| Customer flow | `/earn-points` | Point earning page reached via QR scan |
| API routes | `/api/merchant/*` | Authenticated merchant endpoints |
| Auth helpers | `/api/auth/*` | Anonymous session helpers |

---

## Environment variables

Copy `.env.example` to `.env` and fill in every value before running:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key (server-side only) |
| `APP_URL` | Public URL of the deployment (e.g. `https://trelio.io`) |
| `GEMINI_API_KEY` | Gemini API key (injected automatically by AI Studio) |
| `NEXT_PUBLIC_DEMO_EMAIL` | Email shown on the merchant login demo panel |
| `NEXT_PUBLIC_DEMO_PASSWORD` | Password shown on the merchant login demo panel |
| `NEXT_PUBLIC_DEMO_MERCHANT_ID` | UUID of the demo merchant row in the `merchants` table |

> `NEXT_PUBLIC_DEMO_*` values are intentionally public — they belong to a sandboxed demo account whose credentials are displayed openly on the login page. Leave them blank to hide the demo panel entirely.

---

## Development

### Option A — Docker (recommended for WSL2 / cross-platform teams)

Requires **Docker** and **Docker Compose**.

```bash
# First time only — build the dev image
docker compose -f docker-compose.dev.yml build

# Start with hot reload
docker compose -f docker-compose.dev.yml up
```

The app is available at [http://localhost:3000](http://localhost:3000).

Every file save on the host is reflected immediately in the browser. File watching uses polling (`WATCHPACK_POLLING=true`) so it works reliably through Docker on WSL2 without needing inotify.

To stop:

```bash
docker compose -f docker-compose.dev.yml down
```

### Option B — Local Node.js

Requires **Node.js 22+**.

```bash
npm install
npm run dev
```

The app is available at [http://localhost:3000](http://localhost:3000).

---

## Production

### Docker (self-hosted)

The production image is a multi-stage build that produces a minimal standalone Next.js server (~50 MB image).

> `NEXT_PUBLIC_*` variables are inlined at **build time** by the Next.js compiler, so they must be provided as build arguments.

```bash
docker compose up --build
```

Or build and run manually:

```bash
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=<your-url> \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key> \
  -t trelio .

docker run --env-file .env -p 8080:8080 trelio
```

The app is available at [http://localhost:8080](http://localhost:8080).

Runtime secrets (`SUPABASE_SERVICE_ROLE_KEY`, `APP_URL`, etc.) are passed via `--env-file` and never baked into the image.

### Cloud Run / any container platform

1. Build the image and push it to a registry.
2. Deploy the image and set all environment variables via the platform's secrets / env panel.
3. Set `APP_URL` to the service's public URL so OAuth callbacks and QR links resolve correctly.

---

## Merchant guide

### 1. Create your account

Go to `/merchant/login` and sign up, or use the **demo credentials** shown on the login page to explore the app without creating an account.

### 2. Dashboard

After logging in you land on the merchant dashboard (`/merchant`). Here you can see:

- Total customers, total points issued, and total redemptions.
- A shortcut to display the QR code.

### 3. Display the QR code

Click **Show QR code** on the dashboard to open the full-screen QR display page (`/merchant/display-qr`).

- Mount this page on a tablet or screen at your point of sale.
- The QR refreshes automatically every 60 seconds to prevent replay attacks.
- The screen is kept awake using the **Wake Lock API** when supported by the browser.

### 4. Validation modes

Set your preferred mode in the merchant settings:

| Mode | How it works |
|---|---|
| **Automatic** | Points are credited immediately when a customer scans the QR code. No action required from the merchant. |
| **Manual** | A notification appears at the bottom of the QR display page when a customer requests points. The merchant taps **Approve** or **Reject** for each request. |

### 5. Customer experience

When a customer scans the QR code their phone opens `/earn-points`:

1. They see a loyalty card showing their current points.
2. They tap **Valider mon achat** to earn a point.
3. If they are not signed in they can optionally tap **Sauvegarder mes points** to link their account (Google, Facebook, or email) and carry their points across devices.

### 6. "Open customer view" link (development / demo)

On the QR display page a small **Open customer view** link appears below the QR code:

- Always visible on `localhost` — useful for testing without a second device.
- Visible in production only for the merchant whose ID matches `NEXT_PUBLIC_DEMO_MERCHANT_ID`.

---

## Project structure

```
trelio/
├── app/
│   ├── page.tsx                  # Corporate landing page
│   ├── earn-points/              # Customer point-earning flow
│   ├── merchant/
│   │   ├── page.tsx              # Merchant dashboard
│   │   ├── login/                # Merchant login
│   │   ├── display-qr/          # Full-screen QR display
│   │   └── settings/            # Merchant settings
│   └── api/
│       ├── merchant/             # Authenticated merchant API
│       └── auth/                 # Auth helpers (anon session)
├── components/                   # Shared UI components
├── lib/                          # Supabase client, utilities
├── Dockerfile                    # Production multi-stage build
├── Dockerfile.dev                # Development image (hot reload)
├── docker-compose.yml            # Production Compose config
└── docker-compose.dev.yml        # Development Compose config
```
