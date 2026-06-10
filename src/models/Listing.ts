import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBloodline {
  name: string;
  closed: boolean;
}

export interface IPrice {
  category: string;
  amount: number;
}

export interface IListing extends Document {
  type: "pahulugan" | "months-old" | "day-old";
  name: string;
  slug: string;
  startDate: Date | null;
  releaseMonthStart: number;
  releaseMonthEnd: number;
  releaseYear: number;
  bloodlines: IBloodline[];
  prices: IPrice[];
  isDone: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ListingSchema = new Schema<IListing>(
  {
    type: { type: String, enum: ["pahulugan", "months-old", "day-old"], required: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    startDate: { type: Date, default: null },
    releaseMonthStart: { type: Number, required: true, min: 1, max: 12 },
    releaseMonthEnd: { type: Number, required: true, min: 1, max: 12 },
    releaseYear: { type: Number, required: true },
    bloodlines: [
      {
        name: { type: String, required: true },
        closed: { type: Boolean, default: false },
      },
    ],
    prices: [
      {
        category: { type: String, required: true },
        amount: { type: Number, required: true },
      },
    ],
    isDone: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ListingSchema.index({ type: 1, isDone: 1, createdAt: -1 });

const Listing: Model<IListing> =
  mongoose.models.Listing ?? mongoose.model<IListing>("Listing", ListingSchema, "listings");

export default Listing;
