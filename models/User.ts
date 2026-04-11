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

  role: "user" | "admin";

  // ✅ PROFILE
  name?: string;
  country?: string;
  profileImage?: string;

  // ✅ NOTIFICATIONS
  notifications: INotifications;

  otp?: string;
  otpExpires?: Date;

  isVerified: boolean;

  // 🔥 ADD THIS (IMPORTANT)
  isSuspended: boolean;

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
    email: { type: String, required: true, unique: true },
    password: { type: String },

    balance: {
      type: Number,
      default: 0,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    // ✅ PROFILE
    name: { type: String, default: "" },
    country: { type: String, default: "" },
    profileImage: { type: String, default: "" },

    // ✅ NOTIFICATIONS
    notifications: {
      type: NotificationSchema,
      default: () => ({}),
    },

    otp: { type: String },
    otpExpires: { type: Date },

    isVerified: { type: Boolean, default: false },

    // 🔥 ADD THIS (CRITICAL FOR ADMIN PANEL)
    isSuspended: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;