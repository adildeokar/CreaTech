# Deploying & Sharing CreaTech (PRECYCLE) — Free Options

You can host everything on GitHub and share it at **no cost**. Two ways to do it:

---

## 1. Share the code (simplest — 100% free)

**What you get:** A GitHub repo link. Anyone can clone and run the app on their machine.

### Steps

1. **Create a GitHub repo** (if you haven't already)  
   - Go to [github.com/new](https://github.com/new)  
   - Name it e.g. `CreaTech` or `precycle`  
   - Public, no need for a paid plan  

2. **Push your code** (from your project folder):

   ```bash
   git init
   git add .
   git commit -m "Initial commit: CreaTech PRECYCLE app"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```

3. **Share the link**  
   Send people: `https://github.com/YOUR_USERNAME/YOUR_REPO_NAME`  
   They can clone and run with the instructions in the main [README.md](README.md) (run server, then client).

**Pros:** Free, no setup.  
**Cons:** No "click and use" link; people must clone and run locally.

---

## 2. Live link (app in the browser — still free)

**What you get:** One URL (e.g. `https://your-username.github.io/CreaTech`) that opens the app. The backend runs on a free host.

Your app has two parts:

- **Frontend** (React/Vite) → host on **GitHub Pages** (free)  
- **Backend** (Node/Express API) → host on **Render** free tier (free)

### 2.1 Backend on Render

1. Go to [render.com](https://render.com) and sign up (free).  
2. **New → Web Service**.  
3. Connect your GitHub repo.  
4. Configure:
   - **Root directory:** `server`
   - **Build command:** `npm install`
   - **Start command:** `npm start`
   - **Environment:** Add `OPENAI_API_KEY` if you use AI (optional); `PORT` is set by Render.  
5. Create the service. Render will give you a URL like `https://your-api.onrender.com`.

**Note:** On the free tier the service may "sleep" after inactivity; the first request after sleep can take 30–60 seconds.

### 2.2 Frontend on GitHub Pages

1. **Set the API URL for production**  
   When the frontend is on GitHub Pages, it must call your Render API, not `/api` on localhost.  
   Build the client with:

   ```bash
   VITE_API_URL=https://your-api.onrender.com/api
   ```

2. **Build the client:**

   ```bash
   cd client
   npm install
   set VITE_API_URL=https://your-api.onrender.com/api
   npm run build
   ```

   (On macOS/Linux use `export VITE_API_URL=...`.)

3. **Enable GitHub Pages**  
   - Repo → **Settings → Pages**  
   - Source: **GitHub Actions** (recommended) or **Deploy from branch**  
   - If "Deploy from branch": choose branch `main`, folder that contains the built `client/dist` (e.g. copy `client/dist` to `docs` or push to `gh-pages` branch).  

4. After deployment, your live link will be:  
   `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`

Share this link; no need for others to install or run anything.

### 2.3 Optional: Deploy frontend automatically (GitHub Actions)

The repo includes a workflow that builds and deploys the client to GitHub Pages on every push to `main`:

1. In your GitHub repo go to **Settings → Pages** and set **Source** to **GitHub Actions**.
2. Add a **repository secret**: **Settings → Secrets and variables → Actions** → New repository secret:
   - Name: `VITE_API_URL`
   - Value: your Render API URL, e.g. `https://your-api.onrender.com/api`
3. Push to `main` (or run the workflow manually from the Actions tab). The app will be available at `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`.

---

## Summary

| Goal                         | What to do                                      | Cost   |
|-----------------------------|--------------------------------------------------|--------|
| Code on GitHub + share repo | Push to GitHub, share repo link                 | Free   |
| One "use in browser" link   | Frontend on GitHub Pages + backend on Render    | Free   |

Both options keep the entire application on GitHub and give you a link to send others; the second adds a free live demo URL.
