import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { Utils } from "../utils/Utils";
import { BlacklistedToken, User } from "../models/User";
import { getEnvironmentVariables } from "../environments/environment";
import Otp from "../models/Otp";
import { saveOtp, sendOtpEmail } from "../utils/otpUtils";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { OAuth2Client } from "google-auth-library";
import bcrypt from "bcrypt";

dotenv.config();
const env = getEnvironmentVariables();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export class UserController {
  // ✅ Register (Send OTP)
  static async register(req: Request, res: Response) {
    try {
      const { email } = req.body;
      if (!email)
        return res.status(400).json({ message: "Email is required." });

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
  static async verifyOTP(req: Request, res: Response) {
    try {
      const { otp } = req.body;
      if (!otp) {
        return res.status(400).json({ message: "OTP is required." });
      }

      const storedOtp = await Otp.findOne({ otp }); // Find by OTP only
      if (!storedOtp || new Date() > storedOtp.expiresAt) {
        await Otp.deleteOne({ otp });
        return res.status(400).json({ message: "Invalid or expired OTP." });
      }

      let user = await User.findOne({ email: storedOtp.email });
      if (!user) {
        user = new User({ email: storedOtp.email, password: "" });
        await user.save();
      }

      await Otp.deleteOne({ otp });
      return res
        .status(201)
        .json({ message: "OTP verified successfully", email: storedOtp.email });
    } catch (error) {
      console.error("Error verifying OTP:", error);
      return res.status(500).json({ message: "Error verifying OTP", error });
    }
  }

  // ✅ Login User
  static async loginUser(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res
          .status(400)
          .json({ message: "Email and password are required." });
      }

      const user = await User.findOne({ email });
      if (!user || !user.password) {
        return res.status(400).json({ message: "Invalid email or password" });
      }

      const isMatch = await Utils.comparePassword({
        password,
        encrypt_password: user.password,
      });

      if (!isMatch) {
        return res.status(400).json({ message: "Invalid email or password" });
      }

      const payload = {
        userId: user._id,
        email: user.email,
      };

      // ✅ Correct JWT token generation
      const token = jwt.sign(payload, process.env.JWT_SECRET as string, {
        expiresIn: "1h",
      });

      return res.json({ token, message: "Login Successful", user });
    } catch (error) {
      return res.status(500).json({ message: "Server error", error });
    }
  }

  // ✅ Logout User (Store Token in Blacklist)
  static async logoutUser(req: Request, res: Response) {
    try {
      const token = req.header("Authorization")?.replace("Bearer ", "");
      if (!token) {
        return res
          .status(400)
          .json({ message: "Bad Request - No token provided" });
      }

      // Add token to blacklist
      await BlacklistedToken.create({ token });

      return res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }

  // ✅ Set First-Time Password
  static async setFirstTimePassword(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res
          .status(400)
          .json({ message: "Email and password are required." });
      }

      const hashedPassword = await Utils.hashPassword(password);

      const user = await User.findOneAndUpdate(
        { email: email.toLowerCase() },
        { $set: { password: hashedPassword } },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json({ message: "Password set successfully" });
    } catch (error) {
      return res.status(500).json({ message: "Failed to set password" });
    }
  }

  // ✅ Forgot Password - Send OTP
  static async sendOTP(req: Request, res: Response) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const otp = await saveOtp(email);
      await sendOtpEmail(email, otp);

      return res.status(200).json({ message: "OTP sent successfully" });
    } catch (error) {
      console.error("Error sending OTP:", error);
      return res.status(500).json({ message: "Internal Server Error", error });
    }
  }

  // ✅ Verify OTP for Password Reset
  // ✅ Verify OTP for Password Reset (Only OTP Required)
  static async verifyResetOTP(req: Request, res: Response) {
    try {
      const { otp } = req.body;
      if (!otp) {
        return res.status(400).json({ message: "OTP is required" });
      }

      const storedOtp = await Otp.findOne({ otp });
      if (!storedOtp || new Date() > storedOtp.expiresAt) {
        await Otp.deleteOne({ otp });
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }

      return res.json({
        message: "OTP verified successfully",
        email: storedOtp.email,
      });
    } catch (error) {
      console.error("Error verifying OTP:", error);
      return res.status(500).json({ message: "Error verifying OTP", error });
    }
  }

  // ✅ Reset Password after OTP Verification
  // ✅ Reset Password after OTP Verification
  static async resetPassword(req: Request, res: Response) {
    try {
      const { email, newPassword } = req.body;

      if (!email || !newPassword) {
        return res
          .status(400)
          .json({ message: "Email and new password are required" });
      }

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // ❌ Do NOT hash again, just assign newPassword
      user.password = newPassword; // Pre-save hook will hash it
      await user.save();

      return res.status(200).json({ message: "Password reset successful" });
    } catch (error) {
      console.error("Error resetting password:", error);
      return res
        .status(500)
        .json({ message: "Internal server error", error: error.message });
    }
  }

  // ✅ Google Authentication
  static async googleAuth(req: Request, res: Response) {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({ error: "No token provided" });
      }

      // ✅ Verify ID Token
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        return res.status(401).json({ error: "Invalid token payload" });
      }

      // Generate a random password
      const generatedPassword = Math.random().toString(36).slice(-8);

      res.json({
        email: payload.email,
        password: generatedPassword,
      });
    } catch (error) {
      console.error("Google Auth Error:", error);
      res
        .status(400)
        .json({ error: "Google Sign-In Failed", details: error.message });
    }
  }
}
