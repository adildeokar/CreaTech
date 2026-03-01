# PRECYCLE — Complete Project Documentation

**Single comprehensive reference for the entire PRECYCLE (Precast Cycle Intelligence Engine) project: problem statement, product vision, working logic, all features, every code file, AI architecture, APIs, and future scope.**

---

# Part 1 — Problem Statement & Background

## Official Problem Statement (CreaTech)

**Problem Statement: AI-Powered Cycle Time Optimization for Precast Yards**

### Background

In precast projects, **element cycle time** — from casting to de-moulding and reset — directly impacts:

- **Project cost**
- **Yard size requirements**
- **Delivery timelines**

Delays and inefficiencies often arise due to:

- Strength gain requirements (when is it safe to demould?)
- Mix design variables (cement type, target strength)
- Curing methods (ambient, steam, heated enclosure)
- Automation levels (manual, semi, full)
- Climatic conditions (temperature, humidity, season)
- Interdependent operational constraints

### Action Item

As part of **CreaTech**, design an **AI-powered system** that:

1. **Identifies** key parameters and dependencies (region, project type, mix, curing, automation, climate).
2. **Evaluates** multiple combinations with cost implications (cycle time, cost per element, risk).
3. **Recommends** the most efficient cycle-time strategy for precast yards.
4. **Works** across **Infrastructure** and **Building** projects **across India** (North, South, East, West, Central).

### Key Considerations

- Critical technical and climatic variables.
- Strength gain vs cost optimization.
- Scenario simulation and decision support.
- Scalability across regions and project types.
- Measurable efficiency gains (cycle reduction %, throughput, cost savings, ROI).

---

# Part 2 — Product Vision & Positioning

## Product Name & Tagline

- **Name:** **PRECYCLE** — *Precast Cycle Intelligence Engine*
- **Tagline:** *"From cast to release in half the guesswork."*

## One-Line Disruptive Pitch

**"PRECYCLE turns every precast yard into a live digital twin: AI predicts strength gain, simulates cycle times across India's climates, and recommends the cheapest, fastest strategy—so you pour more, wait less, and scale without doubling the yard."**

## App Type

- **Yard Intelligence Platform** — Single dashboard for cycle time, cost, climate risk, and recommendations.
- **AI Simulation Engine** — Run "what if" scenarios (mix, curing, automation, weather) and get strategy + cost implications.
- **Lightweight Digital Twin** — 3D yard view showing beds, cycle states, and optimization heatmap.

## Why It Wins Over Traditional ERP

| Traditional ERP / Spreadsheets | PRECYCLE |
|--------------------------------|----------|
| Static templates | Climate-aware, project-type-aware (infra vs building, North vs South India) |
| Manual "experience-based" cycle times | Physics + AI: strength curves, curing, mix design in one model |
| Cost and cycle time in separate modules | Unified cost–cycle trade-off with scenario simulation |
| No explainability | AI explainability: "Why this strategy?" in plain language |
| Reactive reporting | Predictive: delay alerts, weather-risk, Monte Carlo (Scenario Lab) |
| Siloed data | Single source of truth with 3D yard and optimization score |

**Defensible angle:** ERPs track *what happened*. PRECYCLE tells you *what to do next* and *why*, with measurable efficiency gains.

## Target Users

- **Yard managers** — Precast yard operations, infra/building projects in India.
- **Project planners** — Timeline and cost optimization across yards/regions.
- **Civil engineers** — Mix design, curing, and cycle-time decisions.

---

# Part 3 — Working Logic (End-to-End)

## 3.1 High-Level Data Flow

1. **User sets parameters** in the Parameter panel: region, project type, cement type, mix strength (MPa), curing method, curing hours, automation level, yard beds.
2. User clicks **"Run scenario"** → current parameters are sent to the **simulation engine** (client-side).
3. **Simulation engine** (deterministic):
   - **Strength gain:** Maturity-style curve `strength(t) = k * (1 - exp(-t/tau))`; tau and k depend on cement, curing, and ambient temp. Returns **hours to reach 20 MPa** (demould).
   - **Cycle time:** `cycle_time_hours = demould_hours + strip_reset_hours` (strip/reset from automation: manual 4 h, semi 2.5 h, full 1.5 h). Optionally adjusted by **climate factor** if `ClimateContext` is provided.
   - **Cost:** Extended cost engine: material, curing, labour, amortization, land_yard, automation_capex, delay_penalties → **cost_per_element_inr**.
   - **Risk:** Risk engine: crack probability, weather volatility, automation failure, cycle time risk → **risk_level** (low/medium/high).
4. **Scenario** is added to the list; user can run again with different params to get multiple scenarios.
5. User clicks **"Get AI recommendation"** → frontend builds **scenario summary** (cycle, cost, risk per scenario) → **POST /api/recommend**.
6. **Backend** either:
   - **With OpenAI API key:** Calls **gpt-4o-mini** with a prompt that asks for ranked strategies and explanation; **copies numbers from scenario summary** (no hallucination); returns JSON.
   - **Without API key:** Returns **fallback** ranking (sort by cycle time then cost) and static explanation.
7. **Frontend** stores recommendation, highlights **recommended** scenario in the table, updates **optimization score**, and shows **AI Co-pilot** panel (primary_reason, caveats, trade_offs, climate_note).
8. **Strength curve** chart shows predicted strength vs time for the active scenario (from `getStrengthCurve` / `strengthPredictionEngine`).
9. **3D Yard** page shows a grid of beds colored by state (casting/curing/stripping/ready) driven by `parameters.yard_beds`.
10. **KPI Impact** page compares worst vs recommended scenario: cycle time reduction %, cost savings %, throughput increase %, energy/CO₂ estimates.
11. **Optimization** page runs **local Pareto optimization**: generates 100+ parameter combinations, runs simulation for each, computes Pareto frontier (cost vs cycle vs risk), displays scatter chart.
12. **Scenario Lab** runs **Monte Carlo** sensitivity: curing hours ± noise, temp offset; multiple runs → uncertainty band (cycle vs curing hours).

## 3.2 Simulation Engine Logic (Deterministic)

- **Input:** `Parameters` (region, project_type, cement_type, mix_strength_mpa, curing_method, curing_hours, automation_level, yard_beds, element_types). Optional: `ClimateContext` (temp, humidity, etc.) for climate-adjusted cycle and strength.
- **Strength gain:** `hoursToDemouldStrength(cementType, curingMethod, curingHours, 20, ambientTemp)`. Effective rate: OPC_53 ×1.2, PPC/PSC ×0.9; steam ×1.5, heated_enclosure ×1.35; temp factor 0.8 + (ambientTemp/50)*0.4. tau = 8/effectiveRate, k = 50. Returns hours to reach 20 MPa.
- **Cycle time:** `demould_hours + STRIP_RESET_HOURS[automation_level]`. If climateContext present, multiply by `getCycleTimeClimateFactor(climateContext)` (0.85–1.15).
- **Cost:** `costEngine.computeCostBreakdown(params, cycle_time_hours, demould_hours)` → material, curing, labour, amortization, automation_capex, land_yard, delay_penalties → total.
- **Risk:** `riskEngine.computeRiskScore(params, climate, cycle_time_hours)` → overall, crack_probability, weather_volatility, automation_failure, cycle_time_risk. `riskLevelFromScore(overall)` → low (≤0.33), medium (≤0.66), high.
- **Output:** `ScenarioResult`: scenario_id, name, cycle_time_hours, cost_per_element_inr, risk_level, demould_strength_mpa, breakdown.
- **Optimization score:** Composite: cycle score (40) + cost score (30) + risk score (20) + utilization score (10) = 0–100.

## 3.3 Climate Intelligence

- **climateEngine:** `getClimateContext(regionId, { weather?, season?, useLiveWeather? })` → temp, humidity, rainfall_mm, wind_kmh, season, climate_impact_score, source (region | api | historical). Season inferred from date (summer/monsoon/winter) with temp/humidity offsets.
- **getClimateStrengthMultiplier(climate):** 0.6–1.3 for strength curve.
- **getCycleTimeClimateFactor(climate):** 0.85 + (climate_impact_score/100)*0.3.

## 3.4 Cost Engine (Extended)

- Material: `BASE_MATERIAL_COST_PER_M3 * (mix_strength_mpa/40) * 1.1`.
- Curing: steam 180 INR/h × curing_hours; heated_enclosure 120 INR/h × curing_hours.
- Labour: cycle_time × 350 × factor (manual 1.2, semi 0.85, full 0.6).
- Amortization: (120 × yard_beds) / (24/cycle_time_hours).
- Land/yard: (45 × yard_beds) / (24/cycle_time_hours).
- Automation capex: manual 0, semi 25, full 55 per day amortized.
- Delay penalties: max(0, demould_hours - 20) × 80 × 0.5.

## 3.5 Risk Engine

- **Crack probability:** Base 0.1; +0.2 ambient curing; +0.15 North India extreme temp; +0.1 high humidity; +0.1 low mix strength.
- **Weather volatility:** climate_impact_score/100 * 1.2 (capped 1).
- **Automation failure:** manual 0.05, semi 0.15, full 0.25.
- **Cycle time risk:** >30 h → 0.4; >20 h → 0.2; else 0.
- **Overall:** 0.35×crack + 0.25×weather + 0.2×automation + 0.2×cycle.

## 3.6 Strength Prediction Engine

- **getStrengthCurveWithConfidence(params, ambientTemp, climateMultiplier):** Same maturity curve; returns points 0–48 h.
- **demouldProbabilityAt(params, hours, temp, mult):** Probability that strength ≥ 20 MPa at given hours (sigma = 0.08×s).
- **safeDemouldWindow(params, temp, mult):** Hours at which demould probability ≥ 0.95.
- **getStrengthPrediction:** curve, safe_demould_hours, demould_probability, confidence_low/high.

## 3.7 Optimization Engine (Pareto)

- **runLocalOptimization({ regionId, objective, maxScenarios, climateContext }):** Generates parameter combinations (cement × curing × automation × curing_hours × mix_strength × yard_beds). For each, runs simulation with climate. Objectives: minimize_cost, minimize_time, minimize_risk, balanced (Pareto frontier). Pareto: non-dominated points in (cost, cycle, risk). Returns scenarios with `is_frontier` flag.

---

# Part 4 — How the AI Works

## 4.1 Role of the AI (OpenAI gpt-4o-mini)

- **Does not do:** Numerical simulation (cycle time, cost, risk). Those are **deterministic** in the simulation and server engines.
- **Does do:** Strategy **ranking**, **natural-language explanation**, **caveats**, **trade-offs**, **climate note**, and **co-pilot suggestions** from the **same numbers** the engine produced.

## 4.2 Recommendation Pipeline

1. Frontend has **scenario summary**: e.g. `{ scenario_1: { cycle_time_hours, cost_per_element_inr, risk_level }, ... }`.
2. User clicks **Get AI recommendation** → `POST /api/recommend` with `scenarioSummary`, optional `constraints`, `region`.
3. **Server:**
   - If no valid `OPENAI_API_KEY`: returns **fallback** (sort by cycle then cost, static text).
   - If key present: builds a **prompt** instructing the model to output JSON with:
     - `ranked_strategies`: array of { rank, strategy_id, cycle_time_hours, cost_per_element_inr, risk_level, summary }.
     - **Copy** cycle_time_hours, cost_per_element_inr, risk_level **exactly** from the provided scenario summary (do not invent).
     - `primary_reason`, `confidence`, `caveats`.
   - Calls `openai.chat.completions.create` with **gpt-4o-mini**, temperature 0.3.
   - Parses JSON (strips markdown code blocks); on failure uses fallback structure.
4. Response is sent to client; frontend stores it and shows ranked strategies and explanation in the AI Co-pilot panel.

## 4.3 Explain Endpoint

- `POST /api/explain` with `strategyId`, `scenarioSummary`, `parameters`.
- Prompt: explain in 2–3 short sentences why this precast strategy is recommended; output JSON `{ sections: [ { heading, body } ] }`. Do not invent numbers.
- Without API key: returns static sections.

## 4.4 Co-pilot Suggest Endpoint

- `POST /api/copilot/suggest` with `scenarioSummary`, `region`, `objective`.
- Returns: `why_recommended`, `impact_summary`, `suggested_changes` (array of { parameter, suggestion, impact }).
- Used for AI-driven parameter suggestions (e.g. "Try steam for faster strength gain").

## 4.5 Anti-Hallucination Measures

- Prompt explicitly: *"Copy cycle_time_hours, cost_per_element_inr, risk_level EXACTLY from the scenario summary. Do not invent numbers."*
- All numeric comparison in the UI uses **engine data**; LLM only provides order and text.
- If LLM fails or returns invalid JSON, server returns fallback ranking and generic explanation.

---

# Part 5 — All Code Files and Their Roles

## 5.1 Repository Layout

```
CreaTech/
├── COMPLETE-PROJECT-DOCUMENTATION.md   ← This file (master reference)
├── PROJECT-DOCUMENTATION.md             ← Shorter summary + checklist
├── README.md                            ← Quick start, repo overview
├── docs/
│   ├── 01-PRODUCT-VISION.md
│   ├── 02-REACT-APP-CONCEPT.md
│   ├── 03-FEATURE-ARCHITECTURE.md
│   ├── 04-AI-ARCHITECTURE.md
│   ├── 05-TECHNICAL-ARCHITECTURE.md
│   ├── 06-UI-UX-STRATEGY.md
│   ├── 07-MVP-DOCUMENT.md
│   ├── 08-IMPACT-MODEL.md
│   └── 09-FUTURE-SCOPE.md
├── client/                              ← React SPA (Vite + TypeScript)
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── index.css
│   │   ├── vite-env.d.ts
│   │   ├── global.d.ts
│   │   ├── main.minimal.tsx
│   │   ├── types/index.ts
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   ├── constants.ts
│   │   │   ├── simulationEngine.ts
│   │   │   ├── climateEngine.ts
│   │   │   ├── costEngine.ts
│   │   │   ├── riskEngine.ts
│   │   │   ├── strengthPredictionEngine.ts
│   │   │   └── optimizationEngine.ts
│   │   ├── stores/
│   │   │   └── scenarioStore.ts
│   │   ├── hooks/
│   │   │   └── useRecommendation.ts
│   │   ├── components/
│   │   │   ├── Layout.tsx
│   │   │   ├── TopBar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── ScoreBadge.tsx
│   │   │   ├── ParameterPanel.tsx
│   │   │   ├── ScenarioComparison.tsx
│   │   │   ├── StrengthCurveChart.tsx
│   │   │   ├── AiPanel.tsx
│   │   │   ├── Yard3D.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── DemouldMeter.tsx
│   │   │   ├── RiskHeatmap.tsx
│   │   │   ├── CostBreakdownChart.tsx
│   │   └── pages/
│   │       ├── Dashboard.tsx
│   │       ├── YardPage.tsx
│   │       ├── KPIDashboard.tsx
│   │       ├── OptimizationPage.tsx
│   │       └── ScenarioLab.tsx
│   └── public/
└── server/
    ├── package.json
    ├── server.js
    ├── .env.example
    └── engines/
        ├── climateEngine.js
        ├── costEngine.js
        ├── riskEngine.js
        ├── strengthEngine.js
        └── optimizationEngine.js
```

## 5.2 Client — Entry & Config

| File | Purpose |
|------|--------|
| **index.html** | Root HTML; `#root`; loading/error handlers; loads main.tsx. |
| **main.tsx** | Entry: React StrictMode + ErrorBoundary + BrowserRouter, renders App; on catch sets window.__PRECYCLE_ERROR__. |
| **main.minimal.tsx** | Minimal entry for debugging (optional). |
| **App.tsx** | React Router: Layout wraps routes: index & /scenarios → Dashboard; /yard → YardPage; /kpi → KPIDashboard; /optimize → OptimizationPage; /lab → ScenarioLab. |
| **index.css** | Tailwind; CSS variables (surface, accent); .glass-card; scrollbar. |
| **vite-env.d.ts** | Vite client types; Window __PRECYCLE_ERROR__. |
| **global.d.ts** | R3F/Three JSX intrinsics. |
| **vite.config.ts** | React plugin; alias @ → src; proxy /api → localhost:3001. |
| **tailwind.config.js** | content; theme extend: surface, accent, fontFamily, animation. |

## 5.3 Client — Types

| File | Purpose |
|------|--------|
| **types/index.ts** | RegionId, ProjectType, CementType, CuringMethod, AutomationLevel; Region; Parameters; ScenarioResult; ScenarioWithParams; RankedStrategy; RecommendationResponse; StrengthCurvePoint; WeatherData; Season; ClimateContext; OptimizationObjective; CostBreakdown; ParetoPoint; StrengthPrediction; RiskScoreBreakdown; KPIImpact. |

## 5.4 Client — Lib (Engines & API)

| File | Purpose |
|------|--------|
| **lib/constants.ts** | REGIONS (India), CEMENT_TYPES, CURING_METHODS, AUTOMATION_LEVELS, DEFAULT_PARAMETERS. |
| **lib/api.ts** | fetchRecommendation, fetchExplain, fetchWeather, fetchRegions, fetchClimateContext, fetchOptimize, fetchCost, fetchRisk, fetchStrengthPredict, fetchKPIImpact, fetchCopilotSuggest; uses VITE_API_URL or /api. |
| **lib/simulationEngine.ts** | runSimulation(params, scenarioId, name, climateContext?) → ScenarioResult; getStrengthCurve(params, climateContext?) → StrengthCurvePoint[]; computeOptimizationScore(scenarios, bestId) → 0–100. Uses climateEngine, costEngine, riskEngine, strengthPredictionEngine. |
| **lib/climateEngine.ts** | getClimateContext(regionId, options) → ClimateContext; getClimateStrengthMultiplier(climate); getCycleTimeClimateFactor(climate). |
| **lib/costEngine.ts** | computeCostBreakdown(params, cycleTimeHours, demouldHours) → CostBreakdown & { total }. |
| **lib/riskEngine.ts** | computeRiskScore(params, climate, cycleTimeHours) → RiskScoreBreakdown; riskLevelFromScore(overall) → low/medium/high. |
| **lib/strengthPredictionEngine.ts** | getStrengthCurveWithConfidence(params, ambientTemp, climateMultiplier); hoursToDemouldStrengthClient; demouldProbabilityAt; safeDemouldWindow; getStrengthPrediction. |
| **lib/optimizationEngine.ts** | runLocalOptimization({ regionId, objective, maxScenarios, climateContext }) → OptimizationResult (scenarios as ParetoPoint[], climate_context, objective, total_generated). Pareto frontier logic. |

## 5.5 Client — State & Hooks

| File | Purpose |
|------|--------|
| **stores/scenarioStore.ts** | Zustand: parameters, scenarios, activeScenarioId, recommendation, recommendationLoading/Error, optimizationScore, aiPanelOpen. Actions: setParameters, addScenario, removeScenario, updateScenarioParams, runAllScenarios, setRecommendation/Loading/Error, setAiPanelOpen. |
| **hooks/useRecommendation.ts** | getRecommendation(): builds scenarioSummary from store, calls fetchRecommendation, updates store and optimization score; handles errors. |

## 5.6 Client — Components

| File | Purpose |
|------|--------|
| **Layout.tsx** | Shell: TopBar, Sidebar, main with Outlet, AiPanel; reads optimizationScore, aiPanelOpen, setAiPanelOpen from store. |
| **TopBar.tsx** | Logo PRECYCLE, subtitle, weather widget, AI Co-pilot button, ScoreBadge(score). |
| **Sidebar.tsx** | NavLink: Dashboard (/), Scenarios (/scenarios), Digital Twin (/yard), Optimization (/optimize), KPI Impact (/kpi), Scenario Lab (/lab). |
| **ScoreBadge.tsx** | Score 0–100 with tier color (green/amber/red); Framer Motion. |
| **ParameterPanel.tsx** | Form (react-hook-form + zod): region, project_type, cement_type, mix_strength_mpa, curing_method, curing_hours (slider), automation_level, yard_beds; onSubmit → setParameters + addScenario. |
| **ScenarioComparison.tsx** | Table of scenarios (name, cycle h, cost INR, risk); "Get AI recommendation" (useRecommendation); highlights bestId; remove per row. |
| **StrengthCurveChart.tsx** | Recharts LineChart strength_mpa vs hours for active scenario; ReferenceLine 20 MPa; data from getStrengthCurve(active.parameters). |
| **AiPanel.tsx** | Slide-over panel: primary_reason, confidence, caveats, trade_offs, climate_note from recommendation. |
| **Yard3D.tsx** | R3F Canvas; grid of beds from parameters.yard_beds; Bed mesh colored by state; OrbitControls, Grid, lights. |
| **ErrorBoundary.tsx** | Class component; getDerivedStateFromError; renders error UI on child throw. |
| **DemouldMeter.tsx** | Demould probability (circular progress) and safe demould window (hours) from getStrengthPrediction(active params, climate). |
| **RiskHeatmap.tsx** | Risk breakdown bars: overall, crack_probability, weather_volatility, automation_failure, cycle_time_risk from computeRiskScore. |
| **CostBreakdownChart.tsx** | Recharts BarChart (horizontal) of active scenario breakdown: material, curing, labour, amortization, automation_capex, land_yard, delay_penalties. |

## 5.7 Client — Pages

| File | Purpose |
|------|--------|
| **Dashboard.tsx** | Left: ParameterPanel; right: ScenarioComparison, StrengthCurveChart; optional DemouldMeter, RiskHeatmap, CostBreakdownChart. |
| **YardPage.tsx** | Instructions bar + full-height Yard3D. |
| **KPIDashboard.tsx** | KPI cards: cycle time reduction %, cost savings %, throughput increase %, energy %, CO₂ % (best vs worst scenario); traditional vs optimized summary. |
| **OptimizationPage.tsx** | Objective selector (balanced, minimize_cost, minimize_time, minimize_risk); "Generate 100+ scenarios" runs runLocalOptimization; ScatterChart cost vs cycle with Pareto frontier highlighted. |
| **ScenarioLab.tsx** | Sliders: curing hours (center), temp offset, Monte Carlo samples; runs multiple simulations with curing ± noise; ComposedChart cycle time vs curing hours with uncertainty band (min/avg/max). |

## 5.8 Server — Main & Engines

| File | Purpose |
|------|--------|
| **server.js** | Express app; CORS; JSON body; dotenv. Routes: GET /api/regions; POST /api/recommend (OpenAI or fallback); POST /api/copilot/suggest; POST /api/explain; GET /api/weather (Open-Meteo live or mock); GET /api/climate; POST /api/climate/context; POST /api/optimize (runOptimization); POST /api/cost; POST /api/risk; POST /api/strength-predict; POST /api/kpi-impact. Listens PORT (default 3001). |
| **engines/climateEngine.js** | getClimateContext(regionId, options); getClimateStrengthMultiplier; getCycleTimeClimateFactor. |
| **engines/costEngine.js** | computeCostBreakdown(params, cycle_time_hours, demould_hours). |
| **engines/riskEngine.js** | computeRiskScore(params, climate, cycle_time_hours); riskLevelFromScore. |
| **engines/strengthEngine.js** | getStrengthCurveWithConfidence; hoursToDemouldStrength; demouldProbabilityAt; safeDemouldWindow. |
| **engines/optimizationEngine.js** | runOptimization({ regionId, objective, maxScenarios, constraints, weather, season }); parameter combinations; Pareto frontier. |

---

# Part 6 — API Specification (All Endpoints)

| Method | Path | Request | Response |
|--------|------|---------|----------|
| GET | /api/regions | — | Array of { id, label, temp_range, humidity_range } |
| POST | /api/recommend | { scenarioSummary, constraints?, region? } | { recommendation: { ranked_strategies, primary_reason, confidence, caveats }, explanation?: { factors, trade_offs, climate_note } } |
| POST | /api/copilot/suggest | { scenarioSummary?, region?, objective? } | { why_recommended, impact_summary, suggested_changes: [{ parameter, suggestion, impact }] } |
| POST | /api/explain | { strategyId, scenarioSummary?, parameters? } | { sections: [ { heading, body } ] } |
| GET | /api/weather | ?lat=&lon=&live=1 | { temp, humidity, conditions, risk, rainfall?, wind_kmh?, source } |
| GET | /api/climate | ?region=&season= | ClimateContext |
| POST | /api/climate/context | { regionId, weather?, season?, useLiveWeather? } | ClimateContext |
| POST | /api/optimize | { regionId, objective, maxScenarios, constraints?, weather?, season? } | { scenarios (ParetoPoint[]), climate_context, objective, total_generated } |
| POST | /api/cost | { params, cycle_time_hours?, demould_hours? } | CostBreakdown & { total } |
| POST | /api/risk | { params, climate?, cycle_time_hours? } | RiskScoreBreakdown & { risk_level } |
| POST | /api/strength-predict | { params, ambient_temp?, climate_multiplier?, hours? } | { curve, safe_demould_hours, demould_probability, hours_to_20mpa } |
| POST | /api/kpi-impact | { traditional: { cycle_time_hours, cost_per_element_inr }, optimized } | KPIImpact (cycle_time_reduction_pct, cost_savings_pct, throughput_increase_pct, etc.) |

---

# Part 7 — Implemented Features Summary

| Feature | Status | Location |
|--------|--------|----------|
| Parameter form (region, project type, cement, mix, curing, automation, beds) | ✅ | ParameterPanel.tsx |
| Run scenario (add scenario with current params) | ✅ | scenarioStore.addScenario, runSimulation |
| Scenario comparison table (cycle h, cost INR, risk) | ✅ | ScenarioComparison.tsx |
| Remove scenario | ✅ | scenarioStore.removeScenario |
| Get AI recommendation (ranked + explanation) | ✅ | useRecommendation, POST /api/recommend |
| AI Co-pilot panel (Why, caveats, trade-offs, climate note) | ✅ | AiPanel.tsx |
| Optimization score (0–100) | ✅ | computeOptimizationScore, ScoreBadge.tsx |
| Strength gain curve chart | ✅ | StrengthCurveChart.tsx, getStrengthCurve |
| 3D yard view (beds, states, orbit) | ✅ | Yard3D.tsx, YardPage |
| Regions API (Indian regions + climate presets) | ✅ | GET /api/regions |
| Weather API (mock + live Open-Meteo with ?live=1) | ✅ | GET /api/weather |
| Fallback when no OpenAI key | ✅ | server.js /api/recommend, /api/explain, /api/copilot/suggest |
| Climate context (region + season + live weather) | ✅ | climateEngine, GET/POST /api/climate |
| Cost breakdown (extended: material, curing, labour, amortization, automation_capex, land_yard, delay_penalties) | ✅ | costEngine, CostBreakdownChart.tsx |
| Risk breakdown (overall, crack, weather, automation, cycle) | ✅ | riskEngine, RiskHeatmap.tsx |
| Demould probability & safe window | ✅ | strengthPredictionEngine, DemouldMeter.tsx |
| KPI Impact dashboard (cycle reduction, cost savings, throughput, energy, CO₂) | ✅ | KPIDashboard.tsx, POST /api/kpi-impact |
| Multi-objective optimization (Pareto, 100+ scenarios) | ✅ | optimizationEngine, OptimizationPage.tsx, POST /api/optimize |
| Scenario Lab (Monte Carlo, curing/temp sensitivity, uncertainty band) | ✅ | ScenarioLab.tsx |
| Co-pilot suggest (AI parameter suggestions) | ✅ | POST /api/copilot/suggest, api.ts fetchCopilotSuggest |
| Error boundary & load error display | ✅ | ErrorBoundary.tsx, index.html, main.tsx |

---

# Part 8 — Technical Stack

## Frontend

- **React 18**, **Vite**, **TypeScript**
- **Tailwind CSS** (custom surface/accent theme)
- **Framer Motion** (ScoreBadge, cards, DemouldMeter, RiskHeatmap, etc.)
- **React Three Fiber** + **Three.js** + **Drei** (3D yard)
- **Recharts** (strength curve, cost breakdown bar, scatter, composed chart)
- **Zustand** (scenarioStore)
- **React Hook Form** + **Zod** (parameter form)
- **React Router** (Dashboard, Yard, KPI, Optimization, Scenario Lab)

## Backend

- **Node.js**, **Express**
- **OpenAI** SDK (gpt-4o-mini)
- **dotenv** (OPENAI_API_KEY, PORT)
- **Server engines:** climateEngine, costEngine, riskEngine, strengthEngine, optimizationEngine (JS)

---

# Part 9 — UI/UX (Implemented)

- **Theme:** Dark industrial (#0f1419, #1a1f26); teal/cyan accents; amber for alerts/score.
- **Layout:** Top bar (PRECYCLE, weather, AI Co-pilot, score); sidebar (Dashboard, Scenarios, Digital Twin, Optimization, KPI Impact, Scenario Lab); main content; right AI panel (slide-over).
- **Dashboard:** Parameter panel (left), scenario table + strength curve + optional DemouldMeter, RiskHeatmap, CostBreakdownChart.
- **3D Yard:** Full-screen R3F canvas; beds colored by state; orbit/zoom.
- **AI Co-pilot:** Slide-over panel with reason, confidence, caveats, trade-offs, climate note.
- **Optimization score:** Single 0–100 badge with color tier (green/amber/red).

---

# Part 10 — Measurable Impact (From Docs)

- **Cycle time reduction %:** (1 - optimized_cycle / baseline_cycle) × 100.
- **Throughput:** 24 / cycle_time_hours per bed per day.
- **Example (24 beds, North India):** Baseline 24 h, 3800 INR; optimized 18 h, 4200 INR → 25% cycle reduction, 33% throughput gain; extra ~2,920 elements/year with same beds; ROI illustration with margin and payback.
- **Carbon:** Shorter curing (e.g. less steam) → lower energy and CO₂; formula and example in docs/08-IMPACT-MODEL.md.

---

# Part 11 — Future Scope (Post-Hackathon)

- **IoT:** Temp/humidity sensors in yard → live curing conditions and closed-loop improvement.
- **Edge:** Local devices for "ready to strip?" and sync to cloud.
- **Reinforcement learning:** Policy from historical outcomes; yard-specific recommendations.
- **SaaS:** Free → Starter → Professional → Enterprise (per yard/month); pilots and partnerships in India.
- **More features:** Full Monte Carlo (server-side), delay alerts (push/email), report export (PDF/Excel), multi-yard comparison, templates, localization, mobile.

---

# Part 12 — How to Run the Project

1. **Server**
   - `cd server`
   - Copy `.env.example` to `.env`, set `OPENAI_API_KEY` (optional).
   - `npm install && npm run dev`
   - API at **http://localhost:3001**

2. **Client**
   - `cd client`
   - `npm install && npm run dev`
   - App at **http://localhost:5173** (proxies `/api` to 3001)

3. **Production build**
   - Client: `npm run build` (output in client/dist).
   - Set `VITE_API_URL` to your API base URL if not same origin.

---

# Part 13 — Environment Variables

| Variable | Where | Purpose |
|----------|--------|---------|
| OPENAI_API_KEY | server/.env | OpenAI API key for gpt-4o-mini; omit for fallback. |
| PORT | server/.env | API port (default 3001). |
| VITE_API_URL | client/.env | API base URL when not using dev proxy (e.g. production). |

---

# Part 14 — Database (Post-MVP)

No database in MVP; state is in-memory (Zustand). For persistence and multi-user:

- **users** (id, email, name, created_at)
- **yards** (id, user_id, name, region, project_type, created_at)
- **parameter_sets** (id, yard_id, name, parameters JSONB, created_at)
- **scenarios** (id, parameter_set_id, name, scenario_index, results JSONB, created_at)
- **recommendations** (id, scenario_run_id, ranked_strategies JSONB, explanation JSONB, created_at)

---

# Part 15 — Summary Checklist

- [x] Problem statement (CreaTech) documented
- [x] Product name, pitch, positioning
- [x] End-to-end working logic (parameters → simulation → scenarios → AI recommendation → UI)
- [x] All implemented features listed (including KPI, Optimization, Scenario Lab, climate, cost/risk/demould)
- [x] Simulation, climate, cost, risk, strength, optimization engine logic
- [x] AI role, pipeline, prompts, anti-hallucination
- [x] Every project code file and its role (client + server + engines)
- [x] API specification (all endpoints)
- [x] Tech stack and data flow
- [x] UI/UX summary
- [x] Impact model and future scope
- [x] Run instructions and environment variables
- [x] Database schema (post-MVP)

This document is the single source of truth for what PRECYCLE is, what problem it solves, how it works, how the AI is used, and where every part of the codebase lives.
