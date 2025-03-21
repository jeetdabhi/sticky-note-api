import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcrypt";

export interface IUser extends Document {
    name?: string;
    email: string;
    password?: string;
    otp?: string;
    otpExpires?: Date;
    googleId?: string;
    token?: string;  // New field to store the latest JWT token
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
    {
        name: { type: String, required: false },
        email: { type: String, required: true, unique: true },
        password: { type: String },
        otp: { type: String },
        otpExpires: { type: Date },
        googleId: { type: String },
        token: { type: String }  // Store the latest token
    },
    { timestamps: true }
);

// Hash password before saving
UserSchema.pre("save", async function (next) {
    if (this.password && this.isModified("password")) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function (candidatePassword: string) {
    if (!this.password) return false;
    return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>("User", UserSchema);

// ✅ Blacklisted Token Schema
export interface IBlacklistedToken extends Document {
    token: string;
    createdAt: Date;
}

const BlacklistedTokenSchema = new Schema<IBlacklistedToken>({
    token: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now, expires: "7d" }, // Auto-delete after 7 days
});

export const BlacklistedToken: Model<IBlacklistedToken> =
    mongoose.models.BlacklistedToken ||
    mongoose.model<IBlacklistedToken>("BlacklistedToken", BlacklistedTokenSchema);
