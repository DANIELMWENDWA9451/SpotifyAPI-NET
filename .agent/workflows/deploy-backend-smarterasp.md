---
description: Deploy the .NET Backend to SmarterASP.NET hosting
---

# Deploy Backend to SmarterASP.NET

## Prerequisites
- SmarterASP.NET account (https://www.smarterasp.net)
- FTP credentials from SmarterASP control panel
- Your site configured in SmarterASP control panel

## Step 1: Prepare Environment Variables

Create/update `appsettings.Production.json` in SpotifyBackend:

```json
{
  "Spotify": {
    "ClientId": "YOUR_PRODUCTION_SPOTIFY_CLIENT_ID",
    "RedirectUri": "https://your-backend-url.smarterasp.net/api/auth/callback"
  },
  "AllowedOrigins": "https://your-frontend.vercel.app"
}
```

## Step 2: Build for Production

// turbo
```bash
cd c:\Users\Coxward\Desktop\SpotifyAPI-NET\SpotifyBackend
dotnet publish -c Release -o ./publish
```

## Step 3: Deploy via FTP

Use FileZilla or similar FTP client:

1. **Host**: ftp.site####.smarterasp.net (from control panel)
2. **Username**: Your SmarterASP username
3. **Password**: Your SmarterASP password
4. **Port**: 21

Upload contents of `./publish` folder to your site's root directory.

## Step 4: Configure IIS on SmarterASP

1. Log into SmarterASP Control Panel
2. Go to **Sites** → **Your Site** → **Features**
3. Enable **.NET Core Hosting**
4. Set application pool to **No Managed Code**
5. Add `web.config` if not present:

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <location path="." inheritInChildApplications="false">
    <system.webServer>
      <handlers>
        <add name="aspNetCore" path="*" verb="*" modules="AspNetCoreModuleV2" resourceType="Unspecified" />
      </handlers>
      <aspNetCore processPath="dotnet" arguments=".\SpotifyBackend.dll" stdoutLogEnabled="true" stdoutLogFile=".\logs\stdout" hostingModel="inprocess" />
    </system.webServer>
  </location>
</configuration>
```

## Step 5: Update Spotify Dashboard

1. Go to https://developer.spotify.com/dashboard
2. Select your app
3. Add Redirect URI: `https://your-backend-url.smarterasp.net/api/auth/callback`
4. Save changes

## Step 6: Verify Deployment

// turbo
```bash
curl https://your-backend-url.smarterasp.net/api/health
```

## Troubleshooting

- **500 Error**: Check `logs/stdout` files in your FTP for error details
- **CORS Error**: Verify `AllowedOrigins` matches your frontend URL exactly
- **Auth Issues**: Verify Redirect URI in Spotify Dashboard matches exactly
