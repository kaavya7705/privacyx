import mongoose, { Schema, type Document } from "mongoose";

export interface IGraphNode extends Document {
  userId: mongoose.Types.ObjectId;
  attackRunId: mongoose.Types.ObjectId;
  nodeId: string;
  type: "user" | "signal" | "pattern" | "inference";
  label: string;
  data: Record<string, unknown>;
  position: { x: number; y: number };
}

export interface IGraphEdge extends Document {
  userId: mongoose.Types.ObjectId;
  attackRunId: mongoose.Types.ObjectId;
  edgeId: string;
  source: string;
  target: string;
  evidenceId?: string;
  label?: string;
  strength: number;
}

const GraphNodeSchema = new Schema<IGraphNode>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    attackRunId: { type: Schema.Types.ObjectId, ref: "AttackRun", required: true },
    nodeId: { type: String, required: true },
    type: { type: String, enum: ["user", "signal", "pattern", "inference"], required: true },
    label: { type: String, required: true },
    data: { type: Schema.Types.Mixed, default: {} },
    position: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

const GraphEdgeSchema = new Schema<IGraphEdge>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    attackRunId: { type: Schema.Types.ObjectId, ref: "AttackRun", required: true },
    edgeId: { type: String, required: true },
    source: { type: String, required: true },
    target: { type: String, required: true },
    evidenceId: String,
    label: String,
    strength: { type: Number, default: 0.5 },
  },
  { timestamps: true }
);

GraphNodeSchema.index({ userId: 1, attackRunId: 1 });
GraphEdgeSchema.index({ userId: 1, attackRunId: 1 });

export const GraphNode =
  mongoose.models.GraphNode || mongoose.model<IGraphNode>("GraphNode", GraphNodeSchema);

export const GraphEdge =
  mongoose.models.GraphEdge || mongoose.model<IGraphEdge>("GraphEdge", GraphEdgeSchema);
