import mongoose, { Schema, Document, Model } from "mongoose";

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId; // 🔥 FIXED

  type: "deposit" | "withdraw" | "system";
  message: string;
  read: boolean;

  meta?: {
    amount?: number;
    coin?: string;
    network?: string;
  };

  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema: Schema<INotification> = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId, // 🔥 CRITICAL FIX
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: ["deposit", "withdraw", "system"],
      required: true,
    },

    message: { type: String, required: true },

    read: { type: Boolean, default: false },

    meta: {
      amount: { type: Number },
      coin: { type: String },
      network: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

const Notification: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>("Notification", NotificationSchema);

export default Notification;