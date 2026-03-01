# PRECYCLE — Project Documentation (Summary)

**For the full, exhaustive reference see [COMPLETE-PROJECT-DOCUMENTATION.md](./COMPLETE-PROJECT-DOCUMENTATION.md).** This file is a short summary and checklist.

---

## Problem Statement (CreaTech)

Design an **AI-powered system** that identifies key parameters, evaluates combinations with cost implications, and recommends the most efficient cycle-time strategy for precast yards across **Infrastructure** and **Building** projects **in India**.

---

## Product

- **Name:** PRECYCLE — *Precast Cycle Intelligence Engine*
- **Pitch:** AI-powered cycle time + cost optimization + scenario simulation + explainability for precast yards in India.
- **App type:** Yard Intelligence Platform + AI Simulation Engine + Lightweight Digital Twin (3D yard).

---

## Working Logic (Brief)

1. User sets **parameters** (region, project type, cement, mix, curing, automation, beds) → **Run scenario**.
2. **Simulation engine** (client): strength gain (maturity-style) → demould hours; + strip/reset → **cycle_time_hours**; **cost** (material, curing, labour, amortization, etc.); **risk** (crack, weather, automation, cycle).
3. Multiple **scenarios** → **Get AI recommendation** → backend calls **gpt-4o-mini** (or fallback) → **ranked strategies** + explanation.
4. **AI Co-pilot** shows primary_reason, caveats, trade_offs, climate_note.
5. **Strength curve**, **DemouldMeter**, **RiskHeatmap**, **CostBreakdownChart** for active scenario.
6. **3D Yard** = beds by state; **KPI Impact** = best vs worst; **Optimization** = Pareto 100+ scenarios; **Scenario Lab** = Monte Carlo sensitivity.

---

## Implemented Features

| Feature | Where |
|--------|--------|
| Parameter form, run scenario, scenario table, remove scenario | ParameterPanel, scenarioStore, ScenarioComparison |
| Get AI recommendation, AI Co-pilot panel | useRecommendation, AiPanel, POST /api/recommend |
| Optimization score | computeOptimizationScore, ScoreBadge |
| Strength curve | StrengthCurveChart, getStrengthCurve |
| 3D yard | Yard3D, YardPage |
| Regions, weather (mock + live Open-Meteo) | GET /api/regions, GET /api/weather |
| Climate context | climateEngine, GET/POST /api/climate |
| Cost breakdown (extended) | costEngine, CostBreakdownChart |
| Risk breakdown | riskEngine, RiskHeatmap |
| Demould probability & safe window | strengthPredictionEngine, DemouldMeter |
| KPI Impact dashboard | KPIDashboard, POST /api/kpi-impact |
| Multi-objective optimization (Pareto) | optimizationEngine, OptimizationPage, POST /api/optimize |
| Scenario Lab (Monte Carlo) | ScenarioLab |
| Co-pilot suggest | POST /api/copilot/suggest |

---

## Routes

| Path | Page |
|------|------|
| /, /scenarios | Dashboard |
| /yard | YardPage (3D) |
| /kpi | KPIDashboard |
| /optimize | OptimizationPage |
| /lab | ScenarioLab |

---

## API Endpoints

- **GET** /api/regions  
- **POST** /api/recommend — scenarioSummary → ranked strategies + explanation  
- **POST** /api/copilot/suggest — scenarioSummary, region, objective → why_recommended, suggested_changes  
- **POST** /api/explain — strategyId, scenarioSummary, parameters → sections  
- **GET** /api/weather — ?lat=&lon=&live=1  
- **GET** /api/climate, **POST** /api/climate/context  
- **POST** /api/optimize — regionId, objective, maxScenarios, constraints, weather, season  
- **POST** /api/cost, **POST** /api/risk, **POST** /api/strength-predict, **POST** /api/kpi-impact  

---

## Codebase (Key Paths)

- **Client:** `client/src/` — App.tsx (routes), types/index.ts, lib/ (api, constants, simulationEngine, climateEngine, costEngine, riskEngine, strengthPredictionEngine, optimizationEngine), stores/scenarioStore, hooks/useRecommendation, components/ (Layout, TopBar, Sidebar, ParameterPanel, ScenarioComparison, StrengthCurveChart, AiPanel, Yard3D, DemouldMeter, RiskHeatmap, CostBreakdownChart, ErrorBoundary), pages/ (Dashboard, YardPage, KPIDashboard, OptimizationPage, ScenarioLab).
- **Server:** `server/server.js`, `server/engines/` (climateEngine, costEngine, riskEngine, strengthEngine, optimizationEngine).

---

## AI (OpenAI gpt-4o-mini)

- **Role:** Ranking and natural-language explanation only; **no** numerical simulation (engine is deterministic).
- **Pipeline:** scenarioSummary → POST /api/recommend → prompt “copy numbers exactly” → JSON ranked_strategies + primary_reason, caveats.
- **Anti-hallucination:** Prompt instructs copy; fallback if no key or parse failure.

---

## Run

1. **Server:** `cd server` → `.env` with OPENAI_API_KEY (optional) → `npm install && npm run dev` (port 3001).
2. **Client:** `cd client` → `npm install && npm run dev` (port 5173, proxy /api to 3001).

---

## Docs Index

- **COMPLETE-PROJECT-DOCUMENTATION.md** — Full reference (problem, logic, features, every file, AI, API, future).
- **docs/01–09** — Product vision, React concept, feature architecture, AI architecture, technical architecture, UI/UX, MVP, impact model, future scope.
- **README.md** — Quick start and repo overview.

---

## Checklist

- [x] Problem statement  
- [x] Product vision  
- [x] Working logic  
- [x] Implemented features  
- [x] All code files (see COMPLETE-PROJECT-DOCUMENTATION.md)  
- [x] AI pipeline & anti-hallucination  
- [x] API spec  
- [x] Run instructions  
- [x] Future scope (IoT, edge, RL, SaaS)
