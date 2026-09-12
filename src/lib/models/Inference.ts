import mongoose, { Schema, type Document } from "mongoose";

export type InferenceType =
  | "LIKELY_HOME_AREA"
  | "LIKELY_WORK_AREA"
  | "PREDICTABLE_ROUTINE"
  | "INTEREST_PROFILE"
  | "BEHAVIORAL_FINGERPRINT"
  | "REIDENTIFICATION_RISK"
  | "CROSS_SOURCE_CORRELATION"
  | "TEMPORAL_PATTERN"
  | "ANOMALY_EXPLOITATION";

export type AttackProfile = "weak" | "moderate" | "strong" | "targeted";

export interface IInference extends Document {
  userId: mongoose.Types.ObjectId;
  attackRunId: mongoose.Types.ObjectId;
  type: InferenceType;
  confidence: number;
  risk: number;
  evidence: Array<{
    id: string;
    description: string;
    strength: number;
  }>;
  attackProfile: AttackProfile;
  modelVersion: string;
  explanation?: string;
  assumptions: string[];
  alternatives: string[];
  createdAt: Date;
}

const InferenceSchema = new Schema<IInference>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    attackRunId: { type: Schema.Types.ObjectId, ref: "AttackRun", required: true },
    type: {
      type: String,
      enum: [
        "LIKELY_HOME_AREA",
        "LIKELY_WORK_AREA",
        "PREDICTABLE_ROUTINE",
        "INTEREST_PROFILE",
        "BEHAVIORAL_FINGERPRINT",
        "REIDENTIFICATION_RISK",
        "CROSS_SOURCE_CORRELATION",
        "TEMPORAL_PATTERN",
        "ANOMALY_EXPLOITATION",
      ],
      required: true,
    },
    confidence: { type: Number, required: true, min: 0, max: 1 },
    risk: { type: Number, required: true, min: 0, max: 100 },
    evidence: [
      {
        id: String,
        description: String,
        strength: Number,
      },
    ],
    attackProfile: {
      type: String,
      enum: ["weak", "moderate", "strong", "targeted"],
      required: true,
    },
    modelVersion: { type: String, default: "v1" },
    explanation: String,
    assumptions: [String],
    alternatives: [String],
  },
  { timestamps: true }
);

InferenceSchema.index({ userId: 1, type: 1 });
InferenceSchema.index({ attackRunId: 1 });

export const Inference =
  mongoose.models.Inference || mongoose.model<IInference>("Inference", InferenceSchema);
