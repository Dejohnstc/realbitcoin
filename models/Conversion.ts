import mongoose, {
  Schema,
  Document,
  Model,
} from "mongoose";

export interface IConversion extends Document {
  userId: mongoose.Types.ObjectId;

  fromAsset: string;
  toAsset: string;

  fromAmount: number;
  toAmount: number;

  fromPrice: number;
  toPrice: number;

  createdAt: Date;
  updatedAt: Date;
}

const ConversionSchema = new Schema<IConversion>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    fromAsset: {
      type: String,
      required: true,
      uppercase: true,
    },

    toAsset: {
      type: String,
      required: true,
      uppercase: true,
    },

    fromAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    toAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    fromPrice: {
      type: Number,
      required: true,
    },

    toPrice: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Conversion: Model<IConversion> =
  mongoose.models.Conversion ||
  mongoose.model<IConversion>(
    "Conversion",
    ConversionSchema
  );

export default Conversion;