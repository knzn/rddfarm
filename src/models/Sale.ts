import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ISale extends Document {
  userId: Types.ObjectId;
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

const SaleSchema = new Schema<ISale>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
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

const Sale: Model<ISale> =
  mongoose.models.Sale ?? mongoose.model<ISale>("Sale", SaleSchema, "farmsales");

export default Sale;
