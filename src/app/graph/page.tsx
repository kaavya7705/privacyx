"use client";

import { useState, useEffect, useCallback } from "react";
import { GitBranch } from "lucide-react";

interface GraphData {
  nodes: Array<{ nodeId: string; type: string; label: string; data: Record<string, unknown>; position: { x: number; y: number } }>;
  edges: Array<{ edgeId: string; source: string; target: string; strength: number; label?: string }>;
}

const NODE_COLORS: Record<string, string> = {
  user: "#00f0ff",
  signal: "#9945ff",
  pattern: "#ffb800",
  inference: "#ff006e",
};

export default function GraphPage() {
  const [graph, setGraph] = useState<GraphData | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const fetchGraph = useCallback(async () => {
    try {
      const res = await fetch("/api/graph");
      const data = await res.json();
      setGraph(data);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { fetchGraph(); }, [fetchGraph]);

  if (!graph || graph.nodes.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <GitBranch className="w-8 h-8 text-px-purple" /> Evidence Graph
        </h1>
        <div className="glass-card p-12 text-center text-px-text-muted">
          No evidence graph yet. Run an attack first to generate the evidence graph.
        </div>
      </div>
    );
  }

  const selected = graph.nodes.find((n) => n.nodeId === selectedNode);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-3">
        <GitBranch className="w-8 h-8 text-px-purple" /> Evidence Graph
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Graph Visualization */}
        <div className="md:col-span-2 glass-card p-4 relative" style={{ minHeight: "500px" }}>
          <svg width="100%" height="500" viewBox="0 0 800 500" className="overflow-visible">
            {/* Grid */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(36,48,86,0.3)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="800" height="500" fill="url(#grid)" />

            {/* Edges */}
            {graph.edges.map((edge) => {
              const source = graph.nodes.find((n) => n.nodeId === edge.source);
              const target = graph.nodes.find((n) => n.nodeId === edge.target);
              if (!source || !target) return null;
              return (
                <g key={edge.edgeId}>
                  <line
                    x1={source.position.x} y1={source.position.y + 20}
                    x2={target.position.x} y2={target.position.y}
                    stroke={`rgba(0,240,255,${0.2 + edge.strength * 0.6})`}
                    strokeWidth={1 + edge.strength * 2}
                    strokeDasharray={edge.strength < 0.5 ? "4 4" : "none"}
                  />
                  {edge.label && (
                    <text
                      x={(source.position.x + target.position.x) / 2}
                      y={(source.position.y + target.position.y) / 2}
                      fill="#94a3b8" fontSize="10" textAnchor="middle"
                    >{edge.label}</text>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {graph.nodes.map((node) => {
              const color = NODE_COLORS[node.type] || "#00f0ff";
              const isSelected = selectedNode === node.nodeId;
              return (
                <g key={node.nodeId}
                  onClick={() => setSelectedNode(isSelected ? null : node.nodeId)}
                  style={{ cursor: "pointer" }}
                >
                  {/* Glow */}
                  {isSelected && (
                    <circle cx={node.position.x} cy={node.position.y + 10} r="35"
                      fill="none" stroke={color} strokeWidth="2" opacity="0.5">
                      <animate attributeName="r" values="30;40;30" dur="2s" repeatCount="indefinite" />
                    </circle>
                  )}
                  <circle cx={node.position.x} cy={node.position.y + 10} r="24"
                    fill={`${color}15`} stroke={color} strokeWidth={isSelected ? 2 : 1} />
                  <text x={node.position.x} y={node.position.y + 14}
                    fill="#e2e8f0" fontSize="9" textAnchor="middle" fontWeight="bold">
                    {node.label.length > 12 ? node.label.slice(0, 12) + "…" : node.label}
                  </text>
                  {Boolean(node.data?.confidence) && (
                    <text x={node.position.x} y={node.position.y + 28}
                      fill={color} fontSize="9" textAnchor="middle" fontWeight="bold">
                      {Math.round(Number(node.data.confidence) * 100)}%
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 flex gap-4">
            {Object.entries(NODE_COLORS).map(([type, color]) => (
              <div key={type} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-[10px] text-px-text-muted capitalize">{type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Node Detail */}
        <div className="glass-card p-6">
          <h2 className="text-sm font-bold mb-4 text-px-text-muted uppercase tracking-wider">Node Details</h2>
          {selected ? (
            <div className="space-y-4">
              <div>
                <div className="text-xs text-px-text-muted">Label</div>
                <div className="text-lg font-bold" style={{ color: NODE_COLORS[selected.type] }}>{selected.label}</div>
              </div>
              <div>
                <div className="text-xs text-px-text-muted">Type</div>
                <div className="text-sm capitalize">{selected.type}</div>
              </div>
              {selected.data?.confidence !== undefined && (
                <div>
                  <div className="text-xs text-px-text-muted">Confidence</div>
                  <div className="text-2xl font-bold">{Math.round(Number(selected.data.confidence) * 100)}%</div>
                </div>
              )}
              {selected.data?.risk !== undefined && (
                <div>
                  <div className="text-xs text-px-text-muted">Risk Level</div>
                  <div className="text-2xl font-bold">{String(selected.data.risk)}/100</div>
                </div>
              )}
              <div>
                <div className="text-xs text-px-text-muted mb-2">Connected Edges</div>
                {graph.edges.filter((e) => e.source === selected.nodeId || e.target === selected.nodeId).map((e) => (
                  <div key={e.edgeId} className="text-xs text-px-text-secondary py-1">
                    {e.source} → {e.target} ({Math.round(e.strength * 100)}%)
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-sm text-px-text-muted">Click a node to see details</div>
          )}
        </div>
      </div>
    </div>
  );
}
