# Videasy M3U8 Extractor

A Puppeteer-based API service that extracts M3U8 streaming URLs from Videasy player links and wraps them with proxy for cross-origin playback.

## 🚀 Features

- Extract M3U8 URLs from Videasy movie and TV show players
- Automatic proxy wrapping for CORS-free playback
- Cloudflare Worker-style API endpoints
- Free deployment on Render

## 📡 API Endpoints

### Movies
```
GET /embed/movie/{id}
```
**Example:** `/embed/movie/299534`

### TV Shows
```
GET /embed/tv/{show_id}/{season}/{episode}
```
**Example:** `/embed/tv/95557/1/1` (Invincible S01E01)

## 🔗 Response

Returns the proxied M3U8 URL as plain text:
```
https://proxystreamora9.nium0l8grm.workers.dev/proxy?url=https%3A//winter.robsonchengen.workers.dev/video.m3u8?q=...
```

## 🛠 Deployment on Render

1. Fork this repository
2. Connect to Render
3. Deploy as a Web Service
4. Render will automatically use the `render.yaml` configuration

## 🔧 Local Development

```bash
npm install
npm start
```

Server runs on `http://localhost:3000`

## 📋 Dependencies

- **puppeteer**: Browser automation
- **@sparticuz/chromium**: Chromium for serverless environments
- **express**: Web server framework

## ⚙️ Environment Variables

Render automatically sets these for Puppeteer:
- `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true`
- `PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable`
