import mongoose, { Schema, type Document } from "mongoose";

export interface ILeak extends Document {
  userId: mongoose.Types.ObjectId;
  type: "tracker" | "data_broker" | "pii_in_url" | "pii_in_request" | "pii_in_form" | "fingerprinting";
  domain: string;
  severity: "low" | "medium" | "high" | "critical";
  blocked: boolean;
  piiDetail: {
    type?: string;
    label?: string;
    count?: number;
  } | null;
  createdAt: Date;
}

const LeakSchema = new Schema<ILeak>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: ["tracker", "data_broker", "pii_in_url", "pii_in_request", "pii_in_form", "fingerprinting"],
      required: true,
    },
    domain: { type: String, required: true },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    blocked: { type: Boolean, default: false },
    piiDetail: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

// TTL: auto-delete leaks after 30 days
LeakSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });
LeakSchema.index({ userId: 1, createdAt: -1 });
LeakSchema.index({ userId: 1, type: 1 });
LeakSchema.index({ userId: 1, severity: 1 });

export const Leak = mongoose.models.Leak || mongoose.model<ILeak>("Leak", LeakSchema);
