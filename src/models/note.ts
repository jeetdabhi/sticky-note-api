import mongoose, { Schema, Document, Model } from "mongoose";

// Interface for Note
export interface INote extends Document {
  title?: string;
  content?: string;
  userId: mongoose.Schema.Types.ObjectId;
  date: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const NoteSchema = new Schema<INote>(
  {
    title: { type: String, required: false },
    content: { type: String, required: false },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true }, // ✅ Ensuring note belongs to a user
    date: { type: String, required: true },
  },
  { timestamps: true } // ✅ Adds createdAt & updatedAt automatically
);

// Create and export the Note model
export const Note: Model<INote> = mongoose.model<INote>("Note", NoteSchema);
