"use client";

import { useState } from "react";
import { Settings, Trash2, Pause, Play, Save } from "lucide-react";

export default function SettingsPage() {
  const [monitoring, setMonitoring] = useState({
    browser: true, websiteCategories: true, searchCategories: false,
    location: false, desktop: false,
  });
  const [retention, setRetention] = useState(7);
  const [aiExplanations, setAiExplanations] = useState(true);
  const [rawDataToAI, setRawDataToAI] = useState(false);
  const [paused, setPaused] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const save = async () => {
    setSaving(true);
    // Would save to API
    setTimeout(() => setSaving(false), 1000);
  };

  const deleteAll = async () => {
    setDeleting(true);
    try {
      await fetch("/api/user/data", { method: "DELETE" });
      window.location.href = "/";
    } catch (e) { console.error(e); }
    setDeleting(false);
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <h1 className="text-3xl font-bold flex items-center gap-3">
        <Settings className="w-8 h-8 text-px-text-secondary" /> Settings
      </h1>

      {/* Monitoring */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="font-bold uppercase tracking-wider text-sm text-px-text-muted">Monitoring</h2>
        {Object.entries(monitoring).map(([key, val]) => (
          <label key={key} className="flex items-center justify-between py-2">
            <span className="text-sm capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
            <button onClick={() => setMonitoring({ ...monitoring, [key]: !val })}
              className={`w-10 h-6 rounded-full transition-colors ${val ? "bg-px-cyan" : "bg-px-border"}`}>
              <div className={`w-4 h-4 bg-white rounded-full transition-transform mx-1 ${val ? "translate-x-4" : ""}`} />
            </button>
          </label>
        ))}
      </div>

      {/* Retention */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="font-bold uppercase tracking-wider text-sm text-px-text-muted">Data Retention</h2>
        <div className="flex gap-3">
          {[7, 30, 90].map((d) => (
            <button key={d} onClick={() => setRetention(d)}
              className={`px-6 py-2 rounded-lg border text-sm font-medium transition-all ${
                retention === d ? "border-px-cyan bg-px-cyan/10 text-px-cyan" : "border-px-border text-px-text-secondary"
              }`}>{d} days</button>
          ))}
        </div>
      </div>

      {/* AI */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="font-bold uppercase tracking-wider text-sm text-px-text-muted">AI Settings</h2>
        <label className="flex items-center justify-between py-2">
          <span className="text-sm">AI Explanations</span>
          <button onClick={() => setAiExplanations(!aiExplanations)}
            className={`w-10 h-6 rounded-full transition-colors ${aiExplanations ? "bg-px-cyan" : "bg-px-border"}`}>
            <div className={`w-4 h-4 bg-white rounded-full transition-transform mx-1 ${aiExplanations ? "translate-x-4" : ""}`} />
          </button>
        </label>
        <label className="flex items-center justify-between py-2">
          <div>
            <span className="text-sm">Send Raw Data to AI</span>
            <div className="text-xs text-px-text-muted">Only structured evidence is sent by default</div>
          </div>
          <button onClick={() => setRawDataToAI(!rawDataToAI)}
            className={`w-10 h-6 rounded-full transition-colors ${rawDataToAI ? "bg-px-amber" : "bg-px-border"}`}>
            <div className={`w-4 h-4 bg-white rounded-full transition-transform mx-1 ${rawDataToAI ? "translate-x-4" : ""}`} />
          </button>
        </label>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button onClick={save} disabled={saving}
          className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50">
          <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Settings"}
        </button>
        <button onClick={() => setPaused(!paused)}
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg border text-sm font-semibold uppercase tracking-wider transition-all ${
            paused ? "border-px-emerald text-px-emerald" : "border-px-amber text-px-amber"
          }`}>
          {paused ? <><Play className="w-4 h-4" /> Resume</> : <><Pause className="w-4 h-4" /> Pause</>}
        </button>
      </div>

      {/* Delete */}
      <div className="glass-card p-6 border-risk-critical/20">
        <h2 className="font-bold text-risk-critical mb-2">Danger Zone</h2>
        <p className="text-sm text-px-text-muted mb-4">Permanently delete all your data. This action cannot be undone.</p>
        {!confirmDelete ? (
          <button onClick={() => setConfirmDelete(true)} className="btn-danger flex items-center gap-2">
            <Trash2 className="w-4 h-4" /> Delete All Data
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button onClick={deleteAll} disabled={deleting}
              className="btn-danger flex items-center gap-2 disabled:opacity-50">
              {deleting ? "Deleting..." : "Confirm Delete"}
            </button>
            <button onClick={() => setConfirmDelete(false)} className="text-sm text-px-text-muted hover:text-px-text">Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
}
