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

  lastNotifiedAmount: number;

  // 🔥 NEW FIELDS (DAILY SYSTEM)
  dailyProfits: number[];
  currentDay: number;
  lastCreditedDay: number;
  lastCreditTime?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const earningSchema: Schema<IEarning> = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
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
      index: true,
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

    lastNotifiedAmount: {
      type: Number,
      default: 0,
    },

    // 🔥 NEW DAILY SYSTEM
    dailyProfits: {
      type: [Number],
      default: [],
    },

    currentDay: {
      type: Number,
      default: 0,
    },

    lastCreditedDay: {
      type: Number,
      default: -1,
    },

    lastCreditTime: {
      type: Date,
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