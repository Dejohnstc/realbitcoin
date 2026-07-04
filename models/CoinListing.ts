import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICoinListing extends Document {
  name: string;
  symbol: string;
  slug: string;

  logo?: string;
  description?: string;

  listingPrice: number;
  currentPrice: number;

  listingDate: Date;

  network?: string;
  contractAddress?: string;

  marketCap?: string;
  circulatingSupply?: string;
  maxSupply?: string;

  website?: string;
  whitepaper?: string;
  twitter?: string;
  telegram?: string;

  featured: boolean;
  allowReservation: boolean;
  showCountdown: boolean;
  displayDashboard: boolean;

  reservations: number;

  launchColor: string;
  priority: number;
  salePrice: number;

minPurchase: number;

maxPurchase: number;

totalSupply: number;

reservedSupply: number;

reservationEnabled: boolean;
claimEnabled: boolean;
reservationStart?: Date;

reservationEnd?: Date;
soldPercentage: number;
  status:
    | "scheduled"
    | "launching"
    | "live"
    | "completed"
    | "cancelled";

  createdAt: Date;
  updatedAt: Date;
}

const CoinListingSchema: Schema<ICoinListing> = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    symbol: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    logo: {
      type: String,
      default: "",
    },

    description: {
      type: String,
      default: "",
    },

    salePrice: {
  type: Number,
  required: true,
  min: 0,
},

listingPrice: {
  type: Number,
  required: true,
  min: 0,
},

    currentPrice: {
      type: Number,
      default: 0,
    },

    listingDate: {
      type: Date,
      required: true,
    },

    network: {
      type: String,
      default: "",
    },

    contractAddress: {
      type: String,
      default: "",
    },

    marketCap: {
      type: String,
      default: "",
    },

    circulatingSupply: {
      type: String,
      default: "",
    },

    maxSupply: {
      type: String,
      default: "",
    },

    website: {
      type: String,
      default: "",
    },

    whitepaper: {
      type: String,
      default: "",
    },

    twitter: {
      type: String,
      default: "",
    },

    telegram: {
      type: String,
      default: "",
    },

    featured: {
      type: Boolean,
      default: false,
    },

    allowReservation: {
      type: Boolean,
      default: true,
    },

    showCountdown: {
      type: Boolean,
      default: true,
    },

    displayDashboard: {
      type: Boolean,
      default: true,
    },

    reservations: {
      type: Number,
      default: 0,
    },

    launchColor: {
      type: String,
      default: "#06b6d4",
    },

    priority: {
      type: Number,
      default: 0,
    },

minPurchase: {
  type: Number,
  default: 100,
},
soldPercentage: {
  type: Number,
  default: 0,
},
maxPurchase: {
  type: Number,
  default: 100000,
},

totalSupply: {
  type: Number,
  default: 0,
},

reservedSupply: {
  type: Number,
  default: 0,
},

reservationEnabled: {
  type: Boolean,
  default: true,
},
claimEnabled: {
  type: Boolean,
  default: false,
},
reservationStart: {
  type: Date,
},

reservationEnd: {
  type: Date,
},

    status: {
      type: String,
      enum: [
        "scheduled",
        "launching",
        "live",
        "completed",
        "cancelled",
      ],
      default: "scheduled",
    },
  },
  {
    timestamps: true,
  }
);

const CoinListing: Model<ICoinListing> =
  mongoose.models.CoinListing ||
  mongoose.model<ICoinListing>("CoinListing", CoinListingSchema);

export default CoinListing;