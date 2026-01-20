---
description: Deploy the React Frontend to Vercel
---

# Deploy Frontend to Vercel

## Prerequisites
- Vercel account (https://vercel.com)
- Vercel CLI installed: `npm i -g vercel`
- GitHub account (optional, for auto-deploy)

## Option A: Deploy via Vercel CLI (Quick)

### Step 1: Login to Vercel

// turbo
```bash
cd c:\Users\Coxward\Desktop\SpotifyAPI-NET\Spotify-Client
npx vercel login
```

### Step 2: Configure Environment Variables

Create `.env.production` in Spotify-Client:

```env
VITE_API_BASE_URL=https://your-backend-url.smarterasp.net
```

### Step 3: Deploy

// turbo
```bash
cd c:\Users\Coxward\Desktop\SpotifyAPI-NET\Spotify-Client
npx vercel --prod
```

Follow the prompts:
- **Set up and deploy?** Yes
- **Which scope?** Select your account
- **Link to existing project?** No (first time) / Yes (subsequent)
- **Project name?** spotify-client
- **Directory?** ./
- **Override settings?** No

### Step 4: Set Environment Variables in Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add: `VITE_API_BASE_URL` = `https://your-backend-url.smarterasp.net`
5. Redeploy to apply

---

## Option B: Deploy via GitHub (Auto-Deploy)

### Step 1: Push to GitHub

// turbo
```bash
cd c:\Users\Coxward\Desktop\SpotifyAPI-NET
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/SpotifyAPI-NET.git
git push -u origin main
```

### Step 2: Import to Vercel

1. Go to https://vercel.com/new
2. Import from GitHub
3. Select your repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `Spotify-Client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Step 3: Add Environment Variables

In the import wizard, add:
- `VITE_API_BASE_URL` = `https://your-backend-url.smarterasp.net`

### Step 4: Deploy

Click **Deploy** and wait for completion.

---

## Post-Deployment

### Update CORS on Backend

After getting your Vercel URL (e.g., `https://spotify-client.vercel.app`):

1. Update `appsettings.Production.json` in SpotifyBackend:
```json
{
  "AllowedOrigins": "https://spotify-client.vercel.app"
}
```

2. Redeploy backend to SmarterASP

### Verify Deployment

Visit your Vercel URL and test:
1. Login flow works
2. Search works
3. Playback works

## Troubleshooting

- **CORS Errors**: Backend `AllowedOrigins` must match Vercel URL exactly
- **API Errors**: Check browser console, verify `VITE_API_BASE_URL` is set
- **Build Fails**: Check Vercel build logs for TypeScript/ESLint errors
