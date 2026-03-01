# 8️⃣ Measurable Impact Model

## How Efficiency Gains Will Be Calculated

### 1. Cycle Time Reduction (%)

- **Baseline:** Current or default scenario cycle time (e.g. 24 h) from user input or regional default.
- **Optimized:** Recommended scenario cycle time (e.g. 18 h) from PRECYCLE.
- **Formula:** `Cycle time reduction % = (1 - optimized_cycle / baseline_cycle) × 100`.
- **Example:** (1 - 18/24) × 100 = **25% cycle time reduction**.

### 2. Throughput Increase (elements per day)

- **Formula:** `Throughput = 24 / cycle_time_hours` (single bed, one element per cycle). For N beds: `N × (24 / cycle_time_hours)`.
- **Baseline throughput:** `24 / 24 = 1` element/bed/day; **Optimized:** `24 / 18 ≈ 1.33` element/bed/day.
- **Gain:** `(1.33 - 1) / 1 = 33%` more elements per bed per day (same yard size).

### 3. Yard Size Equivalence (beds saved)

- **Question:** "To produce the same number of elements per day with the baseline cycle, how many beds would I need?"
- **Formula:** `Beds_equivalent_baseline = target_daily_elements / (24 / baseline_cycle)`; with optimized cycle, `Beds_needed_optimized = target_daily_elements / (24 / optimized_cycle)`.
- **Beds saved:** `Beds_equivalent_baseline - Beds_needed_optimized` (can be negative if optimizing for cost with slightly longer cycle).
- **Example:** Target 48 elements/day. Baseline 24 h → need 48 beds. Optimized 18 h → need 36 beds. **12 beds saved** (25% yard size reduction for same output).

### 4. Cost Impact (INR per element and total)

- **Per element:** `Delta cost = optimized_cost_per_element - baseline_cost_per_element`. Can be negative (saving) or positive (faster but costlier).
- **Total project:** `Total delta = delta_cost × total_elements`. Compare with **savings from earlier delivery** (e.g. reduced overhead, penalty avoidance) to get net benefit.
- **ROI (simplified):** `ROI = (savings from cycle reduction - extra cost from strategy) / extra cost`. Example: If faster strategy costs INR 400 more per element but saves 10 days on project (e.g. INR 2L/day overhead), for 500 elements: extra cost INR 2L, savings 10 × 2L = 20L → net benefit 18L.

### 5. Risk-Adjusted Choice

- **Metric:** Share of decisions that choose a "low risk" strategy when available; or reduction in delay incidents (post-MVP with real data). For MVP: report "Risk level" of chosen strategy and compare to baseline.

### 6. Carbon Reduction Potential (optional)

- **Logic:** Shorter cycle → fewer curing hours → less energy (e.g. steam). `Carbon_saved = (baseline_curing_hours - optimized_curing_hours) × energy_per_hour × carbon_factor × cycles_per_year`.
- **Example:** 2 h less steam per cycle, 300 cycles/year, 50 kg CO2/h steam → **30 tCO2/year** per bed (illustrative; use project-specific factors).

---

## Example Numbers for a Precast Yard in India

### Assumptions (illustrative)

- **Yard:** 24 beds, North India, infrastructure (bridge elements).
- **Baseline:** OPC 53, normal curing 24 h, manual stripping; cycle **24 h**; cost **INR 3,800** per element.
- **Optimized (PRECYCLE recommended):** OPC 53, steam curing 12 h, semi-automation; cycle **18 h**; cost **INR 4,200** per element.

### Calculated impact

| Metric | Value |
|--------|--------|
| Cycle time reduction | (1 - 18/24) × 100 = **25%** |
| Throughput increase (per bed/day) | (24/18 - 24/24) / (24/24) = **33%** |
| Elements per day (24 beds) | Baseline 24; Optimized 32 |
| Extra cost per element | INR 4,200 - 3,800 = **INR 400** |
| Beds needed for 32 elements/day at baseline | 32 beds → **8 beds "saved"** vs 24-bed yard doing 32/day with optimized cycle |

### Project-level (annual, 24 beds)

- **Elements/year (baseline):** 24 × (365/1) ≈ 8,760 (assuming 1 cycle/day).
- **Elements/year (optimized):** 24 × (365 × 24/18) ≈ 11,680.
- **Extra output:** **2,920 elements/year** with same 24 beds.
- **Extra cost (if all at +INR 400):** 2,920 × 400 = **INR 11.68 L**.
- **Value of extra output:** Depends on margin per element (e.g. INR 2,000 margin → 2,920 × 2,000 = **INR 58.4 L** additional margin; net benefit ≈ **INR 46.72 L** before overhead and delivery gains).

---

## ROI Simulation (Simplified)

- **One-time:** Implementation and training (assume INR 2 L for PRECYCLE subscription + setup).
- **Annual benefit:** Net margin gain from higher throughput (e.g. INR 46.72 L) + possible savings from fewer delays and better scheduling (e.g. INR 5 L) = **INR 51.72 L**.
- **ROI (Year 1):** (51.72 - 2) / 2 ≈ **2,486%** (illustrative; real numbers depend on margin and adoption).
- **Payback:** Under one month if benefits materialize as above.

---

## Carbon Reduction Potential (Illustrative)

- **Steam curing:** Baseline 24 h vs optimized 12 h steam (rest ambient). Assume 40 kg CO2/h for steam (coal/gas).
- **Saving per cycle per bed:** 12 h × 40 = **480 kg CO2** per bed per cycle.
- **Annual (24 beds, 365 cycles):** 24 × 365 × 480 kg ≈ **4,204 tCO2/year** (order of magnitude; actual depends on energy source and efficiency).

---

## Summary

- **Efficiency gains:** Cycle time reduction %, throughput increase, beds equivalent, cost delta per element and total.
- **Example yard:** 25% cycle reduction, 33% throughput gain, +2,920 elements/year with same 24 beds; extra cost INR 400/element; net benefit depends on margin and delivery gains.
- **ROI:** High in example due to throughput gain; payback under one month with assumed margin.
- **Carbon:** Shorter steam curing can yield significant CO2 savings; quantify with project-specific energy and emission factors.
