import * as Bcrypt from "bcrypt";
import { BlacklistedToken } from "../models/User";

export class Utils {
  static hashPassword = (password: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      Bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
          reject(err);
        } else {
          resolve(hash);
        }
      });
    });
  };

  static comparePassword = (
    password: string,
    hashedPassword: string
  ): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      Bcrypt.compare(password, hashedPassword, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(true);
        }
      });
    });
  };
}

export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  if (!token) return false;

  console.log("Checking token:", token); // ✅ Debugging line
  const blacklisted = await BlacklistedToken.findOne({ token }).lean();
  console.log("Blacklisted result:", blacklisted); // ✅ Debugging line
  
  return !!blacklisted;
};
