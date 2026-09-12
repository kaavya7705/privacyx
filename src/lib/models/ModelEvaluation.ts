import mongoose, { Schema, type Document } from "mongoose";

export interface IModelEvaluation {
  userId?: mongoose.Types.ObjectId;
  model: string;
  modelVersion: string;
  experiment: string;
  metrics: {
    precision: number;
    recall: number;
    f1: number;
    rocAuc?: number;
    falsePositiveRate?: number;
    attackSuccessRate?: number;
    reidentificationRate?: number;
    inferenceAccuracy?: number;
    privacyRiskReduction?: number;
    utilityRetention?: number;
  };
  config: Record<string, unknown>;
  datasetSize: number;
  createdAt: Date;
}

const ModelEvaluationSchema = new Schema<IModelEvaluation>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    model: { type: String, required: true },
    modelVersion: { type: String, default: "v1" },
    experiment: { type: String, required: true },
    metrics: {
      precision: { type: Number, required: true },
      recall: { type: Number, required: true },
      f1: { type: Number, required: true },
      rocAuc: Number,
      falsePositiveRate: Number,
      attackSuccessRate: Number,
      reidentificationRate: Number,
      inferenceAccuracy: Number,
      privacyRiskReduction: Number,
      utilityRetention: Number,
    },
    config: { type: Schema.Types.Mixed, default: {} },
    datasetSize: { type: Number, required: true },
  },
  { timestamps: true }
);

export const ModelEvaluation =
  mongoose.models.ModelEvaluation ||
  mongoose.model<IModelEvaluation>("ModelEvaluation", ModelEvaluationSchema);
