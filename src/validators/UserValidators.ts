import { body, query } from "express-validator";
import {User} from "../models/User";

export class UserValidators {
  static registerValidator() {
    return [
      body("name", "Name is required").notEmpty(),
      body("email", "Invalid email format").isEmail(),
    ];
  }

  static verifyOTPValidator() {
    return [
      body("email", "Invalid email").isEmail(),
      body("otp", "OTP must be 6 digits").isLength({ min: 6, max: 6 }),
      body("password", "Password must be at least 6 characters").isLength({ min: 6 }),
    ];
  }

  static loginValidator() {
    return [
      body("email", "Please include a valid email").isEmail(),
      body("password", "Password is required").notEmpty(),
    ];
  }

  static validateSignup() {
    return [
      body("email", "Invalid email format").isEmail(),
      body("password", "Password must be at least 6 characters long").isLength({ min: 6 }),
      body("confirmPassword").custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error("Passwords do not match");
        }
        return true;
      }),
    ];
  }

  static sendResetOTPValidator() {
    return [body("email", "Invalid email format").isEmail()];
  }

  static verifyResetOTPValidator() {
    return [
      body("email", "Invalid email format").isEmail(),
      body("otp", "OTP must be 6 digits").isLength({ min: 6, max: 6 }),
      body("newPassword", "Password must be at least 6 characters").isLength({ min: 6 }),
    ];
  }

  static googleSignInValidator() {
    return [body("token", "Google token is required").notEmpty()];
  }

  static checkResetPasswordEmail() {
    return [
      query("email", "Email is required")
        .isEmail()
        .custom(async (email) => {
          const user = await User.findOne({ email });
          if (!user) {
            throw new Error("No User Registered with such Email");
          }
          return true;
        }),
    ];
  }

  static resetPassword() {
    return [
      body("email", "Email is required")
        .isEmail()
        .custom(async (email, { req }) => {
          const user = await User.findOne({ email });
          if (!user) {
            throw new Error("No User Registered with such Email");
          }
          req.user = user;
          return true;
        }),
      body("new_password", "New password is required").isAlphanumeric(),
      body("otp", "Reset password token is required")
        .isNumeric()
        .custom((otp, { req }) => {
          if (req.user.reset_password_token !== otp) {
            throw new Error("Reset password token is invalid, please try again");
          }
          return true;
        }),
    ];
  }
}
