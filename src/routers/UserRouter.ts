import { Router } from "express";
import { UserController } from "../controllers/UserController";
import { UserValidators } from "../validators/UserValidators";
import { authMiddleware } from "../middlewares/authMiddleware";
import rateLimit from "express-rate-limit";
import { asyncHandler } from "../utils/otpUtils";

class UserRouter {
  public router: Router;
  
  private otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { message: "Too many OTP requests. Please try again later." },
  });

  constructor() {
    this.router = Router();
    this.getRoutes();
    this.postRoutes();
    this.patchRoutes();
    this.putRoutes();
    this.deleteRoutes();
  }

  getRoutes() {
  }

  postRoutes() {
    this.router.post("/register", asyncHandler(UserController.register));

    this.router.post("/verify-otp", asyncHandler(UserController.verifyOTP));

    this.router.post(
      "/login",
      UserValidators.loginValidator(),
      asyncHandler(UserController.loginUser)
    );

    this.router.post(
      "/signup",
      UserValidators.validateSignup(),
      asyncHandler(UserController.setFirstTimePassword)
    );

    this.router.post(
      "/logout",
      authMiddleware,
      asyncHandler(UserController.logoutUser)
    );

    this.router.post("/google-signin", asyncHandler(UserController.googleAuth));

    this.router.post(
      "/send-otp",
      this.otpLimiter,
      asyncHandler(UserController.sendOTP)
    );

    this.router.post(
      "/verify-reset-otp",
      UserValidators.verifyResetOTPValidator(),
      asyncHandler(UserController.verifyResetOTP)
    );

    this.router.post(
      "/reset-password",
      UserValidators.verifyResetOTPValidator(),
      asyncHandler(UserController.resetPassword)
    );
  }

  patchRoutes() {
    this.router.patch(
      "/reset/password",
      UserValidators.resetPassword(),
      asyncHandler(UserController.resetPassword)
    );
  }

  putRoutes() {}
  
  deleteRoutes() {}
}

export default new UserRouter().router;
