# ⚡ VoltEarth — AI Powered Renewable Energy Platform

A full-featured renewable energy analysis dashboard with Supabase database integration.

## 📁 Project Structure

```
voltearth/
│
├── index.html              ← Main entry point (open this in browser)
│
├── css/
│   └── main.css            ← All styles, animations, dark theme
│
├── js/
│   ├── db.js               ← Supabase database module (plain fetch, no SDK)
│   ├── state.js            ← Global state, location data, constants
│   ├── auth.js             ← Login, register, logout, app bootstrap
│   ├── location.js         ← GPS, dropdowns, location modal, navigation
│   ├── charts.js           ← Dashboard Chart.js configurations
│   ├── generator.js        ← Energy analysis, results, report builder
│   ├── activity.js         ← Activity log, table render, filters
│   ├── download.js         ← CSV export, download modal, date validation
│   ├── voice.js            ← Web Speech API, TTS voice commands
│   └── helpers.js          ← Toast, loader, DOMContentLoaded init
│
└── db/
    └── setup.sql           ← Run once in Supabase SQL Editor
```

## 🚀 How to Run

### Option 1 — Open locally (simplest)
1. Download this entire `voltearth/` folder
2. Double-click `index.html` — opens in your browser
3. Database connects automatically to Supabase

### Option 2 — VS Code Live Server (recommended for development)
1. Install the **Live Server** extension in VS Code
2. Right-click `index.html` → **Open with Live Server**
3. App runs at `http://127.0.0.1:5500`

### Option 3 — Deploy to Netlify (free hosting)
1. Go to [netlify.com/drop](https://netlify.com/drop)
2. Drag and drop the entire `voltearth/` folder
3. Done — live URL in seconds

### Option 4 — Deploy to Vercel
```bash
npm install -g vercel
cd voltearth/
vercel
```

## 🗄 Database Setup (one-time)

1. Go to [https://eicwqdylfqbzuvxmxdgh.supabase.co](https://eicwqdylfqbzuvxmxdgh.supabase.co)
2. Open **SQL Editor** → **New Query**
3. Paste the contents of `db/setup.sql`
4. Click **Run**

Tables created: `users`, `predictions`, `activity_logs`

## ⚙️ Configuration

Edit the top of `js/db.js` to change your Supabase credentials:

```js
const SB_URL = 'https://eicwqdylfqbzuvxmxdgh.supabase.co';
const SB_KEY = 'sb_publishable_CSX_PJrPrQeruzoE1cE7fg_3dZ1Z2j4';
```

## 🔄 How Database Auto-save Works

| Event | Saved to DB |
|-------|------------|
| User logs in / registers | `users` table (upserted) |
| Energy prediction generated | `predictions` table (auto) |
| User searches, downloads, navigates | `activity_logs` table |
| Reports page opened | Loads from `predictions` |
| Activity page opened | Loads from `activity_logs` |

## ⚠️ Why Not Claude Artifact?

The app uses `fetch()` to call Supabase APIs. Claude's artifact viewer runs inside a sandboxed iframe that **blocks all outbound network requests** — so DB calls show "Failed to fetch". Running the file directly in a browser (or on any hosting) works perfectly.

## 🛠 Tech Stack

- **Frontend**: Vanilla HTML/CSS/JS (no framework needed)
- **Charts**: Chart.js 4.4
- **Database**: Supabase (PostgreSQL via REST API)
- **Fonts**: Syne + DM Sans (Google Fonts)
- **Voice**: Web Speech API (built into browsers)
- **GPS**: Browser Geolocation API + Nominatim reverse geocoding
