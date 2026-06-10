import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICategory extends Document {
  slug: string;
  label: string;
  page: "videos" | "breeding" | "photos";
  mediaTypes: ("video" | "photo")[];
  createdAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    slug: { type: String, required: true, lowercase: true, trim: true },
    label: { type: String, required: true, trim: true },
    page: { type: String, enum: ["videos", "breeding", "photos"], required: true },
    mediaTypes: [{ type: String, enum: ["video", "photo"] }],
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Unique slug per page (not globally)
CategorySchema.index({ slug: 1, page: 1 }, { unique: true });

const Category: Model<ICategory> =
  mongoose.models.Category ?? mongoose.model<ICategory>("Category", CategorySchema);

export default Category;
