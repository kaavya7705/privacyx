import mongoose, { Schema, type Document } from "mongoose";

export interface IConsent extends Document {
  userId: mongoose.Types.ObjectId;
  categories: {
    browser: boolean;
    websiteCategories: boolean;
    searchCategories: boolean;
    location: boolean;
    desktop: boolean;
  };
  retention: number;
  aiExplanations: boolean;
  rawDataToAI: boolean;
  consentVersion: string;
  acceptedAt: Date;
  updatedAt: Date;
}

const ConsentSchema = new Schema<IConsent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    categories: {
      browser: { type: Boolean, default: false },
      websiteCategories: { type: Boolean, default: false },
      searchCategories: { type: Boolean, default: false },
      location: { type: Boolean, default: false },
      desktop: { type: Boolean, default: false },
    },
    retention: { type: Number, default: 7 },
    aiExplanations: { type: Boolean, default: true },
    rawDataToAI: { type: Boolean, default: false },
    consentVersion: { type: String, default: "1.0" },
    acceptedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Consent =
  mongoose.models.Consent || mongoose.model<IConsent>("Consent", ConsentSchema);
