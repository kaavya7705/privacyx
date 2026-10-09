import mongoose, { Schema, type Document } from "mongoose";

export interface ITransformationDetail {
  field: string;
  action: string;
  eventCount: number;
  description: string;
}

export interface IMLAssessment {
  modelName: string;
  modelType: string;
  riskBefore: number;
  riskAfter: number;
  reduction: number;
  effective: boolean;
}

export interface IDefenseRun extends Document {
  userId: mongoose.Types.ObjectId;
  strategies: Array<{
    name: string;
    strategy: string;
    riskBefore: number;
    riskAfter: number;
    utilityRetained: number;
    privacyImprovement: number;
  }>;
  selectedStrategy: string;
  riskBefore: number;
  riskAfter: number;
  utilityRetained: number;
  privacyImprovement: number;
  // NEW: Defense persistence fields
  active: boolean;
  deactivatedAt: Date | null;
  transformationLog: ITransformationDetail[];
  mlAssessment: IMLAssessment[];
  mlRiskBefore: number;
  mlRiskAfter: number;
  mlRiskReduction: number;
  mlModelsUsed: string[];
  eventsModified: number;
  eventsBefore: number;
  eventsAfter: number;
  createdAt: Date;
}

const DefenseRunSchema = new Schema<IDefenseRun>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    strategies: [
      {
        name: String,
        strategy: String,
        riskBefore: Number,
        riskAfter: Number,
        utilityRetained: Number,
        privacyImprovement: Number,
      },
    ],
    selectedStrategy: { type: String, required: true },
    riskBefore: { type: Number, required: true },
    riskAfter: { type: Number, required: true },
    utilityRetained: { type: Number, required: true },
    privacyImprovement: { type: Number, required: true },
    // NEW fields
    active: { type: Boolean, default: true, index: true },
    deactivatedAt: { type: Date, default: null },
    transformationLog: [
      {
        field: String,
        action: String,
        eventCount: Number,
        description: String,
      },
    ],
    mlAssessment: [
      {
        modelName: String,
        modelType: String,
        riskBefore: Number,
        riskAfter: Number,
        reduction: Number,
        effective: Boolean,
      },
    ],
    mlRiskBefore: { type: Number, default: 0 },
    mlRiskAfter: { type: Number, default: 0 },
    mlRiskReduction: { type: Number, default: 0 },
    mlModelsUsed: [{ type: String }],
    eventsModified: { type: Number, default: 0 },
    eventsBefore: { type: Number, default: 0 },
    eventsAfter: { type: Number, default: 0 },
  },
  { timestamps: true }
);

DefenseRunSchema.index({ userId: 1, active: 1 });
DefenseRunSchema.index({ userId: 1, createdAt: -1 });

export const DefenseRun =
  mongoose.models.DefenseRun || mongoose.model<IDefenseRun>("DefenseRun", DefenseRunSchema);
