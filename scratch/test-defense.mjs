import { extractFeatures } from "../src/lib/engine/features.js";
import { runAttackBattery } from "../src/lib/engine/attacks/index.js";
import { computeRisk } from "../src/lib/engine/risk/index.js";
import { DEFENSE_STRATEGIES, applyDefense } from "../src/lib/engine/defenses/index.js";

console.log("Defense strategies count:", DEFENSE_STRATEGIES.length);
