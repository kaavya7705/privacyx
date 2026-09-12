"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Brain, AlertTriangle, Eye, Shield } from "lucide-react";

interface InferenceData {
  _id: string;
  type: string;
  confidence: number;
  risk: number;
  attackProfile: string;
  evidence: Array<{ description: string; strength: number }>;
  assumptions: string[];
  alternatives: string[];
  createdAt: string;
}

function getRiskColor(s: number) {
  return s <= 30 ? "text-risk-low" : s <= 60 ? "text-risk-medium" : s <= 80 ? "text-risk-high" : "text-risk-critical";
}

export default function InferencesPage() {
  const [inferences, setInferences] = useState<InferenceData[]>([]);
  const [selected, setSelected] = useState<InferenceData | null>(null);

  const fetchInferences = useCallback(async () => {
    try {
      const res = await fetch("/api/inferences?limit=50");
      const data = await res.json();
      setInferences(data.inferences || []);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { fetchInferences(); }, [fetchInferences]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-3">
        <Brain className="w-8 h-8 text-px-purple" />
        Inferences
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* List */}
        <div className="space-y-3">
          {inferences.length === 0 ? (
            <div className="glass-card p-8 text-center text-px-text-muted text-sm">
              No inferences yet. Run an attack first.
            </div>
          ) : inferences.map((inf, i) => (
            <motion.button
              key={inf._id}
              onClick={() => setSelected(inf)}
              className={`glass-card-hover w-full p-4 text-left ${selected?._id === inf._id ? "border-px-cyan/50" : ""}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{inf.type.replace(/_/g, " ")}</span>
                <span className={`text-lg font-bold ${getRiskColor(inf.risk)}`}>{Math.round(inf.confidence * 100)}%</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-px-text-muted">
                <Eye className="w-3 h-3" />
                <span>{inf.evidence?.length || 0} evidence signals</span>
                <span>·</span>
                <Shield className="w-3 h-3" />
                <span>{inf.attackProfile}</span>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Detail */}
        {selected && (
          <motion.div className="glass-card p-6 space-y-5 sticky top-8" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="text-lg font-bold">{selected.type.replace(/_/g, " ")}</h2>
            <div className="flex items-center gap-4">
              <div><div className="text-xs text-px-text-muted">Confidence</div><div className={`text-3xl font-bold ${getRiskColor(selected.risk)}`}>{Math.round(selected.confidence * 100)}%</div></div>
              <div><div className="text-xs text-px-text-muted">Risk</div><div className={`text-3xl font-bold ${getRiskColor(selected.risk)}`}>{selected.risk}</div></div>
              <div><div className="text-xs text-px-text-muted">Profile</div><div className="text-sm capitalize">{selected.attackProfile}</div></div>
            </div>
            <div>
              <div className="text-xs text-px-text-muted uppercase tracking-wider mb-2">Evidence</div>
              {selected.evidence?.map((e, i) => (
                <div key={i} className="flex items-start gap-2 py-1.5 text-sm text-px-text-secondary">
                  <AlertTriangle className="w-3 h-3 text-px-amber mt-1 flex-shrink-0" />
                  {e.description}
                </div>
              ))}
            </div>
            <div>
              <div className="text-xs text-px-text-muted uppercase tracking-wider mb-2">Assumptions</div>
              {selected.assumptions?.map((a, i) => <div key={i} className="text-sm text-px-text-muted py-0.5">• {a}</div>)}
            </div>
            <div className="p-3 rounded-lg bg-px-amber/5 border border-px-amber/20 text-xs text-px-amber">
              ⚠️ This is a probabilistic inference, not a confirmed fact. Confidence: {Math.round(selected.confidence * 100)}% under the {selected.attackProfile} attacker model.
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
