import mongoose, { Schema, Document, Model } from "mongoose";

export interface WithdrawDocument extends Document {
  userId: string;

  amount: number;

  method: "CRYPTO" | "BANK" | "MONEYGRAM" | "MUKURU";

  wallet?: string;

  coin?: string;
  network?: string;

  accountName?: string;
  accountNumber?: string;
  bankName?: string;
  country?: string;

  // 🔥 NEW FIELDS
  transactionId: string;
  fee: number;
  netAmount: number;

  status: "pending" | "approved" | "rejected";

  createdAt: Date;
  updatedAt: Date;
}

const WithdrawSchema: Schema<WithdrawDocument> = new Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
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

    wallet: {
      type: String,
      default: null,
    },

    coin: {
      type: String,
      default: null,
    },

    network: {
      type: String,
      default: null,
    },

    accountName: {
      type: String,
      default: null,
    },
    
accountNumber: {
  type: String,
  default: null,
},
    bankName: {
      type: String,
      default: null,
    },

    country: {
      type: String,
      default: null,
    },

    // 🔥 IMPORTANT TRACKING FIELDS
    transactionId: {
      type: String,
      unique: true,
      index: true,
    },

    fee: {
      type: Number,
      default: 0,
    },

    netAmount: {
      type: Number,
      default: 0,
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