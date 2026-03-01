# 4️⃣ AI Architecture (OpenAI Mini Model API)

**Full AI pipeline, prompts, and anti-hallucination details: [COMPLETE-PROJECT-DOCUMENTATION.md](../COMPLETE-PROJECT-DOCUMENTATION.md) Part 4.**

## How the OpenAI Mini Model Will Be Used

- **Role:** Strategy synthesis, natural-language explanation, risk narrative, and structured recommendations — **not** numerical simulation (that stays deterministic).
- **Use cases:**
  1. **Parameter extraction:** Free-text or semi-structured input → normalized parameter JSON.
  2. **Strategy recommendation:** Scenario summary + constraints → ranked strategies with rationale and confidence.
  3. **Explainability:** Strategy + inputs → "Why this?" and "What drives cycle time?" in sections.
  4. **Cost–benefit explanation:** Numbers from cost model → short narrative (e.g. "Heating adds 12% cost but cuts cycle by 18%").
  5. **Climate risk assessment:** Region + strategy + optional weather → risk summary and mitigation hints.

- **Model:** Use `gpt-4o-mini` (or current "mini" class) for low latency and cost; reserve a larger model only for complex multi-turn explainability if needed.

---

## Prompt Engineering Strategy

1. **System prompt:** Define role ("Precast cycle-time expert for Indian infrastructure and building projects"), output format (JSON when needed), and guardrails (no fabrication of numbers; only explain provided data).
2. **Structured output:** Prefer `response_format: { type: "json_schema", json_schema: ... }` or clear JSON blocks in the prompt so parsing is reliable.
3. **Few-shot:** Include 1–2 example input/output pairs for extraction and recommendation to stabilize structure.
4. **Delimiters:** Use clear section markers (e.g. `## SCENARIOS`, `## RECOMMENDATION`) so we can split and validate.
5. **Length limits:** Cap explanation length (e.g. 2–3 short paragraphs) to avoid drift and token waste.
6. **Temperature:** Use low (0.2–0.4) for extraction and recommendation; slightly higher (0.5) only for narrative explanation if desired.

---

## Structured Output Schema

### Recommendation Response (from engine + LLM)

```json
{
  "recommendation": {
    "ranked_strategies": [
      {
        "rank": 1,
        "strategy_id": "scenario_2",
        "cycle_time_hours": 18,
        "cost_per_element_inr": 4200,
        "risk_level": "low",
        "summary": "OPC with 12h steam curing and semi-automation balances cost and speed."
      }
    ],
    "primary_reason": "Best trade-off between cycle time and cost for your region.",
    "confidence": 0.85,
    "caveats": ["Assumes steam boiler capacity available."]
  },
  "explanation": {
    "factors": ["curing_method", "cement_type", "automation"],
    "trade_offs": "Faster cycle with steam increases energy cost; OPC is cheaper than PPC for this strength class.",
    "climate_note": "Current region (North India) supports 12h cycle without winter heating."
  }
}
```

### Parameter Extraction Response

```json
{
  "parameters": {
    "region": "North India",
    "project_type": "infrastructure",
    "cement_type": "OPC 53",
    "mix_design_strength_mpa": 45,
    "curing_method": "steam",
    "curing_hours": 12,
    "automation_level": "semi",
    "ambient_temp_range_c": [8, 42],
    "yard_beds": 24,
    "element_types": ["beam", "slab"]
  },
  "extraction_confidence": 0.9,
  "missing_or_inferred": ["ambient_temp_range_c inferred from region"]
}
```

### Explainability Response (per strategy)

```json
{
  "strategy_id": "scenario_2",
  "sections": [
    {
      "heading": "Why this strategy",
      "body": "Steam curing at 12h reaches demould strength reliably in your climate. OPC 53 keeps material cost lower than PPC while meeting 45 MPa."
    },
    {
      "heading": "Main drivers",
      "body": "Cycle time is dominated by curing (12h). Stripping and reset add ~2h. Semi-automation reduces labour time by ~20% vs manual."
    }
  ],
  "warnings": []
}
```

---

## Multi-Step Reasoning Pipeline

1. **User input** → Form or text → **Parameter extraction** (LLM or form-only) → normalized `parameters`.
2. **Parameters** → **Deterministic engine** → cycle time, cost, risk score per scenario.
3. **Scenario summary** (cycle, cost, risk) + **constraints** → **LLM recommendation** → `ranked_strategies` + `explanation`.
4. **Selected strategy** → **LLM explainability** → "Why this?" sections (optional, can be merged with step 3).
5. **Cost model output** → **LLM cost–benefit** → short narrative (optional).
6. **Region + strategy** → **LLM climate risk** → risk summary + mitigation (optional).

All numerical outputs (cycle time, cost, percentiles) come from the engine; LLM only interprets and explains.

---

## Combining Deterministic Calculations + LLM Reasoning

- **Deterministic:** Strength gain (maturity/equivalent age), demould time, cycle time formula, cost per element, risk score formula. Implement in JS/TS; same inputs always give same numbers.
- **LLM:** Consumes these numbers and metadata (region, project type, scenario names) and produces:
  - Ranking and rationale
  - Plain-language explanation
  - Caveats and climate notes
- **Contract:** Engine returns a **scenario summary** object; that exact object (or a strict subset) is passed to the LLM. LLM is instructed: "Do not invent numbers; only use the figures in the scenario summary."

---

## Preventing Hallucinations

1. **No numbers from LLM:** Recommendation prompt states: "Output only reasoning and ranking. All cycle_time_hours, cost_per_element_inr, and risk_level must be copied from the scenario summary provided; do not generate new values."
2. **Structured merge:** Backend merges `ranked_strategies` from LLM (order + summary text) with engine-generated `cycle_time_hours`, `cost_per_element_inr`, `risk_level` by `strategy_id`.
3. **Validation:** Schema validate LLM JSON; reject or retry if required fields missing or types wrong.
4. **Fallback:** If LLM fails or returns invalid JSON, show engine-only ranking (e.g. by cycle time or cost) and a generic "Explanation unavailable" message.
5. **Audit:** Log prompt and response (without PII) for debugging and prompt iteration.

---

## Fine-Tuned Prompt Templates

### Mix Design Optimization (Explanation)

**System:** You are a precast mix-design expert. Explain in 2–3 short sentences why the given mix and curing choice is appropriate for the target strength and region. Do not invent numbers.

**User:**
```
Region: North India. Target strength: 45 MPa. Mix: OPC 53, w/c 0.42. Curing: steam 12h.
Engine output: cycle_time 18h, demould_strength_achieved 48 MPa.
```
**Expected:** Short explanation tying OPC 53 + steam to fast strength gain and suitability for North India; mention demould strength achieved.

---

### Climate Risk Assessment

**System:** You are a precast operations expert for India. Given region and strategy, list 1–3 climate-related risks and one mitigation each. Be concise. Do not invent numbers.

**User:**
```
Region: Chennai (humid, high temp). Strategy: steam curing 12h, OPC 53.
```
**Expected:** e.g. "High ambient temp can accelerate setting; mitigate with shade and mix temperature control." "Humidity supports curing but watch formwork corrosion; mitigate with regular inspection."

---

### Cost–Benefit Explanation

**System:** You explain cost–benefit in one short paragraph for precast managers. Use only the numbers provided. Do not add new figures.

**User:**
```
Scenario A: cycle 24h, cost per element INR 3800. Scenario B: cycle 18h, cost per element INR 4200. Difference: 6h faster, INR 400 more per element.
```
**Expected:** e.g. "Scenario B saves 6 hours per cycle at INR 400 more per element. If your yard runs 2 cycles per day, the extra throughput may justify the higher cost per element."

---

### Strategy Recommendation

**System:** You recommend the best precast cycle-time strategy from the given scenarios. Output valid JSON only. Rank by best balance of cycle time, cost, and risk unless the user specifies otherwise. Do not invent cycle_time_hours, cost_per_element_inr, or risk_level; copy them from the scenario summary. Include a short primary_reason and optional caveats.

**User:**
```
Scenarios:
- scenario_1: cycle_time_hours 24, cost_per_element_inr 3800, risk_level "low"
- scenario_2: cycle_time_hours 18, cost_per_element_inr 4200, risk_level "low"
- scenario_3: cycle_time_hours 14, cost_per_element_inr 5100, risk_level "medium"
Constraints: Prefer cost-efficient; max risk "low".
```
**Expected:** JSON with ranked_strategies (e.g. 1. scenario_1, 2. scenario_2, 3. scenario_3), primary_reason, confidence, caveats; all numbers copied from input.

---

## Example Prompts and Example Structured JSON Responses

### Recommendation request (abbreviated)

```text
You are PRECYCLE's recommendation engine. Given the scenario summary below, output a JSON object with:
- ranked_strategies: array of { rank, strategy_id, cycle_time_hours, cost_per_element_inr, risk_level, summary }.
  Copy cycle_time_hours, cost_per_element_inr, risk_level exactly from the scenario summary.
- primary_reason: one sentence.
- confidence: 0–1.
- caveats: optional string array.

Scenario summary:
{ "scenario_1": { "cycle_time_hours": 24, "cost_per_element_inr": 3800, "risk_level": "low" }, ... }
```

### Example response

```json
{
  "ranked_strategies": [
    { "rank": 1, "strategy_id": "scenario_2", "cycle_time_hours": 18, "cost_per_element_inr": 4200, "risk_level": "low", "summary": "Best balance of speed and cost." },
    { "rank": 2, "strategy_id": "scenario_1", "cycle_time_hours": 24, "cost_per_element_inr": 3800, "risk_level": "low", "summary": "Lowest cost, longer cycle." },
    { "rank": 3, "strategy_id": "scenario_3", "cycle_time_hours": 14, "cost_per_element_inr": 5100, "risk_level": "medium", "summary": "Fastest but higher cost and risk." }
  ],
  "primary_reason": "Scenario 2 offers the best cycle-time reduction with acceptable cost and low risk.",
  "confidence": 0.85,
  "caveats": []
}
```

---

## Summary

- **Mini model:** Used for extraction, recommendation, explainability, climate risk, and cost–benefit narrative; not for core math.
- **Structured output:** JSON schemas or strict JSON blocks; validate and merge with engine data.
- **Pipeline:** Parameters → deterministic engine → scenario summary → LLM → ranked strategies + explanation; numbers always from engine.
- **Hallucination control:** "Copy, don’t invent" in prompts; merge engine numbers with LLM order/text; validation and fallback.
- **Templates:** Mix explanation, climate risk, cost–benefit, strategy recommendation with example prompts and responses.
