import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICoinReservation extends Document {
  userId: mongoose.Types.ObjectId;
  coinId: mongoose.Types.ObjectId;

  coinsPurchased: number;

  salePrice: number;

  totalPaid: number;

  status: "reserved" | "claimed" | "cancelled";

  claimed: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const CoinReservationSchema = new Schema<ICoinReservation>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    coinId: {
      type: Schema.Types.ObjectId,
      ref: "CoinListing",
      required: true,
    },

    coinsPurchased: {
      type: Number,
      required: true,
      min: 1,
    },

    salePrice: {
      type: Number,
      required: true,
    },

    totalPaid: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["reserved", "claimed", "cancelled"],
      default: "reserved",
    },

    claimed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const CoinReservation: Model<ICoinReservation> =
  mongoose.models.CoinReservation ||
  mongoose.model<ICoinReservation>(
    "CoinReservation",
    CoinReservationSchema
  );

export default CoinReservation;