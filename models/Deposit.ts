import mongoose, { Schema, Document, Model } from "mongoose";

export interface DepositDocument extends Document {
  userId: string;
  amount: number;

  // 🔥 NEW FIELDS
  coin: "BTC" | "USDT" | "ETH" | "LTC";
  network?: "ERC20" | "BEP20" | "TRC20";

  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}

const DepositSchema: Schema<DepositDocument> = new Schema(
  {
    userId: { type: String, required: true },

    amount: { type: Number, required: true },

    // 🔥 ADD THIS
    coin: {
      type: String,
      enum: ["BTC", "USDT", "ETH", "LTC"],
      required: true,
    },

    // 🔥 ADD THIS (ONLY FOR USDT)
    network: {
      type: String,
      enum: ["ERC20", "BEP20", "TRC20"],
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const Deposit: Model<DepositDocument> =
  mongoose.models.Deposit ||
  mongoose.model<DepositDocument>("Deposit", DepositSchema);

export default Deposit;