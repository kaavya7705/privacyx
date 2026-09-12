"use client";

import { useState, useEffect, useCallback } from "react";
import { Clock, Target, ShieldCheck } from "lucide-react";

interface HistoryRun {
  _id: string; status: string; attackProfile: string; riskBefore: number; riskAfter: number;
  isReattack: boolean; duration: number; createdAt: string;
  attacks: Array<{ type: string; confidence: number; risk: number }>;
}

function getRiskColor(s: number) { return s <= 30 ? "text-risk-low" : s <= 60 ? "text-risk-medium" : s <= 80 ? "text-risk-high" : "text-risk-critical"; }

export default function HistoryPage() {
  const [runs, setRuns] = useState<HistoryRun[]>([]);
  const fetchRuns = useCallback(async () => {
    try { const res = await fetch("/api/attack?limit=30"); const data = await res.json(); setRuns(data.runs || []); } catch (e) { console.error(e); }
  }, []);
  useEffect(() => { fetchRuns(); }, [fetchRuns]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-3"><Clock className="w-8 h-8 text-px-text-secondary" /> Attack History</h1>
      {runs.length === 0 ? (
        <div className="glass-card p-12 text-center text-px-text-muted text-sm">No attack runs yet.</div>
      ) : (
        <div className="space-y-3">
          {runs.map((run) => (
            <div key={run._id} className="glass-card-hover p-5 flex items-center gap-6">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${run.isReattack ? "bg-px-emerald/10" : "bg-px-magenta/10"}`}>
                {run.isReattack ? <ShieldCheck className="w-5 h-5 text-px-emerald" /> : <Target className="w-5 h-5 text-px-magenta" />}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">{run.isReattack ? "Re-Attack" : "Attack"} — {run.attackProfile}</div>
                <div className="text-xs text-px-text-muted">{new Date(run.createdAt).toLocaleString()} · {run.duration}ms</div>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${getRiskColor(run.riskAfter)}`}>{run.riskAfter}</div>
                <div className="text-xs text-px-text-muted">{run.attacks?.length || 0} attacks</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
