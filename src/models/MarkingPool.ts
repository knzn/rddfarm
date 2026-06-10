import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IPoolAssignment {
  matingId: Types.ObjectId;
  noseGroup: string;
  combos: string[];
}

export interface IMarkingPool extends Document {
  seasonId: Types.ObjectId;
  userId: Types.ObjectId;
  assignments: IPoolAssignment[];
  usedCombos: string[];
  generatedAt: Date;
}

const MarkingPoolSchema = new Schema<IMarkingPool>({
  seasonId: { type: Schema.Types.ObjectId, ref: "Season", required: true, unique: true },
  userId: { type: Schema.Types.ObjectId, required: true },
  assignments: [
    {
      matingId: { type: Schema.Types.ObjectId, required: true },
      noseGroup: { type: String, required: true },
      combos: [String],
    },
  ],
  usedCombos: [String],
  generatedAt: { type: Date, default: Date.now },
});

const MarkingPool: Model<IMarkingPool> =
  mongoose.models.MarkingPool ??
  mongoose.model<IMarkingPool>("MarkingPool", MarkingPoolSchema, "markingpools");

export default MarkingPool;
