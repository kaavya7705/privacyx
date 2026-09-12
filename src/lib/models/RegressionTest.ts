import mongoose, { Schema, type Document } from "mongoose";

export interface IRegressionTest extends Document {
  userId: mongoose.Types.ObjectId;
  baselineRisks: {
    overall: number;
    location: number;
    behavior: number;
    identity: number;
    interest: number;
    reidentification: number;
  };
  newRisks: {
    overall: number;
    location: number;
    behavior: number;
    identity: number;
    interest: number;
    reidentification: number;
  };
  regressions: Array<{
    category: string;
    before: number;
    after: number;
    delta: number;
    severity: "none" | "minor" | "major" | "critical";
    cause?: string;
  }>;
  newDataSource: string;
  totalRegression: number;
  hasRegression: boolean;
  createdAt: Date;
}

const RegressionTestSchema = new Schema<IRegressionTest>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    baselineRisks: {
      overall: Number,
      location: Number,
      behavior: Number,
      identity: Number,
      interest: Number,
      reidentification: Number,
    },
    newRisks: {
      overall: Number,
      location: Number,
      behavior: Number,
      identity: Number,
      interest: Number,
      reidentification: Number,
    },
    regressions: [
      {
        category: String,
        before: Number,
        after: Number,
        delta: Number,
        severity: {
          type: String,
          enum: ["none", "minor", "major", "critical"],
        },
        cause: String,
      },
    ],
    newDataSource: { type: String, required: true },
    totalRegression: { type: Number, default: 0 },
    hasRegression: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const RegressionTest =
  mongoose.models.RegressionTest ||
  mongoose.model<IRegressionTest>("RegressionTest", RegressionTestSchema);
