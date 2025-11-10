# Deployment Guide for AI Threat Detector

## Overview
This application consists of:
- **Frontend**: React app (deploy to Vercel)
- **Backend**: Express/Node.js server (deploy to Render)

## Prerequisites
- NVIDIA API Key (get from https://build.nvidia.com/)
- GitHub account
- Vercel account (free)
- Render account (free)

---

## Backend Deployment (Render)

### 1. Create New Web Service on Render
1. Go to https://render.com/
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository: `miki42v/ai-threat-detector`

### 2. Configure the Service
- **Name**: `ai-threat-detector-backend` (or your choice)
- **Region**: Choose closest to you
- **Branch**: `main`
- **Root Directory**: `server`
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `node server.js`
- **Instance Type**: `Free`

### 3. Set Environment Variables
Add the following environment variable:
- **Key**: `NVIDIA_API_KEY`
- **Value**: `your-nvidia-api-key-here` ⚠️ **IMPORTANT**: Get a new key, don't use the exposed one!

### 4. Deploy
- Click **"Create Web Service"**
- Wait for deployment to complete (2-3 minutes)
- **Copy the backend URL** (e.g., `https://ai-threat-detector-backend.onrender.com`)

---

## Frontend Deployment (Vercel)

### 1. Create New Project on Vercel
1. Go to https://vercel.com/
2. Click **"Add New"** → **"Project"**
3. Import your GitHub repository: `miki42v/ai-threat-detector`

### 2. Configure the Project
- **Project Name**: `ai-threat-detector` (or your choice)
- **Framework Preset**: `Create React App`
- **Root Directory**: `client`
- **Build Command**: `npm run build` (default)
- **Output Directory**: `build` (default)

### 3. Set Environment Variable
Add the following environment variable:
- **Key**: `REACT_APP_API_URL`
- **Value**: Your Render backend URL (e.g., `https://ai-threat-detector-backend.onrender.com`)
  - ⚠️ **No trailing slash**

### 4. Deploy
- Click **"Deploy"**
- Wait for deployment to complete (1-2 minutes)
- Your frontend will be available at `https://ai-threat-detector.vercel.app` (or your custom domain)

---

## Post-Deployment Steps

### 1. Test the Deployment
1. Visit your Vercel URL
2. Try analyzing a URL (e.g., `https://example.com`)
3. Verify the analysis completes without errors

### 2. Update README (Optional)
Update your README.md with the live URLs:
```markdown
🚀 **Live Demo**: https://your-app.vercel.app
```

### 3. Security Checklist
- ✅ Rotate NVIDIA API key (the one in conversation history is exposed)
- ✅ Never commit `.env` files to Git (already in `.gitignore`)
- ✅ Use environment variables for all sensitive data
- ✅ Enable CORS only for your frontend domain (optional for production)

---

## Troubleshooting

### Backend Issues
- **Server won't start**: Check Render logs for errors
- **NVIDIA API errors**: Verify your API key is valid and has credits
- **Timeout errors**: Render free tier may spin down after inactivity (takes 30s to wake up)

### Frontend Issues
- **Can't connect to backend**: Verify `REACT_APP_API_URL` is correct in Vercel environment variables
- **CORS errors**: Check backend CORS configuration allows your Vercel domain
- **Build fails**: Check Node.js version compatibility

### Re-deploy After Changes
- **Render**: Automatically deploys on push to `main` branch
- **Vercel**: Automatically deploys on push to `main` branch

---

## Environment Variables Summary

### Server (.env)
```env
NVIDIA_API_KEY=your-new-api-key-here
```

### Client (.env - for local development only)
```env
REACT_APP_API_URL=http://localhost:5001
```

### Vercel (Production)
```
REACT_APP_API_URL=https://your-backend.onrender.com
```

---

## Costs
- **Render Free Tier**: 750 hours/month, sleeps after 15 min inactivity
- **Vercel Free Tier**: Unlimited deployments, 100 GB bandwidth/month
- **NVIDIA API**: Check pricing at https://build.nvidia.com/pricing

---

## Support
For issues, check:
1. Render logs: https://dashboard.render.com/
2. Vercel logs: https://vercel.com/dashboard
3. GitHub issues: https://github.com/miki42v/ai-threat-detector/issues
