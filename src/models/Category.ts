import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICategory extends Document {
  slug: string;
  label: string;
  mediaTypes: ("video" | "photo")[];
  createdAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    label: { type: String, required: true, trim: true },
    mediaTypes: [{ type: String, enum: ["video", "photo"] }],
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const Category: Model<ICategory> =
  mongoose.models.Category ?? mongoose.model<ICategory>("Category", CategorySchema);

export default Category;
