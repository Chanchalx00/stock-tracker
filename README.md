<div align="center">

# 📈 Stocklytics — Indian Stock Market Tracker

**A full-stack, real-time NSE/BSE stock tracker: live prices, TradingView-style candlestick charts, watchlists, portfolio P&L, price alerts, and market news.**

[![Live App](https://img.shields.io/badge/Live%20App-Vercel-black?style=for-the-badge&logo=vercel)](https://stock-tracker-lime-theta.vercel.app/)
[![API](https://img.shields.io/badge/Backend%20API-Render-46E3B7?style=for-the-badge&logo=render)](https://stock-tracker-backend-twb1.onrender.com/health)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB%20Atlas-47A248?style=for-the-badge&logo=mongodb)](https://cloud.mongodb.com)
[![Redis](https://img.shields.io/badge/Cache-Redis-DC382D?style=for-the-badge&logo=redis)](https://redis.io)
[![Socket.IO](https://img.shields.io/badge/Realtime-Socket.IO-010101?style=for-the-badge&logo=socketdotio)](https://socket.io)

</div>

---

## 🌐 Live URLs

| Service | URL |
|---------|-----|
| 🖥 **Frontend (Vercel)** | https://stock-tracker-lime-theta.vercel.app/ |
| ⚙️ **Backend API (Render)** | https://stock-tracker-backend-twb1.onrender.com |
| 💓 **Health Check** | https://stock-tracker-backend-twb1.onrender.com/health |
| 📖 **API Docs (Swagger)** | `<backend-url>/api/docs` — local/staging only, disabled in production |

> ⚠️ **Cold Start** — Render's free tier spins down after 15 min of inactivity; the first request can take 20–30 seconds.
>
> ⚠️ **Redeploy needed** — this README describes the current codebase. If the links above haven't been redeployed since, they may still be running an older build (US-stock/Finnhub version with localStorage auth) rather than what's documented here.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started Locally](#-getting-started-locally)
- [Environment Variables](#-environment-variables)
- [Authentication & Sessions](#-authentication--sessions)
- [Architecture](#-architecture)
- [Real-Time with Socket.IO](#-real-time-with-socketio)
- [Redis Caching](#-redis-caching)
- [API Reference](#-api-reference)
- [Database Design](#-database-design)
- [Background Jobs](#-background-jobs)
- [Data Sources & Known Limitations](#-data-sources--known-limitations)
- [Deployment](#-deployment)
- [What This Project Demonstrates](#-what-this-project-demonstrates)
- [Assumptions & Tradeoffs](#-assumptions--tradeoffs)

---

## ✨ Features

### 🔐 Authentication & Sessions
- Signup / login with server-side email format + password strength validation
- **Access + refresh token pattern**, not a single long-lived JWT in localStorage:
  - Short-lived (15 min) access token, returned in the response body, kept **in memory only** on the frontend
  - Long-lived (30 day) refresh token in an **httpOnly, sameSite cookie** — never readable by JavaScript
  - Refresh tokens are **rotated** on every use and stored server-side only as a SHA-256 hash
  - Logout **revokes** the refresh token and **blacklists** the current access token's `jti` so it can't be reused before it naturally expires
  - Axios interceptor silently calls `/auth/refresh` on a 401, retries the original request once, and only redirects to `/login` if that fails too
  - Session survives a page reload via a silent refresh call on mount — no token ever touches `localStorage`

### 📊 Dashboard
- 12 curated large-cap NSE stocks with live prices, refreshed over WebSocket every second
- Nifty 50 & Sensex index cards with a live area chart (5-minute historical bars, live-updating current bar)
- Symbol/company search with live quote previews, rendered as the same stock cards as the recommended list
- A small "has news" indicator on any card with recent headlines

### 🕯️ Charts
- Dedicated `/charts` page styled after TradingView: dark theme, candlesticks, a volume histogram pane, a floating OHLC legend that tracks the crosshair, and a background watermark of the active symbol
- A watchlist sidebar (Nifty 50 + the two indices) with a "See more" toggle, live-updating prices, click to load into the chart
- Live-updating — ticks are bucketed into the same 5-minute candles the historical data uses, so the chart never re-scales or "shrinks" as data streams in

### 📋 Watchlist & 💼 Portfolio
- Add/remove stocks from a personal watchlist with live prices
- Track holdings (symbol, quantity, buy price) with live P&L, computed fresh on every fetch — never stored stale
- Portfolio summary: total invested, current value, total P&L, return %

### 🔔 Price Alerts
- `GREATER_THAN` / `LESS_THAN` a target price, with debounced (600ms) live symbol validation
- Smart suggested target chips (±2/5/10/15/20%, rounded to sensible price steps)
- Checked server-side every 5 minutes by a cron job; triggers push an `alert:triggered` Socket.IO event to the owner

### 📰 News
- Market-wide and per-stock headlines (source, published time, link out)
- Powered by Google News RSS search — see [Data Sources & Known Limitations](#-data-sources--known-limitations)

### 🖼 Company Logos
- Real logo (or the company's site favicon) for known NSE large-caps, generated server-side as an SVG
- Any symbol without a known logo still gets a **generated initials avatar** (server-rendered, sized to fit) — the frontend's `<img>` never actually fails to load, so there's no broken-image flash and no client-side text-truncation to fight with

### 🎨 Polish
- Framer Motion entrance/stagger animations across every page, hover/tap micro-interactions on stock cards, modal enter animation
- Per-page SEO metadata — every route is a server component wrapping a `*Client.tsx` component, so each page gets its own `<title>`/description instead of one generic one for the whole app
- Full ARIA pass: live regions, `aria-busy` loading states, focus-trapped modal, `aria-expanded`/`aria-current`, labelled landmarks, keyboard (Escape) support on the mobile nav drawer
- Branded `not-found.tsx` and `error.tsx` instead of Next's defaults, plus a footer

### 🛡 Backend Hardening
- Rate limiting: a global ceiling plus a much tighter limit on `/auth/login`, `/auth/signup`, `/auth/refresh`
- Centralized error handling (`ApiError` / `asyncHandler` / `ApiResponse`) instead of a hand-rolled try/catch per controller — consistent response shape, no leaked internal error messages
- Server-side input validation on signup (email format, password length) and on alerts/portfolio (positive numeric price/quantity)
- Structured logging via Winston — rotating log files, one line per request with timing, log-injection-safe
- Auto-generated Swagger/OpenAPI docs at `/api/docs` (disabled in production)

---

## 🛠 Tech Stack

### Frontend

| Technology | Purpose |
|------------|---------|
| Next.js (App Router) | React framework — every route is a server component (`page.tsx`, metadata) wrapping a client component |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| Framer Motion | Page/element animations |
| lightweight-charts (TradingView) | Candlestick + area charts |
| clsx + tailwind-merge | `cn()` utility |
| Lucide React | Icons (centralised in `lib/icons.ts`) |
| Axios | HTTP client — in-memory access token, `withCredentials`, silent-refresh interceptor |
| Socket.IO Client | Real-time price updates & alert notifications |

### Backend

| Technology | Purpose |
|------------|---------|
| Node.js 18+ / Express 5 | HTTP server |
| MongoDB + Mongoose | Database + ODM |
| JWT + httpOnly cookies | Access/refresh token session auth |
| bcryptjs | Password hashing |
| Socket.IO | Real-time bidirectional communication |
| ioredis | Redis client for caching |
| node-cron | Background alert checker |
| express-rate-limit | Global + auth-specific rate limiting |
| validator | Email/input validation |
| winston | Structured, rotating file logging |
| swagger-jsdoc + swagger-ui-express | Auto-generated API docs |
| fast-xml-parser | Parses the Google News RSS feed |
| helmet + cors + cookie-parser | Security headers, CORS, cookie parsing |

### Data Sources

| Source | Used for | Official? |
|--------|----------|-----------|
| Yahoo Finance (`query1/2.finance.yahoo.com`) | Live quotes, OHLC candles, symbol search | ❌ Unofficial, no key required |
| Google News RSS | Market & per-stock news | ❌ Unofficial |
| Clearbit logo API / Google favicon service | Company logos | ❌ Unofficial, with a generated-SVG fallback |

### Infrastructure

| Service | Usage | Tier |
|---------|-------|------|
| MongoDB Atlas | Cloud database | M0 Free |
| Redis (local or Upstash) | Quote/news/search cache | Free |
| Render.com | Backend hosting | Free |
| Vercel | Frontend hosting | Free |

---

## 📁 Project Structure

```
stock-tracker/
└── stock-tracker/
    │
    ├── backend/
    │   ├── src/
    │   │   ├── config/
    │   │   │   ├── db.js                 # MongoDB Atlas connection
    │   │   │   ├── redis.js              # ioredis client + cache helpers
    │   │   │   └── swagger.js            # swagger-jsdoc spec (scans routes/*.js)
    │   │   │
    │   │   ├── middleware/
    │   │   │   ├── auth.js               # JWT verify + blacklist check
    │   │   │   └── error.middleware.js   # Centralized error handler
    │   │   │
    │   │   ├── models/
    │   │   │   ├── User.js
    │   │   │   ├── RefreshToken.js       # Hashed refresh tokens, TTL-indexed
    │   │   │   ├── Watchlist.js
    │   │   │   ├── Alert.js
    │   │   │   └── Holding.js
    │   │   │
    │   │   ├── routes/                   # auth · stock · watchlist · alert · portfolio · news
    │   │   ├── controllers/              # same modules, all asyncHandler + ApiError/ApiResponse
    │   │   │
    │   │   ├── services/
    │   │   │   ├── stockService.js       # Yahoo Finance wrapper + Redis cache
    │   │   │   ├── newsService.js        # Google News RSS wrapper + Redis cache
    │   │   │   ├── logoService.js        # Real logo lookup + generated SVG fallback
    │   │   │   └── token.service.js      # Access/refresh token issue, rotate, revoke, blacklist
    │   │   │
    │   │   ├── utils/
    │   │   │   ├── ApiError.js / ApiResponse.js / asyncHandler.js
    │   │   │   └── logger.js             # Winston, rotating files
    │   │   │
    │   │   ├── socket/socketManager.js   # Per-symbol price rooms, 1s emit interval
    │   │   ├── jobs/alertChecker.js      # node-cron, every 5 min
    │   │   └── app.js
    │   │
    │   ├── .env.example
    │   └── package.json
    │
    └── frontend/
        ├── src/
        │   ├── app/
        │   │   ├── (auth)/login/{page.tsx, LoginClient.tsx}
        │   │   ├── (auth)/signup/{page.tsx, SignupClient.tsx}
        │   │   ├── dashboard/{page.tsx, DashboardClient.tsx}
        │   │   ├── charts/{page.tsx, ChartsClient.tsx}
        │   │   ├── watchlist/{page.tsx, WatchlistClient.tsx}
        │   │   ├── alerts/{page.tsx, AlertsClient.tsx}
        │   │   ├── portfolio/{page.tsx, PortfolioClient.tsx}
        │   │   ├── news/{page.tsx, NewsClient.tsx}
        │   │   ├── not-found.tsx / error.tsx
        │   │   └── layout.tsx             # Root metadata, Footer
        │   │
        │   ├── components/
        │   │   ├── ui/                    # Button, Input, Select, Badge, Spinner, Card, EmptyState, AlertBanner
        │   │   ├── Navbar.tsx / Footer.tsx / ProtectedRoute.tsx / Toast.tsx
        │   │   ├── StockCard.tsx / StockDetailModal.tsx / StockAvatar.tsx
        │   │   ├── MarketIndices.tsx      # Nifty50/Sensex cards
        │   │   ├── PriceChart.tsx         # Lightweight area chart (dashboard/modal)
        │   │   ├── CandlestickChart.tsx   # Full TradingView-style chart (/charts)
        │   │   ├── ChartWatchlist.tsx     # /charts sidebar
        │   │   ├── NewsList.tsx
        │   │   └── FadeIn.tsx / Stagger.tsx  # Framer Motion wrappers
        │   │
        │   ├── hooks/           # useToast, useWatchlist, useAlerts, usePortfolio, useStockSocket, useSymbolValidation
        │   ├── context/AuthContext.tsx
        │   └── lib/
        │       ├── api.ts                 # Axios: in-memory token, withCredentials, silent refresh
        │       ├── liveChart.ts           # Shared live-tick → OHLC bucket merge logic
        │       ├── icons.ts / socket.ts / utils.ts
        │
        ├── .env
        └── package.json
```

---

## 🚀 Getting Started Locally

### Prerequisites

```bash
node --version     # v18+
npm  --version     # v9+
# MongoDB locally or Atlas account
# Redis locally or Upstash account (optional — caching degrades gracefully without it)
```

No third-party API key is required — Yahoo Finance and Google News are used unauthenticated.

### 1. Clone

```bash
git clone https://github.com/Chanchalx00/stock-tracker.git
cd stock-tracker/stock-tracker
```

### 2. Start Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in MONGO_URI and JWT_SECRET at minimum
npm run dev
```

### 3. Start Frontend

```bash
cd ../frontend
npm install
npm run dev
# http://localhost:3000
```

---

## 🔐 Environment Variables

### `backend/.env`

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb://localhost:27017/stocktracker

# JWT — short-lived access token (in the response body) + long-lived
# refresh token (httpOnly cookie, stored server-side only as a hash).
JWT_SECRET=replace_with_64_char_hex_string_here
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY_DAYS=30

# Redis (optional)
REDIS_URL=redis://localhost:6379

# CORS — must match the frontend origin exactly
CLIENT_URL=http://localhost:3000

# Logging
LOG_LEVEL=debug
LOG_DIR=logs
```

### `frontend/.env`

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

> Generate a strong JWT secret:
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

---

## 🔑 Authentication & Sessions

This app deliberately does **not** store any token in `localStorage`. The flow:

1. **Login/signup** → backend issues an access token (15 min, returned in the JSON body) and a refresh token (30 days, set as an `httpOnly; sameSite` cookie). The refresh token is stored server-side only as a SHA-256 hash.
2. **Every request** → the frontend attaches the access token from an in-memory variable (`lib/api.ts`), never from storage.
3. **Page reload** → the in-memory token is gone by design. `AuthContext` calls `POST /auth/refresh` on mount; the browser sends the httpOnly cookie automatically, the backend rotates it and returns a fresh access token, and the session is silently restored. If there's no valid cookie, the user just isn't logged in.
4. **Access token expires mid-session** → the axios response interceptor catches the 401, calls `/auth/refresh` once (concurrent 401s share a single in-flight refresh call, since refresh tokens rotate on every use), retries the original request, and only redirects to `/login` if the refresh itself fails.
5. **Logout** → the refresh token is deleted from the database and the current access token's `jti` is blacklisted server-side (in-memory, pruned every 5 min) so it can't be replayed even before it naturally expires.

Why this over a plain JWT in `localStorage`: `localStorage` is readable by any JavaScript running on the page, so an XSS vulnerability anywhere in the app (or a compromised dependency) can exfiltrate the token directly. An httpOnly cookie can't be read by JavaScript at all, and the short-lived access token limits the blast radius even if it's somehow captured mid-flight.

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────┐
│                  Next.js (Vercel)                         │
│  AuthContext (in-memory token) · Axios (silent refresh)   │
│  Socket.IO Client · Framer Motion · lightweight-charts     │
└────────────────────┬─────────────────────────────────────┘
                     │  HTTPS REST (withCredentials)  +  WebSocket
┌────────────────────▼─────────────────────────────────────┐
│                Express.js (Render)                        │
│                                                           │
│   Routes → Controllers (asyncHandler) → Services → Models │
│   Centralized error middleware · rate limiting · winston  │
│                                                           │
│   Socket.IO Server                                        │
│   ├── per-symbol room: price:{SYMBOL}, 1s emit interval   │
│   └── alertChecker emits alert:triggered to owner room    │
│                                                           │
│   ┌──────────────┐    ┌──────────────────────────────┐   │
│   │ MongoDB Atlas│    │ Redis (ioredis / Upstash)    │   │
│   │ users        │    │ quote:{SYMBOL}   TTL 1s      │   │
│   │ refreshTokens│    │ series:{SYMBOL}  TTL 60s     │   │
│   │ watchlists   │    │ news:*           TTL 10–15m  │   │
│   │ alerts       │    │ logo:{domain}    TTL 24h     │   │
│   │ holdings     │    └──────────────────────────────┘   │
│   └──────────────┘    ┌──────────────────────────────┐   │
│                        │ node-cron (every 5 min)      │   │
│                        │ Check alerts → emit socket   │   │
│                        └──────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
                         │
              ┌──────────┼──────────────┐
              ▼                         ▼
      Yahoo Finance              Google News RSS
      (quotes, charts,           (market + per-stock
       search — unofficial)       headlines — unofficial)
```

---

## ⚡ Real-Time with Socket.IO

Every subscribed symbol gets its own room and its own 1-second poll interval (`EMIT_INTERVAL_MS` in `socketManager.js`) — deliberately fast, since the Redis quote cache TTL is also 1 second, so this is close to as live as the underlying (unofficial, rate-limit-unknown) Yahoo Finance endpoint can support.

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `subscribe` | Client → Server | `["RELIANCE.NS", ...]` | Join price rooms for these symbols |
| `unsubscribe` | Client → Server | `["RELIANCE.NS", ...]` | Leave price rooms |
| `price:{SYMBOL}` | Server → Client | `{symbol, currentPrice, percentChange, high, low, volume, change, timestamp}` | Live tick, ~every second |
| `alert:triggered` | Server → Client | `{alertId, symbol, condition, targetPrice, triggeredPrice, triggeredAt}` | Pushed to the alert owner when the cron job finds a match |

The `useStockSocket(symbols, onQuote)` hook wraps subscribe/unsubscribe lifecycle; it's used across the dashboard, watchlist, charts page, and stock detail modal.

---

## 🗄 Redis Caching

Redis absorbs duplicate requests for the same symbol landing within the same short window — important since the underlying quote API is unofficial and has no documented rate limit.

| Key Pattern | TTL | Why |
|-------------|-----|-----|
| `quote:{SYMBOL}` | **1s** | Short enough to feel live, long enough to dedupe near-simultaneous requests for the same symbol (e.g. the dashboard and the charts watchlist both open) |
| `series:{SYMBOL}:{range}:{interval}` | 60s | Intraday OHLC series (charts, index cards) |
| `search:{query}` | 300s | Symbol search results |
| `news:market` / `news:stock:{query}:{limit}` | 600s / 900s | Google News RSS results |
| `logo:{domain}` | 24h | Resolved logo bytes (or the fact that none were found) |

Redis is optional — every cache read/write is wrapped so a Redis outage degrades to "no caching," not a crash.

---

## 📡 API Reference

**Local:** `http://localhost:5000/api` — full interactive docs at `/api/docs` (Swagger UI, generated from JSDoc comments on every route, always in sync with the code — treat it as the source of truth over this table).

All protected routes require `Authorization: Bearer <accessToken>`.

### 🔐 Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/signup` | ❌ | Register — validates email format & password length |
| `POST` | `/auth/login` | ❌ | Login |
| `POST` | `/auth/refresh` | 🍪 cookie | Rotate the refresh token, issue a new access token |
| `POST` | `/auth/logout` | ❌ | Revoke the refresh token + blacklist the access token |
| `GET` | `/auth/me` | ✅ | Get the current user |

```json
// POST /auth/login — Response 200
{
  "success": true, "message": "Login successful.",
  "token": "eyJ...", "user": { "id": "...", "name": "Chanchal", "email": "..." }
}
```

### 📊 Stocks

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/stocks/recommended` | ✅ | 12 curated NSE large-caps, live quotes + `hasNews` flag |
| `GET` | `/stocks/watchlist` | ✅ | Full Nifty 50, quotes only (lighter — no news lookups) |
| `GET` | `/stocks/indices` | ✅ | Nifty 50 & Sensex with today's intraday series |
| `GET` | `/stocks/chart/:symbol` | ✅ | Intraday OHLC candles for any symbol |
| `GET` | `/stocks/search?q=` | ✅ | Search NSE/BSE symbols |
| `GET` | `/stocks/quote/:symbol` | ✅ | Current quote |
| `GET` | `/stocks/validate/:symbol` | ✅ | Always 200 — check the `valid` field |
| `GET` | `/stocks/logo/:symbol` | ❌ | Public — always returns an image (real logo or generated fallback) |

### 📰 News

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/news` | ✅ | Top Indian market headlines |
| `GET` | `/news/stock/:symbol?name=` | ✅ | Headlines for one stock |

### 📋 Watchlist · 🔔 Alerts · 💼 Portfolio

Standard `GET / POST / DELETE` CRUD under `/watchlist`, `/alerts`, `/portfolio` — see `/api/docs` for full request/response schemas.

```json
// POST /alerts
{ "symbol": "RELIANCE.NS", "condition": "GREATER_THAN", "targetPrice": 1300 }

// POST /portfolio
{ "symbol": "TCS.NS", "quantity": 10, "buyPrice": 3800, "companyName": "Tata Consultancy Services Ltd." }
```

### 💓 Health

```bash
GET /health
# { "status": "OK" }
```

---

## 🗄 Database Design

**`users`** — `name`, `email` (unique, lowercase), `password` (bcrypt, `select: false`)

**`refreshTokens`** — `tokenHash` (unique, SHA-256), `userId` (indexed), `expiresAt` (TTL-indexed — MongoDB auto-deletes expired sessions)

**`watchlists`** — `userId` + `symbol`, compound unique index `{ userId, symbol }`

**`alerts`** — `userId`, `symbol`, `condition` (`GREATER_THAN`/`LESS_THAN`), `targetPrice`, `isTriggered` (indexed — the cron job queries on it), `triggeredAt`, `triggeredPrice`

**`holdings`** — `userId`, `symbol`, `quantity`, `buyPrice` (P&L is never stored — always computed live from the current quote)

---

## ⏰ Background Jobs

**File:** `src/jobs/alertChecker.js` · **Schedule:** `*/5 * * * *`

```
Every 5 min:
  1. Query: Alert.find({ isTriggered: false })
  2. Deduplicate symbols, fetch each quote once (Redis-cached)
  3. GREATER_THAN: currentPrice > targetPrice → trigger
     LESS_THAN:    currentPrice < targetPrice → trigger
  4. Update isTriggered / triggeredAt / triggeredPrice
  5. Socket.IO emit alert:triggered to the owner's room
```

---

## ⚠️ Data Sources & Known Limitations

This project intentionally uses **free, unofficial, keyless** data sources rather than a paid market-data API — the right tradeoff for a personal/portfolio project, but worth being upfront about:

- **Yahoo Finance** (`query1/2.finance.yahoo.com`) — not an official public API, no documented rate limit or SLA. It can start blocking or throttling under sustained load; the 1-second poll interval is chosen for a snappy feel, not because it's guaranteed safe long-term.
- **Google News RSS** — its feed license text is scoped to "personal, non-commercial feed reader" use. Fine for this project's scope; would need a real news API before any commercial use.
- **Clearbit logo API / Google favicon service** — also unofficial. A handful of large NSE stocks (e.g. `SBIN`, `TCS`, `HCLTECH`) have no resolvable logo through either source and fall back to a generated initials avatar — this is expected, not a bug.
- **Access-token blacklist is in-memory** — a token revoked at logout becomes valid again after a server restart, until it naturally expires (≤15 min later). Move to Redis-backed revocation if that gap matters for your use case.
- **Alerts fire once** — once triggered, an alert stays triggered; users delete and recreate it for a new target.

---

## 🚢 Deployment

### Frontend → Vercel

| Setting | Value |
|---------|-------|
| Root Directory | `stock-tracker/frontend` |
| Framework | Next.js |
| Build Command | `npm run build` |

```env
NEXT_PUBLIC_API_URL=https://<your-backend>.onrender.com/api
NEXT_PUBLIC_SOCKET_URL=https://<your-backend>.onrender.com
```

### Backend → Render

| Setting | Value |
|---------|-------|
| Root Directory | `stock-tracker/backend` |
| Build Command | `npm install` |
| Start Command | `npm start` |

```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/stocktracker
JWT_SECRET=<64-char-hex>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY_DAYS=30
REDIS_URL=<your-redis-url>
CLIENT_URL=https://<your-frontend>.vercel.app
```

> In production, the refresh cookie is set with `secure: true; sameSite: none` (required for a cross-origin cookie to be sent at all) — `CLIENT_URL` must exactly match the deployed frontend origin, and both frontend/backend must be served over HTTPS.

### Redis → Upstash (Free)

`https://upstash.com` → create a Redis DB → copy the `rediss://` connection string into `REDIS_URL`.

---

## 📮 API Docs & Postman

- **Swagger** (`/api/docs`, non-production only) is generated directly from JSDoc comments on every route and is guaranteed to match the running code — the primary reference.
- A Postman collection (`Stock tracker API.postman_collection.json`) also exists at the repo root from an earlier version of the API; it predates several endpoints added since (`/auth/refresh`, `/auth/logout`, `/stocks/indices`, `/stocks/chart/:symbol`, `/stocks/watchlist`, `/stocks/logo/:symbol`, `/news/*`) and hasn't been regenerated — prefer Swagger if the two disagree.

---

## 🎯 What This Project Demonstrates

| Area | What was built |
|------|-----------------|
| Real-time systems | Socket.IO per-symbol rooms, 1s live price streaming, live-updating candlestick charts without re-scaling artifacts |
| Auth & security | Access/refresh token rotation, httpOnly cookies, in-memory blacklist revocation, rate limiting, input validation, no client-side secret storage |
| Backend architecture | Layered routes → controllers → services → models, centralized error handling, structured logging, auto-generated API docs |
| Frontend architecture | Server/client component split for real per-page SEO metadata, custom hooks, shared animation primitives, full ARIA pass |
| Working with unofficial/imperfect data | Graceful fallbacks everywhere a third-party source can fail — generated logo avatars, cache-and-degrade Redis usage, defensive symbol/time normalization |
| Product thinking | India-specific UX (₹ formatting, IST timestamps, NSE/BSE symbol handling) rather than a generic global-market clone |

---

## ⚖️ Assumptions & Tradeoffs

| Decision | Reasoning |
|----------|-----------|
| **Yahoo Finance over a paid data API** | No key, no cost, good enough coverage for NSE/BSE large-caps. Tradeoff: no SLA, could break or get rate-limited without notice. |
| **Access/refresh tokens instead of a single JWT in localStorage** | Meaningfully reduces XSS blast radius. Tradeoff: more moving parts (rotation, blacklist, cookie config) than a single token. |
| **In-memory access-token blacklist** | Simple, zero extra infra. Tradeoff: revocation doesn't survive a server restart — acceptable given the 15-minute access token lifetime. |
| **Redis TTL = 1 second on quotes** | Matches the 1-second Socket.IO poll interval so caching still dedupes concurrent requests without visibly staling the price. |
| **Alerts fire once** | Simpler mental model than re-arming; users just create a new alert. |
| **P&L never stored** | Always calculated fresh from the live quote — no stale-data reconciliation needed. |
| **Render cold starts** | Free tier spins down after 15 min. A free uptime pinger against `/health` would prevent this if needed. |

---

## 👤 Author

**Chanchal Chourasiya** — [@Chanchalx00](https://github.com/Chanchalx00)
