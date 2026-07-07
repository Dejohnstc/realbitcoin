import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITransfer extends Document {
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;

  amount: number;

  note?: string;

  status: "completed" | "failed";

  createdAt: Date;
  updatedAt: Date;
}

const TransferSchema = new Schema<ITransfer>(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    receiverId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 1,
    },

    note: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: ["completed", "failed"],
      default: "completed",
    },
  },
  {
    timestamps: true,
  }
);

const Transfer: Model<ITransfer> =
  mongoose.models.Transfer ||
  mongoose.model<ITransfer>(
    "Transfer",
    TransferSchema
  );

export default Transfer;