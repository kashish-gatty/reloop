# Deploying Reloop to Render

This project is configured for one-click deployment on [Render](https://render.com) using `render.yaml`.

---

## Method 1: Automatic Deployment with Render Blueprint (Recommended)

1. **Push your code to GitHub / GitLab**:
   If you haven't pushed this repository to GitHub yet:
   ```bash
   git init
   git add .
   git commit -m "Configure for Render deployment"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```

2. **Connect to Render**:
   - Go to [dashboard.render.com](https://dashboard.render.com).
   - Click **New +** at the top right and select **Blueprint**.
   - Connect your GitHub repository.
   - Render will automatically detect [`render.yaml`](render.yaml) and configure:
     - **Web Service**: `reloop` (running Node with pnpm)
     - **Database**: `reloop-db` (Free PostgreSQL instance)
     - Automatically sets `DATABASE_URL` and `NODE_ENV=production`.
   - Click **Apply**.

3. **Live URL**:
   Once deployed, your app will be live at:
   ```text
   https://reloop.onrender.com
   ```

---

## Method 2: Manual Web Service Setup on Render

If you prefer to configure the Web Service manually:

1. In Render Dashboard, click **New +** > **Web Service**.
2. Connect your GitHub repository.
3. Configure the settings:
   - **Name**: `reloop`
   - **Runtime**: `Node`
   - **Build Command**:
     ```bash
     npm install -g pnpm && pnpm install && pnpm run build:all
     ```
   - **Start Command**:
     ```bash
     pnpm run start
     ```
4. Under **Environment Variables**, add:
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: Your PostgreSQL connection string (from Render Postgres or Neon/Supabase).
5. Click **Create Web Service**.

---

## Adding a Custom Domain on Render

To use your own custom domain (e.g. `reloop.in` or `www.reloop.in`):
1. Go to your **reloop** Web Service in Render.
2. Click **Settings** on the left menu.
3. Scroll down to **Custom Domains** and click **Add Custom Domain**.
4. Enter your domain name and follow the DNS verification instructions provided by Render.
