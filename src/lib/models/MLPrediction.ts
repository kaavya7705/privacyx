import mongoose, { Schema, type Document } from "mongoose";

export interface IMLPrediction {
  userId: mongoose.Types.ObjectId;
  model: string;
  modelVersion: string;
  prediction: number;
  features: Record<string, number>;
  featureImportance: Record<string, number>;
  explanation: Record<string, unknown>;
  createdAt: Date;
}

const MLPredictionSchema = new Schema<IMLPrediction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    model: { type: String, required: true },
    modelVersion: { type: String, default: "v1" },
    prediction: { type: Number, required: true },
    features: { type: Schema.Types.Mixed, default: {} },
    featureImportance: { type: Schema.Types.Mixed, default: {} },
    explanation: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

MLPredictionSchema.index({ userId: 1, model: 1, createdAt: -1 });

export const MLPrediction =
  mongoose.models.MLPrediction ||
  mongoose.model<IMLPrediction>("MLPrediction", MLPredictionSchema);
