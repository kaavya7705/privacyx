import { extractFeatures } from "../src/lib/engine/features";
import { runAttackBattery } from "../src/lib/engine/attacks/index";
import { computeRisk } from "../src/lib/engine/risk";
import { DEFENSE_STRATEGIES, applyDefense, compareDefenses } from "../src/lib/engine/defenses/index";
import type { IEvent } from "../src/lib/models/Event";

// Generate synthetic events similar to user's browsing
const events: IEvent[] = [];
const now = new Date();
for (let i = 0; i < 60; i++) {
  const d = new Date(now.getTime() - i * 3600 * 1000 * 3);
  const hour = (9 + (i % 14)) % 24;
  d.setHours(hour, 15, 0, 0);
  const cat = i % 5 === 0 ? "finance" : i % 3 === 0 ? "developer_tools" : "social";
  events.push({
    source: "browser",
    type: "domain_visit",
    category: cat,
    domainCategory: "technology",
    hourOfDay: hour,
    dayOfWeek: d.getDay(),
    sensitivity: 0.8,
    createdAt: d,
    timeBucket: `${hour.toString().padStart(2, "0")}:00-${((hour + 1) % 24).toString().padStart(2, "0")}:00`,
  } as unknown as IEvent);
}

const comparisons = compareDefenses(events, 65);
console.log("\n=== DEFENSE COMPARISON RESULTS ===");
for (const c of comparisons) {
  console.log(`${c.strategyName.padEnd(30)}: Risk ${c.riskBefore} -> ${c.riskAfter} (Improvement: ${c.privacyImprovement})`);
}
