import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IReservationItem {
  bloodline: string;
  category: string | null;
  quantity: number;
  unitPrice: number;
}

export interface IPaymentScheduleEntry {
  dueDate: Date;
  amount: number;
}

export interface IReservation extends Document {
  listingId: Types.ObjectId;
  listingType: "pahulugan" | "months-old" | "day-old";
  listingSlug: string;

  buyerName: string;
  buyerFacebook: string;
  buyerNumber: string;
  slug: string;

  items: IReservationItem[];

  totalAmount: number;
  downPayment: number;
  balance: number;

  paymentPlan: "full" | "flexible" | "weekly" | "monthly";
  weeklyAmount: number | null;
  monthlyAmount: number | null;
  paymentSchedule: IPaymentScheduleEntry[] | null;

  isConfirmed: boolean;
  publicUrl: string;
  messengerUrl: string;

  createdAt: Date;
  updatedAt: Date;
}

const ReservationSchema = new Schema<IReservation>(
  {
    listingId: { type: Schema.Types.ObjectId, ref: "Listing", required: true },
    listingType: { type: String, enum: ["pahulugan", "months-old", "day-old"], required: true },
    listingSlug: { type: String, required: true },

    buyerName: { type: String, required: true, trim: true },
    buyerFacebook: { type: String, required: true, trim: true },
    buyerNumber: { type: String, required: true, trim: true },
    slug: { type: String, required: true },

    items: [
      {
        bloodline: { type: String, required: true },
        category: { type: String, default: null },
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true },
      },
    ],

    totalAmount: { type: Number, required: true },
    downPayment: { type: Number, required: true },
    balance: { type: Number, required: true },

    paymentPlan: { type: String, enum: ["full", "flexible", "weekly", "monthly"], required: true },
    weeklyAmount: { type: Number, default: null },
    monthlyAmount: { type: Number, default: null },
    paymentSchedule: { type: [{ dueDate: Date, amount: Number }], default: null },

    isConfirmed: { type: Boolean, default: false },
    publicUrl: { type: String, default: "" },
    messengerUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

ReservationSchema.index({ listingSlug: 1, slug: 1 }, { unique: true });
ReservationSchema.index({ listingId: 1, isConfirmed: 1 });

const Reservation: Model<IReservation> =
  mongoose.models.Reservation ??
  mongoose.model<IReservation>("Reservation", ReservationSchema, "reservations");

export default Reservation;
