# 📈 StockPulse — Stock Market Alert & Portfolio Tracker

> Full-stack stock market application built with **Next.js**, **Node.js/Express**, and **MongoDB**

[![Frontend](https://img.shields.io/badge/Frontend-Vercel-black?logo=vercel)](https://stock-tracker-lime-theta.vercel.app/)
[![Backend](https://img.shields.io/badge/Backend-Render-46E3B7?logo=render)](https://stock-tracker-backend-twb1.onrender.com/health)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB_Atlas-47A248?logo=mongodb)](https://cloud.mongodb.com)

---

## 🌐 Live Demo

| Service | URL |
|---------|-----|
| **Frontend (Vercel)** | https://stock-tracker-lime-theta.vercel.app/ |
| **Backend API (Render)** | https://stock-tracker-backend-twb1.onrender.com |
| **API Health Check** | https://stock-tracker-backend-twb1.onrender.com/health |

> ⚠️ The backend is hosted on Render's **free tier** — it may take **20–30 seconds** to respond on the first request after a period of inactivity (cold start). Subsequent requests are fast.

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started Locally](#getting-started-locally)
- [Environment Variables](#environment-variables)
- [Architecture](#architecture)
- [API Reference](#api-reference)
- [Database Design](#database-design)
- [Background Jobs](#background-jobs)
- [Deployment](#deployment)
- [Postman Collection](#postman-collection)
- [Assumptions & Tradeoffs](#assumptions--tradeoffs)

---

## ✨ Features

### 1. Authentication
- User **Signup** and **Login** with JWT tokens
- Protected routes on both frontend and backend
- Passwords hashed with **bcryptjs** (salt rounds: 12)

### 2. Stock Search Module
- Search stocks by symbol or company name via **Finnhub API**
- View live stock details: Symbol, Current Price, Day High/Low, Volume, % Change
- Click **Details** button to open a full stats modal

### 3. Watchlist
- Add stocks to a personal watchlist
- Remove stocks from watchlist
- View all watchlisted stocks with live prices

### 4. Price Alert System *(Main Feature)*
- Create alerts with condition: **Greater Than** / **Less Than** a target price
- Symbol validated in real-time before alert creation
- Smart target price suggestions (2%, 5%, 10%, 15%, 20% offsets)
- Backend **cron job** checks all active alerts every **5 minutes**
- When condition is met → alert marked as triggered with timestamp and actual price

### 5. Portfolio P&L Module
- Add holdings: Symbol, Quantity, Buy Price
- Live P&L calculation using real-time prices
- Overall portfolio summary: Total Invested, Current Value, Total P&L, Return %

### 6. Dashboard — Recommended Stocks
- Curated list of 12 popular stocks loaded on dashboard
- Live prices, High/Low/Volume, day range bar
- One-click add to watchlist or open details modal

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| Next.js 14 (App Router) | React framework |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| clsx + tailwind-merge | Conditional class merging via `cn()` |
| Lucide React | Icon library (centralised in `lib/icons.ts`) |
| Axios | HTTP client with interceptors |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js + Express.js | HTTP server & routing |
| MongoDB + Mongoose | Database & ODM |
| JWT (jsonwebtoken) | Authentication |
| bcryptjs | Password hashing |
| node-cron | Background alert checker |
| Axios | Finnhub API calls |
| helmet + cors | Security headers |
| morgan | Request logging |

### Infrastructure
| Service | Usage |
|---------|-------|
| MongoDB Atlas (M0 Free) | Cloud database |
| Render.com (Free) | Backend hosting |
| Vercel (Free) | Frontend hosting |
| Finnhub API (Free) | Real-time stock data |

---

## 📁 Project Structure

```
stock-tracker/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                 # MongoDB connection
│   │   ├── middleware/
│   │   │   └── auth.js               # JWT verification middleware
│   │   ├── models/
│   │   │   ├── User.js               # User schema
│   │   │   ├── Watchlist.js          # Watchlist schema
│   │   │   ├── Alert.js              # Price alert schema
│   │   │   └── Holding.js            # Portfolio holding schema
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── stock.routes.js
│   │   │   ├── watchlist.routes.js
│   │   │   ├── alert.routes.js
│   │   │   └── portfolio.routes.js
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── stock.controller.js
│   │   │   ├── watchlist.controller.js
│   │   │   ├── alert.controller.js
│   │   │   └── portfolio.controller.js
│   │   ├── services/
│   │   │   └── stockService.js       # Finnhub API wrapper
│   │   ├── jobs/
│   │   │   └── alertChecker.js       # Cron: runs every 5 min
│   │   └── app.js                    # Express entry point
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── (auth)/
    │   │   │   ├── login/page.tsx
    │   │   │   └── signup/page.tsx
    │   │   ├── dashboard/page.tsx
    │   │   ├── watchlist/page.tsx
    │   │   ├── alerts/page.tsx
    │   │   ├── portfolio/page.tsx
    │   │   └── layout.tsx
    │   ├── components/
    │   │   ├── ui/                   # Reusable primitives
    │   │   │   ├── Button.tsx
    │   │   │   ├── Input.tsx
    │   │   │   ├── Select.tsx
    │   │   │   ├── Badge.tsx
    │   │   │   ├── Spinner.tsx
    │   │   │   ├── Card.tsx
    │   │   │   ├── EmptyState.tsx
    │   │   │   └── AlertBanner.tsx
    │   │   ├── Navbar.tsx
    │   │   ├── ProtectedRoute.tsx
    │   │   ├── StockCard.tsx
    │   │   ├── StockDetailModal.tsx
    │   │   └── Toast.tsx
    │   ├── hooks/
    │   │   ├── useToast.ts
    │   │   ├── useDebounce.ts
    │   │   ├── useWatchlist.ts
    │   │   ├── useAlerts.ts
    │   │   ├── usePortfolio.ts
    │   │   ├── useStockQuote.ts
    │   │   └── useSymbolValidation.ts
    │   ├── context/
    │   │   └── AuthContext.tsx
    │   └── lib/
    │       ├── api.ts                # Axios instance + interceptors
    │       ├── icons.ts              # Centralised Lucide icon exports
    │       └── utils.ts             # cn(), formatPrice, formatPct, etc.
    ├── .env.local.example
    └── package.json
```

---

## 🚀 Getting Started Locally

### Prerequisites

- Node.js v18+
- npm v9+
- MongoDB (local) or MongoDB Atlas account
- Finnhub API key — free at https://finnhub.io

### 1. Clone the Repository

```bash
git clone https://github.com/Chanchalx00/stock-tracker.git
cd stock-tracker
```

### 2. Setup Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your values (see Environment Variables below)
npm run dev
```

Backend runs at: `http://localhost:5000`

### 3. Setup Frontend

```bash
cd ../frontend
npm install
cp .env.local.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:5000/api
npm run dev
```

Frontend runs at: `http://localhost:3000`

---

## 🔐 Environment Variables

### Backend — `backend/.env`

```env
PORT=5000
NODE_ENV=development

# MongoDB (local or Atlas)
MONGO_URI=mongodb://localhost:27017/stocktracker
# Atlas: mongodb+srv://user:pass@cluster.mongodb.net/stocktracker?retryWrites=true&w=majority

# JWT
JWT_SECRET=your_64_char_random_secret_here
JWT_EXPIRES_IN=7d

# Finnhub (https://finnhub.io — free tier)
FINNHUB_API_KEY=your_finnhub_api_key

# CORS
CLIENT_URL=http://localhost:3000
```

### Frontend — `frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Generate a secure JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 🏗 Architecture

### Request Flow

```
Browser (Next.js)
      │
      │  HTTP + JWT Bearer Token
      ▼
Express.js (Render)
      │
      ├── auth.js middleware ─── invalid ──→ 401
      │
      ├── Controller
      │       │
      │       ├── stockService.js ──→ Finnhub API
      │       │
      │       └── Mongoose Models ──→ MongoDB Atlas
      │
      └── JSON Response
```

### Background Alert Checker

```
node-cron (every 5 min)
      │
      ▼
  Query MongoDB
  { isTriggered: false }
      │
      ▼
  Extract unique symbols
      │
      ▼
  Fetch prices via Finnhub (parallel)
      │
      ▼
  Evaluate each alert condition
      │
      ├── GREATER_THAN: currentPrice > targetPrice
      └── LESS_THAN:    currentPrice < targetPrice
              │
              ▼
        Update alert:
        isTriggered: true
        triggeredAt: Date.now()
        triggeredPrice: currentPrice
```

### Frontend Architecture

```
AuthContext (global state)
      │
      ├── ProtectedRoute (guards all pages)
      │
      ├── Custom Hooks (data layer)
      │   ├── useWatchlist   — watchlist CRUD
      │   ├── useAlerts      — alerts CRUD
      │   ├── usePortfolio   — portfolio CRUD + P&L
      │   └── useDebounce    — debounced symbol input
      │
      ├── lib/api.ts (Axios)
      │   ├── Attaches JWT to every request
      │   └── Redirects to /login on 401
      │
      └── lib/icons.ts (Lucide)
          └── Single source for all icons
```

---

## 📡 API Reference

**Base URL (Production):** `https://stock-tracker-backend-twb1.onrender.com/api`

**Base URL (Local):** `http://localhost:5000/api`

All protected routes require:
```
Authorization: Bearer <jwt_token>
```

---

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/signup` | ❌ | Register new user |
| `POST` | `/auth/login` | ❌ | Login, returns JWT |
| `GET` | `/auth/me` | ✅ | Get current user |

**POST `/auth/signup`**
```json
// Request
{ "name": "John Doe", "email": "john@example.com", "password": "secret123" }

// Response 201
{ "success": true, "token": "eyJ...", "user": { "id": "...", "name": "John Doe", "email": "john@example.com" } }
```

**POST `/auth/login`**
```json
// Request
{ "email": "john@example.com", "password": "secret123" }

// Response 200
{ "success": true, "token": "eyJ...", "user": { "id": "...", "name": "John Doe", "email": "john@example.com" } }
```

---

### Stocks

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/stocks/recommended` | ✅ | Get 12 popular stocks with live prices |
| `GET` | `/stocks/search?q=AAPL` | ✅ | Search stocks by symbol/name |
| `GET` | `/stocks/quote/:symbol` | ✅ | Get live quote for a symbol |
| `GET` | `/stocks/validate/:symbol` | ✅ | Validate symbol + get current price |

**GET `/stocks/quote/AAPL`**
```json
// Response 200
{
  "success": true,
  "data": {
    "symbol": "AAPL",
    "currentPrice": 189.30,
    "high": 191.05,
    "low": 187.45,
    "open": 188.60,
    "prevClose": 188.01,
    "volume": 54320100,
    "change": 1.29,
    "percentChange": 0.69
  }
}
```

---

### Watchlist

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/watchlist` | ✅ | Get user's watchlist |
| `POST` | `/watchlist` | ✅ | Add stock to watchlist |
| `DELETE` | `/watchlist/:symbol` | ✅ | Remove stock from watchlist |

**POST `/watchlist`**
```json
// Request
{ "symbol": "AAPL", "companyName": "Apple Inc." }

// Response 201
{ "success": true, "data": { "_id": "...", "symbol": "AAPL", "companyName": "Apple Inc.", ... } }
```

---

### Alerts

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/alerts` | ✅ | Get all user alerts |
| `POST` | `/alerts` | ✅ | Create a price alert |
| `DELETE` | `/alerts/:id` | ✅ | Delete an alert |

**POST `/alerts`**
```json
// Request
{ "symbol": "AAPL", "condition": "GREATER_THAN", "targetPrice": 200 }
// condition: "GREATER_THAN" | "LESS_THAN"

// Response 201
{
  "success": true,
  "data": {
    "_id": "...", "symbol": "AAPL",
    "condition": "GREATER_THAN", "targetPrice": 200,
    "isTriggered": false, "triggeredAt": null, "triggeredPrice": null
  }
}
```

---

### Portfolio

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/portfolio` | ✅ | Get holdings with live P&L |
| `POST` | `/portfolio` | ✅ | Add a holding |
| `DELETE` | `/portfolio/:id` | ✅ | Remove a holding |

**GET `/portfolio`** — Response includes live calculations:
```json
{
  "success": true,
  "data": {
    "holdings": [
      {
        "_id": "...", "symbol": "AAPL", "quantity": 10, "buyPrice": 150,
        "currentPrice": 189.30, "investedValue": 1500, "currentValue": 1893,
        "pnl": 393, "pnlPercent": 26.20, "dayChange": 0.69
      }
    ],
    "summary": {
      "totalInvested": 1500, "totalCurrent": 1893,
      "totalPnl": 393, "totalPnlPercent": 26.20, "holdingsCount": 1
    }
  }
}
```

---

## 🗄 Database Design

### Collections

**`users`**
```
_id, name, email (unique), password (hashed), createdAt, updatedAt
```

**`watchlists`**
```
_id, userId (ref: users), symbol, companyName, createdAt
Index: { userId: 1, symbol: 1 } — unique (prevents duplicates per user)
```

**`alerts`**
```
_id, userId (ref: users), symbol, condition (GREATER_THAN|LESS_THAN),
targetPrice, isTriggered (default: false), triggeredAt, triggeredPrice, createdAt
Index: isTriggered — for fast cron queries
```

**`holdings`**
```
_id, userId (ref: users), symbol, companyName, quantity, buyPrice, createdAt
P&L is calculated dynamically — not stored
```

---

## ⏰ Background Jobs

### Alert Checker — `src/jobs/alertChecker.js`

- **Schedule:** `*/5 * * * *` (every 5 minutes)
- Queries only `{ isTriggered: false }` alerts
- Uses `Promise.allSettled` to fetch prices in parallel
- One Finnhub API call per unique symbol (not per alert)
- Failed symbols are skipped silently — don't block others
- Triggered alerts updated with `triggeredAt` timestamp and actual `triggeredPrice`

---

## 🚢 Deployment

### Frontend → Vercel

1. Push to GitHub
2. Import repo at https://vercel.com → select `frontend/` as root directory
3. Add env variable: `NEXT_PUBLIC_API_URL=https://stock-tracker-backend-twb1.onrender.com/api`
4. Deploy

**Live:** https://stock-tracker-lime-theta.vercel.app/

### Backend → Render

| Setting | Value |
|---------|-------|
| **Type** | Web Service |
| **Root Directory** | `backend` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance** | Free |

Environment variables set on Render:
```
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=...
JWT_EXPIRES_IN=7d
FINNHUB_API_KEY=...
CLIENT_URL=https://stock-tracker-lime-theta.vercel.app
```

**Live:** https://stock-tracker-backend-twb1.onrender.com

### Database → MongoDB Atlas

- Cluster: M0 Free Tier
- Network Access: `0.0.0.0/0` (required for Render)
- Database: `stocktracker`
- Collections: `users`, `watchlists`, `alerts`, `holdings`

---

## 📮 Postman Collection

A complete Postman collection is included in the repository.

**File:** `StockPulse.postman_collection.json`

### Import Steps:
1. Open Postman
2. Click **Import** → drag and drop `StocKTracker.postman_collection.json`
3. Set the collection variable `base_url`:
   - **Local:** `http://localhost:5000/api`
   - **Production:** `https://stock-tracker-backend-twb1.onrender.com/api`
4. Run **Signup** or **Login** first — the collection auto-saves the token
5. All subsequent requests use the saved token automatically

---

## ⚖️ Assumptions & Tradeoffs

| Decision | Reasoning |
|----------|-----------|
| **Finnhub free tier** | Returns data for US stocks (NYSE/NASDAQ). Indian NSE symbols (RELIANCE, TCS) are not reliably available. Finnhub returns `c: 0` for unavailable symbols — these are filtered out. |
| **JWT in localStorage** | Simple to implement. For higher security (production), httpOnly cookies + refresh tokens would be preferred. |
| **No WebSockets** | Alert checking is cron-based (every 5 min). Real-time would require Socket.io or SSE — added complexity outside assignment scope. |
| **P&L not cached** | Portfolio P&L is calculated fresh on each request. With Redis caching, Finnhub rate limits (60 req/min free tier) would not be a concern at scale. |
| **Alerts not re-triggered** | Once triggered, an alert stays triggered. User must delete and recreate for a new alert on the same symbol. |
| **Render cold starts** | Free tier services spin down after 15 minutes. First request takes ~30 seconds. UptimeRobot can be used to keep the service warm. |
| **No rate limiting** | `express-rate-limit` not added for assignment scope, but recommended for production. |

---

## 📊 Evaluation Criteria Coverage

| Area | Weight | Implementation |
|------|--------|---------------|
| Clean Code & Maintainability | 15% | Reusable components, custom hooks, `cn()` utility, centralised icons, separation of concerns |
| Backend Architecture | 20% | Config / Middleware / Models / Routes / Controllers / Services / Jobs layers |
| Next.js Frontend | 20% | App Router, TypeScript, Tailwind, protected routes, metadata, ARIA tags |
| Problem Solving Ability | 15% | Symbol validation, smart price suggestions, zero-price handling, graceful error states |
| Async/Background Jobs | 10% | node-cron alert checker, Promise.allSettled for parallel price fetching |
| Database Design | 10% | Proper indexes, compound unique index on watchlist, ref relationships |
| Documentation | 5% | This README + Postman collection |

---

## 👤 Author

**Chanchal** — [@Chanchalx00](https://github.com/Chanchalx00)

---

## 📄 License

