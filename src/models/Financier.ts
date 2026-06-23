import mongoose, { Schema, Document } from "mongoose";

export interface ITransaction {
  _id: string;
  type: "advance" | "payment";
  date: Date;
  amount: number;
  chickenType: "Stag" | "Cock" | "Pullet" | "Hen" | null;
  volume: number | null;
  priceEach: number | null;
  notes: string | null;
  createdAt: Date;
}

export interface IFinancier extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  transactions: ITransaction[];
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    type: { type: String, enum: ["advance", "payment"], required: true },
    date: { type: Date, required: true },
    amount: { type: Number, required: true },
    chickenType: { type: String, enum: ["Stag", "Cock", "Pullet", "Hen", null], default: null },
    volume: { type: Number, default: null },
    priceEach: { type: Number, default: null },
    notes: { type: String, default: null },
  },
  { timestamps: true }
);

const FinancierSchema = new Schema<IFinancier>(
  {
    userId: { type: Schema.Types.ObjectId, required: true },
    name: { type: String, required: true, trim: true },
    transactions: { type: [TransactionSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.models.Financier ||
  mongoose.model<IFinancier>("Financier", FinancierSchema, "financiers");
