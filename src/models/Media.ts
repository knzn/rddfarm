import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IMedia extends Document {
  type: "video" | "photo";
  page: "videos" | "breeding" | "photos";
  title: string;
  description: string | null;
  url: string;
  thumbnail: string | null;
  categories: Types.ObjectId[];
  duration: number | null;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MediaSchema = new Schema<IMedia>(
  {
    type: { type: String, enum: ["video", "photo"], required: true },
    page: { type: String, enum: ["videos", "breeding", "photos"], required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: null },
    url: { type: String, required: true },
    thumbnail: { type: String, default: null },
    categories: [{ type: Schema.Types.ObjectId, ref: "Category" }],
    duration: { type: Number, default: null },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

MediaSchema.index({ page: 1, createdAt: -1 });
MediaSchema.index({ categories: 1 });
MediaSchema.index({ featured: 1 });

const Media: Model<IMedia> =
  mongoose.models.Media ?? mongoose.model<IMedia>("Media", MediaSchema);

export default Media;
