import crypto from "crypto";
import Otp from "../models/Otp";
import nodemailer from "nodemailer";
import { getEnvironmentVariables } from "../environments/environment";
import * as Bcrypt from "bcrypt";
import { Request, Response, NextFunction } from "express";

const env = getEnvironmentVariables();

// ✅ Mailtrap Configuration
const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: env.MAILTRAP_USER,
    pass: env.MAILTRAP_PASS,
  },
  secure: false,
  tls: { rejectUnauthorized: false },
});

// ✅ Generate OTP Function
export const generateOtp = () => crypto.randomInt(100000, 999999).toString();

// ✅ Save OTP to Database
export const saveOtp = async (email: string) => {
  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min expiry

  await Otp.findOneAndUpdate(
    { email },
    { otp, expiresAt },
    { upsert: true, new: true }
  );

  return otp;
};

// ✅ Send OTP via Email
export const sendOtpEmail = async (email: string, otp: string) => {
  await transporter.sendMail({
    from: `Sticky Notes App <${env.EMAIL_FROM}>`,
    to: email,
    subject: "Your OTP Code",
    text: `Your OTP is ${otp}. It will expire in 5 minutes.`,
  });
};


export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };