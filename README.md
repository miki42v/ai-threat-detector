# 🤖 AI-Powered Threat Detector

A full-stack web application that leverages a powerful 70-billion parameter Large Language Model (NVIDIA Llama 3.1) to analyze text, files, and URLs for potential security threats in real-time. This tool provides a user-friendly, streaming interface to get instant, AI-driven security analysis.

### 🔗 **[Click Here for the Live Demo](https://ai-threat-detector-three.vercel.app/)**

![Screenshot of the AI Threat Detector Application](https://user-images.githubusercontent.com/10284367/223212870-272a11b6-7d1c-43f0-8e7c-501f6f874d1a.png)
*(**Note:** To replace this placeholder image, simply take a screenshot of your app, upload the image file to your GitHub repository, and replace the link above with the new image's URL.)*

---

## ✨ Core Features

- **Real-Time Streaming Analysis:** Get instant, word-by-word feedback from the AI, providing a dynamic and responsive user experience.
- **Multi-Faceted Input Methods:**
  - **Text Analysis:** Paste any code snippet, log file, email body, or suspicious text directly into the application.
  - **File Upload:** Upload local files (`.js`, `.py`, `.log`, `.txt`, etc.) for an in-depth analysis of their contents.
  - **Live URL Scanning:** Enter any URL to have the backend fetch its live HTML content and scan it for malicious scripts, phishing indicators, or other threats.
- **Secure Proxy Architecture:** The Node.js backend acts as a secure intermediary, managing the NVIDIA API key and ensuring it is never exposed to the user's browser, which is a critical security practice.
- **Modern & Responsive UI:** Built with React and Tailwind CSS for a polished, professional, and intuitive user experience that works seamlessly on desktop and mobile devices.

---

## 🛠️ Technology Stack & Architecture

This project is a full-stack application with a clear separation of concerns between the client, server, and the external AI service, creating a robust and scalable system.

- **Frontend (Client):**
  - **Framework:** React.js
  - **Styling:** Tailwind CSS
  - **HTTP Client:** `axios` (for simple requests) & the browser's native `fetch` API (for handling streams).
  - **Markdown Rendering:** `react-markdown` to beautifully render the AI's formatted responses.

- **Backend (Server):**
  - **Runtime:** Node.js
  - **Framework:** Express.js for creating the API endpoints and handling routing.
  - **Security:** `dotenv` for managing environment variables and `cors` for secure cross-origin communication.

- **AI Service:**
  - **Provider:** NVIDIA API Gateway
  - **Model:** `llama-3.1-nemotron-70b-instruct`, a state-of-the-art model for nuanced language and code comprehension.

- **Deployment:**
  - **Frontend:** Deployed on **Vercel**, configured for continuous integration from the `client` directory.
  - **Backend:** Deployed on **Render**, configured for continuous integration from the `server` directory.

---

## 🚀 Getting Started Locally

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or later recommended)
- [Git](https://git-scm.com/)

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/miki42v/ai-threat-detector.git
   cd ai-threat-detector
