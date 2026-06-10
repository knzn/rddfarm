import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISettings extends Document {
  messengerUrl: string;
  facebookUrl: string;
  phoneNumber: string;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>(
  {
    messengerUrl: { type: String, default: "" },
    facebookUrl: { type: String, default: "" },
    phoneNumber: { type: String, default: "" },
  },
  { timestamps: true }
);

const Settings: Model<ISettings> =
  mongoose.models.Settings ?? mongoose.model<ISettings>("Settings", SettingsSchema, "settings");

export default Settings;
