# Deployment Guide - TradeIndia Inquiry Manager

This guide covers how to deploy your app online for free. You have two parts to deploy:
1. **Backend** (Node.js + Express + SQLite) — handles API, database, file processing
2. **Frontend** (React) — the dashboard UI

---

## Option 1: Render.com (Recommended - Free, Easiest)

**Best for:** Full-stack apps, no credit card needed, SQLite works fine.

### Step 1: Push to GitHub

```bash
cd tradeindia-inquiry-manager
git init
git add .
git commit -m "Initial commit"
# Create a repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/tradeindia-inquiry-manager.git
git push -u origin main
```

### Step 2: Deploy Backend on Render

1. Go to [render.com](https://render.com) and sign up (free, no card).
2. Click **New +** → **Web Service**.
3. Connect your GitHub repo.
4. Configure:
   - **Name:** `tradeindia-backend`
   - **Runtime:** Node
   - **Build Command:** `cd backend && npm install`
   - **Start Command:** `cd backend && npm start`
   - **Plan:** Free
5. Add Environment Variables:
   - `NODE_ENV` = `production`
   - `PORT` = `10000` (Render assigns this)
   - `DB_PATH` = `/tmp/inquiries.db` (ephemeral but works for free tier)
   - `OPENAI_API_KEY` = `sk-your-key` (optional)
6. Click **Create Web Service**.

Your backend will be live at `https://tradeindia-backend.onrender.com`

### Step 3: Deploy Frontend on Render (Static Site)

1. In Render dashboard, click **New +** → **Static Site**.
2. Connect the same GitHub repo.
3. Configure:
   - **Name:** `tradeindia-frontend`
   - **Build Command:** `cd frontend && npm install && npm run build`
   - **Publish Directory:** `frontend/build`
4. Add Environment Variable:
   - `REACT_APP_API_URL` = `https://tradeindia-backend.onrender.com`
5. Click **Create Static Site**.

Your frontend will be live at `https://tradeindia-frontend.onrender.com`

> **Note:** Render free tier puts services to sleep after 15 min of inactivity. First request after sleep takes 30-60 seconds to wake up.

---

## Option 2: Vercel (Frontend) + Render (Backend)

**Best for:** Fastest frontend, reliable backend.

### Deploy Frontend on Vercel

1. Go to [vercel.com](https://vercel.com), sign up with GitHub.
2. Click **Add New Project**.
3. Import your GitHub repo.
4. In settings:
   - **Framework Preset:** Create React App
   - **Root Directory:** `frontend`
   - Add Environment Variable: `REACT_APP_API_URL` = your backend URL
5. Click **Deploy**.

Your frontend will be live instantly at `https://your-project.vercel.app`

### Deploy Backend on Render (same as Option 1, Step 2)

Then update the frontend environment variable with the actual backend URL and redeploy.

---

## Option 3: Netlify (Frontend) + Render (Backend)

**Best for:** Netlify's great CDN and form handling.

### Deploy Frontend on Netlify

1. Go to [netlify.com](https://netlify.com), sign up.
2. Drag and drop the `frontend/build` folder, or connect GitHub.
3. If using GitHub:
   - **Build command:** `cd frontend && npm run build`
   - **Publish directory:** `frontend/build`
   - Add Environment Variable: `REACT_APP_API_URL` = your backend URL
4. Deploy.

Your frontend will be live at `https://your-project.netlify.app`

### Deploy Backend on Render (same as Option 1, Step 2)

---

## Option 4: Railway (Full-Stack on One Platform)

**Best for:** No cold starts, generous free trial.

1. Go to [railway.app](https://railway.app), sign up.
2. New Project → Deploy from GitHub repo.
3. Railway auto-detects Node.js. Add a start command if needed.
4. Add environment variables in Railway dashboard.
5. Deploy.

Railway gives $5 free credit monthly. No cold starts.

---

## Option 5: SnapDeploy (Free Forever)

**Best for:** Truly free forever, no credit card.

1. Go to [snapdeploy.dev](https://snapdeploy.dev), sign up.
2. Click **Create New App** → select **Node.js Express** template.
3. Connect your GitHub repo.
4. Deploy.

Free tier: 4 containers, 512MB RAM each, auto-sleep after 45 min (auto-wake in 10-30s).

---

## Important Notes

### SQLite on Free Hosting

SQLite is a file-based database. On free hosting:
- **Render:** Use `/tmp/inquiries.db` — file persists during container life but resets on redeploy. For production, upgrade to Render's disk add-on ($0.25/GB/mo).
- **Railway:** Persistent disk available.
- **SnapDeploy:** Check if persistent storage is offered.

**For production with real data:** Consider upgrading to a paid tier or switching to PostgreSQL (Render offers free PostgreSQL for 90 days).

### CORS Configuration

The backend already has CORS enabled. If you deploy frontend and backend on different domains, make sure the backend allows your frontend domain:

```javascript
// In backend/src/index.js, update CORS:
app.use(cors({
  origin: ['https://your-frontend.vercel.app', 'https://your-frontend.netlify.app']
}));
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | Yes | Server port (Render assigns 10000) |
| `NODE_ENV` | Yes | `production` for deployed apps |
| `DB_PATH` | Yes | Path to SQLite file |
| `OPENAI_API_KEY` | No | OpenAI API key for AI extraction |
| `AI_API_URL` | No | Alternative AI API endpoint |
| `AI_MODEL` | No | AI model name |

### Custom Domain (Optional)

All platforms support custom domains:
- **Vercel:** Settings → Domains → Add your domain
- **Netlify:** Domain settings → Add custom domain
- **Render:** Settings → Custom Domains
- Point your domain's CNAME to the platform's URL.

---

## Quick Start Checklist

- [ ] Push code to GitHub
- [ ] Sign up on Render (or chosen platform)
- [ ] Deploy backend with correct env vars
- [ ] Copy backend URL
- [ ] Deploy frontend with `REACT_APP_API_URL` set to backend URL
- [ ] Test upload, filtering, dashboard
- [ ] (Optional) Add custom domain
- [ ] (Optional) Add OpenAI API key for better extraction

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Cannot connect to backend" | Check CORS settings, verify `REACT_APP_API_URL` |
| "SQLite database locked" | Free tiers may have file I/O limits; restart the service |
| "Upload fails" | Check file size limits (50MB max), ensure CSV format |
| "AI extraction not working" | Add `OPENAI_API_KEY` env var; fallback regex works without it |
| "Frontend shows blank page" | Check browser console for API errors |
| "Cold start slow" | Normal on free tiers; first request after inactivity takes 30-60s |

---

## Platform Comparison

| Platform | Free Tier | Cold Start | Custom Domain | Best For |
|----------|-----------|------------|---------------|----------|
| **Render** | 750 hrs/mo | Yes (30s) | Yes (paid) | Full-stack, easiest setup |
| **Vercel** | Unlimited sites | No | Yes | Fastest frontend |
| **Netlify** | 100GB bandwidth | No | Yes | Static sites, CDN |
| **Railway** | $5 credit/mo | No | Yes | No cold starts |
| **SnapDeploy** | Free forever | Yes (10s) | Yes (paid) | Truly free hosting |

---

## Need Help?

- Render docs: [render.com/docs](https://render.com/docs)
- Vercel docs: [vercel.com/docs](https://vercel.com/docs)
- Netlify docs: [docs.netlify.com](https://docs.netlify.com)
