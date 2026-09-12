import mongoose, { Schema, type Document } from "mongoose";

export interface IAttackRun extends Document {
  userId: mongoose.Types.ObjectId;
  status: "running" | "completed" | "failed";
  attackProfile: string;
  attacks: Array<{
    type: string;
    confidence: number;
    risk: number;
    evidenceCount: number;
  }>;
  riskBefore: number;
  riskAfter: number;
  defenseApplied?: string;
  duration: number; // ms
  startedAt: Date;
  completedAt?: Date;
  isReattack: boolean;
  parentRunId?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const AttackRunSchema = new Schema<IAttackRun>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: {
      type: String,
      enum: ["running", "completed", "failed"],
      default: "running",
    },
    attackProfile: { type: String, required: true, default: "moderate" },
    attacks: [
      {
        type: { type: String },
        confidence: Number,
        risk: Number,
        evidenceCount: Number,
      },
    ],
    riskBefore: { type: Number, default: 0 },
    riskAfter: { type: Number, default: 0 },
    defenseApplied: String,
    duration: { type: Number, default: 0 },
    startedAt: { type: Date, default: Date.now },
    completedAt: Date,
    isReattack: { type: Boolean, default: false },
    parentRunId: { type: Schema.Types.ObjectId, ref: "AttackRun" },
  },
  { timestamps: true }
);

AttackRunSchema.index({ userId: 1, createdAt: -1 });

export const AttackRun =
  mongoose.models.AttackRun || mongoose.model<IAttackRun>("AttackRun", AttackRunSchema);
