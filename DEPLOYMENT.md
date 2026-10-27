# 🚀 StaffSync Production Deployment Guide
## Hybrid Architecture: Vercel (Frontend) + Render / Railway (Backend API)

This guide walks you through deploying **StaffSync** with the React frontend hosted on **Vercel** and the Node/Express REST API hosted on **Render** (or Railway).

---

## Part 1: Deploy Backend API to Render (Free)

### Step 1: Create a Free MongoDB Database (MongoDB Atlas)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free M0 cluster.
2. Under **Database Access**, create a database user (e.g., `staffsync_user` / strong password).
3. Under **Network Access**, add `0.0.0.0/0` (Allow access from anywhere).
4. Click **Connect** > **Drivers** and copy your connection string:
   ```
   mongodb+srv://staffsync_user:<password>@cluster0.mongodb.net/staffsync?retryWrites=true&w=majority
   ```
*(Note: If no external MongoDB URI is set, StaffSync will automatically run with its built-in in-memory MongoDB!)*

### Step 2: Deploy Backend to Render
1. Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** > **Web Service**.
2. Connect your GitHub repository (or select public Git repo).
3. Fill in the service configuration:
   - **Name**: `staffsync-api`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: `Free`
4. Add **Environment Variables** in the Render settings:
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: `staffsync_super_secret_jwt_key_2025_hrms`
   - `MONGODB_URI`: *(your MongoDB Atlas URI from Step 1)*
5. Click **Create Web Service**.
6. Once deployed, Render will provide a public URL like:
   ```
   https://staffsync-api.onrender.com
   ```
   Test your API health check: `https://staffsync-api.onrender.com/api/health`

---

## Part 2: Deploy Frontend to Vercel

### Method A: Deploy via Vercel CLI (Command Line)

1. Open your terminal in the `staffsync` workspace directory:
   ```bash
   cd "c:\Users\raina sharma\OneDrive\Documents\staffsync"
   ```

2. Log in to Vercel:
   ```bash
   vercel login
   ```
   *(Follow the interactive prompt in your browser to authorize your Vercel account).*

3. Deploy to production:
   ```bash
   vercel --prod
   ```
   - When asked **"Set up and deploy?"**, type `y`.
   - Which scope? Select your personal or team account.
   - Link to existing project? `N`
   - What's your project's name? `staffsync-hrms`
   - In which directory is your code located? `./`
   - Want to modify these settings? `y`
     - **Build Command**: `npm run build:client`
     - **Output Directory**: `client/dist`

4. Add your Backend API URL environment variable in Vercel:
   ```bash
   vercel env add VITE_API_URL production
   # Value: https://staffsync-api.onrender.com/api
   ```
   Then trigger a redeploy:
   ```bash
   vercel --prod
   ```

---

### Method B: Deploy via Vercel Dashboard (GitHub Import)

1. Push your repository to GitHub:
   ```bash
   git remote add origin https://github.com/<your-username>/staffsync.git
   git branch -M main
   git push -u origin main
   ```
2. Go to [Vercel Dashboard](https://vercel.com/new).
3. Import your `staffsync` repository.
4. Configure the Project Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./` (or `client`)
   - **Build Command**: `npm run build:client`
   - **Output Directory**: `client/dist`
5. Under **Environment Variables**, add:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://staffsync-api.onrender.com/api`
6. Click **Deploy**!

Your frontend will be live on a fast, globally distributed URL (e.g., `https://staffsync-hrms.vercel.app`).

---

## 🔒 Verification & RBAC Testing Checklist

Once both services are deployed:
1. Open your Vercel URL in your browser.
2. Click **Demo: HR Admin (Victoria)** from the top bar to verify full administrative view.
3. Switch to **Demo: Manager (Marcus)** to test direct reports' leave approvals and training assignments.
4. Switch to **Demo: Employee (Alex)** to test the live shift punch clock-in/out timer and leave balance counters.
