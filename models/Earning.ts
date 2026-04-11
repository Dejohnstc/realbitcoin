import mongoose, { Schema, Document, Model } from "mongoose";

export interface IEarning extends Document {
  userId: mongoose.Types.ObjectId;

  depositAmount: number;
  targetAmount: number;

  earnedSoFar: number;

  status: "active" | "completed";

  startTime: Date;
  endTime: Date;

  lastUpdated: Date;

  // 🔥 NEW (IMPORTANT FOR NOTIFICATIONS)
  lastNotifiedAmount: number;

  createdAt: Date;
  updatedAt: Date;
}

const earningSchema: Schema<IEarning> = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // ✅ faster queries
    },

    depositAmount: {
      type: Number,
      required: true,
    },

    targetAmount: {
      type: Number,
      required: true,
    },

    earnedSoFar: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active",
      index: true, // ✅ fast filtering
    },

    startTime: {
      type: Date,
      default: Date.now,
    },

    endTime: {
      type: Date,
      required: true,
    },

    lastUpdated: {
      type: Date,
      default: Date.now,
    },

    // 🔥 NEW FIELD (CRITICAL)
    lastNotifiedAmount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Earning: Model<IEarning> =
  mongoose.models.Earning ||
  mongoose.model<IEarning>("Earning", earningSchema);

export default Earning;