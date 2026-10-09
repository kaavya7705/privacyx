import { extractFeatures } from "../src/lib/engine/features";
import { runAttackBattery } from "../src/lib/engine/attacks/index";
import { computeRisk } from "../src/lib/engine/risk";
import type { IEvent } from "../src/lib/models/Event";

// Test data
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

const fOrig = extractFeatures(events);
const aOrig = runAttackBattery(fOrig, "moderate");
const rOrig = computeRisk(fOrig, aOrig);
console.log("Original overall risk:", rOrig.overall);

// 1. Test improved temporal blurring (bucketing)
function testTemporalBucketing(events: IEvent[]): IEvent[] {
  return events.map((e) => {
    // Coarsen time into 4 major blocks: Night (0-5), Morning (6-11), Afternoon (12-17), Evening (18-23)
    // and randomly distribute hours uniformly within that block to eliminate exact hour peaks
    const block = Math.floor(e.hourOfDay / 6); // 0, 1, 2, 3
    const uniformHour = block * 6 + Math.floor(Math.random() * 6);
    const d = new Date(e.createdAt);
    d.setHours(uniformHour, Math.floor(Math.random() * 60), 0, 0);
    return {
      ...e,
      hourOfDay: uniformHour,
      createdAt: d,
      timeBucket: `${(block * 6).toString().padStart(2, "0")}:00-${((block + 1) * 6).toString().padStart(2, "0")}:00`,
    };
  });
}

// 2. Test improved category aggregation & masking
function testCategoryAggregation(events: IEvent[]): IEvent[] {
  // Mask sensitive categories and disperse dominant categories
  const safeCategories = ["general_browsing", "reference", "media", "utilities"];
  return events.map((e, idx) => {
    let cat = e.category;
    if (["finance", "healthcare", "career"].includes(cat)) {
      cat = "general_browsing";
    } else if (["developer_tools", "gaming", "sports"].includes(cat)) {
      cat = safeCategories[idx % safeCategories.length];
    }
    return {
      ...e,
      category: cat,
      domainCategory: "general",
      sensitivity: Math.min(0.2, e.sensitivity * 0.3),
    };
  });
}

// 3. Test noise injection (decoy browsing)
function testNoise(events: IEvent[]): IEvent[] {
  const noiseCount = Math.round(events.length * 0.35);
  const noise: IEvent[] = [];
  const decoyCats = ["news", "education", "lifestyle", "weather", "reference"];
  for (let i = 0; i < noiseCount; i++) {
    const randomHour = Math.floor(Math.random() * 24);
    const randomDay = Math.floor(Math.random() * 7);
    const d = new Date(now.getTime() - Math.random() * 14 * 24 * 3600 * 1000);
    d.setHours(randomHour, Math.floor(Math.random() * 60), 0, 0);
    noise.push({
      source: "browser",
      type: "domain_visit",
      category: decoyCats[i % decoyCats.length],
      domainCategory: "general",
      hourOfDay: randomHour,
      dayOfWeek: randomDay,
      sensitivity: 0.1,
      createdAt: d,
      timeBucket: `${randomHour.toString().padStart(2, "0")}:00-${((randomHour + 1) % 24).toString().padStart(2, "0")}:00`,
    } as unknown as IEvent);
  }
  return [...events, ...noise];
}

// 4. Combined
function testCombined(events: IEvent[]): IEvent[] {
  let res = testTemporalBucketing(events);
  res = testCategoryAggregation(res);
  res = testNoise(res);
  return res;
}

const tests = [
  { name: "Temporal Bucketing", fn: testTemporalBucketing },
  { name: "Category Aggregation", fn: testCategoryAggregation },
  { name: "Noise Injection", fn: testNoise },
  { name: "Combined Defense", fn: testCombined },
];

console.log("\n=== TEST RESULTS ===");
for (const t of tests) {
  const transformed = t.fn(events);
  const f = extractFeatures(transformed);
  const a = runAttackBattery(f, "moderate");
  const r = computeRisk(f, a);
  console.log(`${t.name.padEnd(25)}: Risk ${rOrig.overall} -> ${r.overall} (Reduction: -${rOrig.overall - r.overall})`);
}
