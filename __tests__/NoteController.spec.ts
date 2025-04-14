import { Request, Response } from 'express';
import { NoteController } from '../src/controllers/NoteController';
import { Note } from '../src/models/note';
import { validationResult } from 'express-validator';
import { AuthRequest } from '../src/middlewares/authMiddleware';
import mongoose from 'mongoose';

jest.mock('../src/models/note');
jest.mock('express-validator');

describe('NoteController', () => {
    let mockRequest: Partial<AuthRequest>;
    let mockResponse: Partial<Response>;
    let mockJson: jest.Mock;
    let mockStatus: jest.Mock;
    const mockUserId = new mongoose.Types.ObjectId().toString();
    let consoleErrorSpy: jest.SpyInstance;

    beforeAll(() => {
        // Silence console.error during tests
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterAll(() => {
        // Restore console.error after tests
        consoleErrorSpy.mockRestore();
    });

    beforeEach(() => {
        mockJson = jest.fn().mockReturnThis();
        mockStatus = jest.fn().mockReturnThis();
        mockRequest = {
            user: { _id: mockUserId, email: 'test@test.com' },
            body: {},
            params: {}
        };
        mockResponse = {
            json: mockJson,
            status: mockStatus
        };
        jest.clearAllMocks();
    });

    describe('createNote', () => {
        it('should create a new note successfully', async () => {
            const noteData = {
                title: 'Test Note',
                content: 'Test Content',
                date: new Date()
            };
            mockRequest.body = noteData;

            // Setup validation to pass
            (validationResult as unknown as jest.Mock).mockReturnValue({
                isEmpty: () => true,
                array: () => []
            });

            // Create the saved note data
            const savedNoteData = {
                _id: '123',
                title: noteData.title,
                content: noteData.content,
                date: noteData.date,
                userId: mockUserId,
                toObject: () => ({
                    _id: '123',
                    title: noteData.title,
                    content: noteData.content,
                    date: noteData.date,
                    userId: mockUserId
                })
            };

            // Mock Note constructor and save method
            const mockSave = jest.fn().mockResolvedValue(savedNoteData);
            const mockNoteInstance = {
                ...savedNoteData,
                save: mockSave
            };
            (Note as unknown as jest.Mock).mockImplementation(() => mockNoteInstance);

            await NoteController.createNote(mockRequest as AuthRequest, mockResponse as Response);

            // Verify save was called
            expect(mockSave).toHaveBeenCalled();
            
            // Check response
            expect(mockStatus).toHaveBeenCalledWith(201);
            expect(mockJson).toHaveBeenCalledWith({
                message: 'Note created successfully',
                note: savedNoteData.toObject()
            });
        });



        it('should handle unauthorized access', async () => {
            // First ensure validation passes
            (validationResult as unknown as jest.Mock).mockReturnValue({
                isEmpty: () => true,
                array: () => []
            });

            // Clear the user object to trigger unauthorized scenario
            mockRequest.user = undefined;
            mockRequest.body = { title: 'Test Note' };

            await NoteController.createNote(mockRequest as AuthRequest, mockResponse as Response);

            // Check for 401 unauthorized response
            expect(mockStatus).toHaveBeenCalledWith(401);
            expect(mockJson).toHaveBeenCalledWith({ message: "Unauthorized" });
        });

        it('should return validation error for missing required fields', async () => {
            mockRequest.body = {};
            (validationResult as unknown as jest.Mock).mockReturnValue({
                isEmpty: () => false,
                array: () => [{ msg: 'Title is required' }]
            });

            await NoteController.createNote(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({ errors: [{ msg: 'Title is required' }] });
        });
    });

    describe('getAllNotes', () => {
        it('should return all notes for authenticated user', async () => {
            const mockNotes = [
                { _id: '1', title: 'Note 1', userId: mockUserId },
                { _id: '2', title: 'Note 2', userId: mockUserId }
            ];
            (Note.find as jest.Mock).mockResolvedValue(mockNotes);

            await NoteController.getAllNotes(mockRequest as AuthRequest, mockResponse as Response);

            expect(Note.find).toHaveBeenCalledWith({ userId: mockUserId });
            expect(mockJson).toHaveBeenCalledWith(mockNotes);
        });

        it('should handle unauthorized access', async () => {
            mockRequest.user = undefined;

            await NoteController.getAllNotes(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockStatus).toHaveBeenCalledWith(401);
            expect(mockJson).toHaveBeenCalledWith({ message: 'Unauthorized' });
        });

        it('should handle database errors', async () => {
            (Note.find as jest.Mock).mockRejectedValue(new Error('Database error'));

            await NoteController.getAllNotes(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Internal server error' });
        });
    });

    describe('updateNote', () => {
        it('should update note successfully', async () => {
            const updateData = {
                title: 'Updated Title',
                content: 'Updated Content'
            };
            mockRequest.params = { id: '123' };
            mockRequest.body = updateData;

            const updatedNote = {
                _id: '123',
                ...updateData,
                userId: mockUserId
            };
            (Note.findByIdAndUpdate as jest.Mock).mockResolvedValue(updatedNote);

            await NoteController.updateNote(mockRequest as Request, mockResponse as Response);

            expect(mockJson).toHaveBeenCalledWith({
                message: 'Note updated successfully',
                note: updatedNote
            });
        });

        it('should handle non-existent note', async () => {
            mockRequest.params = { id: '123' };
            mockRequest.body = { title: 'Updated Title' };
            (Note.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

            await NoteController.updateNote(mockRequest as Request, mockResponse as Response);

            expect(mockStatus).toHaveBeenCalledWith(404);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Note not found' });
        });
    });

    describe('deleteNote', () => {
        it('should delete note successfully', async () => {
            mockRequest.params = { id: '123' };
            (Note.findByIdAndDelete as jest.Mock).mockResolvedValue({ _id: '123' });

            await NoteController.deleteNote(mockRequest as Request, mockResponse as Response);

            expect(mockJson).toHaveBeenCalledWith({ message: 'Note deleted successfully' });
        });

        it('should handle attempt to delete non-existent note', async () => {
            mockRequest.params = { id: '123' };
            (Note.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

            await NoteController.deleteNote(mockRequest as Request, mockResponse as Response);

            expect(mockStatus).toHaveBeenCalledWith(404);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Note not found' });
        });

        it('should handle database errors during deletion', async () => {
            mockRequest.params = { id: '123' };
            (Note.findByIdAndDelete as jest.Mock).mockRejectedValue(new Error('Database error'));

            await NoteController.deleteNote(mockRequest as Request, mockResponse as Response);

            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Internal server error' });
        });
    });

    describe('getNote', () => {
        it('should return specific note by id', async () => {
            const mockNote = {
                _id: '123',
                title: 'Test Note',
                userId: mockUserId
            };
            mockRequest.params = { id: '123' };
            (Note.findById as jest.Mock).mockResolvedValue(mockNote);

            await NoteController.getNote(mockRequest as Request, mockResponse as Response);

            expect(mockJson).toHaveBeenCalledWith(mockNote);
        });

        it('should handle non-existent note', async () => {
            mockRequest.params = { id: '123' };
            (Note.findById as jest.Mock).mockResolvedValue(null);

            await NoteController.getNote(mockRequest as Request, mockResponse as Response);

            expect(mockStatus).toHaveBeenCalledWith(404);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Note not found' });
        });
    });
});
