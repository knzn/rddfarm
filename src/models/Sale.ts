import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ISaleItem {
  bloodline: string;
  category: string | null;
  quantity: number;
  unitPrice: number;
}

export interface ISale extends Document {
  userId: Types.ObjectId;
  source: "manual" | "reservation";
  // reservation auto-fill
  reservationId?: Types.ObjectId;
  listingType?: "pahulugan" | "months-old" | "day-old";
  listingName?: string;
  listingSlug?: string;
  buyerName?: string;
  buyerFacebook?: string;
  buyerNumber?: string;
  items?: ISaleItem[];
  downPayment?: number;
  balance?: number;
  paymentPlan?: string;
  // shared
  description: string;
  amount: number;
  date: Date;
  month: number;
  year: number;
  paymentStatus: "paid" | "partial" | "unpaid";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SaleItemSchema = new Schema<ISaleItem>(
  {
    bloodline: { type: String, required: true },
    category: { type: String, default: null },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
  },
  { _id: false }
);

const SaleSchema = new Schema<ISale>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    source: { type: String, enum: ["manual", "reservation"], default: "manual" },
    reservationId: { type: Schema.Types.ObjectId, ref: "Reservation", default: null },
    listingType: { type: String, enum: ["pahulugan", "months-old", "day-old"], default: null },
    listingName: { type: String, default: null },
    listingSlug: { type: String, default: null },
    buyerName: { type: String, default: null },
    buyerFacebook: { type: String, default: null },
    buyerNumber: { type: String, default: null },
    items: { type: [SaleItemSchema], default: null },
    downPayment: { type: Number, default: null },
    balance: { type: Number, default: null },
    paymentPlan: { type: String, default: null },
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    paymentStatus: { type: String, enum: ["paid", "partial", "unpaid"], default: "unpaid" },
    notes: String,
  },
  { timestamps: true }
);

SaleSchema.index({ userId: 1, year: 1, month: 1 });
SaleSchema.index({ reservationId: 1 }, { sparse: true, unique: true });

const Sale: Model<ISale> =
  mongoose.models.Sale ?? mongoose.model<ISale>("Sale", SaleSchema, "farmsales");

export default Sale;
