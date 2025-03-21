import { Request, Response } from 'express';
import { Note } from '../models/note';
import { validationResult } from 'express-validator';
import { AuthRequest } from '../middlewares/authMiddleware';

export class NoteController {
  static async createNote(req: AuthRequest, res: Response) {
    try {
      // Validate request body
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Extract userId from the authenticated user
      const userId = req.user?._id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Get note data from request body
      const { title, content, date } = req.body;

      // Create new note
      const newNote = new Note({ title, content, userId, date });
      await newNote.save();

      return res.status(201).json({ message: "Note created successfully", note: newNote });
    } catch (error) {
      console.error("Error creating note:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  static async updateNote(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { title, content, date } = req.body;
      const updatedNote = await Note.findByIdAndUpdate(id, { title, content, date }, { new: true });
      if (!updatedNote) return res.status(404).json({ error: 'Note not found' });
      return res.json({ message: 'Note updated successfully', note: updatedNote });
    } catch (error) {
      console.error('Error updating note:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getNote(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const note = await Note.findById(id);
      if (!note) return res.status(404).json({ error: 'Note not found' });
      return res.json(note);
    } catch (error) {
      console.error('Error fetching note:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getAllNotes(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized - User not found" });
      }

      const userId = req.user._id; // ✅ FIXED: Use _id instead of id

      const notes = await Note.find({ userId }); // Fetch only notes for this user
      return res.json(notes);
    } catch (error) {
      console.error("❌ Error fetching notes:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
}

  

  static async deleteNote(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const note = await Note.findByIdAndDelete(id);
      if (!note) return res.status(404).json({ error: 'Note not found' });
      return res.json({ message: 'Note deleted successfully' });
    } catch (error) {
      console.error('Error deleting note:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}
