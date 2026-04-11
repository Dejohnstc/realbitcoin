import mongoose, { Schema, Document, Model } from "mongoose";

export interface WithdrawDocument extends Document {
  userId: string;
  amount: number;
  wallet: string;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
}

const WithdrawSchema: Schema<WithdrawDocument> = new Schema(
  {
    userId: { type: String, required: true },
    amount: { type: Number, required: true },
    wallet: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const Withdraw: Model<WithdrawDocument> =
  mongoose.models.Withdraw ||
  mongoose.model<WithdrawDocument>("Withdraw", WithdrawSchema);

export default Withdraw;