const express = require('express');
const path = require('path');
const { scrapeVideasyM3U8 } = require('./videasy_final_scraper');

const app = express();
const PORT = process.env.PORT || 3000;

// Fly.io doesn't need keep-alive (no sleep on free tier)

// Middleware
app.use(express.json());
app.use(express.static('.'));

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// CF Worker-style embed endpoints that return just the proxied URL
app.get('/embed/movie/:id', async (req, res) => {
    try {
        const movieId = req.params.id;
        const videasyUrl = `https://player.videasy.net/movie/${movieId}`;
        
        console.log('Extracting m3u8 from movie:', videasyUrl);
        
        const m3u8Urls = await scrapeVideasyM3U8(videasyUrl);
        
        if (m3u8Urls.length === 0) {
            return res.status(404).send('No m3u8 URLs found');
        }

        // Return just the proxied URL as plain text
        const proxyPrefix = 'https://proxystreamora9.nium0l8grm.workers.dev/proxy?url=';
        const proxiedUrl = proxyPrefix + encodeURIComponent(m3u8Urls[0]);
        
        res.setHeader('Content-Type', 'text/plain');
        res.send(proxiedUrl);

    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal server error');
    }
});

app.get('/embed/tv/:show/:season/:episode', async (req, res) => {
    try {
        const { show, season, episode } = req.params;
        const videasyUrl = `https://player.videasy.net/tv/${show}/${season}/${episode}`;
        
        console.log('Extracting m3u8 from TV show:', videasyUrl);
        
        const m3u8Urls = await scrapeVideasyM3U8(videasyUrl);
        
        if (m3u8Urls.length === 0) {
            return res.status(404).send('No m3u8 URLs found');
        }

        // Return just the proxied URL as plain text
        const proxyPrefix = 'https://proxystreamora9.nium0l8grm.workers.dev/proxy?url=';
        const proxiedUrl = proxyPrefix + encodeURIComponent(m3u8Urls[0]);
        
        res.setHeader('Content-Type', 'text/plain');
        res.send(proxiedUrl);

    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal server error');
    }
});

// API endpoint for M3U8 extraction (keep for web interface)
app.post('/api/extract-m3u8', async (req, res) => {
    try {
        const { url } = req.body;
        
        if (!url) {
            return res.status(400).json({ 
                error: 'Missing url parameter',
                usage: 'POST /api/extract-m3u8 with {"url": "https://player.videasy.net/movie/299534"}'
            });
        }

        if (!url.includes('player.videasy.net')) {
            return res.status(400).json({ 
                error: 'Invalid URL. Must be a player.videasy.net URL',
                example: 'https://player.videasy.net/movie/299534'
            });
        }

        console.log('Extracting m3u8 from:', url);
        
        const m3u8Urls = await scrapeVideasyM3U8(url);
        
        if (m3u8Urls.length === 0) {
            return res.status(404).json({ 
                error: 'No m3u8 URLs found',
                videasy_url: url
            });
        }

        // Wrap with proxy
        const proxyPrefix = 'https://proxystreamora9.nium0l8grm.workers.dev/proxy?url=';
        const proxiedUrls = m3u8Urls.map(url => proxyPrefix + encodeURIComponent(url));

        res.json({
            success: true,
            videasy_url: url,
            original_m3u8_urls: m3u8Urls,
            proxied_m3u8_urls: proxiedUrls,
            best_proxied_url: proxiedUrls[0],
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message
        });
    }
});

// Health check endpoint for keep-alive
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
    console.log('📺 Open your browser and test the Videasy M3U8 extractor!');
});
