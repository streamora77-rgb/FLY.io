const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrapeVideasyM3U8(videasyUrl) {
    let browser;
    
    try {
        console.log('🚀 Launching browser...');
        const launchOptions = {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor',
                '--disable-gpu',
                '--single-process',
                '--no-zygote'
            ]
        };

        // Fly.io has Chrome pre-installed, no custom path needed

        browser = await puppeteer.launch(launchOptions);

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        const m3u8Urls = [];
        
        // Listen for network responses
        page.on('response', async (response) => {
            const url = response.url();
            if (url.includes('.m3u8')) {
                console.log(`🎯 Found m3u8: ${url}`);
                if (!m3u8Urls.includes(url)) {
                    m3u8Urls.push(url);
                }
            }
        });
        
        // Navigate with autoplay
        console.log('🌐 Loading page with autoplay...');
        const urlWithAutoplay = videasyUrl + (videasyUrl.includes('?') ? '&' : '?') + 'autoplay=1';
        await page.goto(urlWithAutoplay, { waitUntil: 'networkidle0', timeout: 30000 });
        
        // Wait and try to trigger play
        await page.waitForTimeout(3000);
        
        try {
            await page.click('[class*="play"]', { timeout: 5000 });
            console.log('✅ Clicked play button');
            await page.waitForTimeout(8000); // Wait for video to load
        } catch (e) {
            console.log('⚠️ No play button found, continuing...');
        }
        
        // Check page content for m3u8 URLs
        const pageM3u8s = await page.evaluate(() => {
            const content = document.documentElement.innerHTML;
            const matches = content.match(/https?:\/\/[^\s"']*\.m3u8[^\s"']*/g);
            return matches || [];
        });
        
        pageM3u8s.forEach(url => {
            if (!m3u8Urls.includes(url)) {
                console.log(`🎯 Found m3u8 in page: ${url}`);
                m3u8Urls.push(url);
            }
        });
        
        return m3u8Urls;
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        return [];
    } finally {
        if (browser) {
            try {
                await browser.close();
            } catch (e) {
                // Ignore cleanup errors
            }
        }
    }
}

async function main() {
    const videasyUrl = process.argv[2] || 'https://player.videasy.net/movie/299534';
    
    console.log('🎯 Videasy M3U8 Scraper');
    console.log('=' .repeat(50));
    console.log(`📺 Target: ${videasyUrl}`);
    
    const m3u8Urls = await scrapeVideasyM3U8(videasyUrl);
    
    if (m3u8Urls.length > 0) {
        console.log('\n🎉 SUCCESS! Found M3U8 URLs:');
        
        const proxyPrefix = 'https://proxystreamora9.nium0l8grm.workers.dev/proxy?url=';
        const proxiedUrls = m3u8Urls.map(url => proxyPrefix + encodeURIComponent(url));
        
        m3u8Urls.forEach((url, index) => {
            console.log(`\n${index + 1}. Original:`);
            console.log(`   ${url}`);
            console.log(`   Proxied:`);
            console.log(`   ${proxiedUrls[index]}`);
        });
        
        // Save the best proxied URL
        const bestProxiedUrl = proxiedUrls[0];
        fs.writeFileSync('videasy_m3u8_url.txt', bestProxiedUrl);
        
        // Save full results
        const result = {
            videasy_url: videasyUrl,
            original_m3u8_urls: m3u8Urls,
            proxied_m3u8_urls: proxiedUrls,
            best_proxied_url: bestProxiedUrl,
            timestamp: new Date().toISOString()
        };
        
        fs.writeFileSync('videasy_results.json', JSON.stringify(result, null, 2));
        
        console.log('\n💾 Saved to:');
        console.log('  - videasy_m3u8_url.txt (ready-to-use proxied URL)');
        console.log('  - videasy_results.json (full results)');
        
        console.log('\n🔗 Ready-to-use URL:');
        console.log(bestProxiedUrl);
        
    } else {
        console.log('\n❌ No M3U8 URLs found');
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { scrapeVideasyM3U8 };
