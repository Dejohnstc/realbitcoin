import mongoose, { Schema, Document, Model } from "mongoose";

export interface IInvestment extends Document {
  userId: string;
  amount: number;
  plan: string;
  profit: number;
  status: "active" | "completed";
  startDate: Date;
  endDate: Date;

  // ✅ ADD THESE (FIX ALL ERRORS)
  createdAt: Date;
  updatedAt: Date;
}

const InvestmentSchema: Schema<IInvestment> = new Schema(
  {
    userId: { type: String, required: true },
    amount: { type: Number, required: true },
    plan: { type: String, required: true },
    profit: { type: Number, required: true },

    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active",
    },

    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, required: true },
  },
  {
    timestamps: true, // 🔥 THIS ENABLES createdAt & updatedAt
  }
);

const Investment: Model<IInvestment> =
  mongoose.models.Investment ||
  mongoose.model<IInvestment>("Investment", InvestmentSchema);

export default Investment;