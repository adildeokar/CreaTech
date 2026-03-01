# 5️⃣ Technical Architecture

## Frontend Stack

- **React 18** (with hooks)
- **Vite** — build and dev server
- **TypeScript** — type safety and better DX
- **Tailwind CSS** — utility-first styling and theming
- **Framer Motion** — animations and micro-interactions
- **React Three Fiber (R3F) + Three.js** — 3D yard view
- **Recharts** or **Lightning Chart** — strength curve, histograms, scenario comparison
- **Zustand** — lightweight global state (scenarios, UI, selected strategy)
- **React Query (TanStack Query)** — server state, caching, and API calls to backend/OpenAI proxy
- **React Hook Form + Zod** — parameter form and validation

---

## State Management

- **Zustand stores:**
  - `useAppStore`: theme, sidebar, panel visibility (e.g. AI co-pilot open/closed)
  - `useScenarioStore`: list of scenarios, active scenario id, slider values, "base" parameters
  - `useRecommendationStore`: ranked strategies, explanation, loading, error
- **React Query:** Caches recommendation API response, parameter extraction, and optional weather; keys by scenario fingerprint for invalidation.
- **URL state (optional):** Persist scenario id or view (e.g. `/dashboard?scenario=2`) for shareable links.

---

## Backend Architecture

- **Node.js (Express)** API server:
  - Keeps OpenAI API key on server.
  - Routes: `/api/recommend`, `/api/copilot/suggest`, `/api/explain`, `/api/regions`, `/api/weather`, `/api/climate`, `/api/climate/context`, `/api/optimize`, `/api/cost`, `/api/risk`, `/api/strength-predict`, `/api/kpi-impact`.
  - **Server engines** (in `server/engines/`): climateEngine.js, costEngine.js, riskEngine.js, strengthEngine.js, optimizationEngine.js — same logic as client lib for consistency; used by API routes.
- **Simulation engine:** Runs in **frontend** (and server for API) in pure JS/TS; no GPU. Input: parameters object (+ optional climate context); output: cycle time, cost, risk per scenario. Optimization engine generates 100+ parameter combinations and computes Pareto frontier.

---

## API Structure

- **REST (implemented):**
  - `POST /api/recommend` — body: `{ scenarioSummary, constraints?, region? }` → `{ recommendation, explanation }`
  - `POST /api/copilot/suggest` — body: `{ scenarioSummary?, region?, objective? }` → `{ why_recommended, impact_summary, suggested_changes }`
  - `POST /api/explain` — body: `{ strategyId, scenarioSummary, parameters }` → `{ sections }`
  - `POST /api/extract` — body: `{ rawInput }` or form → `{ parameters, missing_or_inferred }` (optional)
  - `GET /api/weather?lat=&lon=&live=1` → `{ temp, humidity, conditions, risk?, source }` (mock or Open-Meteo)
  - `GET /api/regions` — static list of Indian regions with climate presets
  - `GET /api/climate`, `POST /api/climate/context` — climate context for region/season/live weather
  - `POST /api/optimize` — body: `{ regionId, objective, maxScenarios, constraints?, weather?, season? }` → Pareto scenarios
  - `POST /api/cost` — body: `{ params, cycle_time_hours?, demould_hours? }` → cost breakdown
  - `POST /api/risk` — body: `{ params, climate?, cycle_time_hours? }` → risk breakdown + risk_level
  - `POST /api/strength-predict` — body: `{ params, ambient_temp?, climate_multiplier?, hours? }` → curve, safe_demould_hours, demould_probability
  - `POST /api/kpi-impact` — body: `{ traditional, optimized }` → cycle/cost throughput/energy/CO₂ deltas
- **Internal (frontend):** Simulation engine and optimization engine as pure functions; same logic mirrored in server engines for API.

---

## Database Schema Design

**MVP can be file-based or SQLite.** For scalability, use PostgreSQL.

### Tables (conceptual)

- **users** — id, email, name, created_at (for future auth)
- **yards** — id, user_id, name, region, project_type, created_at
- **parameter_sets** — id, yard_id, name, parameters (JSONB), created_at
- **scenarios** — id, parameter_set_id, name, scenario_index, results (JSONB: cycle_time, cost, risk), created_at
- **recommendations** — id, scenario_run_id, ranked_strategies (JSONB), explanation (JSONB), created_at
- **audit_log** — id, entity_type, entity_id, action, payload (JSONB), created_at (for debugging and prompt iteration)

For MVP, **no DB required**: state in memory + optional `localStorage` for "saved" scenarios. DB becomes necessary for multi-user, persistence, and analytics.

---

## Simulation Engine Logic

- **Input:** Single object `params`: region, project_type, cement_type, mix_strength_mpa, curing_method, curing_hours, automation_level, ambient_temp_range, yard_beds, element_types.
- **Steps:**
  1. **Strength gain:** Maturity or equivalent-age model (e.g. Arrhenius-based) or simplified curve: `strength(t) = f(cement_type, curing_method, curing_hours, temp)`. Return time to reach demould strength (e.g. 20 MPa).
  2. **Cycle time:** `cycle_hours = demould_time + strip_and_reset_hours(automation_level)`. demould_time from step 1; strip/reset from constants or lookup.
  3. **Cost:** Parametric: `cost = material_cost(mix, region) + curing_cost(curing_method, curing_hours) + labour_cost(cycle_hours, automation_level) + amortization(beds)`. Use region presets (e.g. North India, South India) with overridable rates.
  4. **Risk score:** Heuristic: climate variance, curing sensitivity, automation dependency. Output 0–1 or "low" | "medium" | "high".
- **Output:** `{ cycle_time_hours, cost_per_element_inr, risk_level, demould_strength_mpa?, breakdown? }`. All deterministic; same input ⇒ same output.

---

## Hosting Strategy

- **Frontend:** Vercel or Netlify (React build; env `VITE_API_URL` for backend).
- **Backend (API proxy):** Same Vercel serverless (Next.js API routes) or separate Railway/Render/Fly.io (Express). Env: `OPENAI_API_KEY`, `WEATHER_API_KEY` (if any).
- **DB (post-MVP):** Supabase or Neon (PostgreSQL); or Firebase if preferred.
- **3D assets:** Bundled with app or CDN; no separate asset server for MVP.

---

## Scalability Design

- **Horizontal:** API is stateless; scale serverless or containers behind a load balancer.
- **Caching:** React Query on frontend; Redis or in-memory cache for weather and static region data on backend.
- **Rate limiting:** Per API key or per IP on `/api/recommend` and `/api/extract` to avoid OpenAI cost spikes.
- **Async (future):** For Monte Carlo (N=500), run in a queue (e.g. Bull + Redis) and poll or WebSocket for result; MVP can run small N in frontend or skip.

---

## Deployment Plan

1. **Repo:** Monorepo or two repos (client + api). Monorepo: `apps/web`, `apps/api` or `client/`, `server/`.
2. **Env:** `.env.example` with `VITE_API_URL`, `OPENAI_API_KEY`; backend reads `OPENAI_API_KEY`.
3. **CI:** GitHub Actions — on push to `main`: build client + API, run lint and tests, deploy frontend to Vercel and API to Railway (or Vercel serverless).
4. **Secrets:** OpenAI key in Vercel/Railway env; never in client bundle.
5. **MVP demo:** Single Vercel deploy (Next.js app with API routes + React frontend) or Vite + Express on Railway with Vercel for static.

---

## Summary

- **Frontend:** React, Vite, TypeScript, Tailwind, Framer Motion, R3F, Recharts, Zustand, React Query (optional), RHF + Zod, React Router. Pages: Dashboard, Yard (3D), KPI Impact, Optimization, Scenario Lab.
- **Backend:** Express; proxy to OpenAI; server engines (climate, cost, risk, strength, optimization); weather (mock + Open-Meteo); simulation logic in both client and server.
- **API:** REST: `/api/recommend`, `/api/copilot/suggest`, `/api/explain`, `/api/regions`, `/api/weather`, `/api/climate`, `/api/optimize`, `/api/cost`, `/api/risk`, `/api/strength-predict`, `/api/kpi-impact`.
- **DB:** Optional for MVP; PostgreSQL schema above for multi-user and persistence.
- **Simulation:** Pure JS/TS engine with maturity-based strength and parametric cost; deterministic; climate-adjusted; Pareto optimization and Monte Carlo (Scenario Lab) on client.
- **Hosting:** Vercel (frontend + serverless API) or Vercel + Railway; DB later on Supabase/Neon.
- **Scalability:** Stateless API, caching, rate limiting, optional queue for heavy simulations.
- **Full file list:** See COMPLETE-PROJECT-DOCUMENTATION.md.
