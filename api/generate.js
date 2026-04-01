import fs from 'fs';
import path from 'path';

const COOLDOWN_FILE = '/tmp/cooldown.json';
const COOLDOWN_DURATION = 3 * 60 * 1000; // 3 minutes

function getCooldown() {
    try {
        if (fs.existsSync(COOLDOWN_FILE)) {
            const data = fs.readFileSync(COOLDOWN_FILE, 'utf8');
            const cooldownData = JSON.parse(data);
            
            // Check if cooldown expired
            if (cooldownData.until > Date.now()) {
                return cooldownData.until;
            }
        }
        return null;
    } catch (error) {
        console.error('Error reading cooldown:', error);
        return null;
    }
}

function setCooldown() {
    try {
        const cooldownUntil = Date.now() + COOLDOWN_DURATION;
        fs.writeFileSync(COOLDOWN_FILE, JSON.stringify({ until: cooldownUntil }));
        return cooldownUntil;
    } catch (error) {
        console.error('Error setting cooldown:', error);
        return null;
    }
}

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow GET
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Check global cooldown
        const cooldownUntil = getCooldown();
        
        if (cooldownUntil) {
            const now = Date.now();
            const remainingTime = Math.ceil((cooldownUntil - now) / 1000);
            const minutes = Math.floor(remainingTime / 60);
            const seconds = remainingTime % 60;
            
            return res.status(429).json({ 
                error: 'Cooldown active',
                message: `Tunggu ${minutes} menit ${seconds} detik lagi ya bro!`,
                remainingSeconds: remainingTime
            });
        }

        const { text } = req.query;

        // Validation
        if (!text || text.trim() === '') {
            return res.status(400).json({ error: 'Text parameter is required' });
        }

        // Fetch from external API
        const apiUrl = `https://api.deline.web.id/maker/lobbyffmax?text=${encodeURIComponent(text)}`;
        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error('Failed to fetch from external API');
        }

        // Get image buffer
        const imageBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(imageBuffer);

        // Set global cooldown
        setCooldown();

        // Send image
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Length', buffer.length);
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.status(200).send(buffer);

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            error: 'Failed to generate image',
            message: error.message 
        });
    }
}
