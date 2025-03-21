import { Router, Request, Response, NextFunction } from "express";
import { 
  register, 
  verifyOTP, 
  loginUser, 
  setFirstTimePassword, 
  logoutUser 
} from "../controllers/UserController";
import { validateSignup, loginValidator } from "../validators/UserValidators";
import { authMiddleware, AuthRequest } from "../middlewares/authMiddleware";

class UserRouter {
  public router: Router = Router();

  constructor() {
    this.postRoutes();
  }

  postRoutes() {
    this.router.post("/register", async (req: Request, res: Response, next: NextFunction) => {
      try {
        await register(req, res);
      } catch (error) {
        next(error);
      }
    });

    this.router.post("/verify-otp", async (req: Request, res: Response, next: NextFunction) => {
      try {
        await verifyOTP(req, res);
      } catch (error) {
        next(error);
      }
    });

    this.router.post("/login", loginValidator, async (req: Request, res: Response, next: NextFunction) => {
      try {
        await loginUser(req, res);
      } catch (error) {
        next(error);
      }
    });

    this.router.post("/signup", validateSignup, async (req: Request, res: Response, next: NextFunction) => {
      try {
        await setFirstTimePassword(req, res);
      } catch (error) {
        next(error);
      }
    });

    this.router.post("/logout", authMiddleware, async (req: Request, res: Response) => {
      try {
        await logoutUser(req, res);
      } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error });
      }
    });
  }
}

export default new UserRouter().router;
