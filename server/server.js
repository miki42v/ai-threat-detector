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

    let insideThinkTag = false;
    let buffer = '';
    let isStreamFinished = false;

    try {
        const apiUrl = "https://integrate.api.nvidia.com/v1/chat/completions";
        const apiKey = process.env.NVIDIA_API_KEY;
        const headers = { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'Accept': 'application/json' };
        
        const data = {
            model: "nvidia/llama-3.3-nemotron-super-49b-v1.5",
            messages: [
                { role: "system", content: "You are a cybersecurity analyst. Analyze security threats in the provided content. Use proper markdown formatting with clear spacing:\n\n## Threat Level\n**Overall:** High/Medium/Low\n\n## Identified Threats\n1. **Threat Name**\n   - Description\n   - Location/Details\n\n2. **Another Threat**\n   - Description\n\n## Potential Impact\n- **Threat 1:** Impact description\n- **Threat 2:** Impact description\n\n## Recommendations\n1. **Fix for Threat 1**\n   - Specific implementation steps\n\n2. **Fix for Threat 2**\n   - Specific implementation steps\n\nUse proper markdown: headings (##), bold (**text**), lists, and line breaks. Be thorough and complete your response fully." },
                { role: "user", content: text }
            ],
            temperature: 0.2,
            top_p: 0.9,
            max_tokens: 8192,
            stream: true
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
                        
                        // Check for finish_reason to see if we hit token limit
                        if (parsed.choices[0]?.finish_reason) {
                            console.log('Stream finished with reason:', parsed.choices[0].finish_reason);
                            isStreamFinished = true;
                        }
                        
                        if (parsed.choices[0]?.delta?.content) {
                            let content = parsed.choices[0].delta.content;
                            buffer += content;
                            
                            // Process buffer to filter out <think> blocks
                            let processedContent = '';
                            let i = 0;
                            
                            while (i < buffer.length) {
                                if (!insideThinkTag) {
                                    // Check if we're entering a think tag
                                    const thinkStart = buffer.indexOf('<think>', i);
                                    if (thinkStart !== -1 && thinkStart === i) {
                                        insideThinkTag = true;
                                        i = thinkStart + 7; // Skip past '<think>'
                                    } else {
                                        // Output everything until the next think tag or end of buffer
                                        const nextThink = buffer.indexOf('<think>', i);
                                        if (nextThink !== -1) {
                                            processedContent += buffer.substring(i, nextThink);
                                            i = nextThink;
                                        } else {
                                            // No think tag found in current buffer
                                            // Output what we can, but keep last 7 chars in case '<think>' is split
                                            if (buffer.length > 7) {
                                                const safeEnd = buffer.length - 7;
                                                processedContent += buffer.substring(i, safeEnd);
                                                buffer = buffer.substring(safeEnd);
                                                i = 0; // Reset index since we shortened buffer
                                            }
                                            break;
                                        }
                                    }
                                } else {
                                    // We're inside a think tag, look for closing tag
                                    const thinkEnd = buffer.indexOf('</think>', i);
                                    if (thinkEnd !== -1) {
                                        insideThinkTag = false;
                                        i = thinkEnd + 8; // Skip past '</think>'
                                        buffer = buffer.substring(i);
                                        i = 0;
                                    } else {
                                        // Haven't found closing tag yet, wait for more data
                                        break;
                                    }
                                }
                            }
                            
                            // Send processed content if any
                            if (processedContent.trim()) {
                                res.write(`data: ${JSON.stringify({ content: processedContent })}\n\n`);
                                console.log('Sent chunk length:', processedContent.length, 'Buffer remaining:', buffer.length);
                            }
                        }
                    } catch (e) {
                        // This block can be noisy, so we'll just log the raw message for now
                        // console.error('Error parsing stream chunk:', message);
                    }
                }
            }
        });

        response.data.on('end', () => {
            // Flush any remaining buffer content ONLY if we're not inside a think tag
            if (buffer.length > 0 && !insideThinkTag) {
                console.log('Flushing remaining buffer:', buffer.length, 'chars:', buffer);
                res.write(`data: ${JSON.stringify({ content: buffer })}\n\n`);
            } else if (insideThinkTag) {
                console.log('Discarding buffer (inside think tag):', buffer.length, 'chars');
            }
            console.log('Stream ended. insideThinkTag:', insideThinkTag);
            res.end();
        });
    } catch (error) {
        console.error('Error in streaming endpoint:', error.message);
        res.end();
    }

    req.on('close', () => res.end());
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});