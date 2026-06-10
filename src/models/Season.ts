import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ISeason extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  year: number;
  markingsGenerated: boolean;
  generatedAt: Date | null;
  eggsLaid: number | null;
  expectedHatchDate: Date | null;
  chicksHatched: number | null;
  hatchRate: number | null;
  maleCount: number | null;
  femaleCount: number | null;
  sexCountDone: boolean;
  sexCountUpdatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const SeasonSchema = new Schema<ISeason>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    year: { type: Number, required: true },
    markingsGenerated: { type: Boolean, default: false },
    generatedAt: { type: Date, default: null },
    eggsLaid: { type: Number, default: null },
    expectedHatchDate: { type: Date, default: null },
    chicksHatched: { type: Number, default: null },
    hatchRate: { type: Number, default: null },
    maleCount: { type: Number, default: null },
    femaleCount: { type: Number, default: null },
    sexCountDone: { type: Boolean, default: false },
    sexCountUpdatedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

SeasonSchema.index({ userId: 1, createdAt: -1 });

const Season: Model<ISeason> =
  mongoose.models.Season ?? mongoose.model<ISeason>("Season", SeasonSchema, "seasons");

export default Season;
