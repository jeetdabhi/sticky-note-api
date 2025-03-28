import { Router, Request, Response, NextFunction } from "express";
import { NoteController } from "../controllers/NoteController";
import { AuthRequest, notesMiddleware } from "../middlewares/notesMiddlewate";

class NoteRouter {
  public router: Router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(
      "/create",
      notesMiddleware, // Apply authentication middleware
      async (req: Request, res: Response, next: NextFunction) => {
        try {
          await NoteController.createNote(req, res);
        } catch (error) {
          next(error);
        }
      }
    );

    this.router.put(
      "/update/:id",
      notesMiddleware, // ✅ Added authentication middleware for security
      async (req: Request, res: Response, next: NextFunction) => {
        try {
          await NoteController.updateNote(req, res);
        } catch (error) {
          next(error);
        }
      }
    );

    this.router.get(
      "/get/:id",
      notesMiddleware, // ✅ Added authentication middleware
      async (req: Request, res: Response, next: NextFunction) => {
        try {
          await NoteController.getNote(req, res);
        } catch (error) {
          next(error);
        }
      }
    );

    this.router.get(
      "/all",
      notesMiddleware, // Ensure only authenticated users can see notes
      async (req: Request, res: Response, next: NextFunction) => {
        try {
          await NoteController.getAllNotes(req as AuthRequest, res); // ✅ Cast req as AuthRequest
        } catch (error) {
          next(error);
        }
      }
    );

    this.router.delete(
      "/delete/:id",
      notesMiddleware, // ✅ Ensure authentication before deleting a note
      async (req: Request, res: Response, next: NextFunction) => {
        try {
          await NoteController.deleteNote(req, res);
        } catch (error) {
          next(error);
        }
      }
    );
  }
}

export default new NoteRouter().router;
