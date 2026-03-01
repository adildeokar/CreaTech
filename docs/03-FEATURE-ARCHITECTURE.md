# 3️⃣ Complete Feature Architecture

## Core Features

### 1. AI Parameter Extraction
- **Input:** Raw project context (region, project type, element types, current practices).
- **Output:** Structured parameters for simulation: mix class, cement type, curing method, automation level, ambient temp range, humidity, yard size, bed count.
- **Implementation:** Form + optional file upload (e.g. CSV) → normalization → LLM or rule-based extraction into a single parameter JSON consumed by the engine.

### 2. Cycle-Time Optimization Engine
- **Input:** Parameter set (mix, curing, automation, climate).
- **Output:** Predicted cycle time (hours/days) per element type, with confidence band.
- **Logic:** Maturity/equivalent-age model for strength gain; lookup or formula for demould strength; fixed steps for stripping, cleaning, setup. Fully deterministic for reproducibility.

### 3. Scenario Simulation
- **Input:** Base scenario + user-tweakable sliders (e.g. cement type, curing hours, automation level).
- **Output:** Multiple scenarios with cycle time, cost delta, and risk score; side-by-side comparison table and optional charts.
- **UI:** "What if" sliders; add/remove scenarios; save and name scenarios.

### 4. Cost Modeling
- **Input:** Scenario parameters + regional rates (material, labour, energy, capex amortization).
- **Output:** Cost per element, cost per cycle, total yard cost; breakdown by category.
- **Logic:** Parametric model (e.g. cost per m³ concrete, per curing hour, per bed) with India region presets and overridable rates.

### 5. Climate-Aware Modeling
- **Input:** Region (or lat/long), date range, optional real-time weather API.
- **Output:** Effective curing conditions (temp, humidity), risk flags (heat wave, rain), and adjusted cycle time / risk score.
- **Implementation:** Region → typical climate band; optional Open-Meteo/IMD API for live data; simple adjustment factors in the engine.

### 6. Recommendation Engine
- **Input:** All scenarios + constraints (max cost, min throughput, risk tolerance).
- **Output:** Ranked list of strategies with: recommended strategy, cycle time, cost, risk, and short rationale.
- **AI layer:** OpenAI mini consumes scenario summary + constraints → structured JSON (ranked strategies, reasoning, confidence). Combined with deterministic scores for final ranking.

---

## Advanced Features (Hackathon-Winning Edge)

### 7. Real-Time Weather API Integration
- **Purpose:** Replace static climate with live temp/humidity/rain for the yard location.
- **Implementation:** Open-Meteo or IMD API; optional "Use live weather" toggle; cache for 15–60 min to limit calls.
- **UI:** Small weather widget on dashboard; "Weather risk" badge on scenarios.

### 8. AI Explainability Engine
- **Purpose:** Answer "Why this strategy?" and "What drives cycle time here?" in plain language.
- **Implementation:** Dedicated prompts (strategy explanation, factor importance, trade-offs) with structured output (sections, bullet points). Expose in collapsible cards next to each recommendation.

### 9. 3D Yard Simulation View
- **Purpose:** Visual differentiation; show beds, cycle state (casting, curing, stripping), and optional heatmap (utilization or risk).
- **Implementation:** Three.js or React Three Fiber; simplified geometry (grid of beds); colour or overlay for state/score; camera controls and optional zoom to bed.

### 10. Predictive Delay Alerts
- **Purpose:** "If you follow current plan, delay risk is X% due to weather/mix."
- **Implementation:** Engine runs "current" scenario with weather; threshold on risk score or cycle extension → alert banner or notification with suggested mitigation.

### 11. Monte Carlo Simulation
- **Purpose:** Uncertainty in strength gain, weather, or labour → distribution of cycle time and cost (e.g. P50, P90).
- **Implementation:** Run N (e.g. 500) samples with perturbed inputs; aggregate cycle time and cost; show histogram or percentile bands in UI.

### 12. Strength Gain Prediction Curve Visualization
- **Purpose:** Show engineers the predicted strength vs time curve for the selected mix/curing.
- **Implementation:** Maturity model or simplified curve (e.g. logarithmic); chart (e.g. Recharts) with target demould strength line and confidence band.

### 13. "What If" Slider Controls
- **Purpose:** Real-time exploration without re-running full simulation on every change (where possible).
- **Implementation:** Sliders for key levers (curing hours, cement type, automation level); debounced run of engine; update comparison table and charts; optional "Lock and compare" to freeze a scenario.

### 14. Gamified Optimization Score
- **Purpose:** Single number that judges and users remember: "Yard efficiency score 87/100."
- **Implementation:** Composite score from cycle time (vs baseline), cost efficiency, utilization, risk. Display prominently with trend and breakdown (e.g. "Cycle +30, Cost +25, Risk +20, Utilization +12").

---

## Feature Prioritization (MVP vs Post-MVP)

| Feature | MVP (2–3 weeks) | Post-MVP | Implemented |
|--------|-------------------|----------|-------------|
| AI parameter extraction | ✅ Form + basic extraction | File upload, templates | ✅ Form (ParameterPanel) |
| Cycle-time engine | ✅ Core logic | More mix/cement types | ✅ simulationEngine + climate |
| Scenario simulation | ✅ 2–3 scenarios, sliders | N scenarios, save/load | ✅ scenarioStore, ScenarioComparison |
| Cost modeling | ✅ Regional presets | Full custom rates | ✅ costEngine (extended breakdown) |
| Climate-aware modeling | ✅ Region + static band | Live weather API | ✅ climateEngine, GET/POST /api/climate |
| Recommendation engine | ✅ Ranked list + rationale | Constraints, preferences | ✅ /api/recommend, AiPanel |
| Weather API | ✅ Optional widget | Full integration in engine | ✅ /api/weather (mock + Open-Meteo live) |
| AI explainability | ✅ Per-strategy explanation | Multi-turn Q&A | ✅ /api/explain, AiPanel |
| 3D yard view | ✅ Simple grid + state | Heatmap, zoom, annotations | ✅ Yard3D, YardPage |
| Delay alerts | ✅ Risk badge + banner | Push, email | ✅ RiskHeatmap, risk engine |
| Monte Carlo | 🔲 | ✅ | ✅ Scenario Lab (client-side sensitivity) |
| Strength curve chart | ✅ | Enhance with confidence | ✅ StrengthCurveChart, strengthPredictionEngine |
| What-if sliders | ✅ | More levers, presets | ✅ ParameterPanel curing slider |
| Optimization score | ✅ | Historical trend, benchmarks | ✅ ScoreBadge, computeOptimizationScore |
| Cost breakdown chart | — | — | ✅ CostBreakdownChart, costEngine |
| Demould probability & safe window | — | — | ✅ DemouldMeter, strengthPredictionEngine |
| KPI Impact dashboard | — | — | ✅ KPIDashboard, /api/kpi-impact |
| Multi-objective (Pareto) optimization | — | — | ✅ OptimizationPage, optimizationEngine, /api/optimize |
| Co-pilot suggest | — | — | ✅ /api/copilot/suggest |

---

## Summary

- **Core:** Parameter extraction, cycle-time engine, scenario simulation, cost model, climate-aware logic, recommendation engine.
- **Advanced:** Weather API, explainability, 3D yard, delay alerts, Monte Carlo (Scenario Lab), strength curve, sliders, optimization score, cost breakdown, demould meter, risk heatmap, KPI Impact, Pareto optimization, co-pilot suggest.
- **MVP:** Focus on core + sliders + 3D + score + explainability + optional weather; full server-side Monte Carlo in post-MVP.
- **Implemented:** See COMPLETE-PROJECT-DOCUMENTATION.md for every file and API.
