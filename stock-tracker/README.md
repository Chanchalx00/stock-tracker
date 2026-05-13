<div align="center">

# 📈 Stocklytics — Stock Market Alert & Portfolio Tracker

**A full-stack real-time stock market application.**

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

> ⚠️ **Cold Start** — Render free tier spins down after 15 min inactivity. First request may take 20–30 seconds.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started Locally](#-getting-started-locally)
- [Environment Variables](#-environment-variables)
- [Architecture](#-architecture)
- [Real-Time with Socket.IO](#-real-time-with-socketio)
- [Redis Caching](#-redis-caching)
- [API Reference](#-api-reference)
- [Database Design](#-database-design)
- [Background Jobs](#-background-jobs)
- [Deployment](#-deployment)
- [Postman Collection](#-postman-collection)
- [Evaluation Criteria](#-evaluation-criteria)
- [Assumptions & Tradeoffs](#-assumptions--tradeoffs)

---

## ✨ Features

### 1. 🔐 Authentication
- JWT-based **Signup / Login / Protected Routes**
- Passwords hashed with **bcryptjs** (12 salt rounds — never stored plain)
- Token attached to every API request via Axios interceptors
- Auto-redirect to `/login` on 401 globally

### 2. 🔍 Stock Search Module
- Search stocks by symbol or company name via **Finnhub API**
- Click **Details** button → opens modal showing: Current Price, Day High/Low, Open, Prev Close, Volume, % Change, day range progress bar
- Invalid/delisted symbols silently filtered (`c: 0` from Finnhub → 404 response)

### 3. 📋 Watchlist
- Add / remove stocks from personal watchlist
- Live prices loaded in parallel on the watchlist page
- Compound MongoDB index `{ userId, symbol }` prevents duplicates

### 4. 🔔 Price Alert System *(Main Feature)*
- Create alerts: **GREATER\_THAN** or **LESS\_THAN** a target price
- **Real-time symbol validation** (debounced 600ms) before allowing alert creation
- **Smart price suggestion chips** — 2%, 5%, 10%, 15%, 20% offsets, rounded to book prices
- **node-cron background job** checks all active alerts every **5 minutes**
- When condition matches → `isTriggered: true`, `triggeredAt`, `triggeredPrice` saved
- **Socket.IO** pushes `alert:triggered` event to the owner in real time

### 5. 💼 Portfolio P&L Module
- Add holdings: Symbol, Quantity, Buy Price
- Live P&L calculated on every fetch (Redis-cached prices)
- Portfolio summary: Total Invested, Current Value, Total P&L, Return %

### 6. 📈 Dashboard — Recommended Stocks
- 12 curated popular stocks loaded on mount
- **Redis caches quotes for 60 seconds** — reduces Finnhub API calls massively
- **Socket.IO pushes live price updates** to subscribed clients every ~30 seconds
- Skeleton loading cards during initial fetch

---

## 🛠 Tech Stack

### Frontend

| Technology | Purpose |
|------------|---------|
| Next.js 14 (App Router) | React framework |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| clsx + tailwind-merge | `cn()` utility |
| Lucide React | Icons (all centralised in `lib/icons.ts`) |
| Axios | HTTP client + JWT interceptors |
| Socket.IO Client | Real-time price updates & alert notifications |

### Backend

| Technology | Purpose |
|------------|---------|
| Node.js 18+ | Runtime |
| Express.js | HTTP server |
| MongoDB + Mongoose | Database + ODM |
| JWT | Authentication |
| bcryptjs | Password hashing |
| **Socket.IO** | Real-time bidirectional communication |
| **ioredis** | Redis client for caching |
| node-cron | Background alert checker |
| Axios | Finnhub API calls |
| helmet + cors + morgan | Security, CORS, logging |

### Infrastructure

| Service | Usage | Tier |
|---------|-------|------|
| MongoDB Atlas | Cloud database | M0 Free |
| Render Redis | Quote cache + Socket.IO | Free |
| Render.com | Backend hosting | Free |
| Vercel | Frontend hosting | Free |
| Finnhub API | Real-time stock data | Free |

---

## 📁 Project Structure

```
stock-tracker/                          ← GitHub repo root
└── stock-tracker/                      ← project root
    │
    ├── backend/
    │   ├── src/
    │   │   ├── config/
    │   │   │   ├── db.js               # MongoDB Atlas connection
    │   │   │   └── redis.js            # ioredis client + cache helpers
    │   │   │
    │   │   ├── middleware/
    │   │   │   └── auth.js             # JWT verify middleware
    │   │   │
    │   │   ├── models/
    │   │   │   ├── User.js
    │   │   │   ├── Watchlist.js
    │   │   │   ├── Alert.js
    │   │   │   └── Holding.js
    │   │   │
    │   │   ├── routes/
    │   │   │   ├── auth.routes.js
    │   │   │   ├── stock.routes.js
    │   │   │   ├── watchlist.routes.js
    │   │   │   ├── alert.routes.js
    │   │   │   └── portfolio.routes.js
    │   │   │
    │   │   ├── controllers/
    │   │   │   ├── auth.controller.js
    │   │   │   ├── stock.controller.js     # recommended, search, quote, validate
    │   │   │   ├── watchlist.controller.js
    │   │   │   ├── alert.controller.js
    │   │   │   └── portfolio.controller.js # live P&L calculation
    │   │   │
    │   │   ├── services/
    │   │   │   └── stockService.js         # Finnhub wrapper + Redis cache check
    │   │   │
    │   │   ├── jobs/
    │   │   │   └── alertChecker.js         # cron, checks every 5 min, emits socket
    │   │   │
    │   │   └── app.js                      # Express + Socket.IO + HTTP server
    │   │
    │   ├── .env.example
    │   ├── Dockerfile
    │   └── package.json
    │
    └── frontend/
        ├── src/
        │   ├── app/
        │   │   ├── (auth)/login/page.tsx
        │   │   ├── (auth)/signup/page.tsx
        │   │   ├── dashboard/page.tsx
        │   │   ├── watchlist/page.tsx
        │   │   ├── alerts/page.tsx
        │   │   ├── portfolio/page.tsx
        │   │   ├── page.tsx
        │   │   └── layout.tsx
        │   │
        │   ├── components/
        │   │   ├── ui/
        │   │   │   ├── Button.tsx          # variant, size, loading, Lucide icons
        │   │   │   ├── Input.tsx           # label, error, hint, success, addons
        │   │   │   ├── Select.tsx
        │   │   │   ├── Badge.tsx + ChangeBadge
        │   │   │   ├── Spinner.tsx         # Lucide Loader2
        │   │   │   ├── Card.tsx
        │   │   │   ├── EmptyState.tsx
        │   │   │   └── AlertBanner.tsx
        │   │   │
        │   │   ├── Navbar.tsx              # aria-current, role=banner
        │   │   ├── ProtectedRoute.tsx
        │   │   ├── StockCard.tsx           # dl/dt/dd, asArticle prop
        │   │   ├── StockDetailModal.tsx    # role=dialog, focus trap, role=meter
        │   │   └── Toast.tsx               # role=status, aria-live=polite
        │   │
        │   ├── hooks/
        │   │   ├── useToast.ts
        │   │   ├── useWatchlist.ts
        │   │   ├── useAlerts.ts
        │   │   ├── usePortfolio.ts
        │   │   ├── useStockQuote.ts
        │   │   └── useSymbolValidation.ts
        │   │         
        │   │
        │   ├── context/
        │   │   └── AuthContext.tsx
        │   │
        │   └── lib/
        │       ├── api.ts                  # Axios + interceptors
        │       ├── icons.ts                # All Lucide icons, Icon* prefix
        │       ├── socket.ts                # Socket.IO client
        │       └── utils.ts                # cn(), formatPrice, formatPct, formatVolume
        │
        ├── .env.local.example
        └── package.json
```

---

## 🚀 Getting Started Locally

### Prerequisites

```bash
node --version     # v18+
npm  --version     # v9+
# MongoDB locally or Atlas account
# Redis locally or Upstash account
# Finnhub free API key → https://finnhub.io
```

### 1. Clone

```bash
git clone https://github.com/Chanchalx00/stock-tracker.git
cd stock-tracker/stock-tracker
```

### 2. Start Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in values below
npm run dev
```

Expected output:
```
✅ MongoDB Connected: cluster0.xxxxx.mongodb.net
[Redis] Connected to redis://localhost:6379
[Socket.IO] Listening for connections
🚀 Server running on port 5000
[AlertChecker] Started — checks every 5 minutes
```

### 3. Start Frontend

```bash
cd ../frontend
npm install
cp .env.local.example .env.local
npm run dev
# http://localhost:3000
```

---

## 🔐 Environment Variables

### `backend/.env`

```env
# Server
PORT=5000

# MongoDB
MONGO_URI=mongodb://localhost:27017/stocktracker
# Atlas: mongodb+srv://user:pass@cluster.mongodb.net/stocktracker?retryWrites=true&w=majority

# JWT
JWT_SECRET=replace_with_64_char_hex_string_here
JWT_EXPIRES_IN=7d

# Finnhub (https://finnhub.io — free tier)
FINNHUB_API_KEY=your_finnhub_api_key

# Redis
REDIS_URL=redis://localhost:6379
# Upstash: rediss://default:password@region.upstash.io:6379
REDIS_QUOTE_TTL=60

# CORS
CLIENT_URL=http://localhost:3000
```

### `frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

> Generate a strong JWT secret:
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────┐
│                  Next.js (Vercel)                         │
│  AuthContext · Axios (JWT) · Socket.IO Client             │
│  Hooks: useWatchlist · useAlerts · usePortfolio           │
│         useSocket · useSymbolValidation · Debounce     │
└────────────────────┬─────────────────────────────────────┘
                     │  HTTPS REST  +  WebSocket (ws://)
┌────────────────────▼─────────────────────────────────────┐
│                Express.js (Render)                        │
│                                                           │
│   Routes → Controllers → Services → Models               │
│                                                           │
│   Socket.IO Server                                        │
│   ├── auth middleware (verify JWT from socket.handshake)  │
│   ├── user joins room: user:{userId}                      │
│   ├── subscribe:price → join room: price:{SYMBOL}         │
│   └── alertChecker emits alert:triggered to owner room    │
│                                                           │
│   ┌──────────────┐    ┌──────────────────────────────┐   │
│   │ MongoDB Atlas│    │ Redis (ioredis / Upstash)    │   │
│   │ users        │    │ quote:{SYMBOL}  TTL     │    │
│   │ watchlists   │    │ recommended:stocks TTL       │   │
│   │ alerts       │    └──────────────────────────────┘   │
│   │ holdings     │                                        │
│   └──────────────┘    ┌──────────────────────────────┐   │
│                        │ node-cron (every 5 min)      │   │
│                        │ Check alerts → emit socket   │   │
│                        └──────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
                         │
                  ┌──────▼──────┐
                  │  Finnhub    │
                  │  Free API   │
                  └─────────────┘
```

---

## ⚡ Real-Time with Socket.IO

### Server setup (`app.js`)

```js
const httpServer = require('http').createServer(app);
const { Server }  = require('socket.io');
const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_URL, credentials: true }
});

// Attach io to app so controllers and cron can access it
app.set('io', io);

// JWT auth for socket connections
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('No token'));
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  socket.userId = String(decoded.id);
  next();
});

io.on('connection', (socket) => {
  // Each user joins their private room
  socket.join(`user:${socket.userId}`);

  // Subscribe to live price updates for a symbol
  socket.on('subscribe:price', (symbol) => socket.join(`price:${symbol}`));
  socket.on('unsubscribe:price', (symbol) => socket.leave(`price:${symbol}`));

  socket.on('disconnect', () => {
    console.log(`[Socket] User ${socket.userId} disconnected`);
  });
});
```

### Alert cron emits to the alert owner

```js
// alertChecker.js — after finding triggered alerts:
const io = app.get('io');
io.to(`user:${alert.userId}`).emit('alert:triggered', {
  alertId:        alert._id,
  symbol:         alert.symbol,
  condition:      alert.condition,
  targetPrice:    alert.targetPrice,
  triggeredPrice: currentPrice,
  triggeredAt:    new Date(),
});
```

### Socket.IO Events Reference

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `subscribe:price` | Client → Server | `"AAPL"` | Join symbol price room |
| `unsubscribe:price` | Client → Server | `"AAPL"` | Leave symbol price room |
| `price:update` | Server → Client | `{symbol, currentPrice, percentChange, ...}` | Live price push every ~30s |

### Client hook (`lib/socket.ts`)

```ts
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export function useSocket(token: string | null) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) return;

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
      auth: { token },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    return () => { socket.disconnect(); };
  }, [token]);

  return socketRef;
}
```

---

## 🗄 Redis Caching

Redis reduces Finnhub API calls (free tier: 60 req/min) and improves response times.

### `config/redis.js`

```js
const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: false,
});

redis.on('connect', () => console.log('[Redis] Connected'));
redis.on('error', (err) => console.error('[Redis] Error:', err.message));

const getCache = async (key) => {
  const val = await redis.get(key);
  return val ? JSON.parse(val) : null;
};

const setCache = async (key, data, ttl = 60) => {
  await redis.set(key, JSON.stringify(data), 'EX', ttl);
};

module.exports = { redis, getCache, setCache };
```

### Cache-aside pattern in `stockService.js`

```js
const getQuote = async (symbol) => {
  // 1. Check cache
  const cached = await getCache(`quote:${symbol}`);
  if (cached) return cached;

  // 2. Cache miss — call Finnhub
  const { data } = await axios.get(`${FINNHUB_BASE}/quote`, { params: { symbol, token: API_KEY } });

  if (!data || data.c === 0) throw new Error(`No price data for "${symbol}"`);

  const result = { symbol, currentPrice: data.c, high: data.h, low: data.l,
                   open: data.o, prevClose: data.pc, volume: data.v,
                   change: +(data.c - data.pc).toFixed(2),
                   percentChange: +(((data.c - data.pc) / data.pc) * 100).toFixed(2) };

  // 3. Cache for 60 seconds
  await setCache(`quote:${symbol}`, result, process.env.REDIS_QUOTE_TTL || 60);
  return result;
};
```

### Cache Keys

| Key Pattern | TTL | Stored Value |
|-------------|-----|-------------|
| `quote:{SYMBOL}` | 60s | Full quote object |
| `recommended:stocks` | 60s | Array of 12 stock quotes |

---

## 📡 API Reference

**Production:** `https://stock-tracker-backend-twb1.onrender.com/api`
**Local:** `http://localhost:5000/api`

All protected routes require: `Authorization: Bearer <token>`

---

### 🔐 Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/signup` | ❌ | Register new user |
| `POST` | `/auth/login` | ❌ | Login, returns JWT |
| `GET` | `/auth/me` | ✅ | Get current user |

**POST /auth/signup**
```json
// Body
{ "name": "Chanchal", "email": "chanchal@example.com", "password": "secret123" }

// Response 201
{ "success": true, "token": "eyJ...", "user": { "id": "...", "name": "Chanchal", "email": "chanchal@example.com" } }
```

**POST /auth/login**
```json
// Body
{ "email": "chanchal@example.com", "password": "secret123" }

// Response 200
{ "success": true, "token": "eyJ...", "user": { "id": "...", "name": "Chanchal", "email": "chanchal@example.com" } }
```

---

### 📊 Stocks

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/stocks/recommended` | ✅ | 12 popular stocks (Redis cached 60s) |
| `GET` | `/stocks/search?q=AAPL` | ✅ | Search by symbol/name |
| `GET` | `/stocks/quote/:symbol` | ✅ | Live quote (Redis cached 60s) |
| `GET` | `/stocks/validate/:symbol` | ✅ | Validate + get price for alert suggestions |

**GET /stocks/quote/AAPL**
```json
// Response 200
{
  "success": true,
  "data": {
    "symbol": "AAPL", "currentPrice": 189.30,
    "high": 191.05, "low": 187.45, "open": 188.60,
    "prevClose": 188.01, "volume": 54320100,
    "change": 1.29, "percentChange": 0.69
  }
}
```

**GET /stocks/validate/AAPL**
```json
{ "success": true, "valid": true, "data": { "symbol": "AAPL", "currentPrice": 189.30, ... } }
// or
{ "success": true, "valid": false, "message": "\"XYZ\" not found or has no market data." }
```

---

### 📋 Watchlist

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/watchlist` | ✅ | Get user's watchlist |
| `POST` | `/watchlist` | ✅ | Add stock |
| `DELETE` | `/watchlist/:symbol` | ✅ | Remove stock |

```json
// POST /watchlist Body
{ "symbol": "TSLA", "companyName": "Tesla Inc." }
// Response 201
{ "success": true, "data": { "_id": "...", "symbol": "TSLA", "companyName": "Tesla Inc.", ... } }

// DELETE /watchlist/TSLA
{ "success": true, "message": "TSLA removed from watchlist." }
```

---

### 🔔 Alerts

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/alerts` | ✅ | All alerts (active + triggered) |
| `POST` | `/alerts` | ✅ | Create price alert |
| `DELETE` | `/alerts/:id` | ✅ | Delete alert |

```json
// POST /alerts Body
{ "symbol": "NVDA", "condition": "GREATER_THAN", "targetPrice": 500 }
// condition: "GREATER_THAN" | "LESS_THAN"

// Response 201 — Active alert
{
  "success": true,
  "data": {
    "_id": "...", "symbol": "NVDA", "condition": "GREATER_THAN",
    "targetPrice": 500, "isTriggered": false,
    "triggeredAt": null, "triggeredPrice": null
  }
}

// After cron fires — Triggered alert
{
  "_id": "...", "symbol": "NVDA", "isTriggered": true,
  "triggeredAt": "2024-01-15T14:35:22.000Z", "triggeredPrice": 501.45
}
```

---

### 💼 Portfolio

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/portfolio` | ✅ | Holdings with live P&L |
| `POST` | `/portfolio` | ✅ | Add holding |
| `DELETE` | `/portfolio/:id` | ✅ | Remove holding |

```json
// POST /portfolio Body
{ "symbol": "AAPL", "quantity": 10, "buyPrice": 150, "companyName": "Apple Inc." }

// GET /portfolio Response
{
  "success": true,
  "data": {
    "holdings": [{
      "_id": "...", "symbol": "AAPL", "quantity": 10, "buyPrice": 150,
      "currentPrice": 189.30, "investedValue": 1500, "currentValue": 1893,
      "pnl": 393, "pnlPercent": 26.20, "dayChange": 0.69
    }],
    "summary": {
      "totalInvested": 1500, "totalCurrent": 1893,
      "totalPnl": 393, "totalPnlPercent": 26.20, "holdingsCount": 1
    }
  }
}
```

---

### 💓 Health

```bash
GET /health
# { "status": "OK", "timestamp": "2024-01-15T10:30:00.000Z" }
```

---

## 🗄 Database Design

### Collections & Indexes

**`users`**
```
name (String, min 2), email (String, unique, lowercase),
password (String, bcrypt, select:false)
→ Index: email (unique)
```

**`watchlists`**
```
userId (ObjectId → users, indexed), symbol (String, uppercase),
companyName (String, default '')
→ Index: { userId: 1, symbol: 1 } UNIQUE
```

**`alerts`**
```
userId (ObjectId → users, indexed), symbol (String, uppercase)
condition (enum: GREATER_THAN | LESS_THAN), targetPrice (Number > 0)
isTriggered (Boolean, default: false) → INDEXED (cron queries this)
triggeredAt (Date, default: null), triggeredPrice (Number, default: null)
```

**`holdings`**
```
userId (ObjectId → users, indexed), symbol (String, uppercase),
quantity (Number, min: 1), buyPrice (Number, min: 0.01)
(P&L is never stored — always calculated live)
```

---

## ⏰ Background Jobs

**File:** `src/jobs/alertChecker.js`
**Schedule:** `*/5 * * * *` (every 5 minutes)

```
Every 5 min:
  1. Query: Alert.find({ isTriggered: false })
  2. Deduplicate symbols
  3. For each symbol:
     a. Check Redis cache → HIT: use cached price
     b. MISS: call Finnhub → cache result 60s
  4. For each alert check condition:
     GREATER_THAN: currentPrice > targetPrice → TRIGGER
     LESS_THAN:    currentPrice < targetPrice → TRIGGER
  5. Bulk update MongoDB: isTriggered, triggeredAt, triggeredPrice
  6. Socket.IO emit to user's private room:
     io.to(`user:${userId}`).emit('alert:triggered', { ... })
```

---

## 🚢 Deployment

### Frontend → Vercel

| Setting | Value |
|---------|-------|
| Root Directory | `stock-tracker/frontend` |
| Framework | Next.js |
| Build Command | `npm run build` |

```env
# Vercel Environment Variables
NEXT_PUBLIC_API_URL=https://stock-tracker-backend-twb1.onrender.com/api
NEXT_PUBLIC_SOCKET_URL=https://stock-tracker-backend-twb1.onrender.com
```

**Live:** https://stock-tracker-lime-theta.vercel.app/

---

### Backend → Render

| Setting | Value |
|---------|-------|
| Root Directory | `stock-tracker/backend` |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Instance | Free |

```env
# Render Environment Variables
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/stocktracker
JWT_SECRET=<64-char-hex>
JWT_EXPIRES_IN=7d
FINNHUB_API_KEY=<your-key>
REDIS_URL=redis://red-d81h7iv7f7vs73dken20:6379
CLIENT_URL=https://stock-tracker-lime-theta.vercel.app
```

**Live:** https://stock-tracker-backend-twb1.onrender.com

---

### Redis → Upstash (Free)

1. https://upstash.com → Create Redis DB → copy `REDIS_URL`
2. Format: `rediss://default:<password>@<region>.upstash.io:6379`
3. Add as `REDIS_URL` in Render env vars

---

## 📮 Postman Collection

**File:** `StockPulse.postman_collection.json` at the repo root.

### Import Steps

1. Open Postman → **Import** → drag `collection.json`
2. Go to collection → **Variables** tab → set:
   - `base_url` → `https://stock-tracker-backend-twb1.onrender.com/api`  _(or `http://localhost:5000/api` locally)_
3. Run **Auth › Signup** or **Auth › Login** first
4. The collection auto-saves the token via post-response test:
   ```js
   pm.collectionVariables.set("token", pm.response.json().token);
   ```
5. All subsequent requests use `{{token}}` automatically

### Collection Structure

```
📁 Stocklytics API
├── 📁 Auth
│   ├── POST  Signup
│   ├── POST  Login
│   └── GET   Me  (protected)
│
├── 📁 Stocks
│   ├── GET   Recommended Stocks
│   ├── GET   Search Stocks ?q=AAPL
│   ├── GET   Get Quote /AAPL
│   └── GET   Validate Symbol /AAPL
│
├── 📁 Watchlist
│   ├── GET   Get Watchlist
│   ├── POST  Add to Watchlist
│   └── DEL   Remove from Watchlist
│
├── 📁 Alerts
│   ├── GET   Get All Alerts
│   ├── POST  Create Alert — Greater Than
│   ├── POST  Create Alert — Less Than
│   └── DEL   Delete Alert
│
├── 📁 Portfolio
│   ├── GET   Get Portfolio with Live P&L
│   ├── POST  Add Holding
│   └── DEL   Remove Holding
│
└── GET  Health Check
```

---

## 📊 Evaluation Criteria

| Area | Weight | What was built |
|------|--------|----------------|
| Clean Code & Maintainability | 15% | Custom hooks, `cn()` utility, centralised `lib/icons.ts`, layered backend (routes → controllers → services), no duplicate logic |
| Backend Architecture | 20% | Config / Middleware / Models / Routes / Controllers / Services / Jobs — each with single responsibility |
| Next.js Frontend | 20% | App Router, TypeScript, reusable UI primitives, custom hooks, per-page metadata, full ARIA accessibility |
| Problem Solving Ability | 15% | Socket.IO real-time alerts, Redis cache-aside, zero-price filtering, debounced symbol validation, smart price suggestions |
| Async / Background Jobs | 10% | node-cron every 5 min, Promise.allSettled for parallel prices, Redis cache in cron loop, Socket.IO emit on trigger |
| Database Design | 10% | Compound unique index on watchlist, `isTriggered` index for cron, all timestamps, clean schema separation |
| Documentation | 5% | This README + Postman collection + `.env.example` files |
| Extra Features | Bonus | Socket.IO, Redis, recommended stocks API, symbol validation endpoint, price suggestions, ARIA tags |

---

## ⚖️ Assumptions & Tradeoffs

| Decision | Reasoning |
|----------|-----------|
| **Finnhub free tier (US stocks)** | Reliable data for NYSE/NASDAQ. Indian NSE symbols return `c: 0` on free tier — detected and filtered. |
| **JWT in localStorage** | Simple for assignment scope. Production would use httpOnly cookies + refresh tokens. |
| **Redis TTL = 60 seconds** | Balances freshness vs Finnhub 60 req/min rate limit. Socket.IO subscriptions get ~30s pushes regardless. |
| **Alerts fire once** | Once triggered, alert stays triggered. Users delete and recreate for a new target. |
| **P&L never stored** | Always calculated fresh using Redis-cached prices. No stale data issue. |
| **Cron + Socket.IO combo** | Server-side cron is reliable. Socket.IO delivers the result to the browser in real time when it fires. |
| **Render cold starts** | Free tier spins down after 15 min. UptimeRobot (free) can ping `/health` every 10 min to prevent this. |

---

## 👤 Author

**Chanchal Chourasiya** — [@Chanchalx00](https://github.com/Chanchalx00)

---

*Built as part of the Stock Market Alert & Portfolio Tracker Machine Test Assignment*