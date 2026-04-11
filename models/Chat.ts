import mongoose, { Schema, Document, Model } from "mongoose";

export interface IChat extends Document {
  userId: string;
  chatId: string;
  message: string;
  sender: "user" | "admin";
  read: boolean;
  status: "sent" | "delivered" | "read";
  createdAt: Date;
  updatedAt: Date;
}

const ChatSchema = new Schema<IChat>(
  {
    userId: { type: String, required: true },
    chatId: { type: String, required: true },

    message: { type: String, required: true },

    sender: {
      type: String,
      enum: ["user", "admin"],
      required: true,
    },

    read: { type: Boolean, default: false },

    // 🔥 NEW
    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
    },
  },
  { timestamps: true }
);

const Chat: Model<IChat> =
  mongoose.models.Chat || mongoose.model<IChat>("Chat", ChatSchema);

export default Chat;