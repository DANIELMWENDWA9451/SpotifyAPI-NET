---
description: Full deployment of both backend and frontend
---

# Full Stack Deployment

Deploy both backend (SmarterASP.NET) and frontend (Vercel) in the correct order.

## Order of Operations

1. Deploy Backend FIRST (so we have the production URL)
2. Deploy Frontend SECOND (needs backend URL)
3. Update Backend CORS (needs frontend URL)
4. Update Spotify Dashboard (needs both URLs)

---

## Step 1: Deploy Backend

Run the backend deployment workflow:
```
/deploy-backend-smarterasp
```

Note your backend URL: `https://_____________.smarterasp.net`

---

## Step 2: Deploy Frontend

Run the frontend deployment workflow:
```
/deploy-frontend-vercel
```

Make sure to set `VITE_API_BASE_URL` to your backend URL from Step 1.

Note your frontend URL: `https://_____________.vercel.app`

---

## Step 3: Update Backend CORS

Update `appsettings.Production.json`:
```json
{
  "AllowedOrigins": "https://your-frontend.vercel.app"
}
```

Republish and upload to SmarterASP.

---

## Step 4: Update Spotify Dashboard

1. Go to https://developer.spotify.com/dashboard
2. Select your app
3. Edit settings:
   - **Redirect URIs**: Add `https://your-backend.smarterasp.net/api/auth/callback`
   - **Website**: Add `https://your-frontend.vercel.app`
4. Save

---

## Verification Checklist

- [ ] Backend responds at `/api/health`
- [ ] Frontend loads without errors
- [ ] Login redirects to Spotify correctly
- [ ] Callback returns to frontend correctly
- [ ] Search works
- [ ] Playback works

---

## Quick Reference

| Component | URL | Platform |
|-----------|-----|----------|
| Backend API | `https://_____.smarterasp.net` | SmarterASP.NET |
| Frontend | `https://_____.vercel.app` | Vercel |
| Spotify Dashboard | developer.spotify.com/dashboard | Spotify |
