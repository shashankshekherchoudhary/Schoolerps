# 🚀 Deployment Guide for Railway

Your project is now configured for deployment! Follow these exact steps to get it running.

## 1. Push Changes to GitHub
I have already committed the configuration changes. You need to push them:
```bash
git add .
git commit -m "Add Docker deployment configuration"
git push
```

## 2. Configure Railway Services

### **Service 1: Backend (Django)**
1.  Go to your Railway Project.
2.  Click **+ New** -> **GitHub Repo** -> Select `schoolerp`.
3.  Click on the new service card to open **Settings**.
4.  **General Tab**:
    *   **Root Directory**: Set to `/backend`
5.  **Variables Tab** (Click **+ New Variable** for each):
    *   `SECRET_KEY`: `[YOUR_SECRET_KEY]` (Generate one)
    *   `DEBUG`: `False`
    *   `ALLOWED_HOSTS`: `*` (or your domain)
    *   `CORS_ALLOWED_ORIGINS`: `https://[YOUR-FRONTEND-URL].up.railway.app`
    *   `CSRF_TRUSTED_ORIGINS`: `https://[YOUR-BACKEND-URL].up.railway.app`
    *   `DATABASE_URL`: (This is usually auto-set if you add a Postgres database)
6.  **Builds Tab**:
    *   It should automatically detect the `Dockerfile`.

### **Service 2: Frontend (React)**
1.  Go to your Railway Project (dashboard).
2.  Click **+ New** -> **GitHub Repo** -> Select `schoolerp` (AGAIN).
3.  Click on the NEW service card.
4.  **General Tab**:
    *   **Root Directory**: Set to `/frontend`
5.  **Builds Tab**:
    *   It should automatically detect the `Dockerfile`.

## 3. Database (Optional but Recommended)
1.  In Railway, click **+ New** -> **Database** -> **PostgreSQL**.
2.  Railway will automatically link this to your Backend service securely.

## 4. Final Wiring
1.  Once the Frontend is deployed, getting its URL (e.g., `https://frontend-production.up.railway.app`).
2.  Go back to **Backend Variables** and update `CORS_ALLOWED_ORIGINS` with this URL.
3.  Redeploy Backend.
