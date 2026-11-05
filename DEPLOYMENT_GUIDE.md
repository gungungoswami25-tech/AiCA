# AI Code Evolution Lab — Production Deployment Guide
## Render (Backend API + Worker) & Vercel (Frontend SPA)

Yeh complete step-by-step production deployment guide hai. Isme hum **100% Free Tiers** use karke poora application live deploy karenge:
- **Frontend SPA:** [Vercel](https://vercel.com) (Global CDN, High Speed)
- **Backend API & Worker:** [Render](https://render.com) (Web Service)
- **PostgreSQL Database:** [Render PostgreSQL](https://render.com) ya [Neon](https://neon.tech) / [Supabase](https://supabase.com)
- **MongoDB Database:** [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (M0 Free Cluster)
- **Redis Broker:** [Render Redis](https://render.com) ya [Upstash](https://upstash.com) (Serverless Redis)
- **AI Engine:** [Google Gemini 1.5 Flash](https://aistudio.google.com/app/apikey) (Free API Tier)

---

## Architecture Flow in Production

```
Browser (Student)
      │
      ▼ HTTPS
[Vercel Global CDN] ───> https://aica-lab.vercel.app (React 18 + Monaco Editor)
      │
      ▼ REST & SSE (Bearer Auth)
[Render Web Service] ──> https://aica-api.onrender.com (Express Gateway + BullMQ Worker)
      │
      ├─► PostgreSQL (Users, Profiles, Credentials SSOT)
      ├─► MongoDB Atlas (Problems, Submissions, Evaluation Reports)
      ├─► Redis (BullMQ Queues, SSE Pub/Sub, Leaderboard ZSET)
      └─► Google Gemini 1.5 Flash API (Structured Complexity & Code Diagnosis)
```

---

## Step 1: Cloud Databases Setup (Free Tier, ~5 Minutes)

### A. MongoDB Atlas (Problems & Submissions)
1. [cloud.mongodb.com](https://cloud.mongodb.com) par login karein.
2. **Create Deployment** -> **M0 (Free)** cluster choose karein.
3. **Database Access** me jakar ek Database User banayein (username aur password note kar lein).
4. **Network Access** me jakar **Add IP Address** -> **Allow Access from Anywhere (`0.0.0.0/0`)** add karein.
5. Cluster me **Connect** par click karein -> **Drivers (Node.js)** choose karein aur connection string copy karein:
   ```env
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/aica_lab?retryWrites=true&w=majority
   ```

### B. PostgreSQL (Users & Auth SSOT)
1. [dashboard.render.com](https://dashboard.render.com) par login karein.
2. **New +** -> **PostgreSQL** click karein.
3. Name: `aica-postgres`, Database: `aica_lab`, User: `postgres`.
4. Plan: **Free**.
5. Create hone ke baad **Internal Database URL** (agar backend bhi Render par hai) ya **External Database URL** copy karein:
   ```env
   postgresql://postgres:xxxx@dpg-xxxxx.oregon-postgres.render.com/aica_lab
   ```

### C. Redis (BullMQ & Pub/Sub)
1. Render dashboard par **New +** -> **Redis** click karein (ya [upstash.com](https://upstash.com) par free Redis banayein).
2. Name: `aica-redis`, Plan: **Free**.
3. **Internal Redis URL** ya **External Redis URL** copy karein:
   ```env
   redis://red-xxxxx:6379   # Render
   # ya rediss://default:xxxx@xxxx.upstash.io:6379   # Upstash
   ```

### D. Google Gemini API Key
1. [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) par jayein.
2. **Create API key** click karke apni free Gemini API key copy karein.

---

## Step 2: Deploy Backend on Render (API + Worker)

Hamne repository me `render.yaml` aur production start scripts pre-configure kar diye hain.

### Option A: Using Render Dashboard (Recommended & Simple)
1. [dashboard.render.com](https://dashboard.render.com) par jayein.
2. **New +** -> **Web Service** par click karein.
3. Apna GitHub repository connect karein: `https://github.com/mohankunjam25-hue/AiCA`.
4. Settings fill karein:
   - **Name:** `aica-backend`
   - **Region:** Oregon (US West) ya Frankfurt (jo aapke DB ke paas ho)
   - **Branch:** `main`
   - **Root Directory:** (Khaali chhod dein / default `.`)
   - **Runtime:** `Node`
   - **Build Command:**
     ```bash
     pnpm install && pnpm approve-builds --all && pnpm build
     ```
   - **Start Command:**
     ```bash
     pnpm start:render
     ```
     *(Yeh command Express API ko `$PORT` par aur BullMQ Execution Worker ko background me ek sath run karti hai, jisse Render ke 1 free service me dono run ho jaate hain).*
   - **Plan:** **Free**
5. **Environment Variables** add karein (**Add Environment Variable** button se):
   | Key | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `PORT` | `10000` |
   | `DATABASE_URL` | Aapka PostgreSQL URL (`postgresql://...`) |
   | `MONGODB_URI` | Aapka MongoDB Atlas URL (`mongodb+srv://...`) |
   | `REDIS_URL` | Aapka Redis URL (`redis://...`) |
   | `JWT_SECRET` | Koi bhi strong random 32+ character string |
   | `JWT_REFRESH_SECRET` | Koi doosri random 32+ character string |
   | `CLIENT_URL` | `*` (ya Vercel deploy hone ke baad aapka Vercel URL) |
   | `GEMINI_API_KEY` | Aapki Google Gemini API key |
6. **Health Check Path** me `/health` enter karein.
7. **Create Web Service** par click karein.
8. Build 2–3 minutes me complete ho jayegi. Jab service **Live** ho jaye, to URL copy karein:
   👉 Example: `https://aica-backend.onrender.com`

### Step 2.1: Seed Database on Render (One-Time)
Jab Render par service Live ho jaye, Render dashboard me **Shell** tab open karein aur yeh command run karein:
```bash
pnpm --filter @aica/api seed
```
Isse PostgreSQL tables ban jayengi aur MongoDB me algorithmic problems seed ho jayengi!

---

## Step 3: Deploy Frontend on Vercel

1. [vercel.com](https://vercel.com) par login karein.
2. **Add New...** -> **Project** par click karein.
3. Apna GitHub repository choose karein (`AiCA`).
4. **Project Settings**:
   - **Framework Preset:** `Vite`
   - **Root Directory:** (Khaali chhod dein / default `.`)
   - **Build Command:** `pnpm --filter @aica/web build` (Automatically detected)
   - **Output Directory:** `apps/web/dist`
5. **Environment Variables**:
   Neeche **Environment Variables** section me add karein:
   - **Key:** `VITE_API_URL`
   - **Value:** Aapka Render backend URL (e.g. `https://aica-backend.onrender.com`)
6. **Deploy** button par click karein.
7. Vercel ~60 seconds me build karke live URL de dega:
   👉 Example: `https://aica-lab.vercel.app`

---

## Step 4: Final Linkup & CORS Verification

1. Render dashboard par jayein -> `aica-backend` -> **Environment**.
2. `CLIENT_URL` ko update karke apna naya Vercel URL daal dein:
   ```env
   CLIENT_URL=https://aica-lab.vercel.app
   ```
3. Save changes karein (Render auto-restart karega).

---

## Step 5: Live Production Verification Checklist

1. Browser me apna Vercel URL open karein: `https://aica-lab.vercel.app`
2. **Problems Catalog:** Verify karein ki "Two Sum Optimal", "Longest Substring", etc. load ho rahe hain.
3. **Sign In / Register:** Naya student account register karein.
4. **Solve Problem:** Monaco Editor me solution likhein.
5. **Submit:** Click "Submit Solution" -> Verify karein ki real-time SSE progress bar move karta hai (`COMPILING` -> `EXECUTING` -> `ANALYZING_AI` -> `COMPLETED`).
6. **Evaluation Report:** Detailed Big-O analysis aur test cases matrix check karein.
7. **Leaderboard:** Leaderboard par jaakar score ranking check karein.

---

## Troubleshooting Guide (Render & Vercel)

| Issue | Cause | Fix |
|---|---|---|
| **Vercel page refresh par 404 de raha hai** | SPA route rewrite missing | Hamne `vercel.json` me `{"source": "/(.*)", "destination": "/index.html"}` configure kar diya hai. Vercel ise automatic apply karega. |
| **API request blocked by CORS** | `CLIENT_URL` mismatch | Render me `CLIENT_URL` me apna exact Vercel domain bina trailing slash ke dalein (`https://your-app.vercel.app`), ya `*` set karein. |
| **PostgreSQL connection timeout on Render** | SSL mode required | Hamne `db.ts` me `ssl: { rejectUnauthorized: false }` enable kar diya hai. Direct connection URL chalega. |
| **Render Web Service sleep ho jata hai** | Free tier inactivity (15 mins) | Render free services 15 min idle hone par sleep ho jati hain. Pehli request me 30-50s lag sakte hain wake hone me. Iske liye [cron-job.org](https://cron-job.org) se har 10 min par `https://your-api.onrender.com/health` ko ping kar sakte hain. |
