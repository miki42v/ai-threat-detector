const express = require('express');
const axios = require('axios'); // <-- THIS LINE WAS MISSING. IT IS NOW FIXED.
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = 5001;
app.use(cors());
app.use(express.json());

// --- ROUTES ---

// Endpoint to fetch URL content. Its only job is to scrape the page.
app.post('/fetch-url-content', async (req, res) => {
    const { url } = req.body;
    if (!url) {
        return res.status(400).json({ error: 'A valid URL is required.' });
    }

    try {
        console.log(`Fetching content from URL: ${url}`);
        const pageResponse = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' },
            timeout: 10000 
        });
        const htmlContent = pageResponse.data;

        // Truncate the content to a reasonable size before sending back to the client
        const contentToAnalyze = typeof htmlContent === 'string' ? htmlContent.substring(0, 25000) : JSON.stringify(htmlContent).substring(0, 25000);

        // Send the scraped content back to the frontend
        res.json({ content: contentToAnalyze });

    } catch (error) {
        if (error.code === 'ECONNABORTED') {
            return res.status(500).json({ error: 'The request to the URL timed out.' });
        }
        if (error.response) {
            return res.status(500).json({ error: `Could not fetch content. Server responded with status ${error.response.status}.` });
        }
        res.status(500).json({ error: 'An unexpected error occurred while fetching the URL.' });
    }
});


// Streaming endpoint for AI analysis (for both text and URL content)
app.post('/analyze-stream', async (req, res) => {
    const { text } = req.body;
    if (!text) {
        return res.status(400).json({ error: 'Text to analyze is required.' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    try {
        const apiUrl = "https://integrate.api.nvidia.com/v1/chat/completions";
        const apiKey = process.env.NVIDIA_API_KEY;
        const headers = { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'Accept': 'application/json' };
        
        const data = {
            model: "nvidia/llama-3.1-nemotron-70b-instruct",
            messages: [
                { role: "system", content: "You are an expert cybersecurity analyst. Analyze the following content and provide a clear, actionable analysis." },
                { role: "user", content: text }
            ],
            temperature: 0.5, top_p: 1, max_tokens: 1024, stream: true
        };

        const response = await axios.post(apiUrl, data, { headers, responseType: 'stream' });

        response.data.on('data', (chunk) => {
            const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const message = line.substring(6);
                    if (message === '[DONE]') {
                        res.end();
                        return;
                    }
                    try {
                        const parsed = JSON.parse(message);
                        if (parsed.choices[0]?.delta?.content) {
                            const content = parsed.choices[0].delta.content;
                            res.write(`data: ${JSON.stringify({ content })}\n\n`);
                        }
                    } catch (e) {
                        // This block can be noisy, so we'll just log the raw message for now
                        // console.error('Error parsing stream chunk:', message);
                    }
                }
            }
        });

        response.data.on('end', () => res.end());
    } catch (error) {
        console.error('Error in streaming endpoint:', error.message);
        res.end();
    }

    req.on('close', () => res.end());
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});