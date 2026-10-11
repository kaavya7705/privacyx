import mongoose, { Schema, type Document } from "mongoose";

export interface IEvent extends Document {
  userId: mongoose.Types.ObjectId;
  source: "browser" | "location" | "desktop" | "manual";
  type: string;
  category: string;
  domainCategory: string;
  domain?: string;
  timeBucket: string;
  durationBucket: string;
  dayOfWeek: number;
  hourOfDay: number;
  sensitivity: number;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    source: {
      type: String,
      enum: ["browser", "location", "desktop", "manual"],
      required: true,
    },
    type: { type: String, required: true },
    category: { type: String, required: true },
    domainCategory: { type: String, default: "unknown" },
    domain: { type: String, default: "" },
    timeBucket: { type: String, required: true },
    durationBucket: { type: String, default: "<1m" },
    dayOfWeek: { type: Number, min: 0, max: 6 },
    hourOfDay: { type: Number, min: 0, max: 23 },
    sensitivity: { type: Number, default: 0, min: 0, max: 1 },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

// TTL index — default 7 days, configurable per user via retention jobs
EventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });
EventSchema.index({ userId: 1, createdAt: -1 });
EventSchema.index({ userId: 1, category: 1 });
EventSchema.index({ userId: 1, source: 1 });

export const Event = mongoose.models.Event || mongoose.model<IEvent>("Event", EventSchema);
