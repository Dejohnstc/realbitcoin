import mongoose, { Schema, Document, Model } from "mongoose";

export interface WithdrawDocument extends Document {
  userId: string;

  amount: number;

  method: "CRYPTO" | "BANK" | "MONEYGRAM" | "MUKURU";

  wallet?: string;

  coin?: string;
  network?: string;

  accountName?: string;
  bankName?: string;
  country?: string;

  status: "pending" | "approved" | "rejected";

  createdAt: Date;
  updatedAt: Date;
}

const WithdrawSchema: Schema<WithdrawDocument> = new Schema(
  {
    userId: {
      type: String,
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    method: {
      type: String,
      enum: ["CRYPTO", "BANK", "MONEYGRAM", "MUKURU"],
      default: "CRYPTO",
    },

    // CRYPTO WALLET
    wallet: {
      type: String,
      default: "",
    },

    // CRYPTO DETAILS
    coin: {
      type: String,
      default: "",
    },

    network: {
      type: String,
      default: "",
    },

    // BANK / MONEYGRAM / MUKURU
    accountName: {
      type: String,
      default: "",
    },

    bankName: {
      type: String,
      default: "",
    },

    country: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

const Withdraw: Model<WithdrawDocument> =
  mongoose.models.Withdraw ||
  mongoose.model<WithdrawDocument>("Withdraw", WithdrawSchema);

export default Withdraw;