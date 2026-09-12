"use client";

import { FlaskConical, Database, Brain } from "lucide-react";
import { useState } from "react";

const PROFILES = ["student", "software_engineer", "remote_worker", "office_worker", "frequent_traveler", "researcher"];

export default function ExperimentsPage() {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<Record<string, unknown> | null>(null);
  const [selectedProfile, setSelectedProfile] = useState("software_engineer");

  const runExperiment = async () => {
    setRunning(true);
    try {
      // Generate synthetic data for the selected profile
      const genRes = await fetch("/api/synthetic", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: selectedProfile, days: 14, eventsPerDay: 25 }),
      });
      const genData = await genRes.json();

      // Run attack
      const attackRes = await fetch("/api/attack", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attackProfile: "moderate" }),
      });
      const attackData = await attackRes.json();

      setResults({ ...genData, ...attackData });
    } catch (e) { console.error(e); }
    setRunning(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-3"><FlaskConical className="w-8 h-8 text-px-amber" /> ML Experiments</h1>

      <div className="glass-card p-6">
        <h2 className="font-bold mb-4 flex items-center gap-2"><Brain className="w-4 h-4 text-px-purple" /> Synthetic Profile Experiment</h2>
        <p className="text-sm text-px-text-secondary mb-4">Generate synthetic data for a user profile and run the full attack battery to evaluate ML performance.</p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          {PROFILES.map((p) => (
            <button key={p} onClick={() => setSelectedProfile(p)}
              className={`p-3 rounded-lg border text-sm text-left transition-all ${
                selectedProfile === p ? "border-px-cyan bg-px-cyan/10" : "border-px-border hover:border-px-border-light"
              }`}>
              <span className="capitalize">{p.replace(/_/g, " ")}</span>
            </button>
          ))}
        </div>

        <button onClick={runExperiment} disabled={running}
          className="btn-primary flex items-center gap-2 disabled:opacity-50">
          <Database className="w-4 h-4" /> {running ? "Running..." : "Run Experiment"}
        </button>
      </div>

      {results && (
        <div className="glass-card p-6">
          <h2 className="font-bold mb-4">Experiment Results</h2>
          <pre className="text-xs text-px-text-secondary bg-px-bg p-4 rounded-lg overflow-x-auto max-h-96">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
