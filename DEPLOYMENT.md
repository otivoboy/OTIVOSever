# OTIVO AI CLOUD DERIV UNIVERSAL BOT - Architecture & Deployment Guide

## 1. System Architecture
```
[Netlify Frontend Dashboard] (React, Vite, Tailwind CSS)
                           │ (HTTPS / WSS proxy)
[Persistent Cloud Backend API & Trading Worker] (Node.js, TypeScript, Railway/Render/Fly.io)
      ├── Durable Job Scheduler (UTC Cron / Time-window monitor)
      ├── Centralized Risk Manager (Circuit breakers, max exposure, drawdown limits)
      ├── Hybrid Strategy Engine (Momentum, Mean Reversion, Digit Frequency, Accumulators)
      ├── Persistent State Storage (Durable state store + PostgreSQL 001 Schema)
      └── Deriv Official WebSocket Engine (wss://ws.derivws.com/websockets/v3)
```

### Critical Cloud Invariant
- **The frontend is only a remote control panel.**
- **The trading engine runs exclusively on the persistent backend.**
- When users close their browser, close the website, or turn off their phone, the background worker continues executing trades according to saved bot schedules and risk rules.

## 2. Deriv Markets & Contract Coverage

### The 8 Standard Volatility 1-Second Indices
1. `1HZ10V` - Volatility 10 (1s) Index
2. `1HZ15V` - Volatility 15 (1s) Index
3. `1HZ25V` - Volatility 25 (1s) Index
4. `1HZ30V` - Volatility 30 (1s) Index
5. `1HZ50V` - Volatility 50 (1s) Index
6. `1HZ75V` - Volatility 75 (1s) Index
7. `1HZ90V` - Volatility 90 (1s) Index
8. `1HZ100V` - Volatility 100 (1s) Index

*Configurable Slots*: If 10 market slots are desired, Slots 9 and 10 are dynamic configurable slots that query verified active symbols from Deriv's catalogue (`R_100`, `R_50`, `1HZ200V`, `1HZ300V`).

### Contract Families Supported
- **Rise / Fall** (`CALL`, `PUT`)
- **Higher / Lower** (`HIGHER`, `LOWER`)
- **Touch / No Touch** (`ONETOUCH`, `NOTOUCH`)
- **Ends In / Out** (`EXPIRYMISS`, `EXPIRYRANGE`)
- **Stays In / Goes Out** (`RANGE`, `UPORDOWN`)
- **Digits** (`DIGITMATCH`, `DIGITDIFF`, `DIGITEVEN`, `DIGITODD`, `DIGITOVER`, `DIGITUNDER`)
- **Accumulators** (`ACCU` with growth rates & knockout protection)
- **Multipliers** (`MULTUP`, `MULTDOWN` with stop-loss & take-profit)
- **Asian** (`ASIANU`, `ASIAND`)
- **Reset** (`RESETCALL`, `RESETPUT`)

## 3. Deployment Instructions

### Frontend (Netlify)
1. Link your repository in Netlify.
2. Build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Node version**: `20`
3. Netlify will use `netlify.toml` which routes `/api/*` requests to your persistent backend server.

### Backend & Persistent Cloud Worker (Railway, Render, Fly.io)
1. Deploy using the included multi-stage `Dockerfile`.
2. Configure Environment Variables:
   - `PORT=3000`
   - `NODE_ENV=production`
   - `DERIV_APP_ID=1089` (or your registered Deriv OAuth App ID)
   - `DATABASE_URL=postgres://...`
3. Attach a persistent volume to `/app/data` to ensure durable state survivability.

### Database Setup (PostgreSQL)
Run the migration file located at:
```bash
psql $DATABASE_URL -f database/migrations/001_initial_schema.sql
```

## 4. Crash Recovery & Safety Invariants
- On startup, the worker scans for bots with status `RUNNING` or `DEPLOYING` and enters `RECOVERING` state.
- Unsettled contracts are reconciled first before any new proposal or buy request can be generated.
- Lease heartbeats occur every 3 seconds to guarantee a single active worker per bot.
- Circuit breaker triggers (`RISK_LIMIT_REACHED`) lock further trade executions until manual reset.
