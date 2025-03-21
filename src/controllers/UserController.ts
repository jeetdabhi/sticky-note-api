import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { Utils } from "../utils/Utils";
import { BlacklistedToken, User } from "../models/User";
import { getEnvironmentVariables } from "../environments/environment";
import Otp from "../models/Otp";
import { saveOtp, sendOtpEmail } from "../utils/otpUtils";
import jwt from "jsonwebtoken";

const env = getEnvironmentVariables();

// ✅ Register (Send OTP)
export async function register(req: Request, res: Response) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required." });

    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.password) {
      return res.status(400).json({ message: "User already exists" });
    }

    const otp = await saveOtp(email);
    await sendOtpEmail(email, otp);

    return res.status(201).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error in register:", error);
    return res.status(500).json({ message: "Error sending OTP", error });
  }
}

// ✅ Verify OTP & Create User
export const verifyOTP = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { otp } = req.body;
    if (!otp) return res.status(400).json({ message: "OTP is required." });

    const storedOtp = await Otp.findOne({ otp });
    if (!storedOtp || new Date() > storedOtp.expiresAt) {
      await Otp.deleteOne({ _id: storedOtp?._id });
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    let user = await User.findOne({ email: storedOtp.email });
    if (!user) {
      user = new User({ email: storedOtp.email, password: "" });
      await user.save();
    }

    await Otp.deleteOne({ _id: storedOtp._id });
    return res.status(201).json({ message: "OTP verified successfully", email: storedOtp.email });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return res.status(500).json({ message: "Error verifying OTP", error });
  }
};

// ✅ Login User
export const loginUser = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;
  try {
    const emailLower = email.toLowerCase();
    const user = await User.findOne({ email: emailLower });
    if (!user || !user.password) return res.status(400).json({ error: "Invalid Email or Password not set" });

    const isMatch = await Utils.comparePassword(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    if (!env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing in environment variables.");
    }
    
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,  // ✅ Must match .env JWT_SECRET
      { expiresIn: "1h" }
    );
    

    return res.json({ token, message: "Login Successful", userId: user.id, email: user.email });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

// ✅ Logout User (Store Token in Blacklist)
export const logoutUser = async (req: Request, res: Response) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(400).json({ message: "Bad Request - No token provided" });
    }

    // Add token to blacklist
    await BlacklistedToken.create({ token });

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("❌ Logout error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// ✅ Set First-Time Password
export const setFirstTimePassword = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.password = await Utils.hashPassword(password);
    await user.save();

    return res.status(200).json({ message: "Password set successfully" });
  } catch (error) {
    console.error("Error setting password:", error);
    return res.status(500).json({ message: "Failed to set password" });
  }
};
