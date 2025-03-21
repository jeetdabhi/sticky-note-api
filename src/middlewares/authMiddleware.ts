import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { BlacklistedToken } from "../models/User"; // Ensure the correct import

export interface AuthRequest extends Request {
  user?: { _id: string; email: string }; // Explicitly define _id and email
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      res.status(401).json({ message: "Unauthorized - No token provided" });
      return;
    }

    // ✅ Check if token is blacklisted
    const blacklistedToken = await BlacklistedToken.findOne({ token });
    if (blacklistedToken) {
      res.status(401).json({ message: "Unauthorized - Token is blacklisted" });
      return;
    }

    if (!process.env.JWT_SECRET) {
      console.error("⚠️ JWT_SECRET is missing in environment variables.");
      res.status(500).json({ message: "Internal Server Error - Missing JWT Secret" });
      return;
    }

    // ✅ Verify token and extract user ID
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: string };

    // ✅ Ensure user exists in the database
    const user = await User.findById(decoded.userId).select("_id email");

    if (!user) {
      res.status(401).json({ message: "Unauthorized - User not found" });
      return;
    }

    req.user = { _id: user._id.toString(), email: user.email }; // Attach user ID & email to req.user

    next(); // ✅ Call next() to continue request handling
  } catch (error) {
    res.status(401).json({ message: "Unauthorized - Invalid token" });
  }
};
