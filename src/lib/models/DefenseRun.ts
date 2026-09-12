import mongoose, { Schema, type Document } from "mongoose";

export interface IDefenseRun extends Document {
  userId: mongoose.Types.ObjectId;
  strategies: Array<{
    name: string;
    riskReduction: number;
    utilityLoss: number;
    riskBefore: number;
    riskAfter: number;
  }>;
  selectedStrategy: string;
  riskBefore: number;
  riskAfter: number;
  utilityRetained: number;
  privacyImprovement: number;
  createdAt: Date;
}

const DefenseRunSchema = new Schema<IDefenseRun>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    strategies: [
      {
        name: String,
        riskReduction: Number,
        utilityLoss: Number,
        riskBefore: Number,
        riskAfter: Number,
      },
    ],
    selectedStrategy: { type: String, required: true },
    riskBefore: { type: Number, required: true },
    riskAfter: { type: Number, required: true },
    utilityRetained: { type: Number, required: true },
    privacyImprovement: { type: Number, required: true },
  },
  { timestamps: true }
);

export const DefenseRun =
  mongoose.models.DefenseRun || mongoose.model<IDefenseRun>("DefenseRun", DefenseRunSchema);
