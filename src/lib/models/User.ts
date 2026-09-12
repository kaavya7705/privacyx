import mongoose, { Schema, type Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  hashedPassword: string;
  name: string;
  settings: {
    monitoring: {
      browser: boolean;
      websiteCategories: boolean;
      searchCategories: boolean;
      location: boolean;
      desktop: boolean;
    };
    retention: number; // days
    aiExplanations: boolean;
    rawDataToAI: boolean;
    monitoringPaused: boolean;
  };
  apiToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    hashedPassword: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    settings: {
      monitoring: {
        browser: { type: Boolean, default: true },
        websiteCategories: { type: Boolean, default: true },
        searchCategories: { type: Boolean, default: false },
        location: { type: Boolean, default: false },
        desktop: { type: Boolean, default: false },
      },
      retention: { type: Number, default: 7 },
      aiExplanations: { type: Boolean, default: true },
      rawDataToAI: { type: Boolean, default: false },
      monitoringPaused: { type: Boolean, default: false },
    },
    apiToken: { type: String },
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
