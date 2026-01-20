# 🎵 Spotify Client

A full-featured Spotify Web Player clone built with React + .NET, featuring real-time playback, lyrics, and a beautiful UI.

![Spotify Client](https://img.shields.io/badge/React-18-blue) ![.NET](https://img.shields.io/badge/.NET-8.0-purple) ![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Features

- 🎧 **Full Spotify Playback** - Play, pause, skip, shuffle, repeat
- 🔍 **Search** - Find tracks, artists, albums, and playlists
- 📝 **Synced Lyrics** - Real-time lyrics that highlight as the song plays
- 📚 **Library** - Access your saved tracks, albums, and playlists
- 🎨 **Audio Visualizer** - Dynamic audio visualization
- 🗂️ **Queue Management** - View and manage your play queue
- 📱 **Responsive Design** - Works on desktop and tablet

## 🏗️ Architecture

```
SpotifyAPI-NET/
├── Spotify-Client/        # React + Vite frontend
├── SpotifyBackend/        # .NET 8 REST API
├── SpotifyAPI.Web/        # Spotify SDK wrapper
└── SpotifyAPI.Web.Auth/   # Authentication helpers
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- .NET 8.0 SDK
- Spotify Premium account
- [Spotify Developer App](https://developer.spotify.com/dashboard)

### 1. Clone & Configure

```bash
git clone https://github.com/DANIELMWENDWA9451/SpotifyAPI-NET.git
cd SpotifyAPI-NET
```

### 2. Configure Spotify API

Create `SpotifyBackend/appsettings.json`:
```json
{
  "Spotify": {
    "ClientId": "YOUR_SPOTIFY_CLIENT_ID",
    "RedirectUri": "http://127.0.0.1:5000/api/auth/callback"
  }
}
```

### 3. Start Backend

```bash
cd SpotifyBackend
dotnet run
```

### 4. Start Frontend

```bash
cd Spotify-Client
npm install
echo "VITE_API_BASE_URL=http://127.0.0.1:5000" > .env.local
npm run dev
```

### 5. Open Browser

Visit `http://localhost:5173` and login with Spotify!

## 🔧 Configuration

### Environment Variables

**Frontend** (`.env.local`):
```env
VITE_API_BASE_URL=http://127.0.0.1:5000
```

**Backend** (`appsettings.json`):
```json
{
  "Spotify": {
    "ClientId": "your_client_id",
    "RedirectUri": "http://127.0.0.1:5000/api/auth/callback"
  }
}
```

### Spotify Dashboard Setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Add Redirect URI: `http://127.0.0.1:5000/api/auth/callback`
4. Copy Client ID to your config

## 🚢 Deployment

### Auto-Deploy (CI/CD)

Push to `main` branch triggers automatic deployment:
- **Frontend** → Vercel
- **Backend** → SmarterASP.NET

See `.github/workflows/` for GitHub Actions configuration.

### Manual Deploy

Use the deployment workflows:
```
/deploy-backend-smarterasp   # Deploy backend
/deploy-frontend-vercel      # Deploy frontend
/deploy-full-stack           # Deploy both
```

## 📦 Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React 18, Vite, TailwindCSS, TanStack Query |
| Backend | .NET 8, ASP.NET Core |
| Authentication | OAuth 2.0 + PKCE |
| Playback | Spotify Web Playback SDK |

## 📄 License

MIT License - feel free to use this project for learning or personal use.