import mongoose, { Schema, Document, Model } from "mongoose";

export interface INotifications {
  email: boolean;
  trade: boolean;
  deposit: boolean;
  withdrawal: boolean;
  market: boolean;
  promo: boolean;
}

export interface IUser extends Document {
  email: string;
  password?: string;

  balance: number;
  lockedBalance: number;

  role: "user" | "admin";

  name?: string;
  country?: string;
  phone?: string;
  profileImage?: string;

  notifications: INotifications;

  otp?: string;
  otpExpires?: Date;

  isVerified: boolean;
  isSuspended: boolean;

  multiplier: number;
  durationDays: number;

  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotifications>(
  {
    email: { type: Boolean, default: true },
    trade: { type: Boolean, default: true },
    deposit: { type: Boolean, default: true },
    withdrawal: { type: Boolean, default: true },
    market: { type: Boolean, default: false },
    promo: { type: Boolean, default: false },
  },
  { _id: false }
);

const UserSchema: Schema<IUser> = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    password: { type: String },

    balance: {
      type: Number,
      default: 0,
    },

    lockedBalance: {
      type: Number,
      default: 0,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    name: { type: String, default: "" },
    country: { type: String, default: "" },

    // 📱 phone number (validated in the register route)
    phone: { type: String, default: "", trim: true },

    profileImage: {
      type: String,
      default: null,
    },

    notifications: {
      type: NotificationSchema,
      default: () => ({}),
    },

    otp: { type: String },
    otpExpires: { type: Date },

    isVerified: { type: Boolean, default: false },
    isSuspended: { type: Boolean, default: false },

    multiplier: {
      type: Number,
      default: 10,
      min: 1,
    },

    durationDays: {
      type: Number,
      default: 7,
      min: 1,
    },
  },
  { timestamps: true }
);

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;