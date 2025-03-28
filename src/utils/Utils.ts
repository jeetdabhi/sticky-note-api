import * as Bcrypt from "bcrypt";
import { BlacklistedToken } from "../models/User";

export class Utils {
  // Hash Password
  static async hashPassword(password: string): Promise<string> {
    try {
      return await Bcrypt.hash(password, 10);
    } catch (error) {
      throw error;
    }
  }

  // Compare Passwords
  static async comparePassword({ password, encrypt_password }: { password: string; encrypt_password: string }) {

    try {
      const isMatch = await Bcrypt.compare(password, encrypt_password);
      if (!isMatch) {
        throw new Error("User & Password Doesn't Match");
      }
      return isMatch;
    } catch (error) {
      throw error;
    }
  }
}



export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  if (!token) return false;

  console.log("Checking token:", token); // ✅ Debugging line
  const blacklisted = await BlacklistedToken.findOne({ token }).lean();
  console.log("Blacklisted result:", blacklisted); // ✅ Debugging line

  return !!blacklisted;
};
