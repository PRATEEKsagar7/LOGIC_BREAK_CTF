# LOGIC BREAK CTF 🚩⚡

> **Collegiate Cybersecurity Capture-The-Flag Arena Platform**

A full-stack, real-time CTF platform built with a high-performance Node.js backend, zero-latency Server-Sent Events (SSE) auto-sync leaderboard, tiered point system (+50/-15 and +100/-25), challenge artifacts/hints distribution, and an integrated master admin control panel.

---

## 🚀 Key Features

- **🎮 Mission & Exploit Vectors Dashboard**:
  - 12 realistic challenge categories: Web Security, Cryptography, Reverse Engineering, Forensics, Binary Exploitation, Cloud Security (SSRF), and Privilege Escalation.
  - Interactive hint reveals and direct challenge file/code downloads.
  - In-browser flag validation with instant feedback.
- **⚖️ Tiered Scoring Protocol**:
  - **Tier 1 (Challenges 01 – 07 - Standard)**: **+50 PTS** on solve | **-15 PTS penalty** on incorrect flag.
  - **Tier 2 (Challenges 08 – 12 - Elite)**: **+100 PTS** on solve | **-25 PTS penalty** on incorrect flag.
  - Anti-replay protection prevents duplicate score accumulation.
- **📊 Real-Time Auto-Sync Leaderboard**:
  - Zero-latency auto-sync via native Server-Sent Events (`/api/events`).
  - Glowing visual podium for Top 3 collegiate squads.
  - Live activity stream ticker broadcasting real-time captures and penalties.
- **🛡️ Master Admin Command Center**:
  - Hardcoded operator authentication (`admin` / `logicbreak_admin_2026` or `admin123`).
  - **Embedded Live Leaderboard & Telemetry Monitor** directly inside the admin panel.
  - Real-time flag submission audit log (inspects exact flag strings submitted by teams).
  - Emergency arena reset controls and team score overrides.
- **💻 Desktop-Optimized Command View**:
  - Full-width modern tactical command-center layout (charcoal & neon emerald aesthetic).
  - Seamless inter-page navigation connecting Overview, Missions, Leaderboard, Files, and Admin.

---

## 🛠️ Quick Start

### 1. Run the Platform
The platform uses native zero-dependency Node.js:
```bash
# Start server
npm start
# Or
node server.js
```

### 2. Access the Arena
- **Overview Dashboard**: `http://localhost:3000/` or `http://localhost:3000/overview.html`
- **Missions & Flags**: `http://localhost:3000/missions.html`
- **Live Leaderboard**: `http://localhost:3000/leaderboard.html`
- **Files & Resources**: `http://localhost:3000/files.html`
- **Admin Panel**: `http://localhost:3000/admin.html`

### 3. Default Admin Credentials
- **Username**: `admin`
- **Password**: `logicbreak_admin_2026` *(backup: `admin123`)*

---

## 📁 Repository Structure

```
Logic_CTF/
├── server.js                          # Node.js backend with SSE auto-sync & flag validator
├── package.json                       # Project metadata & start scripts
├── shared_nav.js                      # Unified navigation, active squad switcher & SSE listener
├── challenge_files/                   # 12 real downloadable challenge artifacts (PCAP, C, SQL, JSON)
├── index.html / overview.html         # Full-width desktop arena overview & telemetry
├── missions.html                      # Missions arena with flag submit modal & hints
├── leaderboard.html                   # Real-time auto-sync leaderboard & podium
├── admin.html                         # Admin panel with hardcoded login & embedded leaderboard
├── files.html                         # Centralized challenge files & rules hub
├── DESIGN.md                          # Cyber Tactical Arena design system specs
└── screenshots/                       # Visual design reference mockups
```

---

## 🏆 Developed For
**Logic Break CTF 2026** — Collegiate Cybersecurity Collective.
