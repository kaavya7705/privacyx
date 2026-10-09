import { extractFeatures } from "../src/lib/engine/features";
import { runAttackBattery } from "../src/lib/engine/attacks/index";
import { computeRisk } from "../src/lib/engine/risk";
import type { IEvent } from "../src/lib/models/Event";

// Let's create realistic user events where someone has a routine, home/work locations, and specific interests
const events: IEvent[] = [];
const now = new Date();
for (let day = 0; day < 14; day++) {
  // Morning at home: 7 AM and 8 AM
  for (const hour of [7, 8]) {
    const d = new Date(now.getTime() - day * 24 * 3600 * 1000);
    d.setHours(hour, 10, 0, 0);
    events.push({
      source: "browser",
      type: "domain_visit",
      category: "news",
      domainCategory: "information",
      hourOfDay: hour,
      dayOfWeek: d.getDay(),
      sensitivity: 0.2,
      createdAt: d,
      timeBucket: `${hour}:00-${hour + 1}:00`,
    } as unknown as IEvent);
  }

  // Work hours: 10 AM, 2 PM, 4 PM
  for (const hour of [10, 14, 16]) {
    const d = new Date(now.getTime() - day * 24 * 3600 * 1000);
    d.setHours(hour, 20, 0, 0);
    events.push({
      source: "browser",
      type: "domain_visit",
      category: "developer_tools",
      domainCategory: "technology",
      hourOfDay: hour,
      dayOfWeek: d.getDay(),
      sensitivity: 0.7,
      createdAt: d,
      timeBucket: `${hour}:00-${hour + 1}:00`,
    } as unknown as IEvent);
  }

  // Evening at home: 9 PM, 11 PM
  for (const hour of [21, 23]) {
    const d = new Date(now.getTime() - day * 24 * 3600 * 1000);
    d.setHours(hour, 45, 0, 0);
    events.push({
      source: "browser",
      type: "domain_visit",
      category: "finance",
      domainCategory: "financial",
      hourOfDay: hour,
      dayOfWeek: d.getDay(),
      sensitivity: 0.9,
      createdAt: d,
      timeBucket: `${hour}:00-${hour + 1}:00`,
    } as unknown as IEvent);
  }
}

const fOrig = extractFeatures(events);
const aOrig = runAttackBattery(fOrig, "moderate");
const rOrig = computeRisk(fOrig, aOrig);

console.log("Overall Risk:", rOrig.overall);
console.log("Category Risks:", aOrig.categoryRisks);
console.log("\nIndividual Attacks:");
for (const a of aOrig.attacks) {
  console.log(`- ${a.type.padEnd(28)}: Confidence ${(a.confidence * 100).toFixed(0)}%, Risk ${a.risk}`);
}

import { compareDefenses } from "../src/lib/engine/defenses/index";
const defRes = compareDefenses(events, rOrig.overall);
console.log("\n=== CURRENT DEFENSE COMPARISON ===");
for (const d of defRes) {
  console.log(`${d.strategyName.padEnd(28)}: Risk ${d.riskBefore} -> ${d.riskAfter} (Reduction: -${d.privacyImprovement})`);
}

