import React, { useState, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

function App() {
  const [inputText, setInputText] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef(null);

  const handleStreamAnalyze = async (text, context = '') => {
    if (!text.trim()) {
      setError('No content to analyze.');
      return;
    }

    setIsLoading(true);
    setResult('');
    setError('');

    try {
      // Define the API URL for the current environment
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

      const response = await fetch(`${API_URL}/analyze-stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: context + text }),
      });

      if (!response.ok) throw new Error(`Server responded with status: ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const message = line.substring(6);
            try {
              const parsed = JSON.parse(message);
              if (parsed.content) {
                setResult(prevResult => prevResult + parsed.content);
              }
            } catch (e) {
              console.error('Failed to parse stream chunk:', message);
            }
          }
        }
      }
    } catch (err) {
      setError('Failed to get streaming analysis. Please check the server connection.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = () => {
    handleStreamAnalyze(inputText, "Analyze the following text/code snippet for threats:\n\n");
  };
  
  const handleUrlAnalyze = async () => {
    if (!urlInput.trim()) {
      setError('Please enter a URL.');
      return;
    }
    setIsLoading(true);
    setResult('');
    setError('');
    try {
      // Define the API URL for the current environment
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      
      const res = await axios.post(`${API_URL}/fetch-url-content`, { url: urlInput });
      const { content } = res.data;

      if (content) {
        const context = `Analyze the HTML content from the URL ${urlInput} for threats:\n\n`;
        await handleStreamAnalyze(content, context);
      } else {
        setError('Received no content from the URL.');
        setIsLoading(false);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch content from the URL.');
      setIsLoading(false);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setInputText(e.target.result);
    reader.onerror = (e) => setError("Failed to read the file.");
    reader.readAsText(file);
  };
  const handleUploadClick = () => fileInputRef.current.click();

  return (
    // ... The rest of the JSX is unchanged and correct ...
    <div className="bg-gray-900 min-h-screen flex flex-col items-center text-white p-4 font-sans">
      <div className="w-full max-w-2xl">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-500">
          AI-Powered Threat Detector
        </h1>
        <p className="text-center text-gray-400 mb-8">
          Paste text, upload a file, or enter a URL to analyze for potential security threats.
        </p>
        <div className="bg-gray-800 p-6 rounded-lg shadow-2xl">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <input type="url" className="w-full p-3 bg-gray-700 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 transition duration-300" placeholder="Enter a URL e.g., https://example.com" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} disabled={isLoading} />
            <button onClick={handleUrlAnalyze} disabled={isLoading} className="py-3 px-6 bg-blue-600 hover:bg-blue-700 rounded-md font-semibold transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed whitespace-nowrap">Analyze URL</button>
          </div>
          <div className="text-center text-gray-500 font-bold mb-4">OR</div>
          <textarea className="w-full h-40 p-4 bg-gray-700 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 transition duration-300 resize-none" placeholder="Paste text or upload a file's content here..." value={inputText} onChange={(e) => setInputText(e.target.value)} />
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".txt,.js,.json,.log,.py,.html,.css,.md" />
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <button onClick={handleUploadClick} disabled={isLoading} className="w-full sm:w-auto flex-grow sm:flex-grow-0 py-3 px-6 bg-gray-600 hover:bg-gray-700 rounded-md text-lg font-semibold transition duration-300 disabled:bg-gray-500">Upload File</button>
            <button onClick={handleAnalyze} disabled={isLoading} className="w-full sm:w-auto flex-grow py-3 px-4 bg-teal-600 hover:bg-teal-700 rounded-md text-lg font-semibold transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center">
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Analyzing...
                </>
              ) : ('Analyze Text / File')}
            </button>
          </div>
        </div>
        {(error || result) && (
            <div className="mt-6 bg-gray-800 p-6 rounded-lg shadow-2xl">
                {error && <p className="text-red-400">{error}</p>}
                {result && ( <div> <h2 className="text-2xl font-semibold mb-3 text-teal-400">Analysis Result</h2> <div className="markdown-content"><ReactMarkdown>{result}</ReactMarkdown></div></div>)}
            </div>
        )}
      </div>
    </div>
  );
}

export default App;