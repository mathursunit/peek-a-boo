const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const https = require('https');

const app = express();
const PORT = 7070;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Ignore self-signed certs just for monitoring purposes if needed, 
// though strictly speaking we want to know if the SSL is valid? 
// Usually for monitors, you want to know if it's reachable. 
// I'll leave default verification but add a flag if needed. 
// For now, I'll instantiate an agent that rejectsUnauthorized: false slightly safer for internal tools?
// The prompt has some http/https mixed. Carrier sites might be internal or stricter.
// I'll stick to standard axios for now, but handle errors gracefully.

const agent = new https.Agent({  
  rejectUnauthorized: false
});

app.post('/api/check', async (req, res) => {
    let { url } = req.body;
    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    if (!/^https?:\/\//i.test(url)) {
        // Default to https if no protocol
        url = 'https://' + url;
    }

    try {
        const start = Date.now();
        const response = await axios.get(url, {
            timeout: 10000, // 10s timeout
            httpsAgent: agent, // Allow self-signed or slightly broken chains just in case
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            validateStatus: () => true // Resolve request even if status is 4xx/5xx
        });
        const duration = Date.now() - start;

        res.json({
            url,
            status: response.status,
            ok: response.status >= 200 && response.status < 400,
            duration,
            statusText: response.statusText
        });
    } catch (error) {
        res.json({
            url,
            status: 0,
            ok: false,
            error: error.message,
            duration: 0
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
