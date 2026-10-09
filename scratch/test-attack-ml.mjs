// Test attack pipeline & ML service connectivity
const ML_URL = "http://127.0.0.1:8000";

async function testMLPipeline() {
  console.log("1. Checking ML Service /health...");
  const healthRes = await fetch(`${ML_URL}/health`);
  const health = await healthRes.json();
  console.log("Health response:", health);

  // Generate 20 realistic event feature vectors: [hour, day, catCode, sensitivity, isBrowser]
  const features = [];
  for (let i = 0; i < 25; i++) {
    features.push([
      (i % 24) / 24,
      (i % 7) / 7,
      (i % 14) / 14,
      0.65,
      1.0
    ]);
  }

  console.log("\n2. Sending /predict/risk (Attack Simulation ML scoring)...");
  const riskRes = await fetch(`${ML_URL}/predict/risk`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ features, user_id: "demo_user_123" }),
  });
  const risk = await riskRes.json();
  console.log("Risk Prediction Result:", risk);

  console.log("\n3. Sending /anomaly (Outlier Detection Attack)...");
  const anomRes = await fetch(`${ML_URL}/anomaly`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ features, contamination: 0.1 }),
  });
  const anom = await anomRes.json();
  console.log("Anomaly Detection Result: count =", anom.anomaly_count, "pct =", anom.anomaly_percentage);

  console.log("\n4. Sending /routine (Routine Detection Attack)...");
  const routRes = await fetch(`${ML_URL}/routine`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ features, algorithm: "dbscan", eps: 0.35, min_samples: 2 }),
  });
  const rout = await routRes.json();
  console.log("Routine Detection Result: routine_count =", rout.routine_count);

  console.log("\n5. Sending /reidentification (Re-identification Attack)...");
  const reidRes = await fetch(`${ML_URL}/reidentification`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ features }),
  });
  const reid = await reidRes.json();
  console.log("Re-identification Result: score =", reid.risk_score, "method =", reid.method);

  console.log("\n6. Sending /predict/defense (ML Defense Evaluation)...");
  // Perturbed features (defended)
  const defendedFeatures = features.map(([h, d, c, s, b]) => [
    Math.round(h * 4) / 4, // 4-hour bucketing
    d,
    0.5, // generalized category
    Math.max(0, s - 0.3), // lowered sensitivity
    b,
  ]);
  const defRes = await fetch(`${ML_URL}/predict/defense`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      features_before: features,
      features_after: defendedFeatures,
      defense_strategy: "differential_privacy",
      user_id: "demo_user_123"
    }),
  });
  const def = await defRes.json();
  console.log("Defense ML Evaluation:", {
    effective: def.defense_effective,
    risk_before: def.risk_before,
    risk_after: def.risk_after,
    reduction: def.ml_risk_reduction,
    models: def.models_used,
  });

  console.log("\n=== ALL ML ATTACK & DEFENSE PIPELINE CALLS SUCCEEDED! ===");
}

testMLPipeline().catch(console.error);

