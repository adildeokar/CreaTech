# 7️⃣ Complete MVP Document

## Product Overview

**Product name:** PRECYCLE (Precast Cycle Intelligence Engine)

**Summary:** PRECYCLE is an AI-powered web application that helps precast yards across India optimize element cycle time (casting → demoulding → reset) by combining deterministic strength-gain and cost models with an OpenAI-powered recommendation and explanation layer. Users input yard and project parameters, run scenario simulations with "what if" sliders, and get ranked strategies with cost implications and natural-language rationale. A 3D yard view and a gamified optimization score provide strong visual differentiation for judges and users.

**Target users:** Precast yard managers, project planners, and civil engineers in infrastructure and building projects in India.

**Value proposition:** Reduce cycle time and cost through data-driven strategy selection; understand trade-offs and climate risks; scale operations without proportionally scaling yard size.

---

## User Personas

### Persona 1: Yard Manager (Rajesh)
- **Role:** Manages a 24-bed precast yard in North India; infra project (bridge elements).
- **Goals:** Hit delivery targets; avoid overtime and rework; control material and energy cost.
- **Pain:** Uncertain cycle times due to weather and mix; no single place to compare "more curing" vs "better mix" vs "automation."
- **Use case:** Enters region, project type, current mix and curing; runs 2–3 scenarios; picks recommended strategy and reads "Why?" to justify to site lead.

### Persona 2: Project Planner (Priya)
- **Role:** Plans precast supply for a metro project across two yards (Chennai, Delhi).
- **Goals:** Optimize for timeline and cost; compare regions and strategies.
- **Pain:** Different climates and practices per yard; spreadsheets don’t capture strength gain and cost together.
- **Use case:** Creates scenarios for each region; compares cycle time and cost; uses delay-risk note to add buffer in schedule.

### Persona 3: Technical Judge / Evaluator
- **Role:** Assesses hackathon demos for technical depth and impact.
- **Goals:** See clear problem, working demo, and measurable impact in 5–10 minutes.
- **Use case:** Opens app → sees score and 3D yard → moves sliders → reads AI "Why?" → checks impact numbers in docs or dashboard.

---

## User Stories

- **US1:** As a yard manager, I can enter my region, project type, mix, and curing so that I get a baseline cycle time and cost.
- **US2:** As a yard manager, I can change curing hours and automation level via sliders and see updated cycle time and cost so that I can explore options without re-entering everything.
- **US3:** As a planner, I can compare multiple scenarios side-by-side (cycle, cost, risk) so that I can choose a strategy.
- **US4:** As a user, I can see an AI-ranked recommendation with a short "Why?" explanation so that I can justify the choice to stakeholders.
- **US5:** As a user, I can view a 3D yard with beds and their state so that I get a quick visual of the yard and differentiation.
- **US6:** As a user, I can see an optimization score (0–100) so that I have a single metric for yard efficiency.
- **US7:** As a user, I can optionally see live weather for my region so that I am aware of climate risk.
- **US8:** As a user, I can see a strength gain curve for the selected scenario so that I understand when demould is safe.
- **US9:** As a user, I can see cost breakdown (material, curing, labour, etc.) and risk breakdown (crack, weather, automation, cycle) for the active scenario so that I understand drivers.
- **US10:** As a user, I can see demould probability and safe demould window so that I know when stripping is safe.
- **US11:** As a user, I can view a KPI Impact dashboard (cycle reduction %, cost savings %, throughput, energy, CO₂) comparing traditional vs optimized so that I can report impact.
- **US12:** As a user, I can run multi-objective optimization (Pareto, 100+ scenarios) and see cost vs cycle tradeoff so that I can pick a frontier strategy.
- **US13:** As a user, I can run Monte Carlo sensitivity in Scenario Lab (curing/temp) and see uncertainty bands so that I understand variability.

---

## Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR1 | User can set region (from Indian regions list) and project type (infrastructure / building). | Must |
| FR2 | User can set mix parameters: cement type, target strength, curing method, curing duration. | Must |
| FR3 | User can set automation level (manual / semi / full) and yard size (e.g. bed count). | Must |
| FR4 | System computes and displays cycle time (hours), cost per element (INR), and risk level per scenario. | Must |
| FR5 | User can create and compare at least 2–3 scenarios with different parameter sets. | Must |
| FR6 | System calls recommendation API and displays ranked strategies with explanation. | Must |
| FR7 | User can view "Why this strategy?" explanation in a dedicated panel or card. | Must |
| FR8 | User can view a 3D yard with beds and state (e.g. casting / curing / stripping). | Must |
| FR9 | User can view optimization score (0–100) with simple breakdown. | Must |
| FR10 | User can view strength gain curve (strength vs time) for selected scenario. | Should |
| FR11 | Optional: user can enable live weather and see weather widget / risk note. | Could |
| FR12 | Optional: user can "save" current scenario (e.g. in localStorage) for later. | Could |

---

## Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR1 | **Performance:** Dashboard and 3D view load in < 3 s on mid-range device; slider response < 500 ms. |
| NFR2 | **Availability:** MVP target 99% uptime for demo; graceful degradation if OpenAI or weather API is down. |
| NFR3 | **Security:** OpenAI API key only on server; no secrets in client bundle. |
| NFR4 | **Usability:** Key actions (run scenario, see recommendation) achievable in ≤ 3 clicks from dashboard. |
| NFR5 | **Scalability:** Architecture supports adding regions, project types, and more scenarios without full rewrite. |
| NFR6 | **Accessibility:** Basic keyboard navigation and focus states; sufficient contrast (WCAG AA where feasible). |

---

## System Architecture (Text Description)

```
[User Browser]
      |
      v
[React SPA - Vite]
  - Parameter form, sliders, scenario comparison
  - Simulation engine + climate, cost, risk, strength, optimization (JS, in-browser)
  - 3D yard (React Three Fiber)
  - Optimization score, strength curve, demould meter, cost/risk breakdown
  - Pages: Dashboard, Yard, KPI Impact, Optimization, Scenario Lab
      |
      | HTTPS
      v
[Backend API - Node/Express]
  - POST /api/recommend  (scenario summary -> OpenAI -> ranked + explanation)
  - POST /api/copilot/suggest (scenario, region, objective -> why_recommended, suggested_changes)
  - POST /api/explain    (strategy + context -> explanation)
  - POST /api/optimize   (regionId, objective, maxScenarios -> Pareto scenarios)
  - POST /api/cost, /api/risk, /api/strength-predict, /api/kpi-impact (engines)
  - GET  /api/weather   (mock or Open-Meteo with ?live=1)
  - GET  /api/regions, GET/POST /api/climate
  - Server engines: climateEngine, costEngine, riskEngine, strengthEngine, optimizationEngine
      |
      | Server-side
      v
[OpenAI API]  [Open-Meteo API - optional]
```

- **Data flow:** User edits params → frontend runs simulation → scenario summary sent to backend for recommendation → backend calls OpenAI → response merged with engine data → UI updates (recommendation, explanation, score). 3D, KPI, Optimization, and Scenario Lab consume same scenario/state or run local engines.

---

## API Specifications

### POST /api/recommend

**Request:**
```json
{
  "scenarioSummary": {
    "scenario_1": { "cycle_time_hours": 24, "cost_per_element_inr": 3800, "risk_level": "low" },
    "scenario_2": { "cycle_time_hours": 18, "cost_per_element_inr": 4200, "risk_level": "low" }
  },
  "constraints": { "max_risk": "low", "prefer": "cost" },
  "region": "North India"
}
```

**Response:**
```json
{
  "recommendation": {
    "ranked_strategies": [
      { "rank": 1, "strategy_id": "scenario_2", "cycle_time_hours": 18, "cost_per_element_inr": 4200, "risk_level": "low", "summary": "..." }
    ],
    "primary_reason": "...",
    "confidence": 0.85,
    "caveats": []
  },
  "explanation": { "factors": [], "trade_offs": "...", "climate_note": "..." }
}
```

### POST /api/explain

**Request:** `{ "strategyId": "scenario_2", "scenarioSummary": { ... }, "parameters": { ... } }`  
**Response:** `{ "sections": [ { "heading": "...", "body": "..." } ] }`

### GET /api/weather?lat=28.61&lon=77.21

**Response:** `{ "temp": 32, "humidity": 65, "conditions": "Clear", "risk": "low" }` (or similar)

### GET /api/regions

**Response:** `[{ "id": "north_india", "label": "North India", "temp_range": [8, 42], "humidity_range": [20, 80] }, ...]`

---

## Database Schema (Post-MVP)

- **users:** id, email, name, created_at
- **yards:** id, user_id, name, region, project_type, created_at
- **parameter_sets:** id, yard_id, name, parameters (JSONB), created_at
- **scenarios:** id, parameter_set_id, name, scenario_index, results (JSONB), created_at
- **recommendations:** id, scenario_run_id, ranked_strategies (JSONB), explanation (JSONB), created_at

MVP can use in-memory state + localStorage; no DB required for demo.

---

## Feature Prioritization

| Feature | Phase | Rationale | Implemented |
|---------|--------|-----------|-------------|
| Parameter form + region/project type | P0 | Core input | ✅ ParameterPanel |
| Simulation engine (cycle, cost, risk) | P0 | Core value | ✅ simulationEngine + climate, cost, risk |
| Scenario comparison (2–3) + sliders | P0 | Decision support | ✅ ScenarioComparison |
| Recommendation API + ranked list | P0 | AI differentiator | ✅ /api/recommend, AiPanel |
| "Why?" explanation panel | P0 | Explainability | ✅ AiPanel |
| 3D yard view (basic) | P0 | Visual wow | ✅ Yard3D, YardPage |
| Optimization score | P0 | Gamification | ✅ ScoreBadge |
| Strength curve chart | P1 | Depth | ✅ StrengthCurveChart |
| Cost breakdown, risk heatmap, demould meter | P1 | Depth | ✅ CostBreakdownChart, RiskHeatmap, DemouldMeter |
| Weather widget + optional API | P1 | Climate angle | ✅ /api/weather (mock + live) |
| KPI Impact dashboard | P1 | Impact numbers | ✅ KPIDashboard, /api/kpi-impact |
| Multi-objective (Pareto) optimization | P1 | Tradeoff exploration | ✅ OptimizationPage, /api/optimize |
| Scenario Lab (Monte Carlo sensitivity) | P1 | Uncertainty | ✅ ScenarioLab |
| Co-pilot suggest | P1 | AI suggestions | ✅ /api/copilot/suggest |
| Save scenario (localStorage) | P1 | UX | Optional |
| Delay alerts (push/email) | P2 | Post-MVP | Risk badge only |
| Full server-side Monte Carlo | P2 | Post-MVP | Client-side in Lab |

---

## Development Roadmap (Week-by-Week)

### Week 1: Foundation and core engine
- Day 1–2: Project setup (Vite, React, TS, Tailwind, Zustand, React Query), theme (dark industrial), layout (top bar, sidebar, main).
- Day 3–4: Parameter form (region, project type, mix, curing, automation), validation (Zod), and parameter store.
- Day 5–7: Simulation engine (strength gain logic, cycle time, cost model, risk heuristic); unit tests; integrate with form and display cycle/cost/risk in a single scenario card.

### Week 2: Scenarios, API, and AI
- Day 1–2: Scenario store; add/duplicate/remove scenarios; sliders for key levers; run simulation per scenario; comparison table.
- Day 3–4: Backend: Express or Next API routes, `/api/recommend`, `/api/explain`; OpenAI integration with structured output; error handling and fallback.
- Day 5–7: Frontend: call recommendation API, show ranked strategies and "Why?" panel; merge engine numbers with LLM response; loading and error states.

### Week 3: 3D, score, polish
- Day 1–2: 3D yard: R3F grid of beds, state colours, camera controls; optional minimap on dashboard.
- Day 3–4: Optimization score formula and UI; strength gain curve chart; optional weather widget and API.
- Day 4–5: Micro-interactions (Framer Motion), responsive tweaks, accessibility (focus, contrast).
- Day 6–7: Bug fixes, demo script, README, env example, and deploy (Vercel + serverless or Railway).

---

## Metrics for Success

- **Product:** Number of scenarios run per session; time to first recommendation; use of "Why?" panel.
- **Technical:** Recommendation API latency (p95 < 5 s); simulation run < 200 ms; 3D 60 fps on target device.
- **Hackathon:** Judge feedback on clarity, technical depth, and differentiation; placement.
- **Impact (post-MVP):** Cycle time reduction % vs baseline; cost per element change; user-reported "decisions made with PRECYCLE."

---

## Cost Estimation (MVP, 2–3 weeks)

- **Development:** Assumed in-house or hackathon team (no external dev cost).
- **OpenAI:** ~$0.15–0.50 per 1K recommendation calls (mini model); 100–500 calls during build + demo ≈ $10–30.
- **Hosting:** Vercel free tier + serverless; optional Railway free tier for API. Total ~$0–20/month for demo.
- **Weather API:** Open-Meteo free tier sufficient for MVP.
- **Total:** ~$20–60 for MVP and demo period.

---

## Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| OpenAI API down or rate limit | Medium | High | Fallback to engine-only ranking; show "Explanation unavailable"; cache last response. |
| 3D performance on low-end devices | Medium | Medium | Reduce bed count or LOD; offer "2D grid" toggle. |
| Scope creep (Monte Carlo, IoT) | High | Medium | Strict MVP scope; park advanced features in backlog. |
| Incorrect cost/cycle formula | Medium | High | Validate with one real yard or expert; document assumptions; make formulas auditable. |
| Judge can’t run locally (env/keys) | Low | High | Deploy public demo URL; provide .env.example and one-click deploy (e.g. Deploy to Vercel). |

---

## Summary

- **Product:** PRECYCLE — AI-powered cycle-time optimization and recommendation for precast yards in India.
- **Personas:** Yard manager, project planner, judge.
- **Core features:** Parameters, simulation, scenarios, recommendation, explanation, 3D yard, optimization score, strength curve, cost/risk breakdown, demould meter, KPI Impact, Pareto optimization, Scenario Lab, co-pilot suggest.
- **Architecture:** React (Vite) + backend Express; server engines (climate, cost, risk, strength, optimization); simulation in frontend and server; optional weather (Open-Meteo) and DB later.
- **API:** `/api/recommend`, `/api/copilot/suggest`, `/api/explain`, `/api/weather`, `/api/regions`, `/api/climate`, `/api/optimize`, `/api/cost`, `/api/risk`, `/api/strength-predict`, `/api/kpi-impact`.
- **Roadmap:** Week 1 engine + form; Week 2 scenarios + AI; Week 3 3D + score + polish; ongoing: KPI, Optimization, Scenario Lab, co-pilot.
- **Success:** Usage metrics, latency, judge feedback, and (post-MVP) cycle time and cost impact.
- **Full reference:** COMPLETE-PROJECT-DOCUMENTATION.md.
