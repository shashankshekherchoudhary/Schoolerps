# 🚀 Master Guide: Deploying SchoolERP to Railway (Production)

**Context:** You are using **Option A: Monorepo** (Both `frontend` and `backend` in one GitHub repository).

This guide assumes you have prepared your code (which we have done!) and are ready to click the buttons on Railway.

---

## 1️⃣ Pre-Deployment Checklist
Before you open Railway, ensure these are true (We have verified these):
- [x] **Backend**: `procfile`, `runtime.txt`, and `Dockerfile` are present in `/backend`.
- [x] **Frontend**: `Dockerfile` and `nginx.conf` are present in `/frontend`.
- [x] **Database**: Code is set to use `DATABASE_URL` via `dj-database-url`.
- [x] **GitHub**: All code is pushed to `main` branch.

---

## 2️⃣ Step-by-Step Deployment

### Phase 1: Create Project & Database
1.  Log in to [Railway.app](https://railway.app/).  
2.  Click **+ New Project** → **Provision PostgreSQL**.
3.  This creates a new project with a database.
4.  Click on the **PostgreSQL** card.
5.  Go to the **Data** tab. You will see it is empty (Good).

### Phase 2: Deploy Backend (Django)
1.  In the same project, click **+ New** → **GitHub Repo**.
2.  Select your repo: `schoolerp`.
3.  **🛑 STOP! DO NOT WAIT.** Immediately click the new card (it might be building and failing, that's okay).
4.  Go to **Settings** → **General**.
5.  **Root Directory**: Change `/` to `/backend`. (This fixes the "Build failed" error).
6.  Go to **Variables** tab. Add these:
    *   `SECRET_KEY`: (Paste a long random string)
    *   `DEBUG`: `False`
    *   `ALLOWED_HOSTS`: `*`
    *   `DATABASE_URL`: (Type `${{PostgreSQL.DATABASE_URL}}` - Railway will auto-complete this!)
    *   `CLOUDINARY_CLOUD_NAME`: (Your Cloudinary Name)
    *   `CLOUDINARY_API_KEY`: (Your Key)
    *   `CLOUDINARY_API_SECRET`: (Your Secret)
7.  Go to **Settings** → **Networking**.
8.  Click **Generate Domain**. (e.g., `web-production-123.up.railway.app`). **COPY THIS URL.**

### Phase 3: Deploy Frontend (React)
1.  Click **+ New** → **GitHub Repo**.
2.  Select the **SAME** repo: `schoolerp`.
3.  Click the NEW card (setup 2).
4.  Go to **Settings** → **General**.
5.  **Root Directory**: Change `/` to `/frontend`.
6.  Go to **Variables** tab. Add this **IMMEDIATELY** (Before the build finishes if possible, or trigger a redeploy after):
    *   `VITE_API_URL`: (Paste the **Backend URL** from Phase 2, e.g., `https://web-production-123...`)
    *   *Note: This is required at BUILD TIME because of our Dockerfile setup.*
7.  Go to **Settings** → **Networking**.
8.  Click **Generate Domain**. (e.g., `schoolerp-frontend.up.railway.app`). **COPY THIS URL.**

### Phase 4: Final Connection (CORS)
1.  Go back to your **Backend Service**.
2.  Go to **Variables**.
3.  Add/Update:
    *   `CORS_ALLOWED_ORIGINS`: (Paste your **Frontend URL** from Phase 3).
        *   **Example:** `https://schoolerp-frontend.up.railway.app`
        *   **Important:** NO trailing slash `/` at the end!
    *   `CSRF_TRUSTED_ORIGINS`: (Paste your **Backend URL**).
        *   **Example:** `https://web-production-123.up.railway.app`
4.  Railway will automatically restart the Backend.
    *   *Startup Magic:* Our updated Dockerfile will automatically:
        *   Run Database Migrations.
        *   Create/Verify the Superuser (`admin@campusorbit.com`).
        *   Start the server with Gunicorn.

---

## 3️⃣ Verification (Did it work?)
1.  Open your **Frontend URL** in a browser.
2.  You should see the Login Page.
3.  Open Developer Tools (F12) → Network Tab.
4.  Try to Login.
5.  If you see a `200 OK` from the backend, **YOU ARE LIVE!** 🚀

---

## 4️⃣ Common Mistakes & Fixes

| Error | Cause | Fix |
| :--- | :--- | :--- |
| **"Railpack could not determine build"** | You didn't set Root Directory. | Set `/backend` or `/frontend` in Settings. |
| **"Database connection failed"** | Missing `DATABASE_URL`. | Ensure `${{PostgreSQL.DATABASE_URL}}` is in variables. |
| **"Network Error" / "CORS Error"** | Backend rejects Frontend. | Check `CORS_ALLOWED_ORIGINS` equals exact Frontend URL. |
| **"404 Not Found" on Refresh** | Nginx config missing. | We already added `nginx.conf`, so this should be safe! |

---

**🎉 Enjoy your Production App!**
