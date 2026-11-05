# AI Code Evolution Lab — Ubuntu Setup & Run Guide

Yeh guide un sabhi developers ke liye hai jo is repository ko **Ubuntu Linux** (20.04 / 22.04 / 24.04 LTS) par clone karke scratch se run karna chahte hain.

---

## 1. System Requirements (Prerequisites)

Naye system par sabse pehle yeh tools hone chahiye:
- **OS:** Ubuntu Linux (64-bit)
- **Node.js:** v20.x, v22.x, ya v24.x LTS
- **pnpm:** v12.x ya v10.x
- **Docker & Docker Compose:** Containers (PostgreSQL, MongoDB, Redis, Judge0) run karne ke liye
- **Git & Build Essentials:** C++ compiler aur native build tools ke liye

---

## 2. Step-by-Step Installation Commands (Ubuntu Terminal)

### Step 2.1: System Packages & Node.js Install Karein
```bash
# 1. System updates aur build tools install karein
sudo apt update && sudo apt install -y git curl build-essential

# 2. Node.js v22 LTS install karein
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Verify karein
node -v    # v22.x ya higher dikhana chahiye
npm -v
```

### Step 2.2: pnpm Package Manager Install Karein
```bash
# pnpm globally install karein
npm install -g pnpm

# Verify karein
pnpm -v    # v10.x ya v12.x dikhana chahiye
```

### Step 2.3: Docker & Docker Compose Install Karein
```bash
# Docker install karein
sudo apt install -y docker.io docker-compose-v2

# Apne user ko docker group me add karein (bina sudo ke docker chalane ke liye)
sudo usermod -aG docker $USER

# Group permissions apply karne ke liye run karein:
newgrp docker

# Verify karein
docker --version
docker compose version
```

---

## 3. Clone Repository & Setup

```bash
# 1. Repository clone karein
git clone https://github.com/mohankunjam25-hue/AiCA.git

# 2. Project directory me jayein
cd AiCA

# 3. Environment file banayein (.env.example se copy karein)
cp .env.example .env
```

---

## 4. Install Dependencies (Monorepo)

```bash
# Dependencies install karein
pnpm install

# Agar pnpm build scripts approve karne ko bole to run karein:
pnpm approve-builds --all
```

---

## 5. Database & Sandbox Containers Start Karein (Docker)

Hamari `docker/docker-compose.yml` file me PostgreSQL 16, MongoDB 7, Redis 7, aur Judge0 CE sandbox pre-configured hain.

```bash
# Saare database containers background me start karein
docker compose -f docker/docker-compose.yml up -d

# Containers status check karein
docker ps
```

Aapko 3–5 containers running dikhenge:
- `aica-postgres` (Port `5432`)
- `aica-mongodb` (Port `27017`)
- `aica-redis` (Port `6379`)
- `aica-judge0-server` (Port `2358`)

---

## 6. Database Migrations & Initial Seed Data

PostgreSQL me demo users aur MongoDB me 3 comprehensive algorithmic problems seed karne ke liye:

```bash
# Seed script run karein
pnpm --filter @aica/api seed
```

**Seed Output:**
- Demo Student User: `student@aica.lab` / `DemoUser123!`
- Admin User: `admin@aica.lab` / `AdminSecret123!`
- Algorithmic Problems:
  1. *Two Sum Optimal* (Easy)
  2. *Longest Substring Without Repeating Characters* (Medium)
  3. *Container With Most Water* (Medium)

---

## 7. Run the Application (Development Mode)

Ek single command se poora monorepo (API + Worker + Frontend) start ho jayega:

```bash
# All-in-one start (Turbo)
pnpm dev
```

Ya fir alag-alag terminals me start kar sakte hain:

### Terminal 1 — Express REST API (Port 5000)
```bash
pnpm --filter @aica/api dev
```
👉 API Gateway URL: **`http://localhost:5000`**  
👉 Healthcheck URL: **`http://localhost:5000/health`**

### Terminal 2 — BullMQ Worker Daemon
```bash
pnpm --filter @aica/worker dev
```
👉 Worker code execution, Judge0 polling, aur AI complexity evaluation listen karega.

### Terminal 3 — Frontend React SPA (Port 5173)
```bash
pnpm --filter @aica/web dev
```
👉 Browser me open karein: **`http://localhost:5173`**

---

## 8. Run Verification & Unit Tests

Saare packages ka build aur automated test suites verify karne ke liye:

```bash
# Run unit test suite (Vitest)
pnpm test

# Build all 5 workspace packages (Turborepo)
pnpm build
```

Expected output:
```
✓ tests/ai-parser.test.ts (3 tests)
✓ tests/diff-engine.test.ts (5 tests)
✓ tests/scoring-engine.test.ts (3 tests)
Test Files  3 passed (3)
Tests       11 passed (11)
```

---

## 9. Common Troubleshooting (Aam Samasyaein & Samadhan)

### Q1: `permission denied while trying to connect to the Docker daemon socket`
**Solution:**
```bash
sudo usermod -aG docker $USER
newgrp docker
```

### Q2: `Port 5432 / 27017 / 6379 already in use`
Agar aapke system par pehle se local Postgres ya Mongo chal raha hai:
```bash
# Check karein kaunsa process port use kar raha hai:
sudo lsof -i :5432
sudo lsof -i :27017
sudo lsof -i :6379

# Agar local service stop karni ho:
sudo systemctl stop postgresql
sudo systemctl stop mongod
sudo systemctl stop redis
```

### Q3: AI Analysis (Gemini) API Key
Agar aapke paas Google Gemini API key hai to `.env` me daal sakte hain:
```env
GEMINI_API_KEY=AIzaSy...
```
*Note: Agar key nahi bhi daalte hain, tab bhi code execution, tests evaluation, scoring aur Monaco editor bina kisi rukawat ke mock fallback mode me perfectly chalte hain.*

---

## 10. Summary Cheat Sheet

```bash
# Quick Setup
git clone https://github.com/mohankunjam25-hue/AiCA.git
cd AiCA
cp .env.example .env
pnpm install
docker compose -f docker/docker-compose.yml up -d
pnpm --filter @aica/api seed
pnpm dev
```
Browse: **`http://localhost:5173`**
