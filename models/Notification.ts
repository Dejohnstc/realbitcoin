import mongoose, { Schema, Document, Model } from "mongoose";

export interface INotification extends Document {
  userId: string;
  type: "deposit" | "withdraw" | "system";
  message: string;
  read: boolean;

  // ✅ NEW (STRUCTURED DATA)
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
    userId: { type: String, required: true },

    type: {
      type: String,
      enum: ["deposit", "withdraw", "system"],
      required: true,
    },

    message: { type: String, required: true },

    read: { type: Boolean, default: false },

    // ✅ NEW FIELD
    meta: {
      amount: { type: Number },
      coin: { type: String },
      network: { type: String },
    },
  },
  {
    timestamps: true, // ✅ createdAt + updatedAt
  }
);

const Notification: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>("Notification", NotificationSchema);

export default Notification;