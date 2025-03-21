import * as express from "express";
import * as http from "http";
import mongoose from "mongoose";
import { getEnvironmentVariables } from "./environments/environment";
import * as bodyParser from "body-parser";
import cors from "cors";
import userRouter from "./routers/UserRouter";
import dotenv from "dotenv";
import noteRouter from "./routers/NoteRouter";
import { BlacklistedToken } from "./models/User"; // ✅ Correct import

dotenv.config(); // Load environment variables


export class Server {
  public app: express.Application;
  public server: http.Server;

  constructor() {
    this.app = express.default();
    this.server = http.createServer(this.app);
    this.initializeServer();
  }

  private initializeServer() {
    this.setConfigs();
    this.allowCors();
    this.setRoutes();
    this.error404Handler();
    this.handleErrors();
  }

  private setConfigs() {
    this.connectMongoDB();
    this.configureBodyParser();
  }

  private connectMongoDB() {
    const dbUri = getEnvironmentVariables()?.db_uri;
    if (!dbUri) {
      console.error("❌ MongoDB URI is missing in environment variables.");
      process.exit(1); // Exit process if no DB URI is set
    }

    mongoose
      .connect(dbUri)
      .then(() => console.log("✅ Connected to MongoDB."))
      .catch((err) => {
        console.error("❌ MongoDB Connection Error:", err);
        process.exit(1); // Exit process on failure
      });
  }

  private configureBodyParser() {
    this.app.use(express.json());
    this.app.use(bodyParser.urlencoded({ extended: true }));
  }

  private allowCors() {
    this.app.use(cors());
  }

  private setRoutes() {
    this.app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
      (async () => {
        try {
          const token = req.header("Authorization")?.replace("Bearer ", "");
          if (token) {
            const blacklisted = await BlacklistedToken.findOne({ token });
            if (blacklisted) {
              return res.status(401).json({ message: "Token has been blacklisted. Please log in again." });
            }
          }
          next();
        } catch (error) {
          console.error("Error checking token blacklist:", error);
          return res.status(500).json({ message: "Internal Server Error" });
        }
      })();
    });

    this.app.use("/api/users", userRouter);
    this.app.use("/api/notes", noteRouter);
  }

  private error404Handler() {
    this.app.use((req, res) => {
      res.status(404).json({
        message: "Not found",
        status_code: 404,
      });
    });
  }

  private handleErrors() {
    this.app.use(
      (
        error: any,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
      ) => {
        const errorStatus = error.status || 500;
        res.status(errorStatus).json({
          message: error.message || "Something went wrong. Please try again!",
          status_code: errorStatus,
        });
      }
    );
  }
}
