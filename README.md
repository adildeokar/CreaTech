# PRECYCLE — Precast Cycle Intelligence Engine

**AI-powered cycle time optimization for precast yards across India.**  
Part of **CreaTech**: identifies key parameters, evaluates strategy combinations with cost implications, and recommends the most efficient cycle-time strategy for Infrastructure and Building projects.

---

## Quick start

### 1. API server (recommendations + regions)

```bash
cd server
cp .env.example .env
# Edit .env and set OPENAI_API_KEY (optional for demo; fallback works without it)
npm install
npm run dev
```

Runs at `http://localhost:3001`. Without a valid `OPENAI_API_KEY`, the app uses a deterministic fallback ranking.

### 2. React client

```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173`. The dev server proxies `/api` to `http://localhost:3001`.

### 3. Single-command run (from repo root)

Terminal 1:

```bash
cd server && npm install && npm run dev
```

Terminal 2:

```bash
cd client && npm install && npm run dev
```

---

## What’s in this repo

| Path | Description |
|------|-------------|
| `COMPLETE-PROJECT-DOCUMENTATION.md` | **Full project doc:** problem, logic, features, every code file, AI, API, future scope |
| `PROJECT-DOCUMENTATION.md` | Short summary and checklist |
| `docs/` | Product and technical docs (vision, features, AI, tech, UI, MVP, impact, future scope) |
| `client/` | React (Vite + TypeScript) app: Dashboard, Scenarios, 3D Yard, KPI Impact, Optimization, Scenario Lab, AI panel |
| `server/` | Express API: recommend, explain, copilot/suggest, regions, weather, climate, optimize, cost, risk, strength-predict, kpi-impact |

---

## Routes (client)

| Path | Page |
|------|------|
| `/`, `/scenarios` | Dashboard (parameters, scenarios, strength curve, demould meter, cost/risk breakdown) |
| `/yard` | 3D Digital Twin |
| `/kpi` | KPI Impact |
| `/optimize` | Multi-objective optimization (Pareto) |
| `/lab` | Scenario Lab (Monte Carlo) |

---

## API (server)

`POST /api/recommend` · `POST /api/copilot/suggest` · `POST /api/explain` · `GET /api/regions` · `GET /api/weather` · `GET/POST /api/climate` · `POST /api/optimize` · `POST /api/cost` · `POST /api/risk` · `POST /api/strength-predict` · `POST /api/kpi-impact`. Without `OPENAI_API_KEY`, recommend/explain/copilot use fallbacks.

---

## Docs index

- **COMPLETE-PROJECT-DOCUMENTATION.md** — Full reference: problem, logic, every file, AI, API, future scope
- **docs/01-PRODUCT-VISION.md** — Name, pitch, why it wins, judge “wow”
- **docs/02-REACT-APP-CONCEPT.md** — App type, defensibility, scalability
- **docs/03-FEATURE-ARCHITECTURE.md** — Core + advanced features, prioritization
- **docs/04-AI-ARCHITECTURE.md** — OpenAI mini usage, prompts, structured output, anti-hallucination
- **docs/05-TECHNICAL-ARCHITECTURE.md** — Stack, state, API, DB, simulation, hosting
- **docs/06-UI-UX-STRATEGY.md** — Command-center UI, 3D, sliders, AI panel, first 30 seconds
- **docs/07-MVP-DOCUMENT.md** — Personas, user stories, requirements, roadmap, risks
- **docs/08-IMPACT-MODEL.md** — Efficiency gains, example numbers, ROI, carbon
- **docs/09-FUTURE-SCOPE.md** — IoT, edge, RL, SaaS monetization

---

## Tech stack

- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Framer Motion, React Three Fiber, Recharts, Zustand, React Hook Form + Zod, React Router
- **Backend:** Node.js, Express, OpenAI (gpt-4o-mini)
- **Simulation:** Pure JS/TS in client (cycle time, cost, risk) + server engines (climate, cost, risk, strength, optimization) for API

---

## Environment

- **Server:** `OPENAI_API_KEY` (optional), `PORT` (default 3001).
- **Client:** `VITE_API_URL` only if the API is not proxied (e.g. production with API on another host).

---

## Hosting & sharing (free)

You can host the whole app on GitHub and share it at no cost:

- **Share the repo:** Push to GitHub and send the repo link; others clone and run locally (see Quick start above).
- **Live website (GitHub Pages + Render):** Step-by-step guide → **[LAUNCH.md](LAUNCH.md)**. You'll get a public repo and a link like `https://YOUR_USERNAME.github.io/CreaTech/` that anyone can open.
- More options and details: [DEPLOYMENT.md](DEPLOYMENT.md).

---

## License

Proprietary — CreaTech hackathon.
