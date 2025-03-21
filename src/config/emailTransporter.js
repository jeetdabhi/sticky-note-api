import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST || "sandbox.smtp.mailtrap.io",
  port: parseInt(process.env.MAILTRAP_PORT || "2525", 10), // Convert to number
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Mailtrap Connection Error:", error);
  } else {
    console.log("✅ Mailtrap is ready to send emails");
  }
});

export default transporter;
