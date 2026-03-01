# Launch CreaTech on GitHub Pages + Render (free)

Follow these steps in order. At the end you’ll have a **public GitHub repo** and a **live website** anyone can open (e.g. `https://YOUR_USERNAME.github.io/CreaTech/`).

---

## Step 1 — Put the app on GitHub

1. **Create a new repository** on GitHub:
   - Go to **[github.com/new](https://github.com/new)**.
   - **Repository name:** e.g. `CreaTech` (this will be in the site URL).
   - **Public**, no need to add a README (you already have one).
   - Click **Create repository**.

2. **Push this project** from your machine (in the project folder `CreaTech`):

   ```bash
   git init
   git add .
   git commit -m "Initial commit: CreaTech PRECYCLE"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/CreaTech.git
   git push -u origin main
   ```

   Replace `YOUR_USERNAME` with your GitHub username and `CreaTech` with your repo name if different.

You now have the full app in a public repo. Next: deploy the backend, then the frontend.

---

## Step 2 — Deploy the API on Render

1. Go to **[render.com](https://render.com)** and **sign up / log in** (free, with GitHub).

2. **New → Web Service**.

3. **Connect your GitHub account** if asked, then **select the repo** you just pushed (e.g. `CreaTech`).

4. Configure the service:
   - **Name:** e.g. `precycle-api` (or leave default).
   - **Region:** pick one close to you.
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance type:** Free.

   *(If Render detects `render.yaml`, it may fill these for you — just confirm Root Directory is `server`.)*

5. **(Optional)** Under **Environment**, add:
   - Key: `OPENAI_API_KEY`  
   - Value: your OpenAI API key  
   (If you skip this, the app still runs with fallback recommendations.)

6. Click **Create Web Service**. Wait for the first deploy to finish.

7. **Copy the service URL** from the top of the dashboard, e.g.  
   `https://precycle-api-xxxx.onrender.com`  
   Your API base URL for the frontend is that URL + `/api`, so:  
   **`https://precycle-api-xxxx.onrender.com/api`**  
   Keep this for the next step.

---

## Step 3 — Turn on GitHub Pages and set the API URL

1. In your **GitHub repo**, go to **Settings → Pages** (left sidebar).

2. Under **Build and deployment**:
   - **Source:** choose **GitHub Actions**.

3. Add the API URL so the frontend can call your Render backend:
   - Go to **Settings → Secrets and variables → Actions**.
   - Click **New repository secret**.
   - **Name:** `VITE_API_URL`
   - **Value:** the API URL from Step 2, e.g. `https://precycle-api-xxxx.onrender.com/api`  
     (no trailing slash).
   - Click **Add secret**.

---

## Step 4 — Deploy the website

The repo includes a workflow that builds and deploys the frontend to GitHub Pages.

- **Option A:** Push any change to `main`:
  ```bash
  git add .
  git commit -m "Deploy to GitHub Pages"
  git push origin main
  ```
- **Option B:** In the repo open the **Actions** tab, select **Deploy to GitHub Pages**, click **Run workflow**, then **Run workflow** again.

Wait for the workflow to finish (green check). The first time may take a couple of minutes.

---

## Step 5 — Your live link

When the workflow has completed:

- **Website URL:**  
  **`https://YOUR_USERNAME.github.io/CreaTech/`**  
  (Replace `YOUR_USERNAME` and `CreaTech` with your GitHub username and repo name.)

Share this link; anyone can open the app in the browser. The API runs on Render (free tier may sleep after inactivity; the first click after that might take ~30–60 seconds).

---

## Quick reference

| What            | Where / URL |
|----------------|-------------|
| Code           | `https://github.com/YOUR_USERNAME/CreaTech` |
| Live site      | `https://YOUR_USERNAME.github.io/CreaTech/` |
| API (backend)  | Your Render Web Service URL (e.g. `https://precycle-api-xxxx.onrender.com`) |

---

## Troubleshooting

- **“Failed to load” or API errors on the site**  
  - Check that **Settings → Secrets and variables → Actions** has `VITE_API_URL` set to `https://YOUR-RENDER-URL.onrender.com/api`.
  - Re-run the **Deploy to GitHub Pages** workflow after saving the secret.

- **Pages says “GitHub Actions” but no workflow runs**  
  - Make sure the **Deploy to GitHub Pages** workflow file is in the repo (`.github/workflows/deploy-pages.yml`) and that you’ve pushed to `main` at least once.

- **First load is slow**  
  - Render’s free tier spins down when idle. The first request after that can take 30–60 seconds; later requests are fast.

For more detail, see [DEPLOYMENT.md](DEPLOYMENT.md).
