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

        // Create filename
        const filename = `lobby-ffmax-${text.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;

        // Send as download
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', buffer.length);
        res.status(200).send(buffer);

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            error: 'Failed to download image',
            message: error.message 
        });
    }
}