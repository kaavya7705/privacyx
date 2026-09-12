import mongoose, { Schema, type Document } from "mongoose";

export interface IRiskSnapshot extends Document {
  userId: mongoose.Types.ObjectId;
  overall: number;
  location: number;
  behavior: number;
  identity: number;
  interest: number;
  reidentification: number;
  attackProfile: string;
  components: {
    evidenceStrength: number;
    uniqueness: number;
    temporalConsistency: number;
    crossSourceSupport: number;
    adversaryPrior: number;
    contradictionPenalty: number;
  };
  createdAt: Date;
}

const RiskSnapshotSchema = new Schema<IRiskSnapshot>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    overall: { type: Number, required: true, min: 0, max: 100 },
    location: { type: Number, default: 0, min: 0, max: 100 },
    behavior: { type: Number, default: 0, min: 0, max: 100 },
    identity: { type: Number, default: 0, min: 0, max: 100 },
    interest: { type: Number, default: 0, min: 0, max: 100 },
    reidentification: { type: Number, default: 0, min: 0, max: 100 },
    attackProfile: { type: String, default: "moderate" },
    components: {
      evidenceStrength: { type: Number, default: 0 },
      uniqueness: { type: Number, default: 0 },
      temporalConsistency: { type: Number, default: 0 },
      crossSourceSupport: { type: Number, default: 0 },
      adversaryPrior: { type: Number, default: 0 },
      contradictionPenalty: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

RiskSnapshotSchema.index({ userId: 1, createdAt: -1 });

export const RiskSnapshot =
  mongoose.models.RiskSnapshot ||
  mongoose.model<IRiskSnapshot>("RiskSnapshot", RiskSnapshotSchema);
