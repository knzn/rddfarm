import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type ExpenseCategory =
  | "feeds"
  | "vitamins"
  | "medicines"
  | "deworming"
  | "workers_extra_budget"
  | "miscellaneous";

export type ExpenseType = "unit" | "direct";

export interface IFarmExpense extends Document {
  userId: Types.ObjectId;
  category: ExpenseCategory;
  type: ExpenseType;
  date: Date;
  month: number;
  year: number;
  // unit type
  name?: string;
  unit?: string;
  quantity?: number;
  pricePerUnit?: number;
  totalAmount?: number;
  // direct type
  description?: string;
  amount?: number;
  notes?: string;
  locked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UNIT_CATEGORIES: ExpenseCategory[] = ["feeds", "vitamins", "medicines", "deworming"];

const FarmExpenseSchema = new Schema<IFarmExpense>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    category: {
      type: String,
      enum: ["feeds", "vitamins", "medicines", "deworming", "workers_extra_budget", "miscellaneous"],
      required: true,
    },
    type: { type: String, enum: ["unit", "direct"] },
    date: { type: Date, required: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    name: String,
    unit: String,
    quantity: Number,
    pricePerUnit: Number,
    totalAmount: Number,
    description: String,
    amount: Number,
    notes: String,
    locked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

FarmExpenseSchema.pre("save", function () {
  this.type = UNIT_CATEGORIES.includes(this.category) ? "unit" : "direct";
  if (this.type === "unit" && this.quantity != null && this.pricePerUnit != null) {
    this.totalAmount = this.quantity * this.pricePerUnit;
  }
});

FarmExpenseSchema.index({ userId: 1, year: 1, month: 1 });

const FarmExpense: Model<IFarmExpense> =
  mongoose.models.FarmExpense ??
  mongoose.model<IFarmExpense>("FarmExpense", FarmExpenseSchema, "farmexpenses");

export default FarmExpense;
