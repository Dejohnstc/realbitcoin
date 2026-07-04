import mongoose, {
  Schema,
  Document,
  Model,
} from "mongoose";

export interface IPortfolio extends Document {
  userId: mongoose.Types.ObjectId;

  assetSymbol: string;
  assetName: string;

  logo: string;

  amount: number;

  averageBuyPrice: number;

  currentPrice: number;

  isLaunchToken: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const PortfolioSchema = new Schema<IPortfolio>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    assetSymbol: {
      type: String,
      required: true,
      uppercase: true,
    },

    assetName: {
      type: String,
      required: true,
    },

    logo: {
      type: String,
      default: "",
    },

    amount: {
      type: Number,
      default: 0,
    },

    averageBuyPrice: {
      type: Number,
      default: 0,
    },

    currentPrice: {
      type: Number,
      default: 0,
    },

    isLaunchToken: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

PortfolioSchema.index(
  {
    userId: 1,
    assetSymbol: 1,
  },
  {
    unique: true,
  }
);

const Portfolio: Model<IPortfolio> =
  mongoose.models.Portfolio ||
  mongoose.model<IPortfolio>(
    "Portfolio",
    PortfolioSchema
  );

export default Portfolio;