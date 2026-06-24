import mongoose, {
  Schema,
  Document,
  Model,
} from "mongoose";

export interface DepositDocument
  extends Document {
  userId: string;

  amount: number;

  coin: "BTC" | "USDT" | "ETH";

  network?: "ERC20" | "BEP20" | "TRC20";

  // 🔥 NEW
  referenceId: string;
  txHash?: string;

  status:
    | "pending"
    | "approved"
    | "rejected";

  adminNote?: string;

  approvedAt?: Date;
  rejectedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const DepositSchema: Schema<DepositDocument> =
  new Schema(
    {
      userId: {
        type: String,
        required: true,
        index: true,
      },

      amount: {
        type: Number,
        required: true,
        min: 1,
      },

      coin: {
        type: String,
        enum: ["BTC", "USDT", "ETH"],
        required: true,
        index: true,
      },

      network: {
        type: String,
        enum: [
          "ERC20",
          "BEP20",
          "TRC20",
        ],
      },

      referenceId: {
        type: String,
        unique: true,
        index: true,
      },

      txHash: {
        type: String,
        trim: true,
      },

      status: {
        type: String,
        enum: [
          "pending",
          "approved",
          "rejected",
        ],
        default: "pending",
        index: true,
      },

      adminNote: {
        type: String,
        trim: true,
      },

      approvedAt: Date,

      rejectedAt: Date,
    },
    {
      timestamps: true,
    }
  );

// 🔥 USDT MUST HAVE NETWORK
DepositSchema.pre("validate", function () {
  if (
    this.coin === "USDT" &&
    !this.network
  ) {
    throw new Error(
      "USDT deposits require a network"
    );
  }
});

const Deposit: Model<DepositDocument> =
  mongoose.models.Deposit ||
  mongoose.model<DepositDocument>(
    "Deposit",
    DepositSchema
  );

export default Deposit;